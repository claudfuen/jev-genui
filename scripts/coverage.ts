// Primitive coverage analysis: which components does a top-tier screen need, across
// the use cases people actually ask for, and how many does our vocabulary cover?
//
//   bun scripts/coverage.ts corpus     # ~200 realistic prompts across 20 categories
//   bun scripts/coverage.ts design     # Sonnet designs the ideal screen for each, as primitives
//   bun scripts/coverage.ts analyze    # cluster proposals, measure coverage, greedy set cover
//
// Output lands in evals/coverage/.

import { generateObject } from "ai"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { z } from "zod"

import { KIND_INFO } from "../lib/genui/catalog"

const MODEL = "anthropic/claude-sonnet-5"
const DIR = "evals/coverage"
mkdirSync(DIR, { recursive: true })

const CATEGORIES = [
  "SaaS dashboards and analytics", "admin panels and internal tools (CRUD, users, permissions, moderation)",
  "e-commerce storefront (catalog, product, cart, checkout, orders, returns)", "marketing and landing pages (SaaS, agency, app, event, nonprofit)",
  "auth and onboarding (sign in, sign up, 2FA, password reset, onboarding wizard, invites)", "settings and account (profile, billing, notifications, security, team)",
  "social and community (feed, profile, groups, forums, followers)", "productivity (to-do, calendar, notes, kanban, docs, time tracking)",
  "communication (email, chat, video calls, notification center)", "finance and fintech (banking, budgeting, investing, crypto, invoices, payments)",
  "health and fitness (activity tracking, workouts, nutrition, telehealth, appointments)", "education (courses, lessons, quizzes, flashcards, LMS)",
  "travel and hospitality (search, flights, hotels, booking, itinerary)", "food and restaurants (menus, ordering, delivery tracking, recipes, reservations)",
  "marketplaces and listings (real estate, jobs, cars, rentals, freelancers)", "media and entertainment (music, video, podcasts, streaming, news, photos)",
  "developer tools (API docs, logs, deployments, monitoring, status pages, CI)", "forms and surveys (contact, applications, multi-step, feedback, quizzes)",
  "utilities and widgets (calculators, weather, timers, converters, clocks, simple games)", "edge and system pages (404, empty states, errors, maintenance, legal, FAQ, pricing)",
]

async function corpus() {
  const Out = z.object({ prompts: z.array(z.string()).min(6).max(40) })
  const all: { q: string; category: string }[] = []
  await Promise.all(
    CATEGORIES.map(async (category) => {
      const { object } = await generateObject({
        model: MODEL,
        schema: Out,
        prompt: `Write 10 realistic prompts someone would type into a "describe any UI and it appears" box, for the category: ${category}.
Vary them the way real people do: mostly short (3-8 words), some specific ("invoice detail page for a design agency"), some vague ("my bank app"),
a couple with constraints ("checkout without account creation"). Cover the most common screens in this category first. No numbering.`,
      })
      for (const q of object.prompts.slice(0, 10)) all.push({ q: q.trim(), category })
    }),
  )
  writeFileSync(`${DIR}/corpus.json`, JSON.stringify(all, null, 1))
  console.log(`corpus: ${all.length} prompts`)
}

const Section = z.object({
  primitive: z.string().describe("An existing primitive name when it does this job well; otherwise a new short kebab-case name."),
  isNew: z.boolean(),
  definition: z.string().describe("For new primitives: one line on what it shows and does. Empty for existing ones."),
  why: z.string().describe("A few words on the section's job on this screen."),
})
const Design = z.object({
  layout: z.enum(["topbar", "sidebar", "bare"]),
  sections: z.array(Section).min(1).max(8),
})

async function design() {
  const cases = JSON.parse(readFileSync(`${DIR}/corpus.json`, "utf8")) as { q: string; category: string }[]
  const existing = Object.entries(KIND_INFO).filter(([k]) => k !== "none" && k !== "page").map(([k, v]) => `${k}: ${v}`).join("\n")
  const file = `${DIR}/designs.json`
  const done: Record<string, unknown> = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {}
  const queue = cases.filter((c) => !done[c.q])
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      for (let c = queue.shift(); c; c = queue.shift()) {
        try {
          const { object } = await generateObject({
            model: MODEL,
            schema: Design,
            prompt: `You are a top product designer. For the request below, design the screen a best-in-class product would ship:
the sections top to bottom (usually 2-6), each as one UI primitive. Reuse an existing primitive ONLY when it does the job
well as described; if the screen needs something they cannot do well, propose a new primitive with a clear, reusable,
domain-neutral name (e.g. "order-tracker", not "pizza-order-tracker"). Do not pad the screen.

Request: "${c.q}"

Existing primitives:
${existing}`,
          })
          done[c.q] = { ...object, category: c.category }
          process.stdout.write(".")
        } catch (e) {
          process.stdout.write("x")
        }
      }
    }),
  )
  writeFileSync(file, JSON.stringify(done, null, 1))
  console.log(`\ndesigns: ${Object.keys(done).length}/${cases.length}`)
}

async function analyze() {
  type D = { layout: string; category: string; sections: z.infer<typeof Section>[] }
  const designs = JSON.parse(readFileSync(`${DIR}/designs.json`, "utf8")) as Record<string, D>
  const known = new Set(Object.keys(KIND_INFO))

  // 1. Cluster every proposed new primitive into canonical primitives.
  const proposals = new Map<string, { n: number; defs: Set<string> }>()
  for (const d of Object.values(designs))
    for (const s of d.sections)
      if (s.isNew || !known.has(s.primitive)) {
        const p = proposals.get(s.primitive) ?? { n: 0, defs: new Set() }
        p.n++
        if (p.defs.size < 2 && s.definition) p.defs.add(s.definition)
        proposals.set(s.primitive, p)
      }
  const list = [...proposals].sort((a, b) => b[1].n - a[1].n)
  const Clusters = z.object({
    clusters: z.array(z.object({
      name: z.string().describe("canonical kebab-case primitive name"),
      definition: z.string().describe("at most 14 words"),
      members: z.array(z.string()),
      mergeInto: z.string().describe("existing primitive it is a variant of, or empty"),
    })).max(80),
  })
  const { object } = await generateObject({
    model: MODEL,
    schema: Clusters,
    maxOutputTokens: 12000,
    prompt: `Merge these proposed UI primitives into canonical, reusable primitives. Merge synonyms and near-duplicates
aggressively; keep genuinely different jobs apart. If a proposal is really a variant of an existing primitive (e.g.
"data-table-with-filters" is a table variant), set mergeInto to that existing name. Each proposed name appears in exactly
one cluster. Definitions: at most 14 words. Output each cluster once.

Existing primitives: ${[...known].join(", ")}

Proposed (name, count, definition):
${list.map(([n, p]) => `${n} (${p.n}): ${[...p.defs][0]?.slice(0, 110) ?? ""}`).join("\n")}`,
  })
  const canon = new Map<string, string>()
  for (const c of object.clusters) for (const m of c.members) canon.set(m, c.mergeInto && known.has(c.mergeInto) ? `~${c.mergeInto}` : c.name)

  // 2. Per use case: the set of missing primitives (variants of existing ones count as upgrades, not gaps).
  const needs = Object.entries(designs).map(([q, d]) => ({
    q,
    category: d.category,
    missing: [...new Set(d.sections.filter((s) => s.isNew || !known.has(s.primitive)).map((s) => canon.get(s.primitive) ?? s.primitive).filter((n) => !n.startsWith("~")))],
    upgrades: [...new Set(d.sections.map((s) => canon.get(s.primitive) ?? "").filter((n) => n.startsWith("~")).map((n) => n.slice(1)))],
    used: d.sections.filter((s) => known.has(s.primitive)).map((s) => s.primitive),
  }))
  const covered = needs.filter((n) => n.missing.length === 0).length

  // 3. Greedy set cover: which new primitives cover the most remaining use cases.
  const remaining = needs.filter((n) => n.missing.length > 0)
  const chosen: { name: string; gain: number; cum: number }[] = []
  let cum = covered
  const have = new Set<string>()
  while (cum / needs.length < 0.95 && chosen.length < 40) {
    const counts = new Map<string, number>()
    for (const n of remaining) {
      const left = n.missing.filter((m) => !have.has(m))
      if (left.length === 1) counts.set(left[0], (counts.get(left[0]) ?? 0) + 1)
    }
    // Prefer primitives that complete a use case; fall back to the most requested one.
    let best = [...counts].sort((a, b) => b[1] - a[1])[0]
    if (!best) {
      const freq = new Map<string, number>()
      for (const n of remaining) for (const m of n.missing) if (!have.has(m)) freq.set(m, (freq.get(m) ?? 0) + 1)
      best = [...freq].sort((a, b) => b[1] - a[1])[0]
      if (!best) break
      best = [best[0], 0]
    }
    have.add(best[0])
    cum = needs.filter((n) => n.missing.every((m) => have.has(m))).length
    chosen.push({ name: best[0], gain: best[1], cum })
  }

  const usedFreq = new Map<string, number>()
  for (const n of needs) for (const u of new Set(n.used)) usedFreq.set(u, (usedFreq.get(u) ?? 0) + 1)
  const upFreq = new Map<string, number>()
  for (const n of needs) for (const u of n.upgrades) upFreq.set(u, (upFreq.get(u) ?? 0) + 1)
  const defs = new Map(object.clusters.map((c) => [c.name, c.definition]))
  const pct = (a: number) => `${Math.round((100 * a) / needs.length)}%`

  const report = [
    `# Primitive coverage, ${needs.length} use cases`,
    "",
    `Fully covered by today's ${known.size - 2} primitives: **${covered} (${pct(covered)})**.`,
    "",
    "## Greedy additions to reach 90%+",
    "",
    "| # | New primitive | Completes | Cumulative coverage | Definition |",
    "|---|---|---|---|---|",
    ...chosen.map((c, i) => `| ${i + 1} | ${c.name} | ${c.gain} | ${pct(c.cum)} | ${defs.get(c.name) ?? ""} |`),
    "",
    "## Existing primitives that need a richer variant",
    "",
    ...[...upFreq].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => `- ${k}: ${v} use cases`),
    "",
    "## Most used existing primitives",
    "",
    ...[...usedFreq].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => `- ${k}: ${v}`),
    "",
    "## Coverage by category (today)",
    "",
    ...CATEGORIES.map((cat) => {
      const inCat = needs.filter((n) => n.category === cat)
      return `- ${cat}: ${inCat.filter((n) => !n.missing.length).length}/${inCat.length}`
    }),
  ]
  writeFileSync(`${DIR}/clusters.json`, JSON.stringify(object.clusters, null, 1))
  writeFileSync(`${DIR}/needs.json`, JSON.stringify(needs, null, 1))
  writeFileSync(`${DIR}/report.md`, report.join("\n") + "\n")
  console.log(report.slice(0, 50).join("\n"))
}

const cmd = process.argv[2]
if (cmd === "corpus") await corpus()
else if (cmd === "design") await design()
else await analyze()
