import { useEffect, useState } from 'react'
import type { University } from '@/data/universities'
import {
  loadAdvisorQuestions, loadManagedAssociation, removeAssociationRecord, saveAssociationRecord, saveManagedAssociation,
  updateAdvisorQuestion, type Advisor, type AdvisorQuestion, type Association, type Collection, type FeedItem, type Member,
} from '@/lib/associationApi'
import { associationButton, Field, ProfileEditor, RecordEditor, type AssociationRecord } from './AssociationEditors'

const collections = {
  members: { title: 'Management Team', add: 'Add team member' },
  advisors: { title: 'Major Advisors', add: 'Add advisor' },
  content: { title: 'Events, Posts & Interviews', add: 'Add content' },
} as const

function recordLabel(record: AssociationRecord) {
  if ('title' in record) return record.title
  if ('name' in record) return record.name
  return record.displayName || record.roleTitle
}

function recordStatus(record: AssociationRecord) {
  if ('published' in record) return `${record.type} · ${record.published ? 'Published' : 'Draft'}`
  if ('active' in record) return record.active ? 'Active' : 'Inactive'
  return record.displayName ? record.status : 'Legacy role with no public profile'
}

function updateRecords<T extends AssociationRecord>(records: T[], id: number, next?: T) {
  const rest = records.filter((record) => record.id !== id)
  return next ? [...rest, next] : rest
}

function collectionRecords(association: Association, kind: Collection) {
  if (kind === 'members') return association.roles
  if (kind === 'advisors') return association.advisors
  return association.content
}

function replaceRecord(association: Association, kind: Collection, id: number, next?: AssociationRecord): Association {
  if (kind === 'members') return { ...association, roles: updateRecords(association.roles, id, next as Member | undefined) }
  if (kind === 'advisors') return { ...association, advisors: updateRecords(association.advisors, id, next as Advisor | undefined) }
  return { ...association, content: updateRecords(association.content, id, next as FeedItem | undefined) }
}

function ManagedCollection({ kind, association, token, update }: {
  kind: Collection
  association: Association
  token: string
  update: (id: number, record?: AssociationRecord) => void
}) {
  const [editing, setEditing] = useState<AssociationRecord | 'new' | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [error, setError] = useState('')
  const meta = collections[kind]
  const records = collectionRecords(association, kind)

  async function remove(record: AssociationRecord) {
    if (!window.confirm('Delete ' + recordLabel(record) + '?')) return
    setError('')
    setDeleting(record.id)
    try {
      await removeAssociationRecord(token, association.id, kind, record.id)
      update(record.id)
      if (editing !== 'new' && editing?.id === record.id) setEditing(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete this record.')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <section className="rounded-2xl bg-surface p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-bold text-navy">{meta.title}</h3>
        <button type="button" className={associationButton} onClick={() => setEditing('new')} disabled={Boolean(editing) || deleting !== null}>{meta.add}</button>
      </div>
      {editing && (
        <div className="mb-4 rounded-xl border border-gray-200 p-4">
          <RecordEditor key={editing === 'new' ? editing : editing.id} token={token} kind={kind}
            record={editing === 'new' ? undefined : editing} close={() => setEditing(null)}
            save={async (record) => {
              const { data } = await saveAssociationRecord(token, association.id, kind, record)
              update(data.id, data)
              setEditing(null)
            }} />
        </div>
      )}
      {error && <p role="alert" className="mb-3 text-sm text-ink">{error}</p>}
      {!records.length ? <p className="text-sm text-muted">No records added yet.</p> : (
        <ul className="divide-y divide-gray-200">
          {records.map((record) => (
            <li key={record.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold text-navy">{recordLabel(record)}</p>
                <p className="text-xs text-muted">{recordStatus(record)}</p>
              </div>
              <div className="flex gap-3 text-sm">
                <button type="button" className="text-teal hover:underline disabled:opacity-50" disabled={Boolean(editing) || deleting !== null} onClick={() => setEditing(record)}>Edit</button>
                <button type="button" className="text-teal hover:underline disabled:opacity-50" disabled={Boolean(editing) || deleting !== null} onClick={() => void remove(record)}>
                  {deleting === record.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ManagedProfile({ token, universityId }: { token: string; universityId: number }) {
  const [association, setAssociation] = useState<Association | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let ignore = false
    loadManagedAssociation(token, universityId)
      .then(({ data }) => { if (!ignore) setAssociation(data) })
      .catch((cause: Error) => { if (!ignore) setError(cause.message) })
    return () => { ignore = true }
  }, [token, universityId, retry])

  if (error) return <p role="alert" className="text-sm text-ink">{error}{' '}
    <button className="text-teal hover:underline" onClick={() => { setError(''); setRetry((value) => value + 1) }}>Try again</button>
  </p>
  if (association === undefined) return <p role="status" className="text-sm text-muted">Loading association…</p>

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-surface p-5 shadow-sm">
        <h3 className="mb-4 font-bold text-navy">Association profile</h3>
        {revision > 0 && <p role="status" className="mb-3 text-sm text-teal">Association saved.</p>}
        <ProfileEditor key={revision} token={token} association={association} save={async (profile) => {
          const { data } = await saveManagedAssociation(token, universityId, profile)
          setAssociation(data)
          setRevision((value) => value + 1)
        }} />
      </section>
      {association && (Object.keys(collections) as Collection[]).map((kind) => (
        <ManagedCollection key={kind} kind={kind} association={association} token={token}
          update={(id, record) => setAssociation((current) => current ? replaceRecord(current, kind, id, record) : current)} />
      ))}
    </div>
  )
}

function QuestionList({ token, status }: { token: string; status: 'open' | 'handled' }) {
  const [items, setItems] = useState<AdvisorQuestion[] | null>(null)
  const [next, setNext] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let ignore = false
    loadAdvisorQuestions(token, status)
      .then((page) => { if (!ignore) { setItems(page.data); setNext(page.next) } })
      .catch((cause: Error) => { if (!ignore) setError(cause.message) })
    return () => { ignore = true }
  }, [token, status])

  async function loadMore() {
    if (!next) return
    setBusy(true)
    setError('')
    try {
      const page = await loadAdvisorQuestions(token, status, next)
      setItems((current) => [...(current ?? []), ...page.data])
      setNext(page.next)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load questions.')
    } finally {
      setBusy(false)
    }
  }

  async function mark(question: AdvisorQuestion) {
    setBusy(true)
    setError('')
    try {
      await updateAdvisorQuestion(token, question.id, status === 'open')
      setItems((current) => current?.filter((item) => item.id !== question.id) ?? [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update the question.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {error && <p role="alert" className="text-sm text-ink">{error}</p>}
      {!items && !error && <p role="status" className="text-sm text-muted">Loading questions…</p>}
      {items && !items.length && !next && <p className="text-sm text-muted">No {status} questions.</p>}
      <ul className="space-y-3">
        {items?.map((question) => (
          <li key={question.id} className="space-y-2 rounded-xl border border-gray-200 p-4 text-sm">
            <h4 className="break-words font-semibold text-navy">{question.advisorName} · {question.advisorMajor}</h4>
            <p className="break-words text-muted">{question.associationName} · {question.universityName}</p>
            <p className="break-words text-muted">{question.student ? `${question.student.name} (${question.student.email})` : 'Former student'} · <time dateTime={question.createdAt}>{new Date(question.createdAt).toLocaleDateString()}</time></p>
            <p className="whitespace-pre-wrap break-words text-ink">{question.body}</p>
            <button type="button" className="text-teal hover:underline disabled:opacity-50" disabled={busy} onClick={() => void mark(question)}>
              {status === 'open' ? 'Mark handled' : 'Reopen'}
            </button>
          </li>
        ))}
      </ul>
      {next && <button className="mt-3 text-sm text-teal hover:underline" type="button" disabled={busy} onClick={() => void loadMore()}>Load more</button>}
    </>
  )
}

function AdvisorInbox({ token }: { token: string }) {
  const [status, setStatus] = useState<'open' | 'handled'>('open')
  return (
    <section className="space-y-3 rounded-2xl bg-surface p-5 shadow-sm">
      <h3 className="font-bold text-navy">Private advisor-question inbox</h3>
      <p className="text-sm text-muted">Relay questions to the selected advisor, then mark them handled.</p>
      <div className="flex gap-2">
        {(['open', 'handled'] as const).map((tab) => (
          <button key={tab} type="button" aria-pressed={tab === status} onClick={() => setStatus(tab)}
            className={`rounded-lg border border-gray-200 px-3 py-1 text-sm capitalize ${tab === status ? 'bg-navy text-white' : 'bg-cream text-navy'}`}>{tab}</button>
        ))}
      </div>
      <QuestionList key={status} token={token} status={status} />
    </section>
  )
}

export default function AssociationManager({ token, universities }: { token?: string; universities: University[] }) {
  const [selected, setSelected] = useState<number | null>(null)
  const universityId = selected ?? universities.find((university) => university.slug === 'korea-university')?.id ?? universities[0]?.id

  if (!token) return <p className="text-sm text-muted">Backend admin login required.</p>

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-surface p-5 shadow-sm">
        <h2 className="mb-3 font-bold text-navy">Student Associations</h2>
        <Field label="University">
          <select className="w-full max-w-md rounded-lg border border-gray-200 bg-cream px-3 py-2 text-ink"
            value={universityId ?? ''} disabled={!universities.length} onChange={(event) => setSelected(Number(event.target.value))}>
            {!universities.length && <option value="">No universities loaded</option>}
            {universities.map((university) => <option key={university.id} value={university.id}>{university.name}</option>)}
          </select>
        </Field>
      </section>
      {universityId && <ManagedProfile key={universityId} universityId={universityId} token={token} />}
      <AdvisorInbox token={token} />
    </div>
  )
}
