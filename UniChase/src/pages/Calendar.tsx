import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import {
  createCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarIcs,
  fetchCalendarEvents,
  updateCalendarEvent,
  type CalendarEventItem,
} from "@/lib/api"
import { applySeo } from "@/lib/seo"
import { getToken } from "@/lib/storage"

const eventTypes = ["custom", "application_deadline", "roadmap_task", "document_deadline", "visa_deadline", "interview", "reminder"]

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export default function Calendar() {
  const token = getToken()
  const [events, setEvents] = useState<CalendarEventItem[]>([])
  const [view, setView] = useState<"month" | "list">("month")
  const [month, setMonth] = useState(() => monthKey(new Date()))
  const [form, setForm] = useState({ title: "", eventType: "custom", startDate: "", description: "" })
  const [status, setStatus] = useState("")

  const refresh = () => {
    if (!token) return
    fetchCalendarEvents(token).then(setEvents).catch(() => setStatus("Could not load calendar events."))
  }

  useEffect(() => {
    applySeo({
      title: "Calendar | UniChase",
      description: "Track application deadlines, roadmap tasks, document reminders, and custom student events.",
      canonicalPath: "/calendar",
    })
  }, [])

  useEffect(refresh, [token])

  const monthEvents = useMemo(() => events.filter((event) => monthKey(new Date(event.startDate)) === month), [events, month])
  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>()
    monthEvents.forEach((event) => {
      const key = new Date(event.startDate).toISOString().slice(0, 10)
      map.set(key, [...(map.get(key) || []), event])
    })
    return map
  }, [monthEvents])

  const days = useMemo(() => {
    const [year, monthNumber] = month.split("-").map(Number)
    const date = new Date(year, monthNumber - 1, 1)
    const result: Date[] = []
    while (date.getMonth() === monthNumber - 1) {
      result.push(new Date(date))
      date.setDate(date.getDate() + 1)
    }
    return result
  }, [month])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || !form.title || !form.startDate) return

    createCalendarEvent(token, { ...form, allDay: true, status: "upcoming" })
      .then(() => {
        setForm({ title: "", eventType: "custom", startDate: "", description: "" })
        refresh()
      })
      .catch(() => setStatus("Could not save calendar event."))
  }

  const exportIcs = () => {
    if (!token) return
    fetchCalendarIcs(token)
      .then((text) => {
        const url = URL.createObjectURL(new Blob([text], { type: "text/calendar" }))
        const link = document.createElement("a")
        link.href = url
        link.download = "unichase-calendar.ics"
        link.click()
        URL.revokeObjectURL(url)
      })
      .catch(() => setStatus("Could not export calendar."))
  }

  if (!token) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <section className="bg-surface rounded-2xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-navy">Calendar</h1>
          <p className="mt-2 text-sm text-muted">Login to manage private deadlines and events.</p>
          <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-teal hover:underline">Login</Link>
        </section>
      </div>
    )
  }

  return (
    <div className="page-fade max-w-6xl mx-auto px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Calendar</h1>
          <p className="mt-1 text-sm text-muted">Application deadlines, document tasks, interviews, and custom reminders.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView("month")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === "month" ? "bg-navy text-white" : "bg-surface text-muted border border-gray-200"}`}>Month</button>
          <button onClick={() => setView("list")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${view === "list" ? "bg-navy text-white" : "bg-surface text-muted border border-gray-200"}`}>List</button>
          <button type="button" onClick={exportIcs} className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal-light">Export .ics</button>
        </div>
      </div>

      {status && <p className="mb-4 rounded-lg bg-teal/10 px-4 py-3 text-sm text-teal">{status}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
            <p className="text-sm text-muted">{monthEvents.length} events</p>
          </div>
          {view === "month" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
              {days.map((day) => {
                const key = day.toISOString().slice(0, 10)
                return (
                  <article key={key} className="min-h-28 rounded-xl border border-gray-200 bg-cream p-3">
                    <p className="text-xs font-bold text-navy">{day.getDate()}</p>
                    <div className="mt-2 space-y-1">
                      {(grouped.get(key) || []).slice(0, 3).map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => token && updateCalendarEvent(token, event.id, { status: event.status === "completed" ? "upcoming" : "completed" }).then(refresh)}
                          className={`block w-full rounded px-2 py-1 text-left text-[11px] ${event.status === "completed" ? "bg-teal/10 text-teal line-through" : "bg-surface text-ink"}`}
                        >
                          {event.title}
                        </button>
                      ))}
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <article key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-cream p-4">
                  <div>
                    <p className="font-semibold text-navy">{event.title}</p>
                    <p className="text-xs text-muted">{new Date(event.startDate).toLocaleDateString()} - {event.eventType.replaceAll("_", " ")}</p>
                  </div>
                  <button onClick={() => deleteCalendarEvent(token, event.id).then(refresh)} className="text-xs text-muted hover:text-teal">Delete</button>
                </article>
              ))}
            </div>
          )}
        </section>

        <form onSubmit={submit} className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy">Add event</h2>
          <label className="mt-4 grid gap-1 text-sm">
            <span className="font-semibold text-muted">Title</span>
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal" required />
          </label>
          <label className="mt-3 grid gap-1 text-sm">
            <span className="font-semibold text-muted">Date</span>
            <input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal" required />
          </label>
          <label className="mt-3 grid gap-1 text-sm">
            <span className="font-semibold text-muted">Type</span>
            <select value={form.eventType} onChange={(event) => setForm({ ...form, eventType: event.target.value })} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal">
              {eventTypes.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}
            </select>
          </label>
          <label className="mt-3 grid gap-1 text-sm">
            <span className="font-semibold text-muted">Description</span>
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal" />
          </label>
          <button className="mt-4 w-full rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">Save event</button>
        </form>
      </div>
    </div>
  )
}
