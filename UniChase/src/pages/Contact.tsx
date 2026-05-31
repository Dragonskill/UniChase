import { useEffect, useState, type FormEvent } from "react"
import { submitContact } from "@/lib/api"
import { applySeo } from "@/lib/seo"

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    universityOfInterest: "",
    subject: "",
    message: "",
  })
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    applySeo({
      title: "Contact UniChase",
      description: "Contact UniChase for support with Korean university discovery.",
      canonicalPath: "/contact",
    })
  }, [])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setStatus("")

    submitContact(form)
      .then(() => {
        setStatus("Message sent. We stored your request and will review it.")
        setForm({ name: "", email: "", universityOfInterest: "", subject: "", message: "" })
      })
      .catch((error) => setStatus(error.message || "Could not send message."))
      .finally(() => setLoading(false))
  }

  return (
    <div className="page-fade max-w-6xl mx-auto px-6 py-8">
      <div className="bg-surface rounded-2xl shadow-sm p-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-navy mb-2">Contact support</h1>
        <p className="text-muted mb-6">Send a question about universities, applications, or using UniChase.</p>
        <form onSubmit={submit} className="grid grid-cols-1 gap-4">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
          <input value={form.universityOfInterest} onChange={(e) => setForm({ ...form, universityOfInterest: e.target.value })} placeholder="University of interest" className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
          <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
          <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Message" rows={5} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
          <button type="submit" className="bg-navy text-white px-5 py-2 rounded-lg font-semibold hover:bg-navy-light transition-colors">{loading ? "Sending..." : "Send message"}</button>
        </form>
        {status && <p className="mt-4 text-sm text-teal">{status}</p>}
      </div>
    </div>
  )
}
