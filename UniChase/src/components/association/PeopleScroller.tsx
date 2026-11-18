import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function PeopleScroller({ title, subtitle, empty, children }: {
  title: string
  subtitle: string
  empty?: string
  children?: ReactNode
}) {
  const track = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: true })

  useEffect(() => {
    const list = track.current
    if (!list) return
    function update() {
      if (!list) return
      setEdges({ start: list.scrollLeft <= 1, end: list.scrollLeft + list.clientWidth >= list.scrollWidth - 2 })
    }
    const observer = new ResizeObserver(update)
    observer.observe(list)
    list.addEventListener('scroll', update, { passive: true })
    update()
    return () => {
      observer.disconnect()
      list.removeEventListener('scroll', update)
    }
  }, [children])

  function scroll(direction: number) {
    const list = track.current
    if (!list) return
    const distance = Math.max(list.clientWidth * 0.8, list.firstElementChild?.getBoundingClientRect().width ?? 0)
    list.scrollBy({ left: direction * distance, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }

  return (
    <section aria-label={title} className="min-w-0 rounded-2xl bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-navy">{title}</h3>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
        {!empty && (
          <div className="hidden shrink-0 gap-2 sm:flex">
            <button type="button" aria-label={`Scroll ${title} left`} onClick={() => scroll(-1)} disabled={edges.start}
              className="rounded-full border border-gray-200 p-2 text-navy disabled:opacity-40"><ChevronLeft size={18} /></button>
            <button type="button" aria-label={`Scroll ${title} right`} onClick={() => scroll(1)} disabled={edges.end}
              className="rounded-full border border-gray-200 p-2 text-navy disabled:opacity-40"><ChevronRight size={18} /></button>
          </div>
        )}
      </div>
      {empty ? <p className="text-sm text-muted">{empty}</p> : (
        <ul ref={track} aria-label={title} tabIndex={0}
          className="flex min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-3 focus-visible:outline-2 focus-visible:outline-teal">
          {children}
        </ul>
      )}
    </section>
  )
}
