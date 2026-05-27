import { useParams, Link } from 'react-router-dom'
import { careers } from '@/data/careers'
import { motion } from 'framer-motion'

export default function CareerDetail() {
  const { id } = useParams()
  const job = careers.find((c) => c.id === Number(id))

  if (!job) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-navy mb-4">Job not found</h1>
        <Link to="/careers" className="text-teal hover:underline">← Back to Careers</Link>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-3xl mx-auto px-5 sm:px-6 py-10">
      <Link to="/careers" className="text-sm text-teal hover:underline mb-8 inline-block">← Back to Careers</Link>

      <div className="flex items-center gap-4 mb-6">
        <img src={job.logo} alt={job.company} className="w-16 h-16 rounded-xl object-cover" />
        <div>
          <h1 className="text-2xl font-bold text-navy">{job.title}</h1>
          <p className="text-sm text-muted">{job.company}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-8 flex-wrap">
        <span className="text-xs bg-cream-dark text-ink px-3 py-1 rounded-full">{job.type}</span>
        <span className="text-xs bg-cream-dark text-ink px-3 py-1 rounded-full">📍 {job.location}</span>
        <span className="text-xs bg-teal/10 text-teal px-3 py-1 rounded-full font-medium">D-{job.daysLeft}</span>
      </div>

      <div className="text-ink leading-relaxed mb-8">
        {job.description.split('\n\n').map((para, i) => <p key={i} className="mb-4">{para}</p>)}
      </div>

      <button className="bg-navy hover:bg-navy-light text-white px-8 py-3 rounded-xl font-semibold transition-colors">Apply Now</button>
    </motion.div>
  )
}