// Dogfood the grammar walk from the terminal: bun scripts/try.ts "sales dashboard for a coffee shop"
import { compose } from "../lib/genui/engine"
import type { UINode } from "../lib/genui/types"

const query = process.argv.slice(2).join(" ") || "sales dashboard for a coffee shop"
const show = (n: UINode, pad = ""): string => {
  const props = Object.entries(n.props).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(" ")
  return [`${pad}${n.path || "page"} ${n.kind} ${props}`, ...n.children.map((c) => show(c, pad + "  "))].join("\n")
}
const t = Date.now()
const { tree, rounds } = await compose(query, {
  onRound: (_, s) => console.log(`round ${s.round}: ${s.ms}ms, ${s.questions} questions, ${s.calls} calls`),
})
console.log(`total ${Date.now() - t}ms\n${show(tree)}`)
