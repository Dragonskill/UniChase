import { useEffect, useState } from "react"
import GlowLetters from "@/components/ui/GlowLetters"
import { createEssayDraft, fetchEssayFeedback, type EssayFeedback } from "@/lib/api"
import { isLocalAuthToken } from "@/lib/authSession"
import { exportStudentToolPdf } from "@/lib/pdfExport"
import { applySeo } from "@/lib/seo"
import { getToken } from "@/lib/storage"
import { buildEssayFeedback } from "@/lib/studentToolsLocal"

export default function EssayHelper() {
  const [title, setTitle] = useState("Statement of purpose")
  const [targetMajor, setTargetMajor] = useState("Computer Science")
  const [targetUniversity, setTargetUniversity] = useState("")
  const [content, setContent] = useState("")
  const [feedback, setFeedback] = useState<EssayFeedback | null>(null)
  const [message, setMessage] = useState("")

  useEffect(() => {
    applySeo({
      title: "Essay Helper | UniChase",
      description: "Draft and review a South Korea university study plan or personal statement.",
      canonicalPath: "/essay-helper",
    })
  }, [])

  const reviewDraft = async () => {
    const token = getToken()

    if (token && !isLocalAuthToken(token)) {
      try {
        const result = await fetchEssayFeedback(token, { content, title, targetMajor })
        setFeedback(result)
        return
      } catch {
        setMessage("Backend feedback unavailable, using local feedback.")
      }
    }

    setFeedback(buildEssayFeedback(content, targetMajor))
  }

  const saveDraft = async () => {
    const token = getToken()

    if (!token || isLocalAuthToken(token)) {
      setMessage("Draft feedback is saved in this browser session.")
      setFeedback(buildEssayFeedback(content, targetMajor))
      return
    }

    try {
      const draft = await createEssayDraft(token, { title, targetMajor, targetUniversity, content })
      setFeedback(draft.feedback || null)
      setMessage("Draft saved to your account.")
    } catch {
      setMessage("Could not sync draft. Feedback is still available locally.")
      setFeedback(buildEssayFeedback(content, targetMajor))
    }
  }

  const exportEssay = () => {
    exportStudentToolPdf(title, [
      { title: "Draft", lines: [content || "No essay content yet."] },
      {
        title: "Feedback",
        lines: feedback
          ? [`Words: ${feedback.wordCount}`, `Tone: ${feedback.tone}`, ...feedback.suggestions]
          : ["Generate feedback before exporting for best results."],
      },
    ])
  }

  return (
    <div className="page-fade max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <p className="text-sm text-teal font-semibold">Student tools</p>
        <h1 className="text-3xl font-bold text-navy">
          <GlowLetters text="Essay helper" />
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-surface rounded-2xl shadow-sm p-5 lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
            <input value={targetMajor} onChange={(e) => setTargetMajor(e.target.value)} className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
            <input value={targetUniversity} onChange={(e) => setTargetUniversity(e.target.value)} placeholder="Target university" className="bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
          </div>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={14}
            placeholder="Paste or write your study plan here..."
            className="w-full bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={reviewDraft} className="bg-navy text-white px-5 py-2 rounded-lg font-semibold hover:bg-navy-light transition-colors">Review draft</button>
            <button onClick={saveDraft} className="bg-teal text-white px-5 py-2 rounded-lg font-semibold hover:bg-teal-light transition-colors">Save draft</button>
            <button onClick={exportEssay} className="border border-gray-200 px-5 py-2 rounded-lg text-navy hover:border-teal transition-colors">Export PDF</button>
          </div>
          {message && <p className="mt-3 text-sm text-teal">{message}</p>}
        </section>

        <section className="bg-surface rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-navy mb-3">Feedback</h2>
          {feedback ? (
            <div className="space-y-4 text-sm text-gray-700">
              <div>
                <p>Words: <strong>{feedback.wordCount}</strong></p>
                <p>Tone: <strong>{feedback.tone}</strong></p>
              </div>
              <div>
                <h3 className="font-semibold text-navy mb-2">Suggestions</h3>
                <ul className="space-y-2">
                  {feedback.suggestions.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-navy mb-2">Structure</h3>
                <ul className="space-y-2">
                  {feedback.structure.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">Feedback will appear after review.</p>
          )}
        </section>
      </div>
    </div>
  )
}

