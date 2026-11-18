import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ApiRequestError } from '@/lib/api'
import { submitAdvisorQuestion, type Advisor } from '@/lib/associationApi'
import { getToken } from '@/lib/storage'
import AssociationDialog from './AssociationDialog'

export default function AskAdvisor({ councilId, advisor, close }: {
  councilId: number
  advisor: Advisor
  close: () => void
}) {
  const { pathname } = useLocation()
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function send(event: FormEvent) {
    event.preventDefault()
    const token = getToken()
    if (!token) {
      setNeedsLogin(true)
      return
    }
    setBusy(true)
    setError('')
    try {
      await submitAdvisorQuestion(token, councilId, advisor.id, body.trim())
      setSent(true)
    } catch (cause) {
      if (cause instanceof ApiRequestError && cause.status === 401) setNeedsLogin(true)
      else setError(cause instanceof Error ? cause.message : 'Could not submit your question. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AssociationDialog title={`Ask ${advisor.name} a question`} close={close}>
      <p className="mb-4 text-sm text-muted">{advisor.major}</p>
      {sent ? (
        <>
          <p role="status" className="text-sm text-ink">Your question was submitted to the private moderator inbox.</p>
          <button type="button" onClick={close} className="mt-4 rounded-lg bg-navy px-4 py-2 text-sm text-white">Close</button>
        </>
      ) : (
        <form onSubmit={send}>
          <label className="block text-sm font-medium text-navy">
            Your question
            <textarea autoFocus required maxLength={2000} rows={5} value={body} onChange={(event) => setBody(event.target.value)}
              className="mt-2 block w-full rounded-lg border border-gray-200 bg-cream px-3 py-2 text-ink focus-visible:outline-teal" />
          </label>
          {needsLogin && <p role="status" className="mt-3 text-sm text-muted">Sign in to submit a question. You will return to this university page.</p>}
          {error && <p role="alert" className="mt-3 text-sm text-ink">{error}</p>}
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={close} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-navy">Cancel</button>
            {needsLogin ? (
              <Link to="/login" state={{ associationReturn: pathname }} className="rounded-lg bg-navy px-4 py-2 text-sm text-white">Sign in</Link>
            ) : (
              <button type="submit" disabled={busy || !body.trim()} className="rounded-lg bg-navy px-4 py-2 text-sm text-white disabled:opacity-50">
                {busy ? 'Submitting…' : 'Send Question'}
              </button>
            )}
          </div>
        </form>
      )}
    </AssociationDialog>
  )
}
