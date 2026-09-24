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

- `lib/genui/banks.ts` is the whole vocabulary: every option Jev can pick. `lib/genui/catalog.ts`
  is the grammar: which kinds each container allows per slot (`GRAMMAR`), the questions per kind
  (`detailQuestions`), and questions that must wait for a node's own answers (`followUpQuestions`).
- Three question shapes, each for one job. `choice` for exclusive picks (component kind, chart
  type). A **set** is one `boolean` per candidate, keeping p >= 0.5 within min/max and honoring
  `conflicts`: use it for anything plural (form fields, table columns, KPIs, FAQs). Never pick sets
  slot by slot: sibling slots see identical questions, so Jev gives them all the same answer.
- Joint options beat independent ones. A list's title and item type are one choice (`LIST_KINDS`),
  alert text carries its tone, listings take their title from the item type, and tabs use their
  content's title. Anything asked in parallel can disagree; anything that depends on a title is a
  follow-up (table columns, detail rows, settings rows, sidebar links).
- `lib/genui/engine.ts` walks the tree breadth-first, one parallel batch of Jev calls per round,
  then applies choices (with page-wide dedupe), sets, and `repair()` for rules Jev cannot see
  (line charts need a time axis). A shard that fails every retry degrades to defaults, not a blank page.
- `app/api/compose/route.ts` streams one NDJSON event per round, then `done`; it takes user swaps
  as `overrides` keyed `path|prop`.
- `components/genui/kit.tsx` holds the shared render context, `useNode`, `Frame` and `Placeholder`;
  `components/genui/primitives.tsx` holds the coverage-study primitives (`PRIMITIVE_VIEWS`), and
  `app/primitives` renders every variant for visual QA. New primitives go there, plus a kind in
  `types.ts`, a `KIND_INFO` entry with a use-case hint, a placement in `SECTIONS`/`PAGE_ORDER`/split,
  and their questions in `detailQuestions`.
- `components/genui/interpreter.tsx` maps nodes to shadcn components. Numbers, names and dates are
  not decisions; `lib/genui/sample.ts` seeds them from query + node path so they stay stable.
- `components/inspector.tsx` shows every decision, set chips and clickable runners-up (swaps).

## Measuring quality

`bun scripts/eval.ts run --base <url> --label vN` composes a 42-prompt suite (25 realistic, 17 edge
cases) through a deployed API; `bun scripts/eval.ts judge --a vN --b vM` has Claude Sonnet 5 (not
Jev) grade four pass/fail criteria and compare head to head. Judge runs vary by about 10 points, so
compare versions in the same judge run and repeat before trusting a small delta. Reports land in
`evals/`; raw runs are gitignored. On 2026-09-23: v1 (first deploy) 26% pass, v10 74% (two judge
passes averaged), v10 won 74 of 82 head-to-head judgments.

## Measured Jev behavior (2026-09-23, SDK retries off)

- Successful calls: p50 ~280ms, p90 ~400ms wall clock from this Mac, including the Gateway.
- The size limit is input characters, not option count: 760 short options pass, while 167 options
  with sentence-long descriptions 503 often. Shards are budgeted by characters (`SHARD_CHARS`).
- 503s also come in provider-side bursts that hit even one-question calls. The AI SDK's default
  retry waits ~2s after a 503 (that was the whole early latency tail), so the engine passes
  `maxRetries: 0`, retries with short jittered backoff, and hedges slow attempts (`robust()`).
- Concurrency is not the problem: 24 parallel calls produced one error.
- Price: $0.042 per million input tokens, output free. A page is roughly 20k tokens.

## Rules

- Never name a component prop `kind`: every node already records a `kind` decision (which
  component it is), and swaps keyed `path|kind` replace the whole component.
- Keep `KIND_INFO` short but keep the use-case hint ("; dashboards, analytics"). Stripping hints to
  save request size cost about 10 points of pass rate when the menu grew to 45 sections.
- Every image goes through `Placeholder` in the interpreter (seeded gradient mesh, subject icon,
  optional caption) so photo slots look intentional and never flicker.

- shadcn preset `b1PzeK` (Base UI, not Radix): no `asChild`; compose with the `render` prop,
  and pass `nativeButton={false}` when a Button renders a non-button element.
- Next.js 16: read `node_modules/next/dist/docs/` before using an API you have not checked.
- Auth: on Vercel the AI Gateway uses the project's OIDC token automatically. Locally, set
  `AI_GATEWAY_API_KEY` in the environment; never commit it.
- Dogfood from the terminal: `bun scripts/try.ts "your prompt"` prints the rounds and the tree.
- `bun run lint` is broken at scaffold time (eslint 10 vs eslint-plugin-react); `bun run typecheck`
  is the gate until that is fixed upstream.
- No em dashes or double hyphens in copy or docs.
