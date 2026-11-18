import { useState, type FormEvent, type ReactNode } from 'react'
import {
  uploadAssociationImage, type Advisor, type Association, type Collection, type FeedItem, type Member, type Verification,
} from '@/lib/associationApi'

const inputClass = 'w-full rounded-lg border border-gray-200 bg-cream px-3 py-2 text-sm text-ink focus:ring-2 focus:ring-teal'
export const associationButton = 'rounded-lg bg-navy px-4 py-2 text-sm text-white hover:bg-navy-light disabled:opacity-50'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block min-w-0 space-y-1 text-sm text-navy"><span>{label}</span>{children}</label>
}

function TextField({ name, label, value, required, kind = 'text', max }: {
  name: string; label: string; value?: string | number | null; required?: boolean; kind?: string; max?: number
}) {
  return (
    <Field label={label}>
      <input name={name} type={kind} defaultValue={value ?? ''} required={required}
        maxLength={kind === 'text' || kind === 'url' ? max : undefined} max={kind === 'number' ? max : undefined}
        min={kind === 'number' ? 0 : undefined} className={inputClass} />
    </Field>
  )
}

function TextArea({ name, label, value, required, max }: { name: string; label: string; value?: string | null; required?: boolean; max: number }) {
  return <Field label={label}><textarea name={name} rows={4} defaultValue={value ?? ''} maxLength={max} required={required} className={inputClass} /></Field>
}

function VerificationField({ value }: { value?: Verification }) {
  return (
    <Field label="Verification">
      <select name="verificationStatus" defaultValue={value ?? 'needs verification'} className={inputClass}>
        <option value="needs verification">Needs Verification</option>
        <option value="verified">Verified</option>
        <option value="manually added">Manually added</option>
      </select>
    </Field>
  )
}

function Check({ name, label, checked }: { name: string; label: string; checked?: boolean }) {
  return <label className="flex items-center gap-2 text-sm text-navy"><input type="checkbox" name={name} defaultChecked={checked} />{label}</label>
}

function SocialFields({ record }: { record?: Association | Member | null }) {
  return (
    <>
      <TextField name="telegramUrl" label="Telegram URL" kind="url" value={record?.telegramUrl} />
      <TextField name="instagramUrl" label="Instagram URL" kind="url" value={record?.instagramUrl} />
      <TextField name="linkedinUrl" label="LinkedIn URL" kind="url" value={record?.linkedinUrl} />
    </>
  )
}

function ImageFields({ url, imageId, label }: { url?: string | null; imageId?: string | null; label: string }) {
  return (
    <>
      <TextField name="hostedImage" label={label + ' URL (HTTPS)'} kind="url" value={url} />
      <Field label={label + ' upload (JPEG, PNG, or WebP, up to 2 MB)'}>
        <input name="file" type="file" accept="image/jpeg,image/png,image/webp" className={inputClass} />
      </Field>
      {imageId && <Check name="removeImage" label="Remove the current uploaded image" />}
    </>
  )
}

function read(data: FormData, key: string) {
  return String(data.get(key) ?? '').trim()
}

function optional(data: FormData, key: string) {
  return read(data, key) || null
}

function number(data: FormData, key: string) {
  const value = optional(data, key)
  return value === null ? null : Number(value)
}

function socials(data: FormData) {
  return { telegramUrl: optional(data, 'telegramUrl'), instagramUrl: optional(data, 'instagramUrl'), linkedinUrl: optional(data, 'linkedinUrl') }
}

async function resolveImage(token: string, data: FormData, imageId: string | null | undefined) {
  const file = data.get('file')
  if (file instanceof File && file.size) {
    if (file.size > 2 * 1024 * 1024) throw new Error('Choose an image less than or equal to 2 MB.')
    return uploadAssociationImage(token, file)
  }
  return data.has('removeImage') ? null : (imageId ?? null)
}

function Editor({ children, save, action, cancel }: {
  children: ReactNode
  save: (data: FormData) => Promise<void>
  action: string
  cancel?: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setMessage('')
    setFailed(false)
    try {
      await save(data)
      setMessage('Saved.')
    } catch (cause) {
      setFailed(true)
      setMessage(cause instanceof Error ? cause.message : 'Could not save. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset disabled={busy} className="grid min-w-0 gap-4 sm:grid-cols-2">{children}</fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <button className={associationButton} type="submit" disabled={busy}>{busy ? 'Saving…' : action}</button>
        {cancel && <button type="button" disabled={busy} className="text-sm text-teal hover:underline" onClick={cancel}>Cancel</button>}
        {message && <p role={failed ? 'alert' : 'status'} className="text-sm text-ink">{message}</p>}
      </div>
    </form>
  )
}

type Profile = Omit<Association, 'id' | 'university' | 'universityId' | 'roles' | 'advisors' | 'content'>

export function ProfileEditor({ token, association, save }: {
  token: string
  association: Association | null
  save: (profile: Profile) => Promise<void>
}) {
  return (
    <Editor action="Save association" save={async (data) => {
      const imageId = await resolveImage(token, data, association?.imageId)
      await save({
        name: read(data, 'name'), officialName: read(data, 'officialName'), description: read(data, 'description'),
        associationEnabled: data.has('associationEnabled'), logoUrl: optional(data, 'hostedImage'), imageId,
        foundedYear: number(data, 'foundedYear'), memberCount: number(data, 'memberCount'),
        verificationStatus: read(data, 'verificationStatus') as Verification, ...socials(data),
      })
    }}>
      <TextField name="name" label="Short name" required value={association?.name} max={80} />
      <TextField name="officialName" label="Full name" required value={association?.officialName} max={180} />
      <div className="sm:col-span-2"><TextArea name="description" label="About" required value={association?.description} max={5000} /></div>
      <TextField name="memberCount" label="Member count" kind="number" value={association?.memberCount} max={1000000} />
      <TextField name="foundedYear" label="Founded year" kind="number" value={association?.foundedYear} max={new Date().getFullYear()} />
      <VerificationField value={association?.verificationStatus} />
      <Check name="associationEnabled" label="Show this association publicly" checked={association?.associationEnabled} />
      <ImageFields label="Logo" url={association?.logoUrl} imageId={association?.imageId} />
      <SocialFields record={association} />
    </Editor>
  )
}

export type AssociationRecord = Member | Advisor | FeedItem

export function RecordEditor({ token, kind, record, save, close }: {
  token: string
  kind: Collection
  record?: AssociationRecord
  save: (record: Partial<AssociationRecord>) => Promise<void>
  close: () => void
}) {
  if (kind === 'members') {
    const member = record as Member | undefined
    return (
      <Editor action="Save team member" cancel={close} save={async (data) => {
        const imageId = await resolveImage(token, data, member?.imageId)
        await save({
          id: member?.id, displayName: read(data, 'displayName'), roleTitle: read(data, 'roleTitle'),
          roleShort: optional(data, 'roleShort'), major: optional(data, 'major'), academicYear: optional(data, 'academicYear'),
          status: read(data, 'status') as Member['status'], verificationStatus: read(data, 'verificationStatus') as Verification,
          displayOrder: number(data, 'displayOrder') ?? 0, avatarUrl: optional(data, 'hostedImage'), imageId, ...socials(data),
        })
      }}>
        <TextField name="displayName" label="Full name" required value={member?.displayName} max={160} />
        <TextField name="roleTitle" label="Role" required value={member?.roleTitle} max={120} />
        <TextField name="roleShort" label="Role tag" value={member?.roleShort} max={20} />
        <TextField name="major" label="Major" value={member?.major} max={120} />
        <TextField name="academicYear" label="Academic year" value={member?.academicYear} max={80} />
        <TextField name="displayOrder" label="Display order" kind="number" value={member?.displayOrder ?? 0} max={10000} />
        <Field label="Status">
          <select name="status" defaultValue={member?.status ?? 'pending'} className={inputClass}>
            <option value="pending">Pending</option><option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
        </Field>
        <VerificationField value={member?.verificationStatus} />
        <ImageFields label="Photo" url={member?.avatarUrl} imageId={member?.imageId} />
        <SocialFields record={member} />
      </Editor>
    )
  }

  if (kind === 'advisors') {
    const advisor = record as Advisor | undefined
    return (
      <Editor action="Save advisor" cancel={close} save={async (data) => {
        const imageId = await resolveImage(token, data, advisor?.imageId)
        await save({
          id: advisor?.id, name: read(data, 'name'), major: read(data, 'major'), academicYear: optional(data, 'academicYear'),
          contactUrl: optional(data, 'contactUrl'), photoUrl: optional(data, 'hostedImage'), imageId,
          displayOrder: number(data, 'displayOrder') ?? 0, active: data.has('active'), verificationStatus: read(data, 'verificationStatus') as Verification,
        })
      }}>
        <TextField name="name" label="Full name" required value={advisor?.name} max={160} />
        <TextField name="major" label="Major" required value={advisor?.major} max={120} />
        <TextField name="academicYear" label="Academic year or status" value={advisor?.academicYear} max={80} />
        <TextField name="contactUrl" label="Public contact URL" kind="url" value={advisor?.contactUrl} />
        <TextField name="displayOrder" label="Display order" kind="number" value={advisor?.displayOrder ?? 0} max={10000} />
        <VerificationField value={advisor?.verificationStatus} />
        <Check name="active" label="Show this advisor and accept questions" checked={advisor?.active} />
        <ImageFields label="Photo" url={advisor?.photoUrl} imageId={advisor?.imageId} />
      </Editor>
    )
  }

  const item = record as FeedItem | undefined
  return (
    <Editor action="Save content" cancel={close} save={async (data) => {
      const imageId = await resolveImage(token, data, item?.imageId)
      await save({
        id: item?.id, type: read(data, 'type') as FeedItem['type'], title: read(data, 'title'),
        description: read(data, 'description'), body: optional(data, 'body'), date: read(data, 'date'),
        imageUrl: optional(data, 'hostedImage'), imageId, externalUrl: optional(data, 'externalUrl'), published: data.has('published'),
      })
    }}>
      <Field label="Content type">
        <select name="type" defaultValue={item?.type ?? 'EVENT'} className={inputClass}>
          <option value="EVENT">Event</option><option value="POST">Post</option><option value="INTERVIEW">Interview</option>
        </select>
      </Field>
      <TextField name="title" label="Title" required value={item?.title} max={180} />
      <TextField name="date" label="Date" kind="date" required value={item?.date.slice(0, 10)} />
      <TextField name="externalUrl" label="External details URL" kind="url" value={item?.externalUrl} />
      <div className="sm:col-span-2"><TextArea name="description" label="Excerpt" required value={item?.description} max={1000} /></div>
      <div className="sm:col-span-2"><TextArea name="body" label="Details" value={item?.body} max={20000} /></div>
      <ImageFields label="Cover" url={item?.imageUrl} imageId={item?.imageId} />
      <Check name="published" label="Publish this item" checked={item?.published} />
    </Editor>
  )
}
