import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const slides = [
  {
    id: 1,
    category: 'CAREERS',
    title: 'Kotra unveils company list, opens applications for annual international student job fair',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=80',
  },
  {
    id: 2,
    category: 'UNIVERSITY',
    title: 'Top universities in Korea open applications for international students 2025',
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1400&q=80',
  },
  {
    id: 3,
    category: 'FOOD & TRAVEL',
    title: '12 Hours in Taebaek: A Fruitful Day Trip',
    image: 'https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?w=1400&q=80',
  },
]

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0)

  const prev = () => setCurrent((c) => (c === 0 ? slides.length - 1 : c - 1))
  const next = () => setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1))

  return (
    <div className="relative w-full h-[500px] overflow-hidden rounded-xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0"
        >
          <img
            src={slides[current].image}
            alt={slides[current].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-16 left-10 text-white max-w-xl">
            <p className="text-sm mb-2 uppercase tracking-widest opacity-80">
              {slides[current].category}
            </p>
            <h2 className="text-3xl font-bold leading-snug mb-4">
              {slides[current].title}
            </h2>
            <button className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-100">
              Read More
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Arrows */}
      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2">
        ‹
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full p-2">
        ›
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${i === current ? 'w-8 bg-white' : 'w-4 bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  )
}