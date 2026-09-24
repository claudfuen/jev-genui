// Diagnostic arm (simulated): keep Jev's tree, have a fast LLM rewrite the page's
// visible sample content to fit the request, and let the judge grade that text.
// An upper-bound estimate of a copywriter pass; the renderer does not consume it yet.
//
//   bun scripts/copy-sim.ts --from v12-sub --label v12-copy --model anthropic/claude-haiku-4.5
import { generateText } from "ai"
import { readFileSync, writeFileSync } from "node:fs"

import type { UINode } from "../lib/genui/types"
import { visibleText } from "./render-text"

const arg = (n: string, f?: string) => (process.argv.includes(`--${n}`) ? process.argv[process.argv.indexOf(`--${n}`) + 1] : f)
const from = arg("from", "v12-sub")!
const label = arg("label", "v12-copy")!
const model = arg("model", "anthropic/claude-haiku-4.5")!
const runs = JSON.parse(readFileSync(`evals/${from}.json`, "utf8")) as { q: string; tree: UINode | null; text?: string; copyMs?: number }[]

const queue = [...runs]
await Promise.all(Array.from({ length: 4 }, async () => {
  for (let r = queue.shift(); r; r = queue.shift()) {
    if (!r.tree) continue
    const text = visibleText(r.tree, r.q.toLowerCase())
    const t = Date.now()
    const { text: out } = await generateText({
      model,
      prompt: `This is the visible text of a UI generated for the request "${r.q}", in reading order, segments separated by |.
Rewrite only the sample content (names, list items, table cells, cards, messages, prices, descriptions, numbers) so it fits
the request's domain and is consistent across the page. Keep the same segments in the same order, and keep UI labels and
button text unless they are clearly wrong for the domain. Reply with the rewritten text only, in the same | format.

${text}`,
    })
    r.copyMs = Date.now() - t
    r.text = out.trim()
    process.stdout.write(".")
  }
}))
writeFileSync(`evals/${label}.json`, JSON.stringify(runs, null, 1))
const ms = runs.filter((r) => r.copyMs).map((r) => r.copyMs!).sort((a, b) => a - b)
console.log(`\n${label}: copy pass p50 ${ms[Math.floor(ms.length / 2)]}ms, p90 ${ms[Math.floor(ms.length * 0.9)]}ms`)
