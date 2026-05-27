import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { careers } from '@/data/careers'

const types = ['All', 'Full time', 'Internship', 'Extracurricular']

export default function Careers() {
  const [active, setActive] = useState('All')
  const filtered = active === 'All' ? careers : careers.filter((c) => c.type === active)

  return (
    <div className="max-w-4xl mx-auto px-5 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-navy mb-2">Careers</h1>
      <p className="text-muted mb-8">Opportunities for international students in Korea</p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setActive(type)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              active === type ? 'bg-navy text-white' : 'bg-surface text-muted hover:bg-cream-dark'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      <motion.div layout className="bg-surface rounded-2xl shadow-sm divide-y divide-gray-100">
        {filtered.map((job) => (
          <motion.div key={job.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <Link to={`/careers/${job.id}`} className="flex items-center gap-4 p-4 hover:bg-cream transition-colors">
              <img src={job.logo} alt={job.company} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-navy truncate">{job.title}</p>
                  <span className="text-xs bg-teal/10 text-teal px-2 py-0.5 rounded-full flex-shrink-0 font-medium">D-{job.daysLeft}</span>
                </div>
                <p className="text-xs text-muted truncate">{job.company} · {job.type} · {job.location}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}