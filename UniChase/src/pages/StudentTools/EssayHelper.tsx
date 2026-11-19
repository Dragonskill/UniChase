import { useEffect, useState } from "react"
import GlowLetters from "@/components/ui/GlowLetters"
import { createEssayDraft, fetchEssayDrafts, fetchEssayFeedback, updateEssayDraft, deleteEssayDraft, type EssayDraft, type EssayFeedback } from "@/lib/api"
import { exportStudentToolPdf } from "@/lib/pdfExport"
import { applySeo } from "@/lib/seo"
import { getToken } from "@/lib/storage"
import { buildEssayFeedback, getLocalEssayDrafts, saveLocalEssayDraft, deleteLocalEssayDraft } from "@/lib/studentToolsLocal"

const blank = { title: "Statement of purpose", targetMajor: "", targetUniversity: "", content: "" }
const fieldClass = "w-full mt-1 bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"

export default function EssayHelper() {
  const [form, setForm] = useState(blank)
  const [selectedId, setSelectedId] = useState<number>()
  const [drafts, setDrafts] = useState<EssayDraft[]>([])
  const [feedback, setFeedback] = useState<EssayFeedback | null>(null)
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    applySeo({ title: "Essay Helper | UniChase", description: "Draft and review a university study plan or personal statement.", canonicalPath: "/essay-helper" })
    const token = getToken()
    Promise.resolve().then(() => token ? fetchEssayDrafts(token) : getLocalEssayDrafts()).then(setDrafts)
      .catch(error => setMessage(error instanceof Error ? error.message : "Could not load drafts"))
  }, [])

  const openDraft = (draft: EssayDraft) => {
    setSelectedId(draft.id)
    setForm({ title: draft.title, targetMajor: draft.targetMajor || "", targetUniversity: draft.targetUniversity || "", content: draft.content })
    setFeedback(draft.feedback || null)
    setMessage("")
  }

  const run = async (action: "review" | "save") => {
    if (!form.title.trim() || !form.content.trim()) { setMessage("Add a title and essay text first."); return }
    setBusy(true)
    setMessage("")
    try {
      const token = getToken()
      if (action === "review") {
        setFeedback(token ? await fetchEssayFeedback(token, form) : buildEssayFeedback(form.content, form.targetMajor))
        return
      }
      const draft = token
        ? selectedId ? await updateEssayDraft(token, selectedId, form) : await createEssayDraft(token, form)
        : saveLocalEssayDraft({ ...form, id: selectedId, wordCount: 0, characterCount: form.content.length })
      setSelectedId(draft.id)
      setFeedback(draft.feedback || null)
      setDrafts(items => [draft, ...items.filter(item => item.id !== draft.id)])
      setMessage(token ? "Draft saved to your account." : "Draft saved for this browser tab. Sign in to keep drafts in your account.")
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save your draft") }
    finally { setBusy(false) }
  }

  const remove = async (id: number) => {
    setBusy(true)
    try {
      const token = getToken()
      if (token) await deleteEssayDraft(token, id)
      else deleteLocalEssayDraft(id)
      setDrafts(items => items.filter(item => item.id !== id))
      if (id === selectedId) { setSelectedId(undefined); setForm(blank); setFeedback(null) }
      setMessage("Draft deleted.")
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not delete draft") }
    finally { setBusy(false) }
  }

  const exportEssay = async () => {
    try { await exportStudentToolPdf(form.title, [{ title: "Draft", lines: [form.content] }, { title: "Feedback", lines: feedback?.suggestions || ["No feedback generated."] }]) }
    catch { setMessage("PDF export failed. Please try again.") }
  }

  return <div className="page-fade max-w-6xl mx-auto px-6 py-8">
    <p className="text-sm text-teal font-semibold">Student tools</p>
    <h1 className="text-3xl font-bold text-navy mb-3"><GlowLetters text="Essay helper" /></h1>
    <p className="text-sm text-muted mb-6">Get rule-based structure prompts and track your drafts. Feedback is a writing checklist, not an admissions assessment.</p>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section className="bg-surface rounded-2xl shadow-sm p-5 lg:col-span-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          {([['title', 'Draft title'], ['targetMajor', 'Target major'], ['targetUniversity', 'Target university']] as const).map(([field, label]) => <label key={field} className="text-sm text-navy">{label}<input maxLength={160} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} className={fieldClass} /></label>)}
        </div>
        <label className="text-sm text-navy">Essay text<textarea maxLength={12000} value={form.content} onChange={event => { setForm({ ...form, content: event.target.value }); setFeedback(null) }} rows={14} className={fieldClass} /></label>
        <p className="mt-1 text-xs text-muted">{form.content.trim().split(/\s+/).filter(Boolean).length} words · {form.content.length}/12,000 characters</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button disabled={busy} onClick={() => run("review")} className="bg-navy text-white px-5 py-2 rounded-lg disabled:opacity-50">Review draft</button>
          <button disabled={busy} onClick={() => run("save")} className="bg-teal text-white px-5 py-2 rounded-lg disabled:opacity-50">{selectedId ? "Save changes" : "Save draft"}</button>
          <button onClick={exportEssay} className="border border-gray-200 px-5 py-2 rounded-lg text-navy">Export PDF</button>
          <button onClick={() => { setSelectedId(undefined); setForm(blank); setFeedback(null) }} className="border border-gray-200 px-5 py-2 rounded-lg text-navy">New draft</button>
        </div>
        {message && <p role="status" className="mt-3 text-sm text-navy">{message}</p>}
      </section>
      <aside className="space-y-5">
        <section className="bg-surface rounded-2xl shadow-sm p-5"><h2 className="text-lg font-bold text-navy mb-3">Feedback</h2>{feedback ? <ul className="space-y-3 text-sm text-navy">{feedback.suggestions.map(item => <li key={item}>{item}</li>)}</ul> : <p className="text-sm text-muted">Review your draft to see structure prompts.</p>}</section>
        <section className="bg-surface rounded-2xl shadow-sm p-5"><h2 className="text-lg font-bold text-navy mb-3">Saved drafts</h2>{!drafts.length && <p className="text-sm text-muted">Your saved drafts will appear here.</p>}<ul className="space-y-3">{drafts.map(draft => <li key={draft.id} className="border-b border-gray-200 pb-2"><button onClick={() => openDraft(draft)} className="text-left text-sm font-semibold text-teal">{draft.title}</button><p className="text-xs text-muted">{draft.wordCount} words</p><button disabled={busy} onClick={() => draft.id && remove(draft.id)} className="text-xs text-muted underline">Delete draft</button></li>)}</ul></section>
      </aside>
    </div>
  </div>
}
