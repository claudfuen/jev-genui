@AGENTS.md

# jev-genui

A generative UI sandbox. You type into one input; Jev (`typesafe-ai/jev`, via the Vercel AI
Gateway) composes an interface as a component tree, and a React interpreter renders it live.

## The one fact everything depends on

**Jev never writes text or code.** Through the AI SDK's `experimental_evaluate` it answers only
three typed question kinds: `boolean` (probability), `choice` (one option from a closed set,
255 options max) and `score` (a level on an ordered scale). So "generation" here is a grammar
walk: every component kind, prop and piece of copy is a choice over options we supply.

## How a composition runs

- `lib/genui/catalog.ts` is the grammar: which kinds each container allows per slot
  (`GRAMMAR`), the detail questions per kind (`detailQuestions`), and every option bank.
  Free text comes only from spans of the user's own words (`spansOf`) plus the banks.
- `lib/genui/engine.ts` walks the tree breadth-first. Each round asks, in one parallel batch,
  the props of nodes decided last round plus the kinds for their child slots. Depth is capped
  by `MAX_DEPTH`, so a page takes 3-4 rounds.
- Sibling questions are independent, so Jev answers identical questions identically. Distinct
  answers come from `dedupeKey`: picks are reassigned greedily down each probability ranking.
- `app/api/compose/route.ts` streams one NDJSON event per round, then `done`.
- `components/genui/interpreter.tsx` maps nodes to shadcn components. Numbers, names and dates
  are not decisions; `lib/genui/sample.ts` seeds them from query + node path so they stay stable.
- `components/inspector.tsx` shows every decision with its probability and runners-up.

## Measured Jev limits (2026-09-23, from this Mac)

- One call is roughly 150ms at the provider and 250-600ms wall clock, with occasional 2.5s tails.
- 20 questions x 76 options is fine; 30 x 76 returns a 503; 80 x 20 takes about 2.9s. The engine
  shards at `SHARD_OPTIONS` / `SHARD_QUESTIONS` and runs shards in parallel. Re-measure before
  raising either.

## Rules

- shadcn preset `b1PzeK` (Base UI, not Radix): no `asChild`; compose with the `render` prop,
  and pass `nativeButton={false}` when a Button renders a non-button element.
- Next.js 16: read `node_modules/next/dist/docs/` before using an API you have not checked.
- Auth: on Vercel the AI Gateway uses the project's OIDC token automatically. Locally, set
  `AI_GATEWAY_API_KEY` in the environment; never commit it.
- Dogfood from the terminal: `bun scripts/try.ts "your prompt"` prints the rounds and the tree.
- `bun run lint` is broken at scaffold time (eslint 10 vs eslint-plugin-react); `bun run typecheck`
  is the gate until that is fixed upstream.
- No em dashes or double hyphens in copy or docs.
