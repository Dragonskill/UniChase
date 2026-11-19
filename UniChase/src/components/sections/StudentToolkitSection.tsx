import { ArrowUpRight, CalendarDays, GitCompareArrows, Route, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"
import GlowLetters from "@/components/ui/GlowLetters"

const tools = [
  {
    to: "/match",
    title: "Find your best match",
    description: "Get ranked university suggestions with clear reasons and tradeoffs.",
    icon: Sparkles,
  },
  {
    to: "/university",
    title: "Compare universities",
    description: "Select up to four universities and review key facts side by side.",
    icon: GitCompareArrows,
  },
  {
    to: "/roadmap",
    title: "Build an application roadmap",
    description: "Turn your target intake into a practical sequence of application tasks.",
    icon: Route,
  },
  {
    to: "/calendar",
    title: "Track important dates",
    description: "Keep applications, documents, interviews, and reminders in one calendar.",
    icon: CalendarDays,
  },
] as const

export default function StudentToolkitSection() {
  return (
    <section className="mt-12 sm:mt-16" aria-label="Student application tools">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <GlowLetters as="h2" text="PLAN YOUR APPLICATION" variant="section" className="text-lg font-bold tracking-wide text-navy sm:text-xl" />
          <p className="mt-2 max-w-2xl text-sm text-muted">Move from university research to a clear application plan.</p>
        </div>
        <Link to="/dashboard" className="hidden text-sm text-muted hover:text-teal sm:inline">Open dashboard →</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map(({ to, title, description, icon: Icon }) => (
          <Link key={to} to={to} className="toolkit-card group relative overflow-hidden rounded-2xl border border-gray-200 bg-surface p-5 shadow-sm">
            <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10 text-teal">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="pr-7 text-base font-bold leading-snug text-navy">{title}</h3>
            <p className="mt-2 text-sm leading-5 text-muted">{description}</p>
            <ArrowUpRight className="toolkit-card-arrow absolute right-4 top-4 h-5 w-5 text-muted" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  )
}
