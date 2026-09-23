// Every option Jev can choose from. Jev never writes text, so these banks are the
// whole vocabulary of the sandbox, together with spans of the user's own words.
// Keep each bank well under Jev's 255-option cap.

export const ACCENTS: Record<string, string> = {
  neutral: "monochrome, serious, minimal, developer tools, legal",
  blue: "trustworthy, corporate, SaaS, productivity, travel",
  indigo: "modern tech, AI, analytics, developer platforms",
  violet: "creative, music, entertainment, community",
  rose: "beauty, fashion, dating, romance",
  orange: "energetic, fitness, sports, food delivery",
  amber: "warm, coffee, bakery, restaurants, hospitality",
  emerald: "money, finance, growth, sustainability, plants",
  teal: "health, medical, wellness, calm, ocean",
}

export const BRAND_FALLBACK = ["Acme", "Northwind", "Lumen", "Orbit", "Nimbus", "Harbor", "Pioneer"]

export const LAYOUTS: Record<string, string> = {
  topbar: "a website or single-purpose page with a slim top bar",
  sidebar: "a multi-section app or dashboard with a left navigation sidebar",
  bare: "just one small component on its own, centered, with no page around it",
}

export const NAV: Record<string, string> = {
  Dashboard: "layout-grid", Home: "home", Inbox: "inbox", Messages: "message", Calendar: "calendar",
  Projects: "folder", Tasks: "check-circle", Board: "layout-grid", Team: "users", Customers: "users",
  Clients: "briefcase", Leads: "target", Deals: "dollar", Orders: "cart", Products: "package",
  Inventory: "package", Analytics: "bar-chart", Reports: "file", Invoices: "receipt",
  Payments: "credit-card", Billing: "wallet", Bookings: "calendar", Listings: "home",
  Patients: "stethoscope", Appointments: "clock", Courses: "book", Students: "graduation-cap",
  Library: "book", Playlists: "music", Files: "folder", Documents: "file", Campaigns: "rocket",
  Audience: "users", Content: "image", Servers: "server", Incidents: "bug", Deployments: "git-branch",
  Portfolio: "wallet", Markets: "trending-up", Settings: "settings", Help: "message",
}

export const NAV_CONFLICTS: [string[], string[]][] = [
  [["Dashboard"], ["Home"]],
  [["Inbox"], ["Messages"]],
  [["Customers"], ["Clients"]],
  [["Board"], ["Tasks"]],
  [["Library"], ["Playlists"]],
  [["Files"], ["Documents"]],
  [["Billing"], ["Payments"]],
  [["Analytics"], ["Reports"]],
]

export const HEADINGS = [
  "Overview", "Dashboard", "Analytics", "Revenue", "Sales", "Orders", "Customers", "Clients",
  "Leads", "Deals", "Pipeline", "Recent activity", "Team", "Members", "Settings", "Profile",
  "Account", "Billing", "Notifications", "Security", "Preferences", "Privacy", "Appearance",
  "Create an account", "Sign in", "Welcome back", "Get started", "Contact us", "Pricing",
  "Features", "Frequently asked questions", "Checkout", "Order summary", "Shipping details",
  "Payment", "Your cart", "Upcoming events", "Schedule", "Tasks", "Projects", "Board", "Sprint",
  "Roadmap", "Releases", "Issues", "Incidents", "Deployments", "Services", "Status", "Messages",
  "Inbox", "Support", "Tickets", "Reports", "Performance", "Traffic", "Audience", "Campaigns",
  "Content", "Posts", "Top products", "Inventory", "Suppliers", "Transactions", "Invoices",
  "Expenses", "Budget", "Subscriptions", "Usage", "Goals", "Leaderboard", "Forecast", "Weather",
  "Bookings", "Reservations", "Rooms", "Guests", "Menu", "Specials", "Appointments", "Patients",
  "Doctors", "Classes", "Trainers", "Workouts", "Nutrition", "Students", "Courses", "Lessons",
  "Assignments", "Listings", "Properties", "Search results", "Favorites", "Library", "Playlist",
  "Tracks", "Episodes", "Portfolio", "Holdings", "Markets", "Watchlist", "Documents", "Files",
  "Cases", "Candidates", "Employees", "Time off", "Donations", "Volunteers", "Recipes",
  "Vehicles", "Trips", "Itinerary", "Integrations", "Today", "This week", "Highlights",
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
  "Answers to the questions we hear most.",
  "Your data is encrypted and never shared.",
  "Hand-picked for you.",
  "Book in seconds, cancel anytime.",
  "Everything happening at {subject}.",
  "The latest from {subject}.",
  "Built for {subject}.",
]

export const HEADLINES = [
  "Welcome to {subject}",
  "Meet {subject}",
  "Discover {subject}",
  "{subject}, made simple",
  "Everything you need, from {subject}",
  "{subject} is here",
  "Build something people love",
  "Work faster with less effort",
  "Do more of what you love",
  "Your next adventure starts here",
  "Good food, good company",
  "Learn from the best",
]

export const CTA_HEADLINES = [
  "Ready to get started?", "Start your free trial today", "Join thousands of happy customers",
  "Book your spot today", "Questions? We are here to help", "Try {subject} free for 14 days",
  "See {subject} in action", "Never miss an update", "Up next: keep going", "Save your seat",
]

export const BUTTONS = [
  "Get started", "Sign up", "Sign in", "Create account", "Continue", "Submit", "Save changes",
  "Cancel", "Learn more", "View all", "Export", "Download", "Add new", "New project", "Invite member",
  "Book now", "Reserve a table", "Place order", "Checkout", "Pay now", "Send message",
  "Contact sales", "Subscribe", "Upgrade", "Start free trial", "Apply", "Search", "Filter",
  "Share", "Edit", "Delete", "Next", "Confirm", "Schedule", "Join", "Follow", "Add to cart",
  "Buy now", "Watch demo", "Explore", "Order now", "Get tickets", "Apply now", "Enroll now",
  "Donate", "Play", "Connect", "Deploy",
]

export const METRICS: Record<string, string> = {
  "Total revenue": "dollar", Revenue: "dollar", "Active users": "users", "New customers": "user-plus",
  Orders: "cart", "Conversion rate": "percent", "Average order value": "receipt", "Churn rate": "trending-down",
  MRR: "dollar", Sessions: "activity", "Page views": "eye", "Bounce rate": "mouse-pointer", Signups: "user-plus",
  Downloads: "download", Subscribers: "mail", "Open rate": "mail", "Click-through rate": "mouse-pointer",
  "Tickets resolved": "check-circle", "Response time": "timer", Uptime: "activity", "Error rate": "bug",
  Latency: "timer", Requests: "server", Deployments: "git-branch", "Tasks completed": "check-circle",
  "Hours logged": "clock", "Calories burned": "flame", Steps: "footprints", Distance: "map-pin",
  "Heart rate": "heart", Sleep: "moon", Temperature: "thermometer", Humidity: "droplets",
  "Wind speed": "wind", "UV index": "sun", Bookings: "calendar", Occupancy: "bed", Covers: "utensils",
  "Stock level": "package", "Net profit": "trending-up", Expenses: "receipt", "Cash balance": "wallet",
  "Portfolio value": "wallet", Return: "trending-up", Listeners: "headphones", Plays: "music",
  Followers: "users", Engagement: "heart", "Students enrolled": "graduation-cap",
  "Completion rate": "check-circle", Satisfaction: "star", NPS: "star", Leads: "target",
  "Pipeline value": "dollar", "Win rate": "trophy", "Deals closed": "trophy", Rating: "star",
  Reviews: "message", Visitors: "eye", Donations: "gift", "Open cases": "briefcase", Patients: "stethoscope",
}

export const FIELDS = [
  "Full name", "First name", "Last name", "Email", "Password", "Confirm password",
  "Phone number", "Company", "Job title", "Website", "Address", "City", "Country",
  "Zip code", "Date of birth", "Username", "Message", "Subject", "Card number",
  "Expiry date", "CVC", "Name on card", "Date", "Time", "Number of guests", "Budget",
  "Notes", "Bio", "Promo code", "Quantity", "Title", "Project name", "Description", "Due date",
  "Assignee", "Priority", "Category", "Location", "Start date", "End date", "Amount",
  "Language", "Timezone", "Plan", "Role",
]

/** Form controls, in the order a form lays them out. Labels are unique across types. */
export const CONTROLS: [label: string, type: "field" | "toggle" | "radio" | "slider"][] = [
  ["Full name", "field"], ["First name", "field"], ["Last name", "field"], ["Username", "field"],
  ["Email", "field"], ["Phone number", "field"], ["Company", "field"], ["Job title", "field"],
  ["Website", "field"], ["Date of birth", "field"], ["Password", "field"], ["Confirm password", "field"],
  ["Address", "field"], ["City", "field"], ["Zip code", "field"], ["Country", "field"],
  ["Card number", "field"], ["Name on card", "field"], ["Expiry date", "field"], ["CVC", "field"],
  ["Promo code", "field"], ["Title", "field"], ["Project name", "field"], ["Subject", "field"], ["Date", "field"],
  ["Time", "field"], ["Number of guests", "field"], ["Start date", "field"], ["End date", "field"],
  ["Due date", "field"], ["Amount", "field"], ["Quantity", "field"], ["Assignee", "field"],
  ["Priority", "field"], ["Category", "field"], ["Location", "field"], ["Language", "field"],
  ["Timezone", "field"], ["Role", "field"], ["Description", "field"], ["Message", "field"],
  ["Notes", "field"], ["Bio", "field"],
  ["Plan", "radio"], ["Billing", "radio"], ["Shipping", "radio"], ["Size", "radio"],
  ["Payment method", "radio"], ["Experience", "radio"], ["Seating", "radio"],
  ["Contact preference", "radio"], ["Budget", "slider"], ["Team size", "slider"],
  ["Remember me", "toggle"], ["Email notifications", "toggle"], ["Marketing emails", "toggle"],
  ["Save card for future purchases", "toggle"], ["Send me a copy", "toggle"],
  ["I agree to the terms and privacy policy", "toggle"],
]

/** Picking one member of a group rules out the other side. */
export const CONTROL_CONFLICTS: [string[], string[]][] = [
  [["Full name"], ["First name", "Last name"]],
  [["Full name", "First name", "Last name"], ["Username"]],
  [["Date"], ["Start date", "End date", "Due date"]],
  [["Message"], ["Notes", "Description", "Bio"]],
  [["Notes"], ["Description", "Bio"]],
  [["Number of guests"], ["Team size", "Quantity", "Size"]],
  [["Location"], ["Address", "City", "Zip code"]],
  [["Username"], ["Email"]],
  [["Card number"], ["Payment method"]],
  [["Title"], ["Subject", "Project name"]],
]

export const CHECKBOX_TOGGLES = new Set(["Remember me", "Send me a copy", "Save card for future purchases", "I agree to the terms and privacy policy"])

export const TOGGLES = [
  "Remember me", "I agree to the terms and privacy policy", "Email notifications",
  "Push notifications", "SMS alerts", "Marketing emails", "Dark mode",
  "Two-factor authentication", "Make profile public", "Auto-renew",
  "Save card for future purchases", "Weekly digest", "Show online status",
  "Allow comments", "Sync across devices", "Send me a copy",
]

export const SETTINGS_ROWS: Record<string, string> = {
  "Email notifications": "Get an email when something needs your attention.",
  "Push notifications": "Alerts on your phone and desktop.",
  "SMS alerts": "Text messages for urgent updates only.",
  "Weekly digest": "A summary of your week, every Monday.",
  "Marketing emails": "Product news and occasional offers.",
  "Two-factor authentication": "Require a code when signing in.",
  "Login alerts": "Tell me about sign-ins from new devices.",
  "Make profile public": "Anyone can see your profile.",
  "Show online status": "Let others see when you are active.",
  "Allow comments": "People can comment on your posts.",
  "Dark mode": "Use a dark theme across the app.",
  "Compact view": "Show more items on screen.",
  "Auto-renew": "Renew your plan automatically.",
  "Sync across devices": "Keep settings the same everywhere.",
  "Autoplay": "Start the next item automatically.",
  "Location services": "Use your location for better results.",
  "Data sharing": "Share anonymous usage data to improve the product.",
  "Team invites": "Allow members to invite others.",
}

export const SLIDERS = [
  "Budget", "Price range", "Volume", "Brightness", "Distance", "Team size",
  "Difficulty", "Duration", "Spice level", "Priority", "Monthly volume",
]

export const RADIOS: Record<string, string[]> = {
  Plan: ["Free", "Pro", "Team"],
  Billing: ["Monthly", "Yearly"],
  Shipping: ["Standard", "Express", "Overnight"],
  Size: ["Small", "Medium", "Large"],
  Frequency: ["Daily", "Weekly", "Monthly"],
  "Payment method": ["Card", "PayPal", "Bank transfer"],
  Experience: ["Beginner", "Intermediate", "Advanced"],
  Theme: ["Light", "Dark", "System"],
  Seating: ["Indoor", "Outdoor", "Bar"],
  "Contact preference": ["Email", "Phone", "Text"],
}

/** Identifying columns first, so the canonical order reads naturally left to right. */
export const COLUMNS = [
  "Name", "Customer", "Client", "Product", "Order", "Invoice", "Company", "Service", "Ticket",
  "Symbol", "Email", "Role", "Team", "Category", "Location", "Plan", "Assignee", "Priority",
  "Status", "Stock", "Quantity", "Price", "Amount", "Revenue", "Change", "Score", "Rating",
  "Progress", "Duration", "Method", "Date", "Due date", "Last active", "Rank",
]

/** Each list option is a title and an item type together, so they can never disagree. */
export const LIST_KINDS: Record<string, [items: string, description: string]> = {
  "Team members": ["people", "people on the team with roles"],
  Customers: ["people", "customer contacts"],
  Clients: ["people", "clients of a firm or agency"],
  Candidates: ["people", "job candidates"],
  Patients: ["people", "patients of a clinic"],
  Students: ["people", "students in a class"],
  Tasks: ["tasks", "to-do items with checkboxes"],
  "Recent activity": ["notifications", "a feed of recent events"],
  Notifications: ["notifications", "alerts and notifications"],
  Files: ["files", "documents and files"],
  Messages: ["messages", "conversations or emails"],
  Inbox: ["messages", "incoming emails"],
  Products: ["products", "products with prices"],
  "Upcoming events": ["events", "events with dates"],
  Appointments: ["events", "booked appointments with times"],
  Transactions: ["transactions", "payments in and out"],
  Holdings: ["holdings", "assets owned, like stocks or crypto, with value and change"],
  Integrations: ["apps", "connected apps and integrations"],
  Services: ["services", "systems with a health status"],
  Tracks: ["tracks", "songs with durations"],
  Episodes: ["tracks", "podcast episodes with durations"],
}
export const FAQS = [
  "How does billing work?", "Can I cancel anytime?", "Is there a free trial?",
  "Do you offer refunds?", "How do I reset my password?", "Is my data secure?",
  "Do you ship internationally?", "How long does delivery take?", "Can I change my plan later?",
  "Do you offer team discounts?", "How do I contact support?", "What payment methods do you accept?",
  "Can I book for a large group?", "Do you have vegetarian options?", "Where are you located?",
  "What are your opening hours?", "Do I need an account?", "How do I invite my team?",
  "Do I need experience?", "What should I bring?", "Is parking available?", "Can I reschedule?",
]

/** Alert text and tone together, so a success message never shows in red. */
export const ALERTS: Record<string, "info" | "success" | "warning" | "error"> = {
  "Your trial ends in 3 days": "warning", "Payment failed": "error", "All systems operational": "success",
  "Scheduled maintenance tonight": "info", "New version available": "info", "Your profile is incomplete": "warning",
  "Changes saved": "success", "Unusual sign-in detected": "error", "Order confirmed": "success",
  "Low stock warning": "warning", "Storage almost full": "warning", "Booking confirmed": "success",
  "Degraded performance in one region": "warning", "We could not do that": "error",
}

export const TAGS = [
  "New", "Popular", "Featured", "Beta", "Pro", "Sale", "Limited", "Trending", "Verified",
  "Open now", "Free shipping", "Vegan", "Organic", "Remote", "Full-time", "Urgent", "Low",
  "Medium", "High", "Draft", "Published", "In stock", "Best seller", "Top rated", "Beginner",
  "Advanced", "Pet friendly", "Waterfront",
]

export const PARAGRAPHS = [
  "Everything you need to get started is already set up. Invite your team, connect your tools and you are ready to go.",
  "We are a small team that cares about the details, and it shows in everything we make.",
  "Your numbers are up compared with last week. Keep an eye on the metrics that moved the most.",
  "Update your personal details here. Changes are saved to your account immediately.",
  "Have a question or want to work with us? Send a message and we will get back to you shortly.",
  "Choose the plan that fits your needs. You can upgrade, downgrade or cancel at any time.",
  "Browse the latest additions, hand-picked for you and updated every day.",
  "Stay consistent and small wins add up. Here is how your week is shaping up.",
  "Lessons for every level, taught by people who love what they do.",
  "Spacious, bright and minutes from everything. Schedule a visit this week.",
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
  "git-branch", "bug", "eye", "user-plus", "store", "camera", "shirt", "gem", "bitcoin",
  "landmark", "mountain", "anchor", "bike", "timer", "check-circle", "inbox", "send",
]

// --- Section molecules ------------------------------------------------------

export const PIPELINES: Record<string, string[]> = {
  "product work": ["Backlog", "In progress", "In review", "Done"],
  hiring: ["Applied", "Screening", "Interviewing", "Offer"],
  "sales deals": ["New lead", "Contacted", "Proposal", "Won"],
  "content calendar": ["Ideas", "Drafting", "Scheduled", "Published"],
  "support tickets": ["New", "Open", "Waiting", "Solved"],
  "orders to fulfil": ["Received", "Packing", "Shipped", "Delivered"],
  "legal matters": ["Intake", "Discovery", "Negotiation", "Closed"],
  "service jobs": ["Requested", "Scheduled", "In progress", "Completed"],
}

export const CHAT_PERSONAS: Record<string, string> = {
  support: "a customer and a support agent",
  assistant: "a person and an AI assistant",
  team: "coworkers in a team channel",
  sales: "a lead and a sales rep",
  friends: "friends making plans",
  booking: "a guest and a host or front desk",
}

export const MEDIA_KINDS: Record<string, string> = {
  music: "songs and albums",
  podcast: "podcast episodes",
  audiobook: "audiobook chapters",
  video: "videos or lessons",
}

export const TIER_PRESETS: Record<string, string[]> = {
  "Free, Pro, Team": ["Free", "Pro", "Team"],
  "Starter, Growth, Scale": ["Starter", "Growth", "Scale"],
  "Basic, Standard, Premium": ["Basic", "Standard", "Premium"],
  "Hobby, Pro, Enterprise": ["Hobby", "Pro", "Enterprise"],
  "Drop-in, 10-class pack, Unlimited": ["Drop-in", "10-class pack", "Unlimited"],
  "Personal, Family": ["Personal", "Family"],
  "Single workshop, Bundle, All access": ["Single workshop", "Bundle", "All access"],
}

export const PLAN_FEATURES = [
  "Unlimited projects", "Up to 5 team members", "Unlimited team members", "Priority support",
  "24/7 phone support", "Single sign-on", "API access", "Advanced analytics", "Custom domain",
  "Audit log", "100 GB storage", "Unlimited storage", "Offline access", "Ad-free", "HD streaming",
  "Cancel anytime", "Guest passes", "Personal coach", "Free shipping", "Early access",
  "Materials included", "Certificate of completion", "Small group sessions", "Recordings included",
  "Lifetime access", "1:1 feedback",
]

export const PROFILE_PERSONAS: Record<string, string> = {
  professional: "a business professional",
  creator: "a content creator or influencer",
  developer: "a software developer",
  designer: "a designer or artist",
  athlete: "an athlete or coach",
  musician: "a musician or DJ",
  doctor: "a doctor or therapist",
  teacher: "a teacher or tutor",
  chef: "a chef or food creator",
  host: "a host or landlord",
}

export const PROFILE_ACTIONS = ["Follow", "Message", "Connect", "Edit profile", "Book a session", "Hire me", "Subscribe"]

export const KV_KEYS = [
  "Subtotal", "Shipping", "Discount", "Tax", "Total", "Order number", "Delivery date", "Carrier",
  "Tracking number", "Payment method", "Plan", "Billing cycle", "Next payment", "Member since",
  "Email", "Phone", "Location", "Status", "Bedrooms", "Bathrooms", "Square feet", "Year built",
  "Parking", "Check-in", "Check-out", "Guests", "Room type", "Duration", "Level", "Instructor",
  "Language", "Certificate", "Symbol", "Market cap", "Volume", "52-week high",
]

export const LISTING_TYPES: Record<string, string> = {
  products: "products for sale",
  homes: "homes or apartments",
  hotels: "hotels and stays",
  courses: "online courses",
  recipes: "recipes",
  events: "events and tickets",
  articles: "articles or blog posts",
  cars: "cars and vehicles",
  restaurants: "restaurants",
  jobs: "job openings",
  classes: "fitness or hobby classes",
  services: "local service providers or pros to hire",
  dishes: "menu items or dishes with prices",
  workshops: "workshops or events to sign up for",
}

export const LISTING_TITLES: Record<string, string> = {
  products: "Products", homes: "Homes for sale", hotels: "Places to stay", courses: "Courses", recipes: "Recipes",
  events: "Upcoming events", articles: "Latest articles", cars: "Cars for sale", restaurants: "Restaurants nearby",
  jobs: "Open roles", classes: "Classes", services: "Pros near you", workshops: "Upcoming workshops", dishes: "Menu",
}

export const SEARCH_SCOPES = ["everything", "products", "homes", "hotels", "people", "messages", "emails", "jobs", "courses", "docs", "recipes", "events", "pets", "tasks", "files", "music", "customers", "services", "workshops"]

export const FILTERS = [
  "Price", "Location", "Dates", "Guests", "Rating", "Category", "Size", "Brand", "Status",
  "Type", "Distance", "Availability", "Bedrooms", "Level", "Duration", "Cuisine", "Sort by",
]

export const FEATURES: Record<string, [icon: string, description: string]> = {
  "Set up in minutes": ["zap", "No setup fees, no engineers needed. You are live the same day."],
  "Secure by default": ["shield", "Encryption, SSO and audit logs on every plan."],
  "Real-time analytics": ["bar-chart", "See what is working as it happens."],
  "Works everywhere": ["globe", "Web, iOS and Android, always in sync."],
  "Built for teams": ["users", "Shared workspaces, roles and comments."],
  "Integrations": ["git-branch", "Connect the tools you already use."],
  "24/7 support": ["message", "Real people, around the clock."],
  "Automations": ["sparkles", "Let the busywork run itself."],
  "Expert instructors": ["graduation-cap", "Learn from people who do this every day."],
  "Small groups": ["users", "Never more than eight people per session."],
  "All equipment included": ["package", "Just show up. We have everything you need."],
  "Flexible scheduling": ["calendar", "Book, move or cancel in two taps."],
  "Fresh ingredients": ["leaf", "Sourced locally, prepared every morning."],
  "Fast delivery": ["truck", "At your door in under 30 minutes."],
  "Free cancellation": ["check-circle", "Change of plans? Cancel up to 24 hours before."],
  "Best price guarantee": ["tag", "Find it cheaper and we will match it."],
  "Private and personal": ["lock", "Your data stays yours. Always."],
  "Award winning": ["award", "Recognized by the people who know best."],
}

export const FLOWS: Record<string, string[]> = {
  checkout: ["Cart", "Shipping", "Payment", "Review"],
  onboarding: ["Account", "Profile", "Invite team", "Done"],
  "order tracking": ["Ordered", "Packed", "Shipped", "Delivered"],
  application: ["Details", "Documents", "Review", "Submitted"],
  booking: ["Date", "Time", "Details", "Confirm"],
  course: ["Intro", "Lessons", "Project", "Certificate"],
}

export const QUOTES = [
  "This completely changed how our team works. We ship twice as fast now.",
  "The best decision we made this year. Setup took an afternoon.",
  "I recommend it to everyone. Friendly, fast and it just works.",
  "Five stars. The staff made us feel at home from day one.",
  "I went from total beginner to confident in a few weeks.",
  "Support answered in minutes, on a Sunday. Unreal.",
  "Beautiful space, great people. We keep coming back.",
  "Finally a tool that gets out of the way.",
]

export const TIMELINES: Record<string, string> = {
  "order tracking": "the journey of a delivery",
  "project activity": "recent changes by a team",
  changelog: "product releases",
  itinerary: "a trip plan, day by day",
  "account history": "account and billing events",
  "incident log": "what happened during an outage",
}

export const EMPTY_SCENARIOS: Record<string, [icon: string, title: string, body: string, action: string]> = {
  "no results": ["search", "No results found", "Try a different search or remove some filters.", "Clear filters"],
  "no messages": ["inbox", "No messages yet", "When someone reaches out, it shows up here.", "Start a conversation"],
  "no projects": ["folder", "No projects yet", "Create your first project to get going.", "New project"],
  "no orders": ["cart", "No orders yet", "Your orders will appear here once you buy something.", "Start shopping"],
  "inbox zero": ["check-circle", "You are all caught up", "Nothing needs your attention right now.", "View archive"],
  "no files": ["file", "No files uploaded", "Drag files here or browse to upload.", "Upload files"],
  "page not found": ["map-pin", "Page not found", "The page you are looking for moved or never existed.", "Go back home"],
  "something went wrong": ["bug", "Something went wrong", "We hit a snag loading this. Please try again.", "Try again"],
}

export const METRIC_CONFLICTS: [string[], string[]][] = [
  [["Revenue"], ["Total revenue", "MRR"]],
  [["Total revenue"], ["MRR"]],
  [["Latency"], ["Response time"]],
  [["NPS"], ["Satisfaction"]],
  [["Active users"], ["Visitors", "Sessions"]],
  [["Orders"], ["Covers"]],
]

export const SWIPE_SUBJECTS: Record<string, string> = {
  people: "dating profiles",
  pets: "pets, dogs or cats to meet or adopt",
  homes: "homes or rentals",
  jobs: "job openings",
  recipes: "recipes or dishes",
  products: "products or outfits",
  restaurants: "restaurants to try",
}

export const KEYPADS: Record<string, string> = {
  calculator: "a calculator with a display and number keys",
  "tip calculator": "split a bill and work out the tip",
  "phone dialer": "dial a phone number",
  "PIN pad": "enter a PIN or passcode",
}

export const FORECASTS: Record<string, string> = { daily: "the next five days", hourly: "the next several hours" }

// --- Atoms --------------------------------------------------------------------

export const PRICE_TIERS: Record<string, string> = { budget: "cheap, under $20", mid: "moderate, $20 to $200", premium: "expensive, $200 to $2,000", luxury: "very expensive, $2,000 and up" }
export const PRICE_PERIODS: Record<string, string> = { "one-time": "a single purchase", month: "per month", year: "per year", night: "per night", hour: "per hour", person: "per person" }
export const STATUSES = ["Online", "Offline", "Busy", "Operational", "Degraded", "Outage", "In stock", "Sold out", "Open now", "Closed", "Live", "Draft"]
export const SEGMENTS: Record<string, string[]> = {
  "Day, Week, Month": ["Day", "Week", "Month"],
  "All, Active, Archived": ["All", "Active", "Archived"],
  "List, Grid, Map": ["List", "Grid", "Map"],
  "Monthly, Yearly": ["Monthly", "Yearly"],
  "Buy, Rent": ["Buy", "Rent"],
  "Upcoming, Past": ["Upcoming", "Past"],
  "Overview, Details": ["Overview", "Details"],
}
