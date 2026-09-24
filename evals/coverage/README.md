# Primitive coverage study (2026-09-24)

**Question:** which primitives does a top-tier screen need across the use cases people actually
ask for, and how many does the vocabulary cover?

**Method** (`scripts/coverage.ts`):
1. `corpus`: Claude Sonnet 5 wrote 200 realistic prompts, 10 in each of 20 categories (dashboards,
   admin, storefront, landing pages, auth, settings, social, productivity, communication, finance,
   health, education, travel, food, marketplaces, media, developer tools, forms, utilities, system
   pages). See `corpus.json`.
2. `design`: for each prompt, Sonnet designed the screen a best-in-class product would ship as a
   list of sections. It reused an existing primitive only when it does the job well and otherwise
   proposed a new one. 196 of 200 designs parsed (`designs.json`).
3. Clustering: the 73 distinct proposals were merged by hand into canonical primitives or variants
   of existing ones (`mapping.json`), then coverage was recomputed.

**Result**

| | Use cases fully covered |
|---|---|
| Before (70 primitives) | 121 / 196 (62%) |
| After 29 new primitives + 8 variants | 192 / 196 (98%) |

Only 80 of the 1,026 designed sections (8%) needed a primitive that did not exist; the gap was a
long tail of single uses, closed by merging near-duplicates. The 4 left out on purpose: a
moderation review panel, synced lyrics, a webhook simulator and a photo-editing canvas.

**New primitives:** tracker, countdown, timer, filters, matrix, itinerary, ticket, invite,
breakdown, wallet, stories, people, cart, editor, article, week, choices, quiz, call, reader,
amenities, thread, scanner, gauge, days, logs, pipeline, converter, clocks.

**Variants:** selectable tables with a bulk-action bar, interactive star and emoji ratings, funnel
charts, a cover hero, avatar upload, watchlist and category lists, in-progress course cards,
chat typing indicator, password strength meter.

**Does Jev use them?** On 60 corpus prompts (3 per category), 26 pages used a new primitive, and
9 of the 13 prompts whose ideal screen needs one got it (bank app got a wallet, flight search got
results plus filters, video call got a call grid, flashcards got a quiz, CI/CD got a pipeline).
Judged on visible text against the previous production engine, the new build won 28 to 10 with
22 ties. Absolute pass rates (52% on four criteria, 33% with content) are still limited by
composition depth and by sample content that no model writes; see `../diagnosis-2026-09-24.md`.

Every primitive and variant can be browsed live at `/primitives`.
