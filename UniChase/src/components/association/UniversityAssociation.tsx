import { useEffect, useState } from 'react'
import { Camera, Send, Users } from 'lucide-react'
import {
  associationImage, fetchAssociation, safeExternalUrl, type Advisor, type Association, type SocialLinks,
} from '@/lib/associationApi'
import AssociationFeed from './AssociationFeed'
import AskAdvisor from './AskAdvisor'
import PeopleScroller from './PeopleScroller'

function LinkedInIcon() {
  return <span aria-hidden="true" className="inline-flex size-3.5 items-center justify-center rounded-[2px] border border-current text-[9px] font-bold leading-none">in</span>
}

function AssociationSocialLinks({ telegramUrl, instagramUrl, linkedinUrl }: SocialLinks) {
  const links = [
    { name: 'Telegram', url: telegramUrl, icon: Send },
    { name: 'Instagram', url: instagramUrl, icon: Camera },
    { name: 'LinkedIn', url: linkedinUrl, icon: LinkedInIcon },
  ].flatMap(({ name, url, icon }) => {
    const href = safeExternalUrl(url)
    return href ? [{ name, href, Icon: icon }] : []
  })

  if (!links.length) return null
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.map(({ name, href, Icon }) => (
        <a key={name} href={href} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-cream px-2.5 py-1.5 text-xs font-medium text-teal hover:underline">
          <Icon size={14} aria-hidden="true" />{name}
        </a>
      ))}
    </div>
  )
}

function ProfilePhoto({ name, src }: { name: string; src?: string }) {
  const [failed, setFailed] = useState(false)
  const initials = /^[A-Z]{2,5}$/.test(name) ? name : name.trim().split(/\s+/).slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('')
  return (
    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cream font-bold text-navy" aria-hidden="true">
      {src && !failed ? <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} /> : initials || <Users size={20} />}
    </div>
  )
}

function AssociationHeader({ association }: { association: Association }) {
  const stats = [
    ['Members', association.memberCount],
    ['Team members', association.roles.length],
    ['Major advisors', association.advisors.length],
    ['Founded', association.foundedYear],
  ] as const
  const image = associationImage(association.imageId, association.logoUrl)

  return (
    <section className="min-w-0 rounded-2xl bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start gap-4">
        <ProfilePhoto key={image} name={association.name} src={image} />
        <div className="min-w-0 flex-1 basis-40">
          <h2 className="break-words text-xl font-bold text-navy">{association.name}</h2>
          {association.officialName && <p className="break-words text-sm font-medium text-ink">{association.officialName}</p>}
          <p className="text-sm text-muted">{association.university.name}</p>
        </div>
        <span className="rounded-full border border-gray-200 bg-cream px-3 py-1 text-xs text-ink">
          {association.verificationStatus === 'verified' ? 'Verified' : 'Needs Verification'}
        </span>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-navy">About</h3>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">{association.description || 'Association information is being verified.'}</p>
      <AssociationSocialLinks {...association} />
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
        {stats.map(([label, value]) => value === null ? null : (
          <div key={label} className="rounded-lg border border-gray-200 bg-cream px-3 py-2">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="text-lg font-semibold text-navy">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

const personCard = 'flex w-60 max-w-[85%] shrink-0 snap-start flex-col rounded-xl border border-gray-200 bg-surface p-4'

function AssociationProfile({ association }: { association: Association }) {
  const [advisor, setAdvisor] = useState<Advisor | null>(null)

  return (
    <>
      <AssociationHeader association={association} />
      <PeopleScroller title="Management Team" subtitle={`The people running ${association.name} this year`}
        empty={!association.roles.length ? 'Management team information has not been added yet.' : undefined}>
        {association.roles.map((member) => {
          const name = member.displayName || ''
          const image = associationImage(member.imageId, member.avatarUrl)
          return (
            <li key={member.id} className={personCard}>
              <ProfilePhoto key={image} name={name} src={image} />
              <h4 className="mt-3 break-words font-semibold text-navy">{name}</h4>
              <p className="break-words text-sm font-medium text-teal">{member.roleTitle}{member.roleShort && ` · ${member.roleShort}`}</p>
              {member.major && <p className="break-words text-sm text-muted">{member.major}</p>}
              {member.academicYear && <p className="break-words text-sm text-muted">{member.academicYear}</p>}
              <AssociationSocialLinks {...member} />
            </li>
          )
        })}
      </PeopleScroller>
      <PeopleScroller title="Major Advisors" subtitle="Ask a senior student about your major"
        empty={!association.advisors.length ? 'No major advisors have been added yet.' : undefined}>
        {association.advisors.map((person) => {
          const image = associationImage(person.imageId, person.photoUrl)
          const contact = safeExternalUrl(person.contactUrl)
          return (
            <li key={person.id} className={personCard}>
              <ProfilePhoto key={image} name={person.name} src={image} />
              <h4 className="mt-3 break-words font-semibold text-navy">{person.name}</h4>
              <p className="break-words text-sm text-ink">{person.major}</p>
              {person.academicYear && <p className="break-words text-sm text-muted">{person.academicYear}</p>}
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                <button type="button" onClick={() => setAdvisor(person)} className="rounded-lg bg-navy px-3 py-2 text-sm text-white hover:bg-navy-light">Ask a question</button>
                {contact && <a href={contact} target="_blank" rel="noopener noreferrer" className="text-sm text-teal hover:underline">Contact</a>}
              </div>
            </li>
          )
        })}
      </PeopleScroller>
      <AssociationFeed items={association.content} name={association.name} />
      {advisor && <AskAdvisor councilId={association.id} advisor={advisor} close={() => setAdvisor(null)} />}
    </>
  )
}

export default function UniversityAssociation({ identifier }: { identifier: string }) {
  const [association, setAssociation] = useState<Association | null>(null)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetchAssociation(identifier, controller.signal).then(setAssociation).catch(() => {
      if (!controller.signal.aborted) setError(true)
    })
    return () => controller.abort()
  }, [identifier, retry])

  if (error) return (
    <div className="mt-6 rounded-2xl bg-surface p-5 text-sm text-muted shadow-sm">
      Association information could not be loaded.{' '}
      <button type="button" className="font-medium text-teal hover:underline" onClick={() => {
        setError(false)
        setRetry((value) => value + 1)
      }}>Try again</button>
    </div>
  )
  if (!association) return null
  return <div className="mt-6 space-y-5"><AssociationProfile association={association} /></div>
}
