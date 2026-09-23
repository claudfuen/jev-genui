import { experimental_evaluate as evaluate, type Experimental_EvaluationQuestion } from "ai"

import {
  GRAMMAR,
  KIND_INFO,
  NONE,
  allowedKinds,
  detailQuestions,
  spansOf,
} from "./catalog"
import type { Decision, Kind, RoundStat, UINode } from "./types"

const MODEL = "typesafe-ai/jev"
// Measured on 2026-09-23: 20 questions x 76 options returns in ~450ms, 30 x 76
// is refused with a 503, and 80 x 20 takes ~2.9s. Shard well below both limits
// and run the shards in parallel so a round costs one call's latency.
const SHARD_OPTIONS = 700
const SHARD_QUESTIONS = 16
const MAX_ROUNDS = 5

type Answer = { choice: string; probabilities?: Record<string, number> }

type Q = {
  key: string
  node: UINode
  prop: string
  slot?: number
  dedupeKey?: string
  question: Experimental_EvaluationQuestion & { criteria: Record<string, string | null> }
}

function ranked(a: Answer): [string, number][] {
  const entries = Object.entries(a.probabilities ?? { [a.choice]: 1 })
  return entries.sort((x, y) => y[1] - x[1])
}

function decisionOf(prop: string, a: Answer, choice: string, note?: string): Decision {
  const r = ranked(a)
  return {
    prop,
    choice,
    probability: a.probabilities?.[choice] ?? (choice === a.choice ? null : 0),
    alternatives: r
      .filter(([o]) => o !== choice)
      .slice(0, 3)
      .map(([option, p]) => ({ option, p })),
    note,
  }
}

function describeNode(n: UINode): string {
  const p = n.props
  const bits: string[] = [n.path ? `${n.path} ${n.kind}` : n.kind]
  for (const k of ["brand", "accent", "title", "tabLabel", "metric", "label", "items", "headline", "group"]) {
    if (typeof p[k] === "string" && p[k] !== NONE) bits.push(`${k} "${p[k]}"`)
  }
  if (n.pendingSlots) bits.push("(contents being decided)")
  return bits.join(", ")
}

function outline(n: UINode, indent = ""): string {
  return [indent + "- " + describeNode(n), ...n.children.map((c) => outline(c, indent + "  "))].join("\n")
}

function stateFor(query: string, root: UINode) {
  return [
    "You are composing a user interface for what someone typed into a generative UI sandbox.",
    "The interface is a tree of components, decided one level at a time. Fit every choice to the request.",
    "",
    `Request: "${query}"`,
    "",
    "Interface so far:",
    outline(root),
  ].join("\n")
}

function where(n: UINode) {
  return n.path ? `This is about the ${n.kind} at position ${n.path}.` : "This is about the whole page."
}

async function askSharded(state: string, qs: Q[], signal?: AbortSignal) {
  const shards: Q[][] = []
  let cur: Q[] = []
  let size = 0
  for (const q of qs) {
    const n = Object.keys(q.question.criteria).length
    if (cur.length && (size + n > SHARD_OPTIONS || cur.length >= SHARD_QUESTIONS)) {
      shards.push(cur)
      cur = []
      size = 0
    }
    cur.push(q)
    size += n
  }
  if (cur.length) shards.push(cur)

  const results = await Promise.all(
    shards.map((shard) =>
      evaluate({
        model: MODEL,
        state,
        questions: Object.fromEntries(shard.map((q) => [q.key, q.question])),
        maxRetries: 1,
        abortSignal: signal,
      }),
    ),
  )
  const answers = new Map<string, Answer>()
  for (const r of results) {
    for (const [k, v] of Object.entries(r.answers)) answers.set(k, v as Answer)
  }
  return { answers, calls: shards.length }
}

/** Distinct answers for questions sharing a dedupe key, greedily in tree order. */
function assignDetails(qs: Q[], answers: Map<string, Answer>) {
  const used = new Map<string, Set<string>>()
  for (const q of qs) {
    const a = answers.get(q.key)
    if (!a) continue
    let choice = a.choice
    let note: string | undefined
    if (q.dedupeKey) {
      const taken = used.get(q.dedupeKey) ?? new Set<string>()
      if (taken.has(choice)) {
        const alt = ranked(a).find(([o]) => !taken.has(o))
        if (alt) {
          note = `"${choice}" already used by a sibling`
          choice = alt[0]
        }
      }
      if (choice !== NONE) taken.add(choice)
      used.set(q.dedupeKey, taken)
    }
    q.node.props[q.prop] = choice
    q.node.decisions.push(decisionOf(q.prop, a, choice, note))
  }
}

function makeNode(kind: Kind, parent: UINode | null, index: number, id: number): UINode {
  const g = GRAMMAR[kind]
  return {
    id: `n${id}`,
    path: parent ? (parent.path ? `${parent.path}.${index + 1}` : `${index + 1}`) : "",
    kind,
    depth: parent ? parent.depth + 1 : 0,
    props: {},
    children: [],
    pending: true,
    pendingSlots: g ? g.slots : 0,
    decisions: [],
  }
}

/** Pick one kind per slot, honoring uniqueness and the parent's minimum child count. */
function resolveSlots(parent: UINode, slotQs: Q[], answers: Map<string, Answer>) {
  const g = GRAMMAR[parent.kind]!
  const used = new Set<string>()
  const picks: { kind: string; a: Answer; note?: string }[] = []
  for (const q of slotQs) {
    const a = answers.get(q.key)
    if (!a) continue
    let kind = NONE
    let note: string | undefined
    for (const [opt] of ranked(a)) {
      if (opt !== NONE && !g.repeatable.includes(opt as Kind) && used.has(opt)) {
        note = `"${opt}" already used in this ${parent.kind}`
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
      .map((p) => ({ p, alt: ranked(p.a).find(([o]) => o !== NONE && (g.repeatable.includes(o as Kind) || !used.has(o))) }))
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

  picks.forEach((p, i) => parent.decisions.push(decisionOf(`slot ${i + 1}`, p.a, p.kind, p.note)))
  let kinds = picks.map((p) => p.kind).filter((k) => k !== NONE) as Kind[]
  // A hero only makes sense at the top of a page.
  if (parent.kind === "page" && kinds.includes("hero")) kinds = ["hero", ...kinds.filter((k) => k !== "hero")]
  return kinds
}

function clone(n: UINode): UINode {
  return structuredClone(n)
}

export async function compose(
  query: string,
  opts: { signal?: AbortSignal; onRound?: (tree: UINode, stat: RoundStat) => void } = {},
) {
  const spans = spansOf(query)
  let ids = 0
  const root = makeNode("page", null, 0, ids++)
  const parents = new Map<string, UINode | null>([[root.id, null]])
  let frontier: UINode[] = [root]
  const rounds: RoundStat[] = []

  for (let round = 1; frontier.length && round <= MAX_ROUNDS; round++) {
    const started = Date.now()
    const detailQs: Q[] = []
    const slotQs = new Map<string, Q[]>()

    for (const node of frontier) {
      const parent = parents.get(node.id) ?? null
      for (const d of detailQuestions(node, { spans, parent })) {
        detailQs.push({
          key: `${node.id}_${d.prop}`,
          node,
          prop: d.prop,
          dedupeKey: d.dedupeKey,
          question: { type: "choice", instructions: `${where(node)} ${d.instructions}`, criteria: d.options },
        })
      }
      const g = GRAMMAR[node.kind]
      if (g) {
        const criteria: Record<string, string | null> = {}
        if (g.noneAllowed) criteria[NONE] = KIND_INFO.none
        for (const k of allowedKinds(node)) criteria[k] = KIND_INFO[k]
        const qs: Q[] = []
        for (let i = 0; i < g.slots; i++) {
          qs.push({
            key: `${node.id}_s${i}`,
            node,
            prop: `slot ${i + 1}`,
            slot: i,
            question: {
              type: "choice",
              instructions: `Inside the ${node.kind}${node.path ? ` at position ${node.path}` : ""}: ${g.describe(i, g.slots)} Which component belongs here?`,
              criteria,
            },
          })
        }
        slotQs.set(node.id, qs)
      }
    }

    const all = [...detailQs, ...[...slotQs.values()].flat()]
    const next: UINode[] = []
    let calls = 0
    if (all.length) {
      const res = await askSharded(stateFor(query, root), all, opts.signal)
      calls = res.calls
      assignDetails(detailQs, res.answers)
      for (const node of frontier) {
        const qs = slotQs.get(node.id)
        if (!qs) continue
        const kinds = resolveSlots(node, qs, res.answers)
        node.children = kinds.map((k, i) => {
          const child = makeNode(k, node, i, ids++)
          parents.set(child.id, node)
          return child
        })
        node.pendingSlots = 0
        next.push(...node.children)
      }
    }
    for (const node of frontier) node.pending = false

    // Leaves with nothing to decide are complete the moment they exist.
    for (const n of next) {
      if (!GRAMMAR[n.kind] && detailQuestions(n, { spans, parent: parents.get(n.id) ?? null }).length === 0) n.pending = false
    }
    frontier = next.filter((n) => n.pending)

    const stat = { round, ms: Date.now() - started, questions: all.length, calls }
    rounds.push(stat)
    opts.onRound?.(clone(root), stat)
  }

  return { tree: root, rounds }
}
