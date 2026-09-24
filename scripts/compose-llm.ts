// Diagnostic arm: an LLM composes the same tree from the same vocabulary and is
// rendered by the same interpreter. If it beats Jev, the composer is the ceiling;
// if not, the vocabulary and renderer are.
//
//   bun scripts/compose-llm.ts --model anthropic/claude-sonnet-5 --label llm-sonnet [--only 16]

import { generateText } from "ai"
import { readFileSync, writeFileSync } from "node:fs"

import { GRAMMAR, KIND_INFO, detailQuestions, followUpQuestions, spansOf } from "../lib/genui/catalog"
import { expandEmoji } from "../lib/genui/engine"
import type { Kind, UINode } from "../lib/genui/types"
import { SUITE } from "./eval"

function arg(name: string, fallback?: string) {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : fallback
}

const stub = (kind: Kind, extra: Record<string, string> = {}): UINode => ({
  id: "x", path: "1", kind, depth: 1, props: { title: "T", layout: "sidebar", ...extra }, children: [], pending: false, pendingSlots: 0, decisions: [],
})

/** The grammar as text: kinds, what containers accept, and every prop's allowed values. */
function grammarSpec(spans: string[]) {
  const lines: string[] = []
  for (const [kind, info] of Object.entries(KIND_INFO)) {
    if (kind === "none") continue
    const k = kind as Kind
    const qs = [...detailQuestions(stub(k), { spans, parent: null }), ...followUpQuestions(stub(k))]
    const props = qs.map((q) =>
      q.type === "choice"
        ? `${q.prop}: one of ${JSON.stringify(Object.keys(q.options))}`
        : `${q.prop}: ${q.min}-${q.max} of ${JSON.stringify(q.items)}`,
    )
    const g = GRAMMAR[k]
    const kids = g ? ` Children (up to ${g.slots}): ${g.allowed.join(", ")}.` : ""
    lines.push(`- ${kind}: ${info}.${kids}${props.length ? `\n    props: ${props.join("; ")}` : ""}`)
  }
  return lines.join("\n")
}

function toNode(raw: unknown, path: string, depth: number, ids: { n: number }): UINode | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as { kind?: string; props?: Record<string, unknown>; children?: unknown[] }
  if (!r.kind || !(r.kind in KIND_INFO)) return null
  const props: UINode["props"] = {}
  for (const [k, v] of Object.entries(r.props ?? {})) {
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") props[k] = String(v)
    else if (Array.isArray(v)) props[k] = v.map(String)
  }
  const children = (r.children ?? [])
    .map((c, i) => toNode(c, path ? `${path}.${i + 1}` : `${i + 1}`, depth + 1, ids))
    .filter((c): c is UINode => !!c)
  return { id: `n${ids.n++}`, path, kind: r.kind as Kind, depth, props, children, pending: false, pendingSlots: 0, decisions: [] }
}

const model = arg("model", "anthropic/claude-sonnet-5")!
const label = arg("label", "llm")!
const only = Number(arg("only", "0"))
const suite = only ? SUITE.filter((_, i) => i % Math.ceil(SUITE.length / only) === 0) : SUITE

const out: { q: string; tag: string; tree: UINode | null; ms: number; rounds: number; error?: string }[] = []
const queue = [...suite]
await Promise.all(
  Array.from({ length: 4 }, async () => {
    for (let s = queue.shift(); s; s = queue.shift()) {
      const q = expandEmoji(s.q)
      const t = Date.now()
      try {
        const { text } = await generateText({
          model,
          prompt: `Compose a user interface for this request, as a JSON component tree, using only this grammar.
Fit every choice to the request, honor anything it asks to leave out, and keep it as small as the request implies.
The root is {"kind":"page","props":{"brand":...,"accent":...,"layout":...},"children":[up to 5 sections]}.
Each node is {"kind":..., "props":{...}, "children":[...]} and nesting is at most 3 levels below the page.
Only use the prop values listed; "none" means leave it out. Reply with the JSON only.

Request: "${q}"

Grammar:
${grammarSpec(spansOf(q))}`,
        })
        const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)
        const tree = toNode(JSON.parse(json), "", 0, { n: 0 })
        out.push({ q: s.q, tag: s.tag, tree, ms: Date.now() - t, rounds: 1, error: tree ? undefined : "invalid tree" })
        process.stdout.write(tree ? "." : "x")
      } catch (e) {
        out.push({ q: s.q, tag: s.tag, tree: null, ms: Date.now() - t, rounds: 0, error: String(e).slice(0, 200) })
        process.stdout.write("x")
      }
    }
  }),
)
out.sort((a, b) => SUITE.findIndex((s) => s.q === a.q) - SUITE.findIndex((s) => s.q === b.q))
writeFileSync(`evals/${label}.json`, JSON.stringify(out, null, 1))
const ms = out.filter((o) => o.tree).map((o) => o.ms).sort((a, b) => a - b)
console.log(`\n${label}: ${ms.length}/${out.length} composed, p50 ${ms[Math.floor(ms.length / 2)]}ms, p90 ${ms[Math.floor(ms.length * 0.9)]}ms`)
// Also save the matching Jev subset so the judge compares like with like.
const jev = JSON.parse(readFileSync("evals/v12.json", "utf8")) as { q: string }[]
writeFileSync("evals/v12-sub.json", JSON.stringify(jev.filter((r) => out.some((o) => o.q === r.q)), null, 1))
