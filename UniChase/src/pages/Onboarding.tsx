import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchOnboarding, saveOnboarding, generateDashboardFromOnboarding, type OnboardingPreference } from '@/lib/api'
import { getToken } from '@/lib/storage'

const steps = [
  [['desiredMajor', 'Desired major'], ['degreeLevel', 'Degree level'], ['preferredCity', 'Preferred city'], ['languagePreference', 'Preferred language']],
  [['budgetMin', 'Minimum annual tuition budget (KRW)'], ['budgetMax', 'Maximum annual tuition budget (KRW)'], ['qsRankMin', 'Minimum QS rank'], ['qsRankMax', 'Maximum QS rank'], ['scholarshipPreference', 'Scholarship preference']],
  [['targetIntake', 'Target intake'], ['educationLevel', 'Education level'], ['preparationStage', 'Preparation stage'], ['nationality', 'Nationality (optional)'], ['testStatus', 'Language test status (optional)']],
] as const
const numeric = new Set(['budgetMin', 'budgetMax', 'qsRankMin', 'qsRankMax'])

export default function Onboarding() {
  const token = getToken()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<OnboardingPreference>({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(Boolean(token))
  useEffect(() => {
    let current = true
    if (token) fetchOnboarding(token).then(value => { if (current) setForm(value || {}) })
      .catch(() => { if (current) setMessage('Could not load your preferences. Please retry before saving.') })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [token])
  async function save(complete = false) {
    if (!token) return
    setBusy(true); setMessage('')
    try {
      await saveOnboarding(token, { ...form, onboardingCompleted: complete })
      if (complete) { await generateDashboardFromOnboarding(token); navigate('/dashboard') }
      else setMessage('Progress saved. You can edit these preferences any time.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save preferences.') }
    finally { setBusy(false) }
  }
  function submit(event: FormEvent) { event.preventDefault(); if (step < 2) setStep(step + 1); else void save(true) }
  return <div className="page-fade max-w-2xl mx-auto px-5 py-8">
    <h1 className="text-2xl font-bold text-navy">Make UniChase yours</h1>
    <p className="text-muted mt-2 mb-6">Tell us what you are looking for. Every field is optional, and you can edit it later.</p>
    {!token ? <Link to="/login" className="text-teal">Sign in to save your preferences</Link> :
      <form onSubmit={submit} className="bg-surface rounded-2xl shadow-sm p-6 space-y-5">
        <p className="text-sm text-muted" aria-live="polite">Step {step + 1} of 3 · {['Your studies', 'Budget and preferences', 'Your preparation'][step]}</p>
        <fieldset disabled={busy || loading} className="space-y-4">
          {steps[step].map(([key, label]) => <label key={key} className="block text-sm text-ink">{label}
            <input type={numeric.has(key) ? 'number' : 'text'} min="0" maxLength={120} value={String(form[key] ?? '')}
              onChange={event => setForm({ ...form, [key]: numeric.has(key) ? event.target.value === '' ? null : Number(event.target.value) : event.target.value })}
              className="mt-1 w-full bg-cream border border-gray-200 rounded-lg px-3 py-2" />
          </label>)}
          {step === 1 && <label className="flex gap-3 text-sm text-ink"><input type="checkbox" checked={Boolean(form.dormitoryRequired)} onChange={event => setForm({ ...form, dormitoryRequired: event.target.checked })} />I need a dormitory</label>}
          <div className="flex flex-wrap gap-3">
            {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="border rounded-lg px-4 py-2">Back</button>}
            <button className="bg-teal text-white rounded-lg px-4 py-2">{busy ? 'Saving…' : step === 2 ? 'Create my dashboard' : 'Continue'}</button>
            <button type="button" onClick={() => void save()} className="text-teal px-2">Save progress</button>
          </div>
        </fieldset>
        {message && <p role="status" className="text-sm text-ink">{message}</p>}
        <Link to="/dashboard" className="inline-block text-sm text-muted underline">Skip for now</Link>
      </form>}
  </div>
}
