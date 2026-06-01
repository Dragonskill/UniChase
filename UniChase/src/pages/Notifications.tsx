import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/lib/api"
import { applySeo } from "@/lib/seo"
import { getToken } from "@/lib/storage"

const types = ["all", "application_status_changed", "community_reply", "community_like", "moderator_announcement", "dashboard_setup"]

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [type, setType] = useState("all")
  const [status, setStatus] = useState("")
  const token = getToken()

  const refresh = () => {
    if (!token) return
    fetchNotifications(token, type === "all" ? {} : { type }).then(setItems).catch(() => setStatus("Could not load notifications."))
  }

  useEffect(() => {
    applySeo({
      title: "Notifications | UniChase",
      description: "Review application reminders, community replies, announcements, and dashboard updates.",
      canonicalPath: "/notifications",
    })
  }, [])

  useEffect(refresh, [token, type])

  if (!token) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <section className="bg-surface rounded-2xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-navy">Notifications</h1>
          <p className="mt-2 text-sm text-muted">Login to see your private notifications.</p>
          <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-teal hover:underline">Login</Link>
        </section>
      </div>
    )
  }

  return (
    <div className="page-fade max-w-4xl mx-auto px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Notification center</h1>
          <p className="mt-1 text-sm text-muted">Application reminders, community activity, and moderator announcements.</p>
        </div>
        <button
          type="button"
          onClick={() => markAllNotificationsRead(token).then(refresh).catch(() => setStatus("Could not mark notifications read."))}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light"
        >
          Mark all read
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {types.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setType(item)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${type === item ? "bg-navy text-white" : "bg-surface text-muted border border-gray-200"}`}
          >
            {item === "all" ? "All" : item.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      {status && <p className="mb-4 rounded-lg bg-teal/10 px-4 py-3 text-sm text-teal">{status}</p>}

      <div className="space-y-3">
        {items.length === 0 && (
          <section className="bg-surface rounded-2xl shadow-sm p-6 text-sm text-muted">No notifications in this filter.</section>
        )}
        {items.map((item) => (
          <article key={item.id} className="bg-surface rounded-2xl shadow-sm p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-navy">{item.title}</h2>
                  {!item.isRead && <span className="rounded-full bg-teal px-2 py-0.5 text-[10px] font-bold text-white">Unread</span>}
                  <span className="rounded-full bg-cream px-2 py-0.5 text-[10px] text-muted">{item.priority}</span>
                </div>
                <p className="mt-2 text-sm text-gray-700">{item.message}</p>
                <p className="mt-2 text-xs text-muted">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                {!item.isRead && (
                  <button type="button" onClick={() => markNotificationRead(token, item.id).then(refresh)} className="text-xs text-teal hover:underline">
                    Mark read
                  </button>
                )}
                <button type="button" onClick={() => deleteNotification(token, item.id).then(refresh)} className="text-xs text-muted hover:text-teal">
                  Delete
                </button>
              </div>
            </div>
            {item.linkUrl && <Link to={item.linkUrl} className="mt-3 inline-block text-sm font-semibold text-teal hover:underline">Open related item</Link>}
          </article>
        ))}
      </div>
    </div>
  )
}
