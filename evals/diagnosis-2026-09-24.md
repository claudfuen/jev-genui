# Diagnosis: what limits Jev/ui, and what it would take to level it up

2026-09-24. Every number below comes from the eval in `scripts/eval.ts` (judge: Claude Sonnet 5),
which now grades the page's **visible text** (server-rendered with the real interpreter), not just
Jev's decisions. Subset comparisons use 17 prompts and swing by up to 15 points between judge runs,
so treat single differences under ~15 points as noise.

## 1. The biggest gap is content, and nothing chooses it

With the judge reading what people actually see, v12 passes the four structure criteria 56-64% of
the time but **only ~30% also pass content fit** (content criterion ~45%).

Nothing decides sample content today: lists, table rows, kanban cards, chat lines, product names and
prices come from one fixed pool per component. Observed failures:

- Wrong domain: a law firm's "Cases" board holds "Dark mode" and "API rate limits"; a bakery shows
  $4,375 subscription orders; a dog-owner feed never mentions dogs; sneakers get XS-XL sizes.
- Inconsistent: a metric shows 24.2K in its stat tile and 158.6K in the chart; a profile lives in
  New York and Miami; names do not match their emails; USDC priced at $177.
- Missing anchors: "weather forecast for miami" never says Miami.

Content fit is identical whether Jev or Sonnet composes (47% vs 47%), so this is a vocabulary and
renderer problem, not a composer problem.

**Simulated fix (upper bound):** Claude Haiku 4.5 rewrote each page's visible content to fit the
request, structure unchanged. Content fit rose from 53% to 71% and it won head to head 10-2 (5 ties),
at p50 1.3s / p90 2.4s. Simulated because the renderer does not consume written content yet.

## 2. Jev composes clean but thin pages, because it cannot judge a page as a whole

| Composer (same vocabulary + renderer) | Sections per page | Clean | Head to head vs Sonnet | p50 latency |
|---|---|---|---|---|
| Jev, slot choices (production, v12) | 1.9 | 72-88% | loses 3-14 | 0.75s |
| Jev, yes/no per section (threshold 0.5) | 3.9 | 30% | not run | 0.61s |
| Jev, yes/no per section (threshold 0.8) | 1.8 | 80% | not run | 0.56s |
| Jev, yes/no + joint redundancy check (v15) | 3.2 | 58-65% | **loses 7-9** | 0.64-0.79s |
| Claude Haiku 4.5 composing | 3.1 | 65% | not run (ties Jev 9-7) | 3.1s |
| Claude Sonnet 5 composing | 3.3 | 65-71% | - | 8.5s |

- Graded alone, Jev's pages score as well or better (they are clean), but the judge prefers the
  richer pages side by side: Sonnet beat production Jev 14-3.
- Independent yes/no questions cannot see each other: at 0.5 they pad pages with redundant sections,
  at 0.8 they fall back to thin pages. No threshold gets both.
- Asking each proposed section "does this add something the others do not?" in the round that already
  runs (no extra latency) got Jev to Sonnet-like richness and near parity head to head, at a tenth of
  the latency, but cleanliness still trails production. It is behind `JEV_PAGE_MODE=set`, off by default.
- An LLM composer is not worth the swap: Sonnet is 11x slower for a modest win over the best Jev
  variant, and Haiku is 4x slower for roughly Jev's quality.

## 3. Latency is the moat; keep Jev on structure

Jev composes a page in 0.6-0.8s. The best LLM composer takes 8.5s. A copy pass that runs after Jev's
structure streams in keeps first paint under a second and finishes content at roughly 2s.

## What it would take, in order

1. **Content layer (largest measured lever).**
   - Deterministic fixes first, no LLM: one value per metric per page (tile and chart agree), statuses
     and pools per domain (legal matters, service jobs, bakery goods), names that match emails, sizes and
     currency by context. Cheap, and removes the "inconsistent" class of failures entirely.
   - Then a copywriter pass: after Jev's structure, a fast model fills each node's content through a
     per-kind schema (list items, rows, cards, messages, prices, product names), so it can change words
     but never structure. Renderers read `node.content` before the sample pools. About 25 kinds carry
     content. Jev can gate each section with "does this content fit the request?" before swapping it in.
     Cost is well under a cent per page with Haiku or Gemini Flash Lite.
2. **Holistic composition.** Keep production on slot mode for now. Next experiment: generate 3-4 whole
   page plans from Jev's own section probabilities and have Jev pick one plan in a single choice
   question (choosing among whole alternatives is what it is best at), then prune.
3. **Measurement that can resolve small wins.** 100+ prompts, two judge passes per comparison, and a
   screenshot judge for visual quality; today's 17-prompt subsets cannot see a 10-point change.
4. **Visual polish.** Pages are uniform stacks of cards in one column. Layout variety (full-bleed
   heroes, alternating section backgrounds, denser app shells) and optional real or generated photos
   are the next visible jump; a taste pass is worth doing once content is fixed.

## Experiment scripts

- `scripts/render-text.tsx`: server-renders a tree to the text a person reads.
- `scripts/compose-llm.ts`: an LLM composes the same tree from the same grammar.
- `scripts/copy-sim.ts`: simulated copywriter pass over a run's visible text.
- `JEV_PAGE_MODE=set`: yes/no page sections with the joint redundancy check.
