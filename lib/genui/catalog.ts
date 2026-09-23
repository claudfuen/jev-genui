// The grammar Jev walks. Jev never writes text or code: every prop below is a
// choice over a closed option set, and every child slot is a choice over the
// component kinds its parent allows. Anything Jev cannot choose (sample numbers,
// names, dates) is filled in deterministically by the interpreter.

import type { Kind, UINode } from "./types"

export const MAX_DEPTH = 3 // page = 0, sections = 1, containers inside sections = 2, leaves = 3
export const NONE = "none"

export const KIND_INFO: Record<Kind | typeof NONE, string> = {
  page: "the whole page",
  hero: "hero banner: big headline, subtitle and call-to-action buttons (landing and marketing pages)",
  card: "card: a titled panel grouping a few elements",
  grid: "grid: 2-4 equal tiles side by side (KPI stats, feature cards, product tiles)",
  split: "split: two columns side by side, e.g. main content next to a side panel",
  tabs: "tabs: 2-3 switchable views of related content",
  form: "form: titled form with input fields and a submit button",
  chart: "chart: bar, line, area or pie chart of one metric",
  table: "table: rows of records with columns",
  list: "list: vertical list of items (people, tasks, notifications, files, messages, products, events, transactions)",
  accordion: "accordion: collapsible frequently asked questions",
  alert: "alert: short callout banner (info, warning, success, error)",
  calendar: "calendar: month view for picking a date",
  stat: "stat: one KPI tile with a big number and a trend",
  text: "text: a short paragraph of copy",
  progress: "progress bar toward a goal",
  field: "form field: a labeled input such as name, email, password, a dropdown or a text area",
  toggle: "toggle: an on/off switch or checkbox with a label",
  slider: "slider: a range input with a label",
  radio: "radio group: pick one of a few options",
  button: "button: a single action button",
  badges: "badges: a row of tags or status chips",
  avatars: "avatars: stacked profile pictures of people",
  image: "image: a picture or media placeholder",
  separator: "separator: a thin divider line",
  none: "nothing: leave this position empty",
}

type Grammar = {
  slots: number
  allowed: Kind[]
  min: number
  /** Kinds that may repeat among siblings; everything else is used at most once. */
  repeatable: Kind[]
  noneAllowed: boolean
  describe: (i: number, n: number) => string
}

const ORDINAL = ["first", "second", "third", "fourth", "fifth"]

export const GRAMMAR: Partial<Record<Kind, Grammar>> = {
  page: {
    slots: 4,
    allowed: ["hero", "grid", "card", "split", "tabs", "form", "chart", "table", "list", "accordion", "alert"],
    min: 1,
    repeatable: ["card"],
    noneAllowed: true,
    describe: (i) =>
      `Section ${i + 1} of up to 4, stacked top to bottom on the page. ${
        i === 0
          ? "The first section carries the main purpose of the request."
          : "Later sections hold supporting content; choose none once the request is covered."
      }`,
  },
  grid: {
    slots: 4,
    allowed: ["stat", "card", "chart", "progress", "image", "list"],
    min: 2,
    repeatable: ["stat", "card", "chart", "progress", "image", "list"],
    noneAllowed: true,
    describe: (i) => `Tile ${i + 1} of up to 4 in a row of equal tiles. Tiles in one row are usually the same kind.`,
  },
  split: {
    slots: 2,
    allowed: ["card", "form", "chart", "table", "list", "calendar", "image", "text", "accordion"],
    min: 2,
    repeatable: ["card"],
    noneAllowed: false,
    describe: (i) => (i === 0 ? "The left column, the wider main content." : "The right column, a narrower side panel."),
  },
  tabs: {
    slots: 3,
    allowed: ["chart", "table", "list", "form", "card"],
    min: 2,
    repeatable: ["chart", "table", "list", "card"],
    noneAllowed: true,
    describe: (i) => `The content of the ${ORDINAL[i]} tab.`,
  },
  card: {
    slots: 3,
    allowed: ["stat", "chart", "table", "list", "text", "progress", "field", "toggle", "button", "badges", "avatars", "image", "calendar", "separator"],
    min: 1,
    repeatable: ["field", "toggle", "progress", "button"],
    noneAllowed: true,
    describe: (i) => `Element ${i + 1} of up to 3 stacked inside the card.`,
  },
  form: {
    slots: 5,
    allowed: ["field", "toggle", "slider", "radio"],
    min: 2,
    repeatable: ["field", "toggle", "slider", "radio"],
    noneAllowed: true,
    describe: (i) => `Form control ${i + 1} of up to 5, top to bottom. A submit button is added automatically.`,
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
// Option banks. Keep each bank well under Jev's 255-option cap; the engine also
// shards calls so no single request carries too many options.

export const ACCENTS: Record<string, string> = {
  neutral: "monochrome, serious, minimal, developer tools, legal",
  blue: "trustworthy, corporate, SaaS, productivity, travel",
  indigo: "modern tech, AI, analytics, developer platforms",
  violet: "creative, music, entertainment, community",
  rose: "beauty, fashion, dating, romance",
  orange: "energetic, fitness, sports, food delivery",
  amber: "warm, coffee, bakery, restaurants, hospitality",
  emerald: "money, finance, growth, sustainability, plants",
  teal: "health, medical, wellness, calm",
}

export const BRAND_FALLBACK = ["Acme", "Northwind", "Lumen", "Orbit", "Nimbus", "Harbor", "Pioneer"]

export const HEADINGS = [
  "Overview", "Dashboard", "Analytics", "Revenue", "Sales", "Orders", "Customers",
  "Recent activity", "Team", "Settings", "Profile", "Account", "Billing", "Notifications",
  "Security", "Create an account", "Sign in", "Welcome back", "Get started", "Contact us",
  "Pricing", "Features", "Frequently asked questions", "Checkout", "Order summary",
  "Shipping details", "Payment", "Your cart", "Upcoming events", "Schedule", "Tasks",
  "Projects", "Messages", "Inbox", "Reports", "Performance", "Traffic", "Top products",
  "Inventory", "Transactions", "Invoices", "Subscriptions", "Usage", "Goals", "Leaderboard",
  "Forecast", "Bookings", "Reservations", "Menu", "Appointments", "Patients", "Students",
  "Courses", "Listings", "Favorites", "Library", "Playlist", "Episodes", "Workouts",
  "Nutrition", "Portfolio", "Watchlist", "Expenses", "Budget", "Support", "Feedback",
  "Integrations", "Members", "Preferences", "Appearance", "Privacy", "Deployments",
  "Incidents", "Pipeline", "Candidates", "Menu highlights", "This week", "Today",
]

export const TAGLINES = [
  "Everything you need, in one place.",
  "Here is what happened this week.",
  "Track performance at a glance.",
  "Manage your account settings and preferences.",
  "Enter your details below to create your account.",
  "Sign in to continue where you left off.",
  "Simple, transparent pricing. No surprises.",
  "We usually reply within one business day.",
  "Stay on top of what matters most.",
  "Your latest updates and alerts.",
  "Review your order before you pay.",
  "Invite your team and start collaborating.",
  "Pick a time that works for you.",
  "All systems are running smoothly.",
  "Compared with the previous period.",
  "Fresh picks, updated daily.",
  "Keep your streak going.",
  "Only the essentials, nothing more.",
  "Answers to the questions we hear most.",
  "Your data is encrypted and never shared.",
]

export const HEADLINES = [
  "Welcome to {subject}",
  "{subject}, made simple",
  "The smarter way to run {subject}",
  "Everything you need for {subject}",
  "Meet the new {subject}",
  "Discover {subject}",
  "Your {subject}, all in one place",
  "Build something people love",
  "Work faster with less effort",
  "The best seat in town",
  "Do more of what you love",
  "Start your free trial today",
]

export const BUTTONS = [
  "Get started", "Sign up", "Sign in", "Create account", "Continue", "Submit", "Save changes",
  "Cancel", "Learn more", "View all", "Export", "Download", "Add new", "Invite member",
  "Book now", "Reserve a table", "Place order", "Checkout", "Pay now", "Send message",
  "Contact sales", "Subscribe", "Upgrade", "Start free trial", "Apply", "Search", "Filter",
  "Share", "Edit", "Delete", "Next", "Confirm", "Schedule", "Join", "Follow", "Add to cart",
  "Buy now", "Watch demo", "Explore", "Order now", "Get tickets", "Apply now",
]

export const METRICS = [
  "Total revenue", "Revenue", "Active users", "New customers", "Orders", "Conversion rate",
  "Average order value", "Churn rate", "MRR", "Sessions", "Page views", "Bounce rate",
  "Signups", "Downloads", "Subscribers", "Open rate", "Click-through rate", "Tickets resolved",
  "Response time", "Uptime", "Error rate", "Latency", "Deployments", "Tasks completed",
  "Hours logged", "Calories burned", "Steps", "Distance", "Heart rate", "Temperature",
  "Humidity", "Wind speed", "Bookings", "Occupancy", "Covers", "Stock level", "Net profit",
  "Expenses", "Cash balance", "Portfolio value", "Return", "Listeners", "Plays", "Followers",
  "Engagement", "Students enrolled", "Completion rate", "Satisfaction", "NPS", "Leads",
  "Pipeline value", "Win rate", "Deals closed", "Rating", "Reviews", "Visitors",
]

export const FIELDS = [
  "Full name", "First name", "Last name", "Email", "Password", "Confirm password",
  "Phone number", "Company", "Job title", "Website", "Address", "City", "Country",
  "Zip code", "Date of birth", "Username", "Message", "Subject", "Card number",
  "Expiry date", "CVC", "Name on card", "Date", "Time", "Number of guests", "Budget",
  "Notes", "Bio", "Promo code", "Quantity", "Project name", "Description", "Due date",
  "Assignee", "Priority", "Category", "Location", "Start date", "End date", "Amount",
  "Language", "Timezone", "Plan", "Role",
]

export const TOGGLES = [
  "Remember me", "I agree to the terms and privacy policy", "Email notifications",
  "Push notifications", "SMS alerts", "Marketing emails", "Dark mode",
  "Two-factor authentication", "Make profile public", "Auto-renew",
  "Save card for future purchases", "Weekly digest", "Show online status",
  "Allow comments", "Sync across devices", "Send me a copy",
]

export const SLIDERS = [
  "Budget", "Price range", "Volume", "Brightness", "Distance", "Team size",
  "Difficulty", "Duration", "Spice level", "Priority", "Monthly volume",
]

export const RADIOS: Record<string, string[]> = {
  "Plan": ["Free", "Pro", "Team"],
  "Billing": ["Monthly", "Yearly"],
  "Shipping": ["Standard", "Express", "Overnight"],
  "Size": ["Small", "Medium", "Large"],
  "Frequency": ["Daily", "Weekly", "Monthly"],
  "Payment method": ["Card", "PayPal", "Bank transfer"],
  "Experience": ["Beginner", "Intermediate", "Advanced"],
  "Theme": ["Light", "Dark", "System"],
  "Seating": ["Indoor", "Outdoor", "Bar"],
  "Contact preference": ["Email", "Phone", "Text"],
}

export const COLUMNS = [
  "Name", "Email", "Status", "Role", "Amount", "Date", "Plan", "Customer", "Order",
  "Product", "Price", "Quantity", "Stock", "Category", "Location", "Last active",
  "Due date", "Assignee", "Priority", "Progress", "Invoice", "Method", "Score", "Rank",
  "Team", "Revenue", "Duration", "Company", "Rating",
]

export const LIST_ITEMS: Record<string, string> = {
  people: "people with names and roles",
  tasks: "to-do items with checkboxes",
  notifications: "alerts and notifications",
  files: "documents and files",
  messages: "conversations or messages",
  products: "products with prices",
  events: "upcoming events with dates",
  transactions: "payments in and out",
}

export const FAQS = [
  "How does billing work?", "Can I cancel anytime?", "Is there a free trial?",
  "Do you offer refunds?", "How do I reset my password?", "Is my data secure?",
  "Do you ship internationally?", "How long does delivery take?", "Can I change my plan later?",
  "Do you offer team discounts?", "How do I contact support?", "What payment methods do you accept?",
  "Can I book for a large group?", "Do you have vegetarian options?", "Where are you located?",
  "What are your opening hours?", "Do I need an account?", "How do I invite my team?",
]

export const ALERTS = [
  "Your trial ends in 3 days", "Payment failed", "All systems operational",
  "Scheduled maintenance tonight", "New version available", "Your profile is incomplete",
  "Changes saved", "Unusual sign-in detected", "Order confirmed", "Low stock warning",
  "Storage almost full", "Booking confirmed",
]

export const TAGS = [
  "New", "Popular", "Featured", "Beta", "Pro", "Sale", "Limited", "Trending", "Verified",
  "Open now", "Free shipping", "Vegan", "Organic", "Remote", "Full-time", "Urgent", "Low",
  "Medium", "High", "Draft", "Published", "In stock", "Best seller", "Top rated",
]

export const PARAGRAPHS = [
  "Everything you need to get started is already set up. Invite your team, connect your tools and you are ready to go.",
  "We are a small team that cares about the details. Every order is prepared fresh and delivered with care.",
  "Your numbers are up compared with last week. Keep an eye on the metrics that moved the most.",
  "Update your personal details here. Changes are saved to your account immediately.",
  "Have a question or want to work with us? Send a message and we will get back to you shortly.",
  "Choose the plan that fits your needs. You can upgrade, downgrade or cancel at any time.",
  "Browse the latest additions, hand-picked for you and updated every day.",
  "Stay consistent and small wins add up. Here is how your week is shaping up.",
]

export const ICONS = [
  "dollar", "users", "cart", "trending-up", "activity", "credit-card", "package", "clock",
  "calendar", "mail", "bell", "star", "heart", "zap", "globe", "server", "cpu", "shield",
  "lock", "coffee", "utensils", "dumbbell", "flame", "footprints", "thermometer", "droplets",
  "wind", "sun", "cloud-rain", "music", "headphones", "mic", "video", "image", "file",
  "folder", "book", "graduation-cap", "briefcase", "home", "map-pin", "plane", "car",
  "truck", "bed", "stethoscope", "pill", "leaf", "target", "award", "trophy", "gift", "tag",
  "message", "phone", "settings", "bar-chart", "pie-chart", "percent", "wallet",
  "piggy-bank", "receipt", "ticket", "rocket", "sparkles", "code", "terminal",
  "git-branch", "bug", "eye", "mouse-pointer", "user-plus", "store", "camera", "shirt",
  "gem", "bitcoin", "landmark", "mountain", "bike", "timer", "check-circle", "inbox", "send",
]

// ---------------------------------------------------------------------------
// Detail questions: the props Jev decides once a node's kind is known.

export type DetailQuestion = {
  prop: string
  instructions: string
  options: Record<string, string | null>
  /** Questions sharing a key get distinct answers, assigned greedily by probability. */
  dedupeKey?: string
}

type Ctx = { spans: string[]; parent: UINode | null }

const opts = (xs: string[], extra: string[] = []) =>
  Object.fromEntries([...new Set([...extra, ...xs])].map((x) => [x, null])) as Record<string, null>

const withNone = (xs: string[]) => ({ [NONE]: "leave this out", ...opts(xs) })

function titleOptions(ctx: Ctx) {
  return opts(HEADINGS, ctx.spans)
}

export function detailQuestions(node: UINode, ctx: Ctx): DetailQuestion[] {
  // Copy should not repeat anywhere on the page, so these keys are page-wide
  // rather than per parent. Button labels may repeat (a grid of product cards).
  const sib = (prop: string) => `page:${prop}`
  const own = (group: string) => `${node.id}:${group}`
  const qs: DetailQuestion[] = []

  if (ctx.parent?.kind === "tabs") {
    qs.push({
      prop: "tabLabel",
      instructions: "The short label on this tab's trigger.",
      options: titleOptions(ctx),
      dedupeKey: sib("tabLabel"),
    })
  }

  switch (node.kind) {
    case "page":
      qs.push(
        {
          prop: "brand",
          instructions: "The product or business name shown in the page header.",
          options: opts(BRAND_FALLBACK, ctx.spans),
        },
        {
          prop: "accent",
          instructions: "The accent color that best fits the mood of this request.",
          options: ACCENTS,
        },
      )
      break
    case "hero":
      qs.push(
        {
          prop: "headline",
          instructions: "The hero headline. {subject} is replaced with the subject chosen separately.",
          options: opts(HEADLINES),
        },
        { prop: "subject", instructions: "The subject the headline is about.", options: opts(ctx.spans.length ? ctx.spans : BRAND_FALLBACK) },
        { prop: "subtitle", instructions: "The supporting line under the headline.", options: opts(TAGLINES), dedupeKey: sib("tagline") },
        { prop: "cta", instructions: "The primary call-to-action button.", options: opts(BUTTONS), dedupeKey: own("cta") },
        { prop: "cta2", instructions: "An optional secondary button.", options: withNone(BUTTONS), dedupeKey: own("cta") },
        {
          prop: "align",
          instructions: "How the hero content is aligned.",
          options: { center: "centered, classic landing page", left: "left aligned, next to an image" },
        },
      )
      break
    case "card":
      qs.push(
        { prop: "title", instructions: "The card title, summarizing what the card holds.", options: titleOptions(ctx), dedupeKey: sib("title") },
        { prop: "description", instructions: "An optional one-line description under the title.", options: withNone(TAGLINES), dedupeKey: sib("tagline") },
        { prop: "action", instructions: "An optional button in the card footer.", options: withNone(BUTTONS) },
      )
      break
    case "split":
      qs.push({
        prop: "ratio",
        instructions: "How the width is shared between the two columns.",
        options: { "wide-left": "main content left, narrow panel right", equal: "two equal halves", "wide-right": "narrow panel left, main content right" },
      })
      break
    case "form":
      qs.push(
        { prop: "title", instructions: "The form title.", options: titleOptions(ctx), dedupeKey: sib("title") },
        { prop: "description", instructions: "An optional line under the form title.", options: withNone(TAGLINES), dedupeKey: sib("tagline") },
        { prop: "submit", instructions: "The label of the submit button.", options: opts(BUTTONS) },
      )
      break
    case "chart":
      qs.push(
        { prop: "metric", instructions: "The metric this chart plots.", options: opts(METRICS), dedupeKey: sib("metric") },
        {
          prop: "type",
          instructions: "The chart type that shows this metric best.",
          options: { area: "trend over time, filled", line: "trend over time", bar: "compare values across categories or periods", pie: "share of a whole" },
        },
        {
          prop: "x",
          instructions: "What the chart is broken down by.",
          options: { months: "months of the year", weeks: "recent weeks", weekdays: "days of the week", hours: "hours of the day", regions: "world regions", channels: "marketing channels", products: "product lines" },
        },
        {
          prop: "compare",
          instructions: "Whether to overlay the previous period for comparison.",
          options: { single: "one series", compare: "this period versus the previous one" },
        },
      )
      break
    case "table":
      qs.push({ prop: "title", instructions: "The table title.", options: titleOptions(ctx), dedupeKey: sib("title") })
      for (let i = 1; i <= 4; i++) {
        qs.push({
          prop: `col${i}`,
          instructions: `Column ${i} of the table, left to right. The first column identifies the row.`,
          options: i <= 2 ? opts(COLUMNS) : withNone(COLUMNS),
          dedupeKey: own("col"),
        })
      }
      break
    case "list":
      qs.push(
        { prop: "title", instructions: "The list title.", options: titleOptions(ctx), dedupeKey: sib("title") },
        { prop: "items", instructions: "What kind of items the list shows.", options: LIST_ITEMS },
      )
      break
    case "accordion":
      qs.push({ prop: "title", instructions: "The section title.", options: opts(HEADINGS) })
      for (let i = 1; i <= 3; i++) {
        qs.push({ prop: `q${i}`, instructions: `Question ${i} of 3 people would ask here.`, options: opts(FAQS), dedupeKey: own("q") })
      }
      break
    case "alert":
      qs.push(
        { prop: "title", instructions: "The alert message.", options: opts(ALERTS) },
        {
          prop: "tone",
          instructions: "The tone of the alert.",
          options: { info: "neutral information", success: "something went well", warning: "needs attention soon", error: "something failed" },
        },
      )
      break
    case "stat":
      qs.push(
        { prop: "label", instructions: "The KPI this tile shows.", options: opts(METRICS), dedupeKey: sib("label") },
        { prop: "icon", instructions: "The icon that represents this KPI.", options: opts(ICONS), dedupeKey: sib("stat-icon") },
      )
      break
    case "text":
      qs.push({ prop: "body", instructions: "The paragraph that fits here best.", options: opts(PARAGRAPHS) })
      break
    case "progress":
      qs.push({ prop: "label", instructions: "What this progress bar tracks.", options: opts(METRICS), dedupeKey: sib("label") })
      break
    case "field":
      qs.push({ prop: "label", instructions: "The label of this input field.", options: opts(FIELDS), dedupeKey: sib("label") })
      break
    case "toggle":
      qs.push(
        { prop: "label", instructions: "The label of this toggle.", options: opts(TOGGLES), dedupeKey: sib("label") },
        { prop: "style", instructions: "Switch or checkbox.", options: { checkbox: "a checkbox, for consent or remember me", switch: "a switch, for settings" } },
      )
      break
    case "slider":
      qs.push({ prop: "label", instructions: "What this slider controls.", options: opts(SLIDERS), dedupeKey: sib("label") })
      break
    case "radio":
      qs.push({ prop: "group", instructions: "Which choice this radio group offers.", options: opts(Object.keys(RADIOS)), dedupeKey: sib("group") })
      break
    case "button":
      qs.push(
        { prop: "label", instructions: "The button label.", options: opts(BUTTONS), dedupeKey: sib("label") },
        {
          prop: "variant",
          instructions: "The button style.",
          options: { default: "primary, filled", outline: "secondary, outlined", ghost: "subtle", destructive: "dangerous action" },
        },
      )
      break
    case "badges":
      for (let i = 1; i <= 3; i++) {
        qs.push({ prop: `tag${i}`, instructions: `Tag ${i} of 3.`, options: opts(TAGS, ctx.spans), dedupeKey: own("tag") })
      }
      break
    case "image":
      qs.push(
        { prop: "icon", instructions: "The subject of the picture.", options: opts(ICONS) },
        { prop: "aspect", instructions: "The image shape.", options: { wide: "wide banner", square: "square", portrait: "tall portrait" } },
      )
      break
    default:
      break
  }
  return qs
}

// ---------------------------------------------------------------------------
// Candidate spans from the query itself: the only free text Jev can "write".

const STOP = new Set(
  "a an the for of to in on at by with and or my our your me i we us it this that these those is are be show make build create give want need some any page app ui screen view please like".split(" "),
)

export function spansOf(query: string): string[] {
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 16)
  const out = new Set<string>()
  for (let n = 3; n >= 1; n--) {
    for (let i = 0; i + n <= words.length; i++) {
      const gram = words.slice(i, i + n)
      if (STOP.has(gram[0]) || STOP.has(gram[gram.length - 1])) continue
      out.add(gram.map((w) => w[0].toUpperCase() + w.slice(1)).join(" "))
    }
  }
  return [...out].slice(0, 30)
}
