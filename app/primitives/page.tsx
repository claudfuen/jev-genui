"use client"

// Every primitive and variant on one page: a browsable library and the visual
// QA surface for the coverage-study primitives.

import * as React from "react"

import { Interpreter } from "@/components/genui/interpreter"
import type { Kind, UINode } from "@/lib/genui/types"

const VARIANTS: [Kind, Record<string, string | string[]>][] = [
  ["tracker", { subject: "delivery" }], ["countdown", { event: "launch" }], ["timer", { mode: "pomodoro" }], ["timer", { mode: "tracker" }],
  ["filters", { layout: "panel", facets: ["Price range", "Rating", "Brand", "Color", "Size", "Bedrooms"] }], ["filters", { layout: "bar", facets: ["Price range", "Stops"] }],
  ["matrix", { mode: "permissions" }], ["matrix", { mode: "comparison", subject: "rooms" }], ["itinerary", { mode: "flights" }], ["itinerary", { mode: "booked" }],
  ["ticket", { pass: "boarding pass" }], ["invite", { purpose: "teammates" }], ["breakdown", { measure: "budget", style: "bars" }], ["breakdown", { measure: "portfolio", style: "donut" }],
  ["wallet", { mode: "cards" }], ["wallet", { mode: "accounts" }], ["stories", { mode: "stories" }], ["people", { role: "doctors" }], ["cart", { items: "food" }],
  ["editor", { mode: "email" }], ["editor", { mode: "post" }], ["article", { type: "legal" }], ["article", { type: "docs" }], ["week", { mode: "calendar" }], ["week", { mode: "guide" }],
  ["choices", { mode: "donation" }], ["choices", { mode: "tickets" }], ["quiz", { mode: "question" }], ["quiz", { mode: "flashcard" }], ["quiz", { mode: "results" }],
  ["call", { mode: "meeting" }], ["call", { mode: "preview" }], ["reader", { mode: "ticket" }], ["amenities", { place: "hotel" }], ["thread", { style: "qa" }],
  ["scanner", { target: "receipt" }], ["gauge", { measure: "credit score" }], ["days", { track: "habits" }], ["logs", { source: "deployment" }], ["pipeline", {}],
  ["converter", { units: "temperature" }], ["clocks", { cities: "team" }],
  ["table", { title: "Patients", columns: ["Name", "Email", "Status"], selectable: "yes" }], ["rating", { input: "emoji" }], ["chart", { metric: "Signups", type: "funnel" }],
  ["hero", { align: "cover", headline: "Welcome to {subject}", subject: "Lisbon" }], ["upload", { accept: "avatar" }], ["list", { title: "Watchlist", media: "none" }],
  ["listings", { items: "enrolled", count: "3" }], ["detail", { item: "product", name: "Everyday Sneaker", cta: "Add to cart" }],
  ["form", { title: "Create an account", controls: ["Email", "Password", "Confirm password"], submit: "Sign up" }], ["chat", { persona: "team" }],
]

export default function PrimitivesPage() {
  const [filter, setFilter] = React.useState("")
  // Live clocks and countdowns differ between server and client, so render after mount.
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const shown = VARIANTS.filter(([k, p]) => !filter || `${k} ${JSON.stringify(p)}`.toLowerCase().includes(filter.toLowerCase()))
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Primitives</h1>
          <p className="text-muted-foreground">{VARIANTS.length} variants Jev can compose. Everything here is live and interactive.</p>
        </div>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter..." className="h-9 rounded-lg border bg-background px-3 text-sm" />
      </header>
      {mounted && shown.map(([kind, props], i) => {
        const tree: UINode = {
          id: "n0", path: "", kind: "page", depth: 0, props: { brand: "Acme", accent: ["blue", "emerald", "violet", "orange", "rose", "teal", "amber", "indigo"][i % 8], layout: "bare" },
          pending: false, pendingSlots: 0, decisions: [],
          children: [{ id: `n${i + 1}`, path: "1", kind, depth: 1, props, children: [], pending: false, pendingSlots: 0, decisions: [] }],
        }
        return (
          <section key={i} id={`${kind}-${i}`} className="overflow-hidden rounded-2xl border">
            <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2 font-mono text-xs"><span className="font-semibold">{kind}</span><span className="truncate text-muted-foreground">{JSON.stringify(props)}</span></div>
            <div className="[&_main]:min-h-0 [&_main]:py-6"><Interpreter tree={tree} seed={`library ${kind} ${i}`} highlight={null} /></div>
          </section>
        )
      })}
    </div>
  )
}
