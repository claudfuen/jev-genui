// Vocabulary audit: run a spread of prompts and report where Jev is unsure.
// A low top probability means no offered option fit, which is where atoms are missing.
// bun scripts/audit.ts
import { compose } from "../lib/genui/engine"
import type { UINode } from "../lib/genui/types"

const SUITE = [
  "sales dashboard for a coffee shop", "sign up form for a yoga studio", "landing page for a surf school",
  "team settings with notifications", "podcast analytics", "checkout for a sneaker store",
  "server health monitoring", "restaurant reservation", "chat app for customer support",
  "music player", "kanban board for a design team", "user profile page", "pricing page for a saas",
  "weather forecast for miami", "online course lesson page", "real estate listing", "crypto portfolio tracker",
  "hotel booking search results", "fitness tracker daily summary", "email inbox",
]

type Row = { key: string; p: number; choice: string; query: string }
const rows: Row[] = []
const walk = (n: UINode, query: string) => {
  for (const d of n.decisions) {
    const prop = d.prop.startsWith("slot") ? "slot" : d.prop.replace(/\d+$/, "")
    rows.push({ key: `${n.kind}.${prop}`, p: d.probability ?? 0, choice: d.choice, query })
  }
  n.children.forEach((c) => walk(c, query))
}

const outlines: string[] = []
for (let i = 0; i < SUITE.length; i += 5) {
  await Promise.all(
    SUITE.slice(i, i + 5).map(async (q) => {
      const { tree } = await compose(q)
      walk(tree, q)
      outlines.push(`${q}: ${tree.children.map((c) => `${c.kind}[${c.children.map((g) => g.kind).join(",")}]`).join(" ")}`)
    }),
  )
}

const by = new Map<string, Row[]>()
for (const r of rows) by.set(r.key, [...(by.get(r.key) ?? []), r])
console.log("key                  n   mean_p  share<0.5")
for (const [k, rs] of [...by].sort((a, b) => a[1].reduce((s, r) => s + r.p, 0) / a[1].length - b[1].reduce((s, r) => s + r.p, 0) / b[1].length)) {
  const mean = rs.reduce((s, r) => s + r.p, 0) / rs.length
  const low = rs.filter((r) => r.p < 0.5).length / rs.length
  console.log(`${k.padEnd(20)} ${String(rs.length).padStart(3)}   ${mean.toFixed(2)}    ${(low * 100).toFixed(0)}%`)
}
console.log("\nLowest-confidence picks:")
for (const r of rows.sort((a, b) => a.p - b.p).slice(0, 25)) console.log(`  ${r.p.toFixed(2)} ${r.key} = "${r.choice}"  (${r.query})`)
console.log("\nStructures:\n" + outlines.sort().join("\n"))
