import {
  experimental_evaluate as evaluate,
  type Experimental_EvaluationQuestion,
} from "ai"

import {
  GRAMMAR,
  KIND_INFO,
  NONE,
  PAGE_SET_MODE,
  allowedKinds,
  detailQuestions,
  followUpQuestions,
  spansOf,
  type ChoiceQuestion,
  type SetQuestion,
} from "./catalog"
import type { Decision, Kind, Overrides, RoundStat, UINode } from "./types"

const MODEL = "typesafe-ai/jev"
// Measured 2026-09-23 with SDK retries off: calls up to ~10 choice questions x 76
// options always succeed (p50 ~280ms, p90 ~400ms); 16 x 40 fails with a 503
// about half the time and 20 x 76 almost always does. 44 boolean questions in one
// call return in ~350ms. Small calls still 503 now and then, and roughly 1 in 30
// hangs until a 504 at 30s. So: small shards run in parallel, no SDK backoff (its
// 2s retry delay was the whole latency tail), an immediate retry on failure, and
// a hedged duplicate when an attempt is slow.
// Later finding: the real limit is input size, not option count. A 7-question
// shard of long option descriptions (~167 options) 503'd far more often than 760
// short options. So shards are budgeted by characters of question text.
const SHARD_CHARS = 7000
const SHARD_QUESTIONS = 12
const SHARD_BOOLEANS = 30
const HEDGE_MS = 700
const ATTEMPT_TIMEOUT_MS = 3000
const MAX_ATTEMPTS = 6
const MAX_ROUNDS = 5

/** First success wins; failures retry at once; a slow attempt gets a hedged twin. */
function robust<T>(
  run: (signal: AbortSignal) => Promise<T>,
  outer?: AbortSignal
): Promise<T> {
  return new Promise((resolve, reject) => {
    const ctrls: AbortController[] = []
    let settled = false
    let attempts = 0
    let inflight = 0
    let lastErr: unknown
    let hedge: ReturnType<typeof setTimeout> | undefined
    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      clearTimeout(hedge)
      ctrls.forEach((c) => c.abort())
      fn()
    }
    const launch = () => {
      if (settled) return
      if (attempts >= MAX_ATTEMPTS) {
        if (inflight === 0) finish(() => reject(lastErr))
        return
      }
      attempts++
      inflight++
      const ctrl = new AbortController()
      ctrls.push(ctrl)
      const signals = [ctrl.signal, AbortSignal.timeout(ATTEMPT_TIMEOUT_MS)]
      if (outer) signals.push(outer)
      run(AbortSignal.any(signals)).then(
        (v) => finish(() => resolve(v)),
        (err) => {
          inflight--
          lastErr = err
          if (outer?.aborted) return finish(() => reject(err))
          // 503s come in bursts under load, so space retries out a little, with jitter.
          if (attempts < MAX_ATTEMPTS)
            setTimeout(launch, 60 * attempts + Math.random() * 120)
          else if (inflight === 0) finish(() => reject(lastErr))
        }
      )
    }
    launch()
    hedge = setTimeout(launch, HEDGE_MS)
  })
}

type Answer = {
  choice?: string
  probability?: number
  probabilities?: Record<string, number>
}

type Q = {
  key: string
  question: Experimental_EvaluationQuestion
  options: number
  cost: number
}

/** Characters a question adds to the request: instructions plus every option and its description. */
function costOf(
  instructions: string,
  criteria?: Record<string, string | null>
) {
  let c = instructions.length + 20
  for (const [k, v] of Object.entries(criteria ?? {}))
    c += k.length + (v?.length ?? 0) + 8
  return c
}

function ranked(a: Answer): [string, number][] {
  const entries = Object.entries(
    a.probabilities ?? (a.choice ? { [a.choice]: 1 } : {})
  )
  return entries.sort((x, y) => y[1] - x[1])
}

function decisionOf(
  prop: string,
  a: Answer,
  choice: string,
  note?: string
): Decision {
  return {
    prop,
    choice,
    probability: a.probabilities?.[choice] ?? null,
    alternatives: ranked(a)
      .filter(([o]) => o !== choice)
      .slice(0, 3)
      .map(([option, p]) => ({ option, p })),
    note,
  }
}

function describeNode(n: UINode): string {
  const bits: string[] = [n.path ? `${n.path} ${n.kind}` : n.kind]
  for (const [k, v] of Object.entries(n.props)) {
    if (k === "nav" && n.props.layout !== "sidebar") continue
    if (typeof v === "string" && v !== NONE) bits.push(`${k} "${v}"`)
    else if (Array.isArray(v)) bits.push(`${k} [${v.join(", ")}]`)
  }
  if (n.pendingSlots) bits.push("(contents being decided)")
  return bits.join(", ")
}

function outline(n: UINode, indent = ""): string {
  return [
    indent + "- " + describeNode(n),
    ...n.children.map((c) => outline(c, indent + "  ")),
  ].join("\n")
}

function stateFor(query: string, root: UINode) {
  return [
    "You are composing a user interface for what someone typed into a generative UI sandbox.",
    "The interface is a tree of components, decided one level at a time. Fit every choice to the request,",
    "and honor anything the request asks to leave out. If it names one small component, show just that;",
    "otherwise build a complete, useful screen for it.",
    "",
    `Request: "${query}"`,
    "",
    "Interface so far:",
    outline(root),
  ].join("\n")
}

function where(n: UINode) {
  return n.path
    ? `About the ${n.kind} at position ${n.path}:`
    : "About the whole page:"
}

function shard(qs: Q[]): Q[][] {
  const out: Q[][] = []
  for (const group of [
    qs.filter((q) => q.question.type === "boolean"),
    qs.filter((q) => q.question.type !== "boolean"),
  ]) {
    const cap =
      group[0]?.question.type === "boolean" ? SHARD_BOOLEANS : SHARD_QUESTIONS
    let cur: Q[] = []
    let size = 0
    for (const q of group) {
      if (cur.length && (size + q.cost > SHARD_CHARS || cur.length >= cap)) {
        out.push(cur)
        cur = []
        size = 0
      }
      cur.push(q)
      size += q.cost
    }
    if (cur.length) out.push(cur)
  }
  return out
}

async function ask(state: string, qs: Q[], signal?: AbortSignal) {
  const shards = shard(qs)
  const results = await Promise.allSettled(
    shards.map((s) => {
      const questions = Object.fromEntries(s.map((q) => [q.key, q.question]))
      return robust(
        (abortSignal) =>
          evaluate({
            model: MODEL,
            state,
            questions,
            maxRetries: 0,
            abortSignal,
          }).catch((e) => {
            if (process.env.JEV_DEBUG) {
              const opts = s.reduce((a, q) => a + q.options, 0)
              console.error(
                `[jev] shard failed: ${s.length}q ${opts}opts ${s[0].question.type} state=${state.length}ch ${(e as { statusCode?: number }).statusCode ?? (e as Error).name}`
              )
            }
            throw e
          }),
        signal
      )
    })
  )
  // A shard that fails every retry degrades to safe defaults for just its
  // questions, so one flaky call never blanks the whole page.
  const answers = new Map<string, Answer>()
  let failed = 0
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      for (const [k, v] of Object.entries(r.value.answers)) answers.set(k, v as Answer)
      return
    }
    if (signal?.aborted) throw r.reason
    failed++
    for (const q of shards[i]) {
      const first = q.question.type === "choice" ? Object.keys(q.question.criteria ?? {})[0] : undefined
      answers.set(q.key, q.question.type === "boolean" ? { probability: 0 } : { choice: first })
    }
  })
  if (failed === shards.length) throw (results[0] as PromiseRejectedResult).reason
  return { answers, calls: shards.length, failed }
}

type Pending =
  | { kind: "choice"; node: UINode; q: ChoiceQuestion; key: string }
  | { kind: "set"; node: UINode; q: SetQuestion; keys: string[] }

/** Distinct answers for choice questions sharing a dedupe key, greedily in tree order. */
function applyChoices(
  pending: Pending[],
  answers: Map<string, Answer>,
  overrides: Overrides,
  used: Map<string, Set<string>>
) {
  for (const p of pending) {
    if (p.kind !== "choice") continue
    const a = answers.get(p.key)
    if (!a?.choice) continue
    let choice = a.choice
    let note: string | undefined
    const forced = overrides[`${p.node.path}|${p.q.prop}`]
    if (forced && forced in p.q.options) {
      choice = forced
      note = "swapped in by you"
    } else if (p.q.dedupeKey) {
      const taken = used.get(p.q.dedupeKey) ?? new Set<string>()
      if (taken.has(choice)) {
        const alt = ranked(a).find(([o]) => !taken.has(o))
        // A near-zero runner-up is junk ("Your cart" on a hospital page); keep the repeat.
        if (alt && alt[1] >= 0.03) {
          note = `"${choice}" already used on this page`
          choice = alt[0]
        }
      }
    }
    if (p.q.dedupeKey && choice !== NONE)
      used.set(
        p.q.dedupeKey,
        (used.get(p.q.dedupeKey) ?? new Set()).add(choice)
      )
    p.node.props[p.q.prop] = choice
    p.node.decisions.push(decisionOf(p.q.prop, a, choice, note))
  }
}

/** Keep the likely candidates (p >= 0.5), within min/max, skipping conflicting ones. */
function applySets(pending: Pending[], answers: Map<string, Answer>) {
  for (const p of pending) {
    if (p.kind !== "set") continue
    const rated = p.q.items
      .map((item, i) => ({
        item,
        i,
        p: answers.get(p.keys[i])?.probability ?? 0,
      }))
      .sort((a, b) => b.p - a.p)
    const picked: typeof rated = []
    const blocked = new Set<string>()
    for (const r of rated) {
      if (picked.length >= p.q.max) break
      if (picked.length >= p.q.min && r.p < (p.q.threshold ?? 0.5)) break
      if (blocked.has(r.item)) continue
      picked.push(r)
      for (const [x, y] of p.q.conflicts ?? []) {
        if (x.includes(r.item)) y.forEach((i) => blocked.add(i))
        if (y.includes(r.item)) x.forEach((i) => blocked.add(i))
      }
    }
    if (p.q.order === "bank") picked.sort((a, b) => a.i - b.i)
    const chosen = new Set(picked.map((r) => r.item))
    p.node.props[p.q.prop] = picked.map((r) => r.item)
    p.node.decisions.push({
      prop: p.q.prop,
      choice: picked.map((r) => r.item).join(", "),
      probability: picked.length
        ? picked.reduce((s, r) => s + r.p, 0) / picked.length
        : null,
      alternatives: rated
        .filter((r) => !chosen.has(r.item))
        .slice(0, 3)
        .map((r) => ({ option: r.item, p: r.p })),
      set: rated
        .slice(0, 10)
        .map((r) => ({ item: r.item, p: r.p, picked: chosen.has(r.item) })),
    })
  }
}

const TIME_AXES = ["months", "weeks", "weekdays", "hours"]
const RECURRING = new Set(["Cancel anytime", "Auto-renew"])

/**
 * Grammar-level consistency Jev cannot see because props are asked in parallel:
 * a line or area chart needs a time axis, and one-time pricing cannot promise
 * "cancel anytime". Repairs pick Jev's own next-best answer and are noted.
 */
function repair(pending: Pending[], answers: Map<string, Answer>) {
  for (const p of pending) {
    if (p.kind !== "choice") continue
    const n = p.node
    if (n.kind === "chart" && p.q.prop === "x" && (n.props.type === "line" || n.props.type === "area") && !TIME_AXES.includes(String(n.props.x))) {
      const a = answers.get(p.key)
      const best = a ? ranked(a).find(([o]) => TIME_AXES.includes(o)) : undefined
      n.props.x = best?.[0] ?? "months"
      const d = n.decisions.find((d) => d.prop === "x")
      if (d) Object.assign(d, { choice: n.props.x, probability: best?.[1] ?? null, note: "adjusted: line and area charts need a time axis" })
    }
  }
  for (const p of pending) {
    if (p.kind === "set" && p.node.kind === "pricing" && p.q.prop === "features" && p.node.props.period === "one-time") {
      const features = Array.isArray(p.node.props.features) ? p.node.props.features : []
      p.node.props.features = features.filter((f) => !RECURRING.has(f))
    }
  }
}

/** Page-level cleanups once the whole tree is known. */
function tidy(root: UINode) {
  const all = walk(root)
  for (const n of all) {
    // A photo subject means nothing on a list without photos.
    if (n.kind === "list" && n.props.media === "none" && "subject" in n.props) {
      delete n.props.subject
      n.decisions = n.decisions.filter((d) => d.prop !== "subject")
    }
  }
  // Time slots already pick the date and time; a form beside them should not ask again.
  if (all.some((n) => n.kind === "timeslots")) {
    for (const n of all) {
      if (n.kind === "form" && Array.isArray(n.props.controls)) {
        n.props.controls = n.props.controls.filter((c) => !["Date", "Time", "Start date"].includes(c))
      }
    }
  }
}

function walk(n: UINode, out: UINode[] = []): UINode[] {
  out.push(n)
  n.children.forEach((c) => walk(c, out))
  return out
}

function makeNode(
  kind: Kind,
  parent: UINode | null,
  index: number,
  id: number
): UINode {
  const g = GRAMMAR[kind]
  return {
    id: `n${id}`,
    path: parent
      ? parent.path
        ? `${parent.path}.${index + 1}`
        : `${index + 1}`
      : "",
    kind,
    depth: parent ? parent.depth + 1 : 0,
    props: {},
    children: [],
    pending: true,
    pendingSlots: g ? g.slots : 0,
    decisions: [],
  }
}

/** Pick one kind per slot, honoring uniqueness, the minimum child count and user swaps. */
function resolveSlots(
  parent: UINode,
  slotKeys: string[],
  answers: Map<string, Answer>,
  overrides: Overrides
) {
  const g = GRAMMAR[parent.kind]!
  const allowed = new Set<string>(allowedKinds(parent))
  const used = new Set<string>()
  const family = (k: string) => g.families?.find((f) => f.includes(k as Kind))
  const blocked = (k: string) => {
    if (g.repeatable.includes(k as Kind)) return false
    if (used.has(k)) return true
    return !!family(k)?.some((f) => used.has(f))
  }
  const picks: { kind: string; a: Answer; note?: string }[] = []
  for (const key of slotKeys) {
    const a = answers.get(key)
    if (!a) continue
    let kind = NONE
    let note: string | undefined
    for (const [opt] of ranked(a)) {
      if (opt !== NONE && blocked(opt)) {
        note = `"${opt}" would repeat content already in this ${parent.kind}`
        continue
      }
      kind = opt
      break
    }
    if (kind !== NONE) used.add(kind)
    picks.push({ kind, a, note })
  }

  // Too few children: promote the empty slots with the strongest non-empty runner-up.
  let filled = picks.filter((p) => p.kind !== NONE).length
  if (filled < g.min) {
    const candidates = picks
      .filter((p) => p.kind === NONE)
      .map((p) => ({
        p,
        alt: ranked(p.a).find(([o]) => o !== NONE && !blocked(o)),
      }))
      .filter((c) => c.alt)
      .sort((x, y) => y.alt![1] - x.alt![1])
    for (const c of candidates) {
      if (filled >= g.min) break
      c.p.kind = c.alt![0]
      c.p.note = `promoted: a ${parent.kind} needs at least ${g.min}`
      used.add(c.p.kind)
      filled++
    }
  }

  // Empty slots stay on the parent so the inspector shows what Jev left out.
  picks.forEach((p, i) => {
    if (p.kind === NONE)
      parent.decisions.push(decisionOf(`slot ${i + 1}`, p.a, NONE, p.note))
  })
  let kept = picks.filter((p) => p.kind !== NONE)
  // A hero only makes sense at the top of a page, a closing CTA at the bottom.
  if (parent.kind === "page") {
    // Banners and heroes belong at the top, search above its results, a closing CTA and the footer at the bottom.
    const rank = (k: string) =>
      ({ banner: -3, hero: -2, search: -1, cta: 1, footer: 2 })[k] ?? 0
    kept = kept
      .map((p, i) => ({ p, i }))
      .sort((x, y) => rank(x.p.kind) - rank(y.p.kind) || x.i - y.i)
      .map((x) => x.p)
  }
  return kept.map((p, i) => {
    const path = parent.path ? `${parent.path}.${i + 1}` : `${i + 1}`
    const forced = overrides[`${path}|kind`]
    if (forced && allowed.has(forced))
      return {
        kind: forced as Kind,
        decision: decisionOf("kind", p.a, forced, "swapped in by you"),
      }
    return {
      kind: p.kind as Kind,
      decision: decisionOf("kind", p.a, p.kind, p.note),
    }
  })
}

// Common emoji spelled out, so "🍕🍕🍕" reaches Jev and the spans as "pizza".
const EMOJI: Record<string, string> = {
  "🍕": "pizza",
  "🍔": "burgers",
  "☕": "coffee",
  "🍣": "sushi",
  "🌮": "tacos",
  "🍺": "beer",
  "🍷": "wine",
  "🐶": "dogs",
  "🐕": "dogs",
  "🐱": "cats",
  "🐈": "cats",
  "🎵": "music",
  "🎶": "music",
  "🎧": "music",
  "🏠": "homes",
  "✈️": "travel",
  "💰": "money",
  "💸": "payments",
  "📚": "books",
  "⚽": "soccer",
  "🏀": "basketball",
  "🎮": "games",
  "📷": "photos",
  "🌱": "plants",
  "💪": "fitness",
  "🏋️": "gym",
  "🚗": "cars",
  "🛒": "shopping",
  "📈": "stocks",
  "💬": "chat",
  "📅": "calendar",
  "🎟️": "tickets",
  "🧘": "yoga",
  "🏖️": "beach",
  "❤️": "dating",
  "🍰": "bakery",
}

export function expandEmoji(query: string) {
  const words = [...new Set([...query].map((ch) => EMOJI[ch]).filter(Boolean))]
  return words.length ? `${query} (${words.join(", ")})` : query
}

export async function compose(
  query: string,
  opts: {
    signal?: AbortSignal
    overrides?: Overrides
    onRound?: (tree: UINode, stat: RoundStat) => void
  } = {}
) {
  const overrides = opts.overrides ?? {}
  query = expandEmoji(query)
  const spans = spansOf(query)
  let ids = 0
  const root = makeNode("page", null, 0, ids++)
  const parents = new Map<string, UINode | null>([[root.id, null]])
  let frontier: UINode[] = [root]
  const rounds: RoundStat[] = []
  // Copy used so far, across rounds, so a title picked in round 2 blocks it in round 3.
  const used = new Map<string, Set<string>>()

  const hasFollowUps = () =>
    walk(root).some((n) => !n.pending && followUpQuestions(n).length > 0)
  for (
    let round = 1;
    (frontier.length || hasFollowUps()) && round <= MAX_ROUNDS;
    round++
  ) {
    const started = Date.now()
    const qs: Q[] = []
    const pending: Pending[] = []
    const slotKeys = new Map<string, string[]>()

    // Follow-ups ride along with this round: questions that needed last round's answers.
    const followUps =
      round > 1
        ? walk(root)
            .filter((n) => !n.pending)
            .flatMap((node) => followUpQuestions(node).map((d) => ({ node, d })))
        : []
    // Set mode: once the proposed sections exist, each one is asked whether it adds
    // something the others do not. This is the joint check independent yes/no
    // questions cannot make, and it rides along with the round that asks details.
    const pruneKeys = new Map<string, string>()
    if (PAGE_SET_MODE && round === 2 && root.children.length > 1) {
      const names = root.children.map((c) => c.kind)
      for (const c of root.children) {
        const key = `${c.id}_keep`
        const others = names.filter((k) => k !== c.kind).join(", ")
        const instructions = `The page has these sections: ${names.join(", ")}. Does the ${c.kind} section add something important for the request that ${others} do not already cover?`
        qs.push({ key, options: 0, cost: costOf(instructions), question: { type: "boolean", instructions } })
        pruneKeys.set(c.id, key)
      }
    }
    const asks = [
      ...frontier.flatMap((node) =>
        detailQuestions(node, {
          spans,
          parent: parents.get(node.id) ?? null,
        }).map((d) => ({ node, d }))
      ),
      ...followUps,
    ]
    for (const { node, d } of asks) {
      if (d.type === "choice") {
        const key = `${node.id}_${d.prop}`
        const instructions = `${where(node)} ${d.instructions}`
        qs.push({
          key,
          options: Object.keys(d.options).length,
          cost: costOf(instructions, d.options),
          question: { type: "choice", instructions, criteria: d.options },
        })
        pending.push({ kind: "choice", node, q: d, key })
      } else {
        const keys = d.items.map((item, i) => {
          const key = `${node.id}_${d.prop}__${i}`
          const instructions = `${where(node)} ${d.ask(item)}`
          qs.push({
            key,
            options: 0,
            cost: costOf(instructions),
            question: { type: "boolean", instructions },
          })
          return key
        })
        pending.push({ kind: "set", node, q: d, keys })
      }
    }
    for (const node of frontier) {
      const g = GRAMMAR[node.kind]
      if (g && !(PAGE_SET_MODE && node.kind === "page")) {
        const criteria: Record<string, string | null> = {}
        if (g.noneAllowed) criteria[NONE] = KIND_INFO.none
        for (const k of allowedKinds(node)) criteria[k] = KIND_INFO[k]
        const keys: string[] = []
        for (let i = 0; i < g.slots; i++) {
          const key = `${node.id}_s${i}`
          keys.push(key)
          const instructions = `Inside the ${node.kind}${node.path ? ` at position ${node.path}` : ""}: ${g.describe(i)} Which component belongs here?`
          qs.push({
            key,
            options: Object.keys(criteria).length,
            cost: costOf(instructions, criteria),
            question: { type: "choice", instructions, criteria },
          })
        }
        slotKeys.set(node.id, keys)
      }
    }

    const next: UINode[] = []
    let calls = 0
    if (qs.length) {
      const res = await ask(stateFor(query, root), qs, opts.signal)
      calls = res.calls
      applyChoices(pending, res.answers, overrides, used)
      applySets(pending, res.answers)
      repair(pending, res.answers)
      if (pruneKeys.size) {
        const scored = root.children.map((c) => ({ c, p: res.answers.get(pruneKeys.get(c.id)!)?.probability ?? 1 }))
        const best = scored.reduce((a, b) => (b.p > a.p ? b : a))
        const keep = scored.filter((x) => x.p >= 0.5 || x === best).map((x) => x.c)
        const dropped = root.children.filter((c) => !keep.includes(c))
        if (dropped.length) {
          root.children = keep
          root.decisions.push({ prop: "pruned", choice: dropped.map((d) => d.kind).join(", "), probability: null, alternatives: [], note: "sections Jev judged redundant next to the others" })
          const renumber = (n: UINode, path: string) => {
            n.path = path
            n.children.forEach((c, i) => renumber(c, `${path}.${i + 1}`))
          }
          root.children.forEach((c, i) => renumber(c, `${i + 1}`))
          const gone = new Set(dropped.flatMap((d) => walk(d)))
          frontier = frontier.filter((n) => !gone.has(n))
        }
      }
      // Set mode: the page's sections came from yes/no questions, already in canonical order.
      if (PAGE_SET_MODE && frontier.includes(root) && Array.isArray(root.props.sections)) {
        const rated = root.decisions.find((d) => d.prop === "sections")?.set ?? []
        root.children = (root.props.sections as string[]).map((k, i) => {
          const child = makeNode(k as Kind, root, i, ids++)
          const p = rated.find((r) => r.item === k)?.p ?? null
          child.decisions.push({ prop: "kind", choice: k, probability: p, alternatives: [] })
          parents.set(child.id, root)
          return child
        })
        delete root.props.sections
        root.pendingSlots = 0
        next.push(...root.children)
      }
      for (const node of frontier) {
        const keys = slotKeys.get(node.id)
        if (!keys) continue
        node.children = resolveSlots(node, keys, res.answers, overrides).map(
          ({ kind, decision }, i) => {
            const child = makeNode(kind, node, i, ids++)
            child.decisions.push(decision)
            parents.set(child.id, node)
            return child
          }
        )
        node.pendingSlots = 0
        next.push(...node.children)
      }
    }
    for (const node of frontier) node.pending = false

    // Leaves with nothing to decide are complete the moment they exist.
    for (const n of next) {
      if (
        !GRAMMAR[n.kind] &&
        detailQuestions(n, { spans, parent: parents.get(n.id) ?? null })
          .length === 0
      )
        n.pending = false
    }
    frontier = next.filter((n) => n.pending)

    const stat = {
      round,
      ms: Date.now() - started,
      questions: qs.length,
      calls,
    }
    rounds.push(stat)
    opts.onRound?.(structuredClone(root), stat)
  }

  tidy(root)
  return { tree: root, rounds }
}
