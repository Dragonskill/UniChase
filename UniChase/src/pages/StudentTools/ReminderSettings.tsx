import { useEffect, useState } from "react"
import GlowLetters from "@/components/ui/GlowLetters"
import { fetchReminderPreference, updateReminderPreference, type ReminderPreference } from "@/lib/api"
import { isLocalAuthToken } from "@/lib/authSession"
import { applySeo } from "@/lib/seo"
import { getToken } from "@/lib/storage"
import { getLocalReminderPreference, saveLocalReminderPreference } from "@/lib/studentToolsLocal"

const defaultPreference: ReminderPreference = {
  emailEnabled: false,
  applicationDeadline: true,
  documentChecklist: true,
  roadmapStep: true,
  visaChecklist: true,
  savedUniversityDeadline: true,
  reminderDays: [30, 14, 7, 1],
  customEmail: "",
}

const toggles: { key: keyof ReminderPreference; label: string }[] = [
  { key: "applicationDeadline", label: "Application deadlines" },
  { key: "documentChecklist", label: "Document checklist" },
  { key: "roadmapStep", label: "Roadmap steps" },
  { key: "visaChecklist", label: "Visa checklist" },
  { key: "savedUniversityDeadline", label: "Saved university deadlines" },
]

export default function ReminderSettings() {
  const [preference, setPreference] = useState<ReminderPreference>(defaultPreference)
  const [message, setMessage] = useState("")

  useEffect(() => {
    applySeo({
      title: "Email Reminders | UniChase",
      description: "Configure deadline reminder preferences for UniChase student tools.",
      canonicalPath: "/reminders",
    })
  }, [])

  useEffect(() => {
    const token = getToken()
    const localPreference = getLocalReminderPreference()

    if (!token || isLocalAuthToken(token)) {
      Promise.resolve().then(() => setPreference(localPreference || defaultPreference))
      return
    }

    fetchReminderPreference(token)
      .then(setPreference)
      .catch(() => setPreference(localPreference || defaultPreference))
  }, [])

  const save = async () => {
    const token = getToken()
    saveLocalReminderPreference(preference)

    if (token && !isLocalAuthToken(token)) {
      try {
        await updateReminderPreference(token, preference)
        setMessage("Reminder settings saved.")
        return
      } catch {
        setMessage("Saved locally. Backend sync is unavailable right now.")
        return
      }
    }

    setMessage("Reminder settings saved in this browser.")
  }

  const toggle = (key: keyof ReminderPreference, checked: boolean) => {
    setPreference((current) => ({ ...current, [key]: checked }))
  }

  return (
    <div className="page-fade max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <p className="text-sm text-teal font-semibold">Student tools</p>
        <h1 className="text-3xl font-bold text-navy">
          <GlowLetters text="Email reminders" />
        </h1>
      </div>

      <section className="bg-surface rounded-2xl shadow-sm p-5 max-w-3xl">
        <label className="flex items-center gap-3 text-sm text-gray-700">
          <input type="checkbox" checked={preference.emailEnabled} onChange={(e) => toggle("emailEnabled", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-teal focus:ring-teal" />
          Enable email reminders
        </label>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {toggles.map((item) => (
            <label key={item.key} className="flex items-center gap-3 text-sm text-gray-700">
              <input type="checkbox" checked={Boolean(preference[item.key])} onChange={(e) => toggle(item.key, e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-teal focus:ring-teal" />
              {item.label}
            </label>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={preference.customEmail || ""}
            onChange={(e) => setPreference({ ...preference, customEmail: e.target.value })}
            placeholder="Optional reminder email"
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <input
            value={preference.reminderDays.join(", ")}
            onChange={(e) =>
              setPreference({
                ...preference,
                reminderDays: e.target.value
                  .split(",")
                  .map((item) => Number(item.trim()))
                  .filter((item) => Number.isFinite(item) && item > 0),
              })
            }
            placeholder="Reminder days"
            className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </div>

        <button onClick={save} className="mt-4 bg-navy text-white px-5 py-2 rounded-lg font-semibold hover:bg-navy-light transition-colors">Save settings</button>
        {message && <p className="mt-3 text-sm text-teal">{message}</p>}
      </section>
    </div>
  )
}
