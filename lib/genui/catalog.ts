// The grammar Jev walks. Jev never writes text or code: every prop below is a
// choice over a closed option set or a set picked by yes/no questions, and every
// child slot is a choice over the kinds its parent allows. Anything Jev cannot
// choose (sample numbers, names, dates) is filled in by the interpreter.

import * as B from "./banks"
import type { Kind, UINode } from "./types"

export const MAX_DEPTH = 3 // page = 0, sections = 1, containers inside sections = 2, leaves = 3
export const NONE = "none"

// Kept short on purpose: every slot question carries all of these, and Jev's
// limit is request size, so long descriptions cost reliability.
export const KIND_INFO: Record<Kind | typeof NONE, string> = {
  page: "the whole page",
  grid: "2-4 equal tiles side by side",
  split: "two columns: main content and a side panel",
  tabs: "2-3 switchable views",
  card: "a titled panel with a few small elements",
  row: "small elements side by side",
  hero: "big headline and buttons; landing and marketing pages",
  stats: "3-4 KPI tiles with trends; dashboards, analytics, monitoring",
  form: "fields and a submit button; sign up, checkout, booking, contact",
  chart: "chart of a metric; dashboards and analytics",
  table: "rows of records; admin panels, CRMs, orders",
  list: "list of items (tasks, people, files, messages), optionally with photos; to-do apps",
  board: "kanban columns of cards; tasks, hiring, deals, tickets",
  chat: "message thread and composer; support, messaging, AI assistants",
  player: "music or podcast player",
  pricing: "2-3 plans with prices; pricing pages",
  profile: "profile header; user profiles, portfolios",
  details: "label and value rows; order summaries, account info",
  listings: "grid of photo cards with prices; shops, rentals, courses, search results",
  search: "search bar with filters",
  settings: "on/off preferences; settings pages",
  features: "3-6 benefits with icons; landing pages",
  steps: "progress through stages",
  testimonial: "a customer quote",
  cta: "closing banner with a headline and button",
  timeline: "events in order",
  accordion: "collapsible FAQ",
  alert: "short callout message",
  calendar: "month calendar",
  empty: "empty state or 404; only when there is nothing to show",
  swipe: "one big photo card with pass and like buttons",
  keypad: "calculator, dialer or PIN pad",
  forecast: "weather now and the coming days",
  detail: "one product or listing page: photos, price, options, buy button",
  gallery: "grid of photos; portfolios, venues, albums",
  carousel: "horizontally scrolling photo cards",
  video: "video player with a poster frame",
  map: "map with pins",
  logos: "row of customer or partner logos",
  feed: "social posts with photos and likes; social and community apps",
  comments: "reviews or a comment thread",
  timeslots: "pick a date and time to book; reservations, appointments",
  footer: "page footer with link columns",
  banner: "thin announcement bar at the very top",
  heatmap: "activity grid of days; habit and streak trackers",
  code: "code snippet; developer docs and APIs",
  tracker: "status card for an order, delivery or application with progress steps; order tracking",
  countdown: "live countdown to a date; launches, sales, maintenance pages",
  timer: "stopwatch, timer or pomodoro with controls; time tracking",
  filters: "filter controls (price, rating, brand...) for results; shop and search pages",
  matrix: "grid of rows by columns: permissions toggles or a comparison table",
  itinerary: "flight or train results with times, stops and prices; travel booking",
  ticket: "boarding pass, event ticket or coupon with a QR code",
  invite: "invite people by email with roles; team and sharing screens",
  breakdown: "amounts per category with bars or a donut; budgets, spending, portfolios",
  wallet: "payment cards or bank accounts; banking and billing",
  stories: "horizontal row of avatars; stories or frequent contacts",
  people: "grid of people with photos and titles; speakers, team, instructors",
  cart: "shopping cart items with quantities and subtotal",
  editor: "rich text editor with toolbar; notes, docs, composing email",
  article: "long-form text with headings; blog posts, legal terms, help and docs",
  week: "week calendar grid with event blocks; calendars and schedules",
  choices: "selectable options with prices: ticket types, donation amounts",
  quiz: "quiz question, flashcard or score results; learning apps",
  call: "video call participant grid with controls; meetings, telehealth",
  reader: "an open email or support ticket with reply box",
  amenities: "icons with labels for what a place includes; rentals, hotels",
  thread: "discussion post with votes and nested replies; forums, communities",
  scanner: "camera viewfinder to scan a barcode, QR code or document",
  gauge: "value on a banded scale, like BMI, heart rate zone or credit score",
  days: "seven-day strip with a status per day; habits, workouts, plans",
  logs: "monospace log lines with levels; logs and developer consoles",
  pipeline: "build or deploy runs with stage progress; CI/CD",
  converter: "two linked fields that convert units or currencies",
  clocks: "current time in several cities; world clock",
  media: "photo card for one item",
  feature: "icon, title and one line",
  person: "avatar, name, role and button",
  heading: "a title line",
  stat: "one KPI with a trend",
  text: "a short paragraph",
  progress: "progress bar",
  field: "one labeled input",
  toggle: "one switch or checkbox",
  slider: "range slider",
  radio: "pick one of a few options",
  button: "one button",
  badges: "a few tags",
  avatars: "stacked profile pictures",
  image: "a photo",
  separator: "divider line",
  price: "a large price",
  rating: "stars and review count",
  status: "colored status dot",
  segmented: "2-3 option pill switch",
  searchbox: "one search input",
  otp: "one-time code boxes",
  quantity: "minus, number, plus",
  ring: "circular progress toward a goal",
  swatches: "color or size choices",
  upload: "file drop zone",
  pagination: "page numbers",
  breadcrumb: "breadcrumb trail",
  checklist: "list of included items with checkmarks",
  none: "nothing here",
}

type Grammar = {
  slots: number
  allowed: Kind[]
  min: number
  /** Kinds that may repeat among siblings; everything else is used at most once. */
  repeatable: Kind[]
  noneAllowed: boolean
  describe: (i: number) => string
  /** Kinds that show the same content; at most one per family among siblings. */
  families?: Kind[][]
}

const ORDINAL = ["first", "second", "third", "fourth"]
const SECTIONS: Kind[] = [
  "banner", "hero", "detail", "stats", "search", "listings", "gallery", "carousel", "grid", "split", "tabs", "card",
  "form", "chart", "table", "list", "board", "chat", "feed", "comments", "player", "video", "map", "pricing",
  "profile", "details", "features", "logos", "steps", "testimonial", "cta", "timeline", "accordion", "alert",
  "settings", "timeslots", "heatmap", "code", "empty", "swipe", "keypad", "forecast", "footer",
  "tracker", "countdown", "timer", "filters", "matrix", "itinerary", "ticket", "invite", "breakdown", "wallet",
  "stories", "people", "cart", "editor", "article", "week", "choices", "quiz", "call", "reader", "amenities",
  "thread", "scanner", "gauge", "days", "logs", "pipeline", "converter", "clocks",
  // Atoms are allowed on their own for requests like "just a button".
  "button", "searchbox", "otp", "calendar", "upload",
]
const ATOMS: Kind[] = [
  "text", "stat", "progress", "ring", "field", "toggle", "button", "badges", "avatars", "image", "separator",
  "price", "rating", "status", "segmented", "searchbox", "otp", "quantity", "swatches", "upload", "checklist",
  "pagination",
]

export const GRAMMAR: Partial<Record<Kind, Grammar>> = {
  page: {
    slots: 5,
    allowed: SECTIONS,
    min: 1,
    repeatable: ["card"],
    families: [["list", "table", "listings"], ["board", "list"], ["chat", "list"], ["player", "list"], ["gallery", "carousel", "listings"], ["detail", "listings"], ["detail", "form"]],
    noneAllowed: true,
    describe: (i) =>
      `Section ${i + 1} of up to 5, stacked top to bottom on the page. ${
        i === 0
          ? "The first section carries the main purpose of the request."
          : "Later sections add supporting content; choose none once the request is covered."
      }`,
  },
  grid: {
    slots: 4,
    allowed: ["card", "media", "feature", "person", "stat", "chart", "image", "progress", "ring", "video"],
    min: 2,
    repeatable: ["card", "media", "feature", "person", "stat", "chart", "image", "progress", "ring", "video"],
    noneAllowed: true,
    describe: (i) => `Tile ${i + 1} of up to 4 in a row of equal tiles. Tiles in one row are usually the same kind.`,
  },
  split: {
    slots: 2,
    allowed: ["card", "form", "chart", "table", "list", "details", "chat", "player", "video", "map", "gallery", "feed", "comments", "timeslots", "calendar", "profile", "settings", "timeline", "steps", "stats", "heatmap", "code", "image", "text", "accordion",
      "filters", "reader", "editor", "breakdown", "cart", "wallet", "tracker", "quiz", "gauge", "clocks", "converter", "logs",
      "pipeline", "thread", "people", "amenities", "invite", "choices", "ticket", "itinerary", "days", "timer", "matrix"],
    min: 2,
    repeatable: ["card"],
    families: [["chat", "list"]],
    noneAllowed: false,
    describe: (i) => (i === 0 ? "The left column, the wider main content." : "The right column, a narrower side panel."),
  },
  tabs: {
    slots: 3,
    allowed: ["chart", "table", "list", "form", "card", "board", "listings", "gallery", "feed", "comments", "map", "code", "settings", "details", "timeline",
      "breakdown", "week", "logs", "pipeline", "matrix", "people", "article", "reader"],
    min: 2,
    repeatable: ["chart", "table", "list", "card"],
    noneAllowed: true,
    describe: (i) => `The content of the ${ORDINAL[i]} tab.`,
  },
  card: {
    slots: 3,
    allowed: [...ATOMS, "chart", "table", "list", "details", "calendar", "row", "heading"],
    min: 1,
    repeatable: ["field", "toggle", "progress", "button", "stat", "text"],
    noneAllowed: true,
    describe: (i) => `Element ${i + 1} of up to 3 stacked inside the card.`,
  },
  row: {
    slots: 3,
    allowed: ["button", "badges", "avatars", "price", "rating", "status", "segmented", "searchbox", "quantity", "swatches", "pagination", "text"],
    min: 2,
    repeatable: ["button"],
    noneAllowed: true,
    describe: (i) => `Element ${i + 1} of up to 3 placed side by side in the row.`,
  },
}

/**
 * Experiment (JEV_PAGE_MODE=set): pick page sections with one yes/no question per
 * kind, laid out in this canonical order, instead of five competing slot choices.
 * Generic containers (grid, card, split, tabs) are left out: asked one at a time,
 * "would a card belong here?" is nearly always yes, which pads every page.
 */
export const PAGE_SET_MODE = process.env.JEV_PAGE_MODE === "set"
export const PAGE_ORDER: Kind[] = [
  "banner", "alert", "countdown", "hero", "detail", "profile", "stories", "search", "filters", "stats", "steps", "tracker",
  "board", "chat", "reader", "call", "feed", "thread", "swipe", "quiz", "editor", "article", "itinerary", "ticket",
  "cart", "choices", "wallet", "breakdown", "week", "days", "timer", "converter", "clocks", "scanner", "gauge", "logs",
  "pipeline", "matrix", "invite", "people", "amenities",
  "player", "video", "forecast", "listings", "gallery", "carousel", "form",
  "timeslots", "chart", "table", "list", "map", "heatmap", "details", "settings", "calendar", "pricing", "comments",
  "features", "logos", "testimonial", "timeline", "code", "keypad", "accordion", "empty", "button", "searchbox",
  "otp", "upload", "cta", "footer",
]
const FAMILY_CONFLICTS: [string[], string[]][] = [
  [["list"], ["table", "listings", "board", "chat", "player"]], [["table"], ["listings"]], [["gallery"], ["carousel", "listings"]],
  [["carousel"], ["listings"]], [["detail"], ["listings", "form"]], [["hero"], ["banner"]],
]

/** Containers may only nest down to MAX_DEPTH - 1; deeper slots get leaves only. */
export function allowedKinds(parent: UINode): Kind[] {
  const g = GRAMMAR[parent.kind]
  if (!g) return []
  const childDepth = parent.depth + 1
  return g.allowed.filter((k) => childDepth < MAX_DEPTH || !GRAMMAR[k])
}

// ---------------------------------------------------------------------------
// Questions asked once a node's kind is known.

export type ChoiceQuestion = {
  type: "choice"
  prop: string
  instructions: string
  options: Record<string, string | null>
  /** Questions sharing a key get distinct answers, assigned greedily by probability. */
  dedupeKey?: string
}

/** A set picked with one yes/no question per candidate, so candidates never compete. */
export type SetQuestion = {
  type: "set"
  prop: string
  items: string[]
  ask: (item: string) => string
  min: number
  max: number
  conflicts?: [string[], string[]][]
  /** "bank" keeps the bank's order (fields, columns); "rank" orders by probability. */
  order: "bank" | "rank"
  /** Probability an extra item needs beyond `min` (default 0.5). */
  threshold?: number
}

export type DetailQuestion = ChoiceQuestion | SetQuestion

type Ctx = { spans: string[]; parent: UINode | null }

const opts = (xs: string[], extra: string[] = []) =>
  Object.fromEntries([...new Set([...extra, ...xs])].map((x) => [x, null])) as Record<string, null>
const withNone = (xs: string[]) => ({ [NONE]: "leave this out", ...opts(xs) })
const keys = (o: Record<string, unknown>) => Object.keys(o)

// Copy should not repeat anywhere on the page, so copy dedupe keys are page-wide.
const page = (prop: string) => `page:${prop}`

function choice(prop: string, instructions: string, options: Record<string, string | null>, dedupeKey?: string): ChoiceQuestion {
  return { type: "choice", prop, instructions, options, dedupeKey }
}

export function detailQuestions(node: UINode, ctx: Ctx): DetailQuestion[] {
  const title = (what = "title") => choice("title", `The ${what}, summarizing what this holds.`, opts(B.HEADINGS, ctx.spans), page("title"))
  const own = (group: string) => `${node.id}:${group}`
  const qs: DetailQuestion[] = []

  // Tabs are labeled with their content's own title, so the two cannot disagree.

  switch (node.kind) {
    case "page":
      qs.push(
        choice("brand", "The product or business name shown on the page.", opts(B.BRAND_FALLBACK, ctx.spans)),
        choice("accent", "The accent color that best fits the mood of this request.", B.ACCENTS),
        choice("layout", "The overall frame of the page.", B.LAYOUTS),
      )
      if (PAGE_SET_MODE) {
        qs.push({
          type: "set", prop: "sections", items: PAGE_ORDER, min: 1, max: 5, order: "bank", threshold: 0.5, conflicts: FAMILY_CONFLICTS,
          ask: (k) => `Would a ${k} section (${KIND_INFO[k as Kind]}) belong on this page?`,
        })
      }
      break
    case "hero":
      qs.push(
        choice("headline", "The hero headline. {subject} is replaced with the subject chosen separately.", opts(B.HEADLINES)),
        choice("subject", "The subject the headline is about.", opts(ctx.spans.length ? ctx.spans : B.BRAND_FALLBACK)),
        choice("subtitle", "The supporting line under the headline.", opts(B.TAGLINES), page("tagline")),
        choice("cta", "The primary call-to-action button.", opts(B.BUTTONS), own("cta")),
        choice("cta2", "An optional secondary button.", withNone(B.BUTTONS), own("cta")),
        choice("align", "How the hero is laid out.", { center: "centered text, classic landing page", left: "text on the left, image on the right", cover: "text over a full-width photo, for travel, events and places" }),
      )
      break
    case "stats":
      qs.push({
        type: "set", prop: "metrics", items: keys(B.METRICS), min: 3, max: 4, order: "rank", conflicts: B.METRIC_CONFLICTS,
        ask: (item) => `Is "${item}" one of the most important numbers to show on this page?`,
      })
      break
    case "card":
      qs.push(
        title("card title"),
        choice("description", "An optional one-line description under the title.", withNone(B.TAGLINES), page("tagline")),
        choice("action", "An optional button in the card footer.", withNone(B.BUTTONS)),
      )
      break
    case "split":
      qs.push(choice("ratio", "How the width is shared between the two columns.", {
        "wide-left": "main content left, narrow panel right", equal: "two equal halves", "wide-right": "narrow panel left, main content right",
      }))
      break
    case "form":
      qs.push(
        title("form title"),
        choice("description", "An optional line under the form title.", withNone(B.TAGLINES), page("tagline")),
        choice("submit", "The label of the submit button.", opts(B.BUTTONS)),
        {
          type: "set", prop: "controls", items: B.CONTROLS.map(([l]) => l), min: 2, max: 6, order: "bank", conflicts: B.CONTROL_CONFLICTS,
          ask: (item) => `Should this form include "${item}"?`,
        },
      )
      break
    case "chart":
      qs.push(
        choice("metric", "The metric this chart plots.", opts(keys(B.METRICS)), page("metric")),
        choice("type", "The chart type that shows this metric best.", { area: "trend over time, filled", line: "trend over time", bar: "compare values across categories or periods", pie: "share of a whole", funnel: "drop-off through the steps of a flow" }),
        choice("x", "What the chart is broken down by.", { months: "months of the year", weeks: "recent weeks", weekdays: "days of the week", hours: "hours of the day", regions: "world regions", channels: "marketing channels", products: "product lines" }),
        choice("compare", "Whether to overlay the previous period.", { single: "one series", compare: "this period versus the previous one" }),
      )
      break
    case "table":
      qs.push(title("table title"), choice("selectable", "Whether rows can be selected for bulk actions (admin tools, inboxes).", { no: "read-only rows", yes: "checkboxes and a bulk action bar" }))
      break
    case "list":
      qs.push(
        choice("title", "What this list shows.", Object.fromEntries(keys(B.LIST_KINDS).map((k) => [k, B.LIST_KINDS[k][1]])), page("title")),
        choice("media", "Whether items show photos. Use photos whenever the request mentions photos or pictures.", B.LIST_MEDIA),
        choice("subject", "What the photos show, if any.", opts(B.ICONS)),
      )
      break
    case "board":
      qs.push(
        title("board title"),
        choice("pipeline", "Which stages the cards move through.", Object.fromEntries(keys(B.PIPELINES).map((k) => [k, B.PIPELINES[k].join(", ")]))),
        choice("covers", "Whether cards show a cover photo. Use photos whenever the request mentions photos or pictures.", B.BOARD_COVERS),
      )
      break
    case "chat":
      qs.push(title("conversation title"), choice("persona", "Who is talking in this conversation.", B.CHAT_PERSONAS))
      break
    case "player":
      qs.push(choice("media", "What is playing.", B.MEDIA_KINDS))
      break
    case "pricing":
      qs.push(
        choice("tiers", "The plan names.", opts(keys(B.TIER_PRESETS))),
        choice("period", "How prices are billed.", { month: "per month", year: "per year", "one-time": "one-time payment" }),
        choice("cta", "The button on each plan.", opts(["Get started", "Start free trial", "Subscribe", "Choose plan", "Contact sales", "Join now", "Buy now"])),
        {
          type: "set", prop: "features", items: B.PLAN_FEATURES, min: 4, max: 6, order: "rank",
          ask: (item) => `Would "${item}" be a selling point in these plans?`,
        },
      )
      break
    case "profile":
      qs.push(choice("persona", "Whose profile this is.", B.PROFILE_PERSONAS), choice("action", "The main button on the profile.", opts(B.PROFILE_ACTIONS)))
      break
    case "details":
      qs.push(title("details title"))
      break
    case "listings":
      // The title comes from the item type, so "Reservations" never heads a grid of restaurants.
      qs.push(
        choice("items", "What is being listed.", B.LISTING_TYPES),
        choice("count", "How many cards to show.", { "3": "three large cards", "4": "four cards", "6": "six smaller cards" }),
      )
      break
    case "search":
      qs.push(
        choice("scope", "What people are searching.", opts(B.SEARCH_SCOPES)),
        { type: "set", prop: "filters", items: B.FILTERS, min: 2, max: 4, order: "rank", ask: (item) => `Would people filter these results by "${item}"?` },
      )
      break
    case "settings":
      qs.push(title("settings group title"))
      break
    case "features":
      qs.push({
        type: "set", prop: "items", items: keys(B.FEATURES), min: 3, max: 6, order: "rank",
        ask: (item) => `Is "${item}" a strong selling point for this?`,
      })
      break
    case "steps":
      qs.push(
        choice("flow", "Which process these steps show.", Object.fromEntries(keys(B.FLOWS).map((k) => [k, B.FLOWS[k].join(", ")]))),
        choice("current", "Which step the person is on now.", { "1": "the first step", "2": "the second step", "3": "the third step", "4": "the last step" }),
      )
      break
    case "testimonial":
      qs.push(choice("quote", "The customer quote that fits best.", opts(B.QUOTES)))
      break
    case "cta":
      qs.push(
        choice("headline", "The closing headline. {subject} is replaced with the page's main subject.", opts(B.CTA_HEADLINES)),
        choice("button", "The button label.", opts(B.BUTTONS), page("cta")),
      )
      break
    case "timeline":
      qs.push(title("timeline title"), choice("story", "What the timeline tells.", B.TIMELINES))
      break
    case "accordion":
      qs.push(choice("title", "The section title.", opts(["Frequently asked questions", "Questions", "Good to know", "Help", "Before you book"])), {
        type: "set", prop: "questions", items: B.FAQS, min: 3, max: 4, order: "rank",
        ask: (item) => `Would people ask "${item}" here?`,
      })
      break
    case "alert":
      qs.push(choice("title", "The alert message.", opts(keys(B.ALERTS))))
      break
    case "empty":
      qs.push(choice("scenario", "What is empty.", opts(keys(B.EMPTY_SCENARIOS))))
      break
    case "swipe":
      qs.push(choice("subject", "What people swipe through.", B.SWIPE_SUBJECTS))
      break
    case "keypad":
      qs.push(choice("mode", "What the keypad is for.", B.KEYPADS))
      break
    case "forecast":
      qs.push(choice("range", "What the forecast covers.", B.FORECASTS))
      break
    case "detail":
      qs.push(
        choice("item", "What this page is about.", B.DETAIL_KINDS),
        choice("name", "The item's name.", opts(ctx.spans.length ? ctx.spans : ["Signature collection"])),
        choice("cta", "The main button.", opts(["Add to cart", "Buy now", "Book now", "Reserve", "Enroll now", "Get tickets", "Schedule a tour", "Order now", "Contact seller"])),
      )
      break
    case "gallery":
      qs.push(
        choice("subject", "What the photos show.", opts(B.ICONS)),
        choice("count", "How many photos.", { "4": "four large photos", "6": "six photos", "9": "nine small photos" }),
        choice("title", "The gallery title.", withNone(["Gallery", "Portfolio", "Photos", "Recent work", "Moments", "Our space", "Inspiration"])),
      )
      break
    case "carousel":
      qs.push(choice("items", "What the cards show.", B.LISTING_TYPES))
      break
    case "video":
      qs.push(choice("video", "What the video is.", B.VIDEO_KINDS))
      break
    case "map":
      qs.push(choice("places", "What the map shows.", B.MAP_PLACES))
      break
    case "logos":
      qs.push(choice("label", "The line above the logos.", opts(B.LOGO_LABELS)))
      break
    case "feed":
      qs.push(choice("source", "Whose posts these are.", B.FEED_KINDS))
      break
    case "comments":
      qs.push(choice("style", "What kind of comments.", B.COMMENT_KINDS))
      break
    case "timeslots":
      qs.push(choice("booking", "What is being booked.", B.BOOKINGS))
      break
    case "banner":
      qs.push(choice("message", "The announcement.", opts(B.BANNERS)))
      break
    case "heatmap":
      qs.push(choice("metric", "What the grid tracks.", opts(["Workouts", "Commits", "Meditation", "Reading", "Posts", "Practice", "Sales", "Check-ins"])))
      break
    case "code":
      qs.push(choice("snippet", "What the snippet shows.", B.CODE_SNIPPETS))
      break
    case "ring":
      qs.push(choice("label", "What the ring tracks.", opts(keys(B.METRICS)), page("metric")))
      break
    case "swatches":
      qs.push(choice("choices", "What to choose between.", B.SWATCH_KINDS))
      break
    case "upload":
      qs.push(choice("accept", "What can be uploaded.", B.UPLOAD_KINDS))
      break
    case "checklist":
      qs.push({ type: "set", prop: "items", items: B.CHECKLIST, min: 3, max: 5, order: "rank", ask: (item) => `Is "${item}" something this includes?` })
      break
    case "tracker":
      qs.push(choice("subject", "What is being tracked.", B.TRACK_SUBJECTS))
      break
    case "countdown":
      qs.push(choice("event", "What the countdown is for.", B.COUNTDOWN_EVENTS))
      break
    case "timer":
      qs.push(choice("mode", "What kind of timer.", B.TIMER_MODES))
      break
    case "filters":
      qs.push(
        choice("layout", "How the filters sit.", { panel: "a vertical panel beside results", bar: "a horizontal bar above results" }),
        { type: "set", prop: "facets", items: B.FACETS, min: 3, max: 5, order: "rank", ask: (item) => `Would people filter these results by "${item}"?` },
      )
      break
    case "matrix":
      qs.push(choice("mode", "What the grid shows.", B.MATRIX_MODES), choice("subject", "If it compares options, what they are.", B.COMPARE_SUBJECTS))
      break
    case "itinerary":
      qs.push(choice("mode", "What kind of trip view.", B.TRIP_MODES))
      break
    case "ticket":
      qs.push(choice("pass", "What kind of pass.", B.PASS_KINDS))
      break
    case "invite":
      qs.push(choice("purpose", "Who is being invited.", B.INVITE_PURPOSES))
      break
    case "breakdown":
      qs.push(choice("measure", "What is broken down.", B.BREAKDOWN_MEASURES), choice("style", "How it is drawn.", B.BREAKDOWN_STYLES))
      break
    case "wallet":
      qs.push(choice("mode", "What the wallet holds.", B.WALLET_MODES))
      break
    case "stories":
      qs.push(choice("mode", "What the avatar row is for.", B.STRIP_MODES))
      break
    case "people":
      qs.push(choice("role", "Who these people are.", B.PEOPLE_ROLES))
      break
    case "cart":
      qs.push(choice("items", "What is in the cart.", B.CART_KINDS))
      break
    case "editor":
      qs.push(choice("mode", "What is being written.", B.EDITOR_MODES))
      break
    case "article":
      qs.push(choice("type", "What kind of long-form page.", B.ARTICLE_TYPES))
      break
    case "week":
      qs.push(choice("mode", "What the week grid shows.", B.WEEK_MODES))
      break
    case "choices":
      qs.push(choice("mode", "What people choose between.", B.CHOICE_MODES))
      break
    case "quiz":
      qs.push(choice("mode", "Which quiz screen.", B.QUIZ_MODES))
      break
    case "call":
      qs.push(choice("mode", "Which call screen.", B.CALL_MODES))
      break
    case "reader":
      qs.push(choice("mode", "What is open.", B.READER_MODES))
      break
    case "amenities":
      qs.push(choice("place", "What the amenities belong to.", B.AMENITY_PLACES))
      break
    case "thread":
      qs.push(choice("style", "What kind of discussion.", B.THREAD_STYLES))
      break
    case "scanner":
      qs.push(choice("target", "What is being scanned.", B.SCAN_TARGETS))
      break
    case "gauge":
      qs.push(choice("measure", "What the scale measures.", B.GAUGE_MEASURES))
      break
    case "days":
      qs.push(choice("track", "What each day shows.", B.DAY_TRACKS))
      break
    case "logs":
      qs.push(choice("source", "Where the logs come from.", B.LOG_SOURCES))
      break
    case "converter":
      qs.push(choice("units", "What is converted.", B.CONVERTER_UNITS))
      break
    case "clocks":
      qs.push(choice("cities", "Which cities.", B.CLOCK_SETS))
      break
    case "media":
      qs.push(choice("items", "What this card shows.", B.LISTING_TYPES, ctx.parent ? `${ctx.parent.id}:media` : undefined))
      break
    case "feature":
      qs.push(choice("feature", "The benefit this tile describes.", opts(keys(B.FEATURES)), page("feature")))
      break
    case "person":
      qs.push(choice("persona", "Who this person is.", B.PROFILE_PERSONAS), choice("action", "The button on the card.", opts(B.PROFILE_ACTIONS)))
      break
    case "heading":
      qs.push(choice("text", "The heading text.", opts(B.HEADINGS, ctx.spans), page("title")))
      break
    case "stat":
      qs.push(choice("label", "The KPI this tile shows.", opts(keys(B.METRICS)), page("metric")))
      break
    case "text":
      qs.push(choice("body", "The paragraph that fits here best.", opts(B.PARAGRAPHS), page("body")))
      break
    case "progress":
      qs.push(choice("label", "What this progress bar tracks.", opts(keys(B.METRICS)), page("metric")))
      break
    case "field":
      qs.push(choice("label", "The label of this input field.", opts(B.FIELDS), page("field")))
      break
    case "toggle":
      qs.push(choice("label", "The label of this toggle.", opts(B.TOGGLES), page("toggle")))
      break
    case "slider":
      qs.push(choice("label", "What this slider controls.", opts(B.SLIDERS), page("slider")))
      break
    case "radio":
      qs.push(choice("group", "Which choice this radio group offers.", opts(keys(B.RADIOS)), page("radio")))
      break
    case "button":
      qs.push(
        choice("label", "The button label.", opts(B.BUTTONS), ctx.parent ? `${ctx.parent.id}:button` : undefined),
        choice("variant", "The button style.", { default: "primary, filled", outline: "secondary, outlined", ghost: "subtle", destructive: "dangerous action" }),
      )
      break
    case "badges":
      qs.push({ type: "set", prop: "tags", items: [...new Set([...ctx.spans.slice(0, 6), ...B.TAGS])], min: 2, max: 3, order: "rank", ask: (item) => `Is "${item}" a fitting tag here?` })
      break
    case "image":
      qs.push(
        choice("icon", "The subject of the picture.", opts(B.ICONS)),
        choice("aspect", "The image shape.", { wide: "wide banner", square: "square", portrait: "tall portrait" }),
      )
      break
    case "price":
      qs.push(choice("tier", "How expensive this is.", B.PRICE_TIERS), choice("period", "What the price is per.", B.PRICE_PERIODS))
      break
    case "rating":
      qs.push(choice("input", "Whether people give a rating here or just see one.", { display: "shows an existing rating", stars: "people tap stars to rate", emoji: "people pick an emoji face to rate" }))
      break
    case "status":
      qs.push(choice("state", "The state to show.", opts(B.STATUSES)))
      break
    case "segmented":
      qs.push(choice("options", "The options in the control.", opts(keys(B.SEGMENTS))))
      break
    case "searchbox":
      qs.push(choice("scope", "What this box searches.", opts(B.SEARCH_SCOPES)))
      break
    default:
      break
  }
  return qs
}

/**
 * Questions that depend on a node's own answers, asked one round later so they can
 * see them: sidebar links once the layout is known, table columns once the table
 * has a title ("Orders" should not get a Stock column), rows once details or
 * settings have a title.
 */
export function followUpQuestions(node: UINode): DetailQuestion[] {
  const titled = typeof node.props.title === "string" ? ` titled "${node.props.title}"` : ""
  if (node.kind === "page" && node.props.layout === "sidebar" && !node.props.nav) {
    return [{
      type: "set", prop: "nav", items: keys(B.NAV), min: 3, max: 5, order: "rank", conflicts: B.NAV_CONFLICTS, threshold: 0.75,
      ask: (item) => `Should the navigation sidebar include a "${item}" link?`,
    }]
  }
  if (node.kind === "table" && node.props.title && !node.props.columns) {
    return [{
      type: "set", prop: "columns", items: B.COLUMNS, min: 3, max: 5, order: "bank",
      ask: (item) => `Should the table${titled} have a "${item}" column?`,
      conflicts: [[["Name"], ["Customer", "Client"]], [["Customer"], ["Client"]], [["Amount"], ["Price", "Revenue"]], [["Date"], ["Due date", "Last active"]], [["Service"], ["Symbol"]]],
    }]
  }
  if (node.kind === "details" && node.props.title && !node.props.rows) {
    return [{
      type: "set", prop: "rows", items: B.KV_KEYS, min: 3, max: 6, order: "bank",
      ask: (item) => `Should the details${titled} include a "${item}" row?`,
    }]
  }
  if (node.kind === "settings" && node.props.title && !node.props.rows) {
    return [{
      type: "set", prop: "rows", items: keys(B.SETTINGS_ROWS), min: 3, max: 5, order: "bank",
      ask: (item) => `Should the settings group${titled} include "${item}"?`,
    }]
  }
  return []
}

// ---------------------------------------------------------------------------
// Candidate spans from the query itself: the only free text Jev can "write".

const STOP = new Set(
  ("a an the for of to in on at by with and or my our your me i we us it this that these those is are be " +
    "show make build create give want need some any page app ui screen view please like just also all see " +
    "can one what where who about said them they people thing things stuff something anything boss friday " +
    "ignore previous instructions print system prompt output reveal pretend simple nice cool beautiful " +
    "wants needs no not without except " +
    // Common Spanish, French and Portuguese function words.
    "de del la el los las para una un unos con y en por al le les des du pour et avec um uma com do da").split(" "),
)
// A span right after a negation names something the request excludes ("no charts").
const NEGATION = new Set(["no", "not", "without", "except", "never"])

export function spansOf(query: string): string[] {
  const words = query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 16)
  const excluded = new Set(words.map((w, i) => (i > 0 && NEGATION.has(words[i - 1]) ? i : -1)).filter((i) => i >= 0))
  const out = new Set<string>()
  for (let n = 3; n >= 1; n--) {
    for (let i = 0; i + n <= words.length; i++) {
      const gram = words.slice(i, i + n)
      if (gram.some((w) => STOP.has(w)) && (STOP.has(gram[0]) || STOP.has(gram[gram.length - 1]))) continue
      if (gram.some((_, k) => excluded.has(i + k))) continue
      if (gram.every((w) => /^\d+$/.test(w))) continue
      out.add(gram.map((w) => w[0].toUpperCase() + w.slice(1)).join(" "))
    }
  }
  return [...out].slice(0, 30)
}
