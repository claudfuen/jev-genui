// The grammar Jev walks. Jev never writes text or code: every prop below is a
// choice over a closed option set or a set picked by yes/no questions, and every
// child slot is a choice over the kinds its parent allows. Anything Jev cannot
// choose (sample numbers, names, dates) is filled in by the interpreter.

import * as B from "./banks"
import type { Kind, UINode } from "./types"

export const MAX_DEPTH = 3 // page = 0, sections = 1, containers inside sections = 2, leaves = 3
export const NONE = "none"

export const KIND_INFO: Record<Kind | typeof NONE, string> = {
  page: "the whole page",
  grid: "grid: 2-4 equal tiles side by side (feature cards, media cards, people, mixed tiles)",
  split: "split: two columns side by side, e.g. main content next to a side panel",
  tabs: "tabs: 2-3 switchable views of related content",
  card: "card: a titled panel grouping a few small elements",
  row: "row: a few small elements side by side, like a button group or a price next to a rating",
  hero: "hero banner: big headline, subtitle and call-to-action buttons (landing and marketing pages)",
  stats: "KPI row: 3-4 key metrics with trends (dashboards, analytics, monitoring)",
  form: "form: titled form with fields and a submit button (sign up, checkout, booking, contact)",
  chart: "chart: bar, line, area or pie chart of one metric over time or categories",
  table: "table: rows of records with columns",
  list: "list: a vertical list of items (people, tasks, notifications, files, messages, apps, services, tracks)",
  board: "kanban board: columns of cards moving through stages (tasks, hiring, deals, tickets)",
  chat: "chat: a message thread with a composer (support, messaging, AI assistant)",
  player: "media player: artwork, now playing, progress and playback controls",
  pricing: "pricing tiers: 2-3 plans side by side with prices, features and a button",
  profile: "profile header: avatar, name, role, stats and an action button",
  details: "details: label and value rows, like an order summary, property facts or account info",
  listings: "listings: a grid of media cards with image, title, price and rating (shop, rentals, courses)",
  search: "search bar with filter controls, placed above results",
  settings: "settings: rows of on/off preferences, each with a description",
  features: "feature grid: 3-6 benefits, each with an icon, title and one line",
  steps: "steps: a progress indicator through stages (checkout, onboarding, order tracking)",
  testimonial: "testimonial: a customer quote with the person's name",
  cta: "call to action: a closing banner with a headline and a button",
  timeline: "timeline: events in order (order tracking, activity, changelog, itinerary)",
  accordion: "FAQ accordion: collapsible frequently asked questions",
  alert: "alert: short callout banner (info, warning, success, error)",
  calendar: "calendar: month view for picking a date",
  empty: "empty state or error page: a friendly message when there is nothing to show (no results, 404 page not found)",
  swipe: "swipe deck: one big card at a time with pass and like buttons (dating-style matching)",
  keypad: "keypad: a calculator, dialer or PIN pad with a display and number keys",
  forecast: "weather forecast: current conditions with a strip of upcoming days or hours",
  media: "media card: image, title, price and rating for one item",
  feature: "feature tile: icon, title and one line about a benefit",
  person: "person card: avatar, name, role and a button",
  heading: "heading: a title line",
  stat: "stat: one KPI tile with a big number and a trend",
  text: "text: a short paragraph of copy",
  progress: "progress bar toward a goal",
  field: "form field: one labeled input",
  toggle: "toggle: one on/off switch or checkbox with a label",
  slider: "slider: a range input with a label",
  radio: "radio group: pick one of a few options",
  button: "button: a single action button",
  badges: "badges: a row of tags or status chips",
  avatars: "avatars: stacked profile pictures of people",
  image: "image: a picture or media placeholder",
  separator: "separator: a thin divider line",
  price: "price: a large price with its billing period",
  rating: "rating: stars with a review count",
  status: "status: a colored dot with a state like Online or Operational",
  segmented: "segmented control: 2-3 options in a pill, like Day / Week / Month",
  searchbox: "search box: one search input",
  otp: "verification code input: six boxes for a one-time code",
  quantity: "quantity stepper: minus, number, plus",
  none: "nothing: leave this position empty",
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
  "hero", "stats", "search", "listings", "grid", "split", "tabs", "card", "form", "chart", "table",
  "list", "board", "chat", "player", "pricing", "profile", "details", "features", "steps",
  "testimonial", "cta", "timeline", "accordion", "alert", "settings", "empty", "swipe", "keypad", "forecast",
  // Atoms are allowed on their own for requests like "just a button".
  "button", "searchbox", "otp", "calendar",
]
const ATOMS: Kind[] = [
  "text", "stat", "progress", "field", "toggle", "button", "badges", "avatars", "image", "separator",
  "price", "rating", "status", "segmented", "searchbox", "otp", "quantity",
]

export const GRAMMAR: Partial<Record<Kind, Grammar>> = {
  page: {
    slots: 5,
    allowed: SECTIONS,
    min: 1,
    repeatable: ["card"],
    families: [["list", "table", "listings"], ["board", "list"], ["chat", "list"], ["player", "list"]],
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
    allowed: ["card", "media", "feature", "person", "stat", "chart", "image", "progress"],
    min: 2,
    repeatable: ["card", "media", "feature", "person", "stat", "chart", "image", "progress"],
    noneAllowed: true,
    describe: (i) => `Tile ${i + 1} of up to 4 in a row of equal tiles. Tiles in one row are usually the same kind.`,
  },
  split: {
    slots: 2,
    allowed: ["card", "form", "chart", "table", "list", "details", "chat", "player", "calendar", "profile", "settings", "timeline", "steps", "stats", "image", "text", "accordion"],
    min: 2,
    repeatable: ["card"],
    families: [["chat", "list"]],
    noneAllowed: false,
    describe: (i) => (i === 0 ? "The left column, the wider main content." : "The right column, a narrower side panel."),
  },
  tabs: {
    slots: 3,
    allowed: ["chart", "table", "list", "form", "card", "board", "listings", "settings", "details", "timeline"],
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
    allowed: ["button", "badges", "avatars", "price", "rating", "status", "segmented", "searchbox", "quantity", "text"],
    min: 2,
    repeatable: ["button"],
    noneAllowed: true,
    describe: (i) => `Element ${i + 1} of up to 3 placed side by side in the row.`,
  },
}

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
      break
    case "hero":
      qs.push(
        choice("headline", "The hero headline. {subject} is replaced with the subject chosen separately.", opts(B.HEADLINES)),
        choice("subject", "The subject the headline is about.", opts(ctx.spans.length ? ctx.spans : B.BRAND_FALLBACK)),
        choice("subtitle", "The supporting line under the headline.", opts(B.TAGLINES), page("tagline")),
        choice("cta", "The primary call-to-action button.", opts(B.BUTTONS), own("cta")),
        choice("cta2", "An optional secondary button.", withNone(B.BUTTONS), own("cta")),
        choice("align", "How the hero is laid out.", { center: "centered text, classic landing page", left: "text on the left, image on the right" }),
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
        choice("type", "The chart type that shows this metric best.", { area: "trend over time, filled", line: "trend over time", bar: "compare values across categories or periods", pie: "share of a whole" }),
        choice("x", "What the chart is broken down by.", { months: "months of the year", weeks: "recent weeks", weekdays: "days of the week", hours: "hours of the day", regions: "world regions", channels: "marketing channels", products: "product lines" }),
        choice("compare", "Whether to overlay the previous period.", { single: "one series", compare: "this period versus the previous one" }),
      )
      break
    case "table":
      qs.push(title("table title"))
      break
    case "list":
      qs.push(choice("title", "What this list shows.", Object.fromEntries(keys(B.LIST_KINDS).map((k) => [k, B.LIST_KINDS[k][1]])), page("title")))
      break
    case "board":
      qs.push(title("board title"), choice("pipeline", "Which stages the cards move through.", Object.fromEntries(keys(B.PIPELINES).map((k) => [k, B.PIPELINES[k].join(", ")]))))
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
