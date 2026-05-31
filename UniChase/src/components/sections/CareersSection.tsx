import { Link } from 'react-router-dom'
import GlowLetters from '@/components/ui/GlowLetters'
import { careers } from '@/data/careers'

export default function CareersSection() {
  return (
    <section className="mt-12 sm:mt-16">
      <div className="flex items-center justify-between mb-4">
        <GlowLetters as="h2" text="CAREERS" variant="section" className="text-lg sm:text-xl font-bold tracking-wide text-navy" />
        <Link to="/careers" className="text-sm text-muted hover:text-teal transition-colors">See all →</Link>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm divide-y divide-gray-100">
        {careers.slice(0, 5).map((job) => (
          <Link key={job.id} to={`/careers/${job.id}`} className="flex items-center gap-4 p-4 hover:bg-cream transition-colors first:rounded-t-2xl last:rounded-b-2xl">
            <img src={job.logo} alt={job.company} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-navy truncate">{job.title}</p>
                <span className="text-xs bg-teal/10 text-teal px-2 py-0.5 rounded-full flex-shrink-0 font-medium">D-{job.daysLeft}</span>
              </div>
              <p className="text-xs text-muted truncate">{job.company} · {job.type}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
