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

## Measured Jev behavior (2026-09-23, SDK retries off)

- Successful calls: p50 ~280ms, p90 ~400ms wall clock from this Mac, including the Gateway.
- Failure odds grow with call size: ~10 questions x 76 options always succeeds, 16 x 40 fails
  with a 503 about half the time, 20 x 76 almost always fails. Small calls still 503 now and then,
  and about 1 in 30 hangs until a 504 at 30s.
- The AI SDK's default retry waits ~2s after a 503; that backoff was the entire latency tail.
  The engine therefore shards small (`SHARD_OPTIONS`, `SHARD_QUESTIONS`), passes `maxRetries: 0`,
  retries at once, and hedges a slow attempt (`robust()`). Re-measure before raising shard sizes.
- Price: $0.042 per million input tokens, output free. A page is roughly 20k tokens.

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
