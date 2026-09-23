import {
  Activity, Award, BarChart3, Bed, Bell, Bike, Bitcoin, BookOpen, Briefcase, Bug, Calendar,
  Camera, Car, CircleCheck, Clock, Cloud, CloudRain, Code, Coffee, Cpu, CreditCard, DollarSign,
  Droplets, Dumbbell, Eye, FileText, Flame, Folder, Footprints, Gem, Gift, GitBranch, Globe,
  GraduationCap, Headphones, Heart, House, Image, Inbox, Landmark, Leaf, Lock, Mail, MapPin,
  MessageSquare, Mic, Mountain, MousePointerClick, Music, Package, Percent, Phone, PieChart,
  PiggyBank, Pill, Plane, Receipt, Rocket, Send, Server, Settings, Shield, Shirt, ShoppingCart,
  Sparkles, Star, Stethoscope, Store, Sun, Tag, Target, Terminal, Thermometer, Ticket, Timer,
  TrendingUp, Trophy, Truck, UserPlus, Users, Utensils, Video, Wallet, Wind, Zap,
  type LucideIcon,
} from "lucide-react"

export const ICON_MAP: Record<string, LucideIcon> = {
  dollar: DollarSign, users: Users, cart: ShoppingCart, "trending-up": TrendingUp,
  activity: Activity, "credit-card": CreditCard, package: Package, clock: Clock,
  calendar: Calendar, mail: Mail, bell: Bell, star: Star, heart: Heart, zap: Zap, globe: Globe,
  server: Server, cpu: Cpu, shield: Shield, lock: Lock, coffee: Coffee, utensils: Utensils,
  dumbbell: Dumbbell, flame: Flame, footprints: Footprints, thermometer: Thermometer,
  droplets: Droplets, wind: Wind, sun: Sun, "cloud-rain": CloudRain, music: Music,
  headphones: Headphones, mic: Mic, video: Video, image: Image, file: FileText, folder: Folder,
  book: BookOpen, "graduation-cap": GraduationCap, briefcase: Briefcase, home: House,
  "map-pin": MapPin, plane: Plane, car: Car, truck: Truck, bed: Bed, stethoscope: Stethoscope,
  pill: Pill, leaf: Leaf, target: Target, award: Award, trophy: Trophy, gift: Gift, tag: Tag,
  message: MessageSquare, phone: Phone, settings: Settings, "bar-chart": BarChart3,
  "pie-chart": PieChart, percent: Percent, wallet: Wallet, "piggy-bank": PiggyBank,
  receipt: Receipt, ticket: Ticket, rocket: Rocket, sparkles: Sparkles, code: Code,
  terminal: Terminal, "git-branch": GitBranch, bug: Bug, eye: Eye,
  "mouse-pointer": MousePointerClick, "user-plus": UserPlus, store: Store, camera: Camera,
  shirt: Shirt, gem: Gem, bitcoin: Bitcoin, landmark: Landmark, mountain: Mountain, bike: Bike,
  timer: Timer, "check-circle": CircleCheck, inbox: Inbox, send: Send, cloud: Cloud,
}

export function Icon({ name, className }: { name?: unknown; className?: string }) {
  const C = (typeof name === "string" && ICON_MAP[name]) || Sparkles
  return <C className={className} />
}
