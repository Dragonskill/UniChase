import { useEffect, useState, type FormEvent } from 'react'
import { fetchPrograms, fetchUniversities, saveCatalogItem, type Program } from '@/lib/api'
import type { University } from '@/data/universities'

const fieldClass = 'block w-full mt-1 bg-cream border border-gray-200 rounded-lg px-3 py-2 text-sm'
const blankUniversity = { name: '', slug: '', koreanName: '', city: '', province: '', universityType: 'private', description: '', officialWebsite: '', verificationStatus: 'needs verification', sourceUrls: '', lastVerifiedAt: '' }
const blankProgram = { universityId: '', name: '', slug: '', degreeLevel: 'Undergraduate', languageOfInstruction: 'Unknown', duration: '', officialLink: '', requirements: '', requiredDocuments: '', applicationPeriod: '', careerOutcomes: '', tuitionMin: '', tuitionMax: '', tuitionCurrency: 'KRW' }
const lines = (value: string) => value.split('\n').map(item => item.trim()).filter(Boolean)

export default function CatalogManager({ token }: { token: string }) {
  const [universities, setUniversities] = useState<University[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [universityId, setUniversityId] = useState<number | null>(null)
  const [programId, setProgramId] = useState<number | null>(null)
  const [university, setUniversity] = useState(blankUniversity)
  const [program, setProgram] = useState(blankProgram)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const refresh = () => Promise.all([fetchUniversities(), fetchPrograms({ limit: 100 })]).then(([items, courses]) => { setUniversities(items); setPrograms(courses) })
  useEffect(() => { void refresh().catch(() => setMessage('Could not load the catalog.')) }, [])
  function selectUniversity(id: string) {
    const item = universities.find(entry => entry.id === Number(id)); setUniversityId(item?.id || null)
    setUniversity(item ? { name: item.name, slug: item.slug || '', koreanName: item.koreanName || '', city: item.city || '', province: item.province || '', universityType: item.universityType || 'private', description: item.description, officialWebsite: item.officialWebsite || '', verificationStatus: item.verificationStatus || 'needs verification', sourceUrls: item.sourceUrls?.join('\n') || '', lastVerifiedAt: item.lastVerifiedAt?.slice(0, 10) || '' } : blankUniversity)
  }
  function selectProgram(id: string) {
    const item = programs.find(entry => entry.id === Number(id)); setProgramId(item?.id || null)
    setProgram(item ? { universityId: String(item.universityId), name: item.name, slug: item.slug, degreeLevel: item.degreeLevel, languageOfInstruction: item.languageOfInstruction, duration: item.duration || '', officialLink: item.officialLink || '', requirements: item.requirements.join('\n'), requiredDocuments: item.requiredDocuments.join('\n'), applicationPeriod: item.applicationPeriod || '', careerOutcomes: item.careerOutcomes.join('\n'), tuitionMin: String(item.tuition?.min ?? ''), tuitionMax: String(item.tuition?.max ?? ''), tuitionCurrency: item.tuition?.currency || 'KRW' } : blankProgram)
  }
  async function save(event: FormEvent, kind: 'universities' | 'programs') {
    event.preventDefault(); setBusy(true); setMessage('')
    try {
      const payload = kind === 'universities'
        ? { ...university, sourceUrls: lines(university.sourceUrls), lastVerifiedAt: university.lastVerifiedAt || null, ...(!universityId ? { programs: [], languagesOfInstruction: [], hasDormitory: null, hasScholarships: null } : {}) }
        : { ...program, universityId: Number(program.universityId), requirements: lines(program.requirements), requiredDocuments: lines(program.requiredDocuments), careerOutcomes: lines(program.careerOutcomes), tuitionMin: program.tuitionMin ? Number(program.tuitionMin) : null, tuitionMax: program.tuitionMax ? Number(program.tuitionMax) : null }
      await saveCatalogItem(token, kind, kind === 'universities' ? universityId : programId, payload)
      await refresh(); setMessage('Catalog saved. The public directory now uses the updated information.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not save catalog item.') }
    finally { setBusy(false) }
  }
  return <div>
    <p className="text-sm text-muted mb-4">Use official sources. Leave unverified values blank or select “needs verification”. Image and council editors remain in Student Councils.</p>
    {message && <p role="status" className="mb-4 border border-teal rounded-lg p-3 text-sm text-ink">{message}</p>}
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <form onSubmit={event => void save(event, 'universities')} className="bg-surface rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="text-xl font-bold text-navy">University management</h2>
        <label className="block text-sm text-ink">Edit university<select className={fieldClass} value={universityId || ''} onChange={event => selectUniversity(event.target.value)}><option value="">Create a university</option>{universities.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <fieldset disabled={busy} className="space-y-3">
          {([['name', 'English name'], ['slug', 'Page slug'], ['koreanName', 'Korean name'], ['city', 'City'], ['province', 'Province'], ['officialWebsite', 'Official website'], ['lastVerifiedAt', 'Last verified date']] as const).map(([key, label]) => <label key={key} className="block text-sm text-ink">{label}<input required={['name', 'city', 'officialWebsite'].includes(key)} type={key === 'lastVerifiedAt' ? 'date' : key === 'officialWebsite' ? 'url' : 'text'} value={university[key]} onChange={event => setUniversity({ ...university, [key]: event.target.value })} className={fieldClass} /></label>)}
          <label className="block text-sm text-ink">Type<select value={university.universityType} onChange={event => setUniversity({ ...university, universityType: event.target.value })} className={fieldClass}><option value="public">Public</option><option value="private">Private</option></select></label>
          <label className="block text-sm text-ink">Verification<select value={university.verificationStatus} onChange={event => setUniversity({ ...university, verificationStatus: event.target.value })} className={fieldClass}>{['needs verification', 'manually added', 'verified', 'outdated'].map(value => <option key={value}>{value}</option>)}</select></label>
          <label className="block text-sm text-ink">Description<textarea required value={university.description} onChange={event => setUniversity({ ...university, description: event.target.value })} className={fieldClass} rows={4} /></label>
          <label className="block text-sm text-ink">Sources (one URL per line)<textarea value={university.sourceUrls} onChange={event => setUniversity({ ...university, sourceUrls: event.target.value })} className={fieldClass} rows={3} /></label>
          <button className="bg-navy text-white rounded-lg px-4 py-2">{busy ? 'Saving…' : 'Save university'}</button>
        </fieldset>
      </form>
      <form onSubmit={event => void save(event, 'programs')} className="bg-surface rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="text-xl font-bold text-navy">Program management</h2>
        <label className="block text-sm text-ink">Edit program<select className={fieldClass} value={programId || ''} onChange={event => selectProgram(event.target.value)}><option value="">Create a program</option>{programs.map(item => <option key={item.id} value={item.id}>{item.name} · {item.university?.name}</option>)}</select></label>
        <fieldset disabled={busy} className="space-y-3">
          <label className="block text-sm text-ink">University<select required value={program.universityId} onChange={event => setProgram({ ...program, universityId: event.target.value })} className={fieldClass}><option value="">Select a university</option>{universities.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          {([['name', 'Program name'], ['slug', 'Page slug'], ['degreeLevel', 'Degree level'], ['languageOfInstruction', 'Teaching language'], ['duration', 'Duration'], ['officialLink', 'Official program page'], ['applicationPeriod', 'Application period'], ['tuitionMin', 'Minimum tuition'], ['tuitionMax', 'Maximum tuition'], ['tuitionCurrency', 'Currency']] as const).map(([key, label]) => <label key={key} className="block text-sm text-ink">{label}<input type={key === 'officialLink' ? 'url' : key.startsWith('tuition') && key !== 'tuitionCurrency' ? 'number' : 'text'} min="0" required={['name', 'slug', 'degreeLevel', 'languageOfInstruction'].includes(key)} value={program[key]} onChange={event => setProgram({ ...program, [key]: event.target.value })} className={fieldClass} /></label>)}
          {([['requirements', 'Requirements'], ['requiredDocuments', 'Required documents'], ['careerOutcomes', 'Career outcomes']] as const).map(([key, label]) => <label key={key} className="block text-sm text-ink">{label} (one per line)<textarea value={program[key]} onChange={event => setProgram({ ...program, [key]: event.target.value })} className={fieldClass} rows={3} /></label>)}
          <button className="bg-navy text-white rounded-lg px-4 py-2">{busy ? 'Saving…' : 'Save program'}</button>
        </fieldset>
      </form>
    </div>
  </div>
}
