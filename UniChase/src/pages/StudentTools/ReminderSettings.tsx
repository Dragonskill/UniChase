import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import GlowLetters from "@/components/ui/GlowLetters"
import { fetchReminderDeliveryStatus, fetchReminderPreference, fetchScheduledReminders, updateReminderPreference, type ReminderPreference, type ScheduledReminder } from "@/lib/api"
import { applySeo } from "@/lib/seo"
import { getToken } from "@/lib/storage"

const defaults: ReminderPreference = { emailEnabled: false, applicationDeadline: true, documentChecklist: true, roadmapStep: true, visaChecklist: true, savedUniversityDeadline: true, reminderDays: [30, 14, 7, 1], customEmail: "" }
const toggles: { key: keyof ReminderPreference; label: string }[] = [
  { key: "applicationDeadline", label: "Application deadlines" }, { key: "documentChecklist", label: "Document checklist" },
  { key: "roadmapStep", label: "Roadmap steps" }, { key: "visaChecklist", label: "Visa checklist" },
  { key: "savedUniversityDeadline", label: "Saved university deadlines" },
]

export default function ReminderSettings() {
  const [preference, setPreference] = useState(defaults)
  const [daysText, setDaysText] = useState("30, 14, 7, 1")
  const [scheduled, setScheduled] = useState<ScheduledReminder[]>([])
  const [delivery, setDelivery] = useState<{ configured: boolean; message: string }>()
  const [message, setMessage] = useState("")
  const token = getToken()

  const load = async (authToken: string) => {
    const [settings, status, reminders] = await Promise.all([fetchReminderPreference(authToken), fetchReminderDeliveryStatus(authToken), fetchScheduledReminders(authToken)])
    setPreference(settings); setDaysText(settings.reminderDays.join(", ")); setDelivery(status); setScheduled(reminders)
  }
  useEffect(() => {
    applySeo({ title: "Email Reminders | UniChase", description: "Configure and review your application reminders.", canonicalPath: "/reminders" })
    let active = true
    if (token) Promise.all([fetchReminderPreference(token), fetchReminderDeliveryStatus(token), fetchScheduledReminders(token)]).then(([settings, status, reminders]) => {
      if (active) { setPreference(settings); setDaysText(settings.reminderDays.join(', ')); setDelivery(status); setScheduled(reminders) }
    }).catch(error => { if (active) setMessage(error instanceof Error ? error.message : "Could not load reminder settings") })
    return () => { active = false }
  }, [token])

  const save = async () => {
    if (!token) { setMessage("Sign in to schedule account reminders."); return }
    const reminderDays = [...new Set(daysText.split(",").map(item => Number(item.trim())).filter(item => Number.isInteger(item) && item > 0 && item <= 365))]
    if (!reminderDays.length || reminderDays.length > 8) { setMessage("Enter 1 to 8 day offsets between 1 and 365."); return }
    try {
      const saved = await updateReminderPreference(token, { ...preference, customEmail: null, reminderDays })
      setPreference(saved); await load(token); setMessage("Reminder settings saved and schedule refreshed.")
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save reminder settings") }
  }

  return <div className="page-fade max-w-6xl mx-auto px-6 py-8">
    <p className="text-sm text-teal font-semibold">Student tools</p><h1 className="text-3xl font-bold text-navy mb-6"><GlowLetters text="Email reminders" /></h1>
    {!token ? <section className="bg-surface rounded-2xl shadow-sm p-5"><p className="text-navy">Reminders belong to an account so they reach the right student.</p><Link to="/login" className="inline-block mt-3 text-teal underline">Sign in to configure reminders</Link></section> : <div className="grid gap-6 lg:grid-cols-2">
      <section className="bg-surface rounded-2xl shadow-sm p-5">
        {delivery && <p className={`mb-4 text-sm ${delivery.configured ? "text-teal" : "text-muted"}`}>{delivery.message}</p>}
        <label className="flex items-center gap-3 text-sm text-navy"><input type="checkbox" checked={preference.emailEnabled} onChange={e => setPreference({ ...preference, emailEnabled: e.target.checked })} />Enable email reminders to my account email</label>
        <div className="mt-4 grid gap-3 md:grid-cols-2">{toggles.map(item => <label key={item.key} className="flex items-center gap-3 text-sm text-navy"><input type="checkbox" checked={Boolean(preference[item.key])} onChange={e => setPreference({ ...preference, [item.key]: e.target.checked })} />{item.label}</label>)}</div>
        <label className="block mt-4 text-sm text-navy">Days before each deadline<input aria-label="Reminder day offsets" value={daysText} onChange={e => setDaysText(e.target.value)} className="mt-1 w-full bg-cream border border-gray-200 rounded-lg px-3 py-2" /></label>
        <button onClick={save} className="mt-4 bg-navy text-white px-5 py-2 rounded-lg font-semibold">Save and refresh schedule</button>{message && <p role="status" className="mt-3 text-sm text-navy">{message}</p>}
      </section>
      <section className="bg-surface rounded-2xl shadow-sm p-5"><h2 className="text-lg font-bold text-navy mb-3">Scheduled reminders</h2>{!scheduled.length && <p className="text-sm text-muted">No upcoming reminders. Add dated roadmap steps or save a university with published deadlines.</p>}<ul className="space-y-3">{scheduled.map(item => <li key={item.id} className="border-b border-gray-200 pb-3"><strong className="block text-sm text-navy">{item.title}</strong><span className="text-xs text-muted">{new Date(item.sendAt).toLocaleString()} · {item.status}</span></li>)}</ul></section>
    </div>}
  </div>
}
