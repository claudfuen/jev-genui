# Jev/ui

A generative UI sandbox. Type anything into the box and [Jev](https://vercel.com/ai-gateway/models/jev)
composes an interface as you type, which a React interpreter renders live.

## The twist: Jev cannot write code

Jev is an evaluation model. It never produces text. It answers typed questions: a probability
for a yes/no, one option out of a closed set, or a level on a scale. So instead of asking a model
to write JSX, this sandbox asks Jev to walk a grammar:

```
round 1  page     -> brand? accent? what goes in sections 1-4?
round 2  sections -> title? chart type? what goes in each tile?
round 3  tiles    -> which KPI? which icon? which field label?
```

Each round is one parallel batch of `choice` questions against the request and the tree so far.
The answers form a component tree, and the interpreter maps it onto shadcn/ui. Every choice,
with its probability and the runners-up, is visible in the Decisions panel.

Plural things (form fields, table columns, KPIs) are picked with one yes/no question per
candidate, so candidates never compete. Anything that depends on another answer waits a round:
a table picks its columns after it has a title.

A typical page takes 2 to 3 rounds, under a second.

## What it can compose

About 70 component kinds: dashboards (KPI tiles, charts, tables, heatmaps), apps (kanban, chat,
feeds, to-do lists, settings, booking time slots, maps), commerce (product pages with gallery,
swatches and cart, listings, pricing, order summaries), media (galleries, carousels, video, music
player), marketing (hero, features, logos, testimonials, CTA, footer), plus atoms like progress
rings, file upload, pagination and one-time-code inputs. Every photo slot is a seeded placeholder.

## Play with it

- **Swap:** every decision in the panel lists Jev's runners-up. Click one to swap it in.
- **Inspect:** click any component in the preview to jump to the choices behind it.
- **Confidence overlay:** outlines each component green, amber or red by how sure Jev was.
- **Share:** the URL carries your prompt (`?q=`).

## How good is it?

`scripts/eval.ts` runs 42 prompts, from "kanban board for a design team" to "asdfghjkl" and
prompt injections, and has an independent model grade each result on four pass/fail criteria.
The first version passed 26%; the current one passes 74% and wins 74 of 82 head-to-head
judgments against it.

## Run it

```bash
bun install
AI_GATEWAY_API_KEY=... bun dev
```

Or run it from the terminal without the UI:

```bash
AI_GATEWAY_API_KEY=... bun scripts/try.ts "sales dashboard for a coffee shop"
```

On Vercel, the AI Gateway authenticates with the project's OIDC token, so no key is needed.

## Where things live

| Path | What |
|---|---|
| `lib/genui/catalog.ts` | The grammar: allowed children per container, props per kind, option banks |
| `lib/genui/engine.ts` | The breadth-first grammar walk over Jev |
| `app/api/compose/route.ts` | Streams one event per round |
| `components/genui/interpreter.tsx` | Renders the tree with shadcn/ui |
| `components/inspector.tsx` | Shows every decision and its probability |
