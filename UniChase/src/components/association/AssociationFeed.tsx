import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { associationImage, safeExternalUrl, type ContentType, type FeedItem } from '@/lib/associationApi'
import AssociationDialog from './AssociationDialog'

const tabs = [
  { id: 'all', title: 'All' },
  { id: 'EVENT', title: 'Events' },
  { id: 'POST', title: 'Posts' },
  { id: 'INTERVIEW', title: 'Interviews' },
] as const

function ContentDate({ date }: { date: string }) {
  return <time dateTime={date.slice(0, 10)}>{new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium', timeZone: 'UTC' })}</time>
}

export default function AssociationFeed({ items, name }: { items: FeedItem[]; name: string }) {
  const [filter, setFilter] = useState<ContentType | 'all'>('all')
  const [reading, setReading] = useState<FeedItem | null>(null)
  const reduceMotion = useReducedMotion()
  const visible = filter === 'all' ? items : items.filter((item) => item.type === filter)
  const empty = { all: 'No events, posts, or interviews published yet.', EVENT: 'No events published yet.', POST: 'No posts published yet.', INTERVIEW: 'No interviews published yet.' }

  return (
    <section className="min-w-0 rounded-2xl bg-surface p-5 shadow-sm">
      <h3 className="text-lg font-bold text-navy">Events, Posts &amp; Interviews</h3>
      <p className="text-sm text-muted">What’s happening at {name}</p>
      <div role="group" aria-label="Filter association content" className="my-4 flex flex-wrap gap-2">
        {tabs.map(({ id, title }) => (
          <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)}
            className={`rounded-full border border-gray-200 px-3 py-1.5 text-sm transition-colors ${filter === id ? 'bg-navy text-white' : 'bg-cream text-navy'}`}>
            {title}
          </button>
        ))}
      </div>
      <motion.div key={filter} initial={reduceMotion ? false : { opacity: 0.7 }} animate={{ opacity: 1 }} transition={{ duration: 0.16 }}>
        {!visible.length ? <p role="status" className="text-sm text-muted">{empty[filter]}</p> : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => {
              const image = associationImage(item.imageId, item.imageUrl)
              const link = safeExternalUrl(item.externalUrl)
              return (
                <article key={item.id} className="min-w-0 overflow-hidden rounded-xl border border-gray-200">
                  {image && <img src={image} alt="" loading="lazy" className="aspect-video w-full bg-cream object-cover" />}
                  <div className="space-y-2 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className="rounded-full bg-cream px-2 py-1 font-semibold text-teal">{item.type}</span>
                      <ContentDate date={item.date} />
                    </div>
                    <h4 className="break-words font-semibold text-navy">{item.title}</h4>
                    <p className="break-words text-sm text-ink">{item.description}</p>
                    {item.body ? <button type="button" className="text-sm font-medium text-teal hover:underline" onClick={() => setReading(item)}>Read details</button>
                      : link && <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-teal hover:underline">View details</a>}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </motion.div>
      {reading && (
        <AssociationDialog title={reading.title} close={() => setReading(null)}>
          <div className="space-y-3 text-sm">
            <p className="text-muted"><ContentDate date={reading.date} /></p>
            <p className="whitespace-pre-wrap break-words">{reading.body}</p>
            {safeExternalUrl(reading.externalUrl) && <a href={safeExternalUrl(reading.externalUrl)} target="_blank" rel="noopener noreferrer" className="block text-teal hover:underline">Visit source</a>}
            <button type="button" className="rounded-lg bg-navy px-4 py-2 text-white" onClick={() => setReading(null)}>Close</button>
          </div>
        </AssociationDialog>
      )}
    </section>
  )
}
