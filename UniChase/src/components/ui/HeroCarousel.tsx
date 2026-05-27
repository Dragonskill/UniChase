import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { slides } from '@/data/carousel'

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const [, setDirection] = useState(1)

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1)
      setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1))
    }, 8000)
    return () => clearInterval(timer)
  }, [])

  const prev = () => { setDirection(-1); setCurrent((c) => (c === 0 ? slides.length - 1 : c - 1)) }
  const next = () => { setDirection(1); setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1)) }

  return (
    <div className="relative w-full h-[360px] sm:h-[480px] md:h-[560px] overflow-hidden rounded-2xl shadow-lg">
      <AnimatePresence mode="sync">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img src={slides[current].image} alt={slides[current].title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="absolute bottom-16 sm:bottom-20 left-6 sm:left-12 text-white max-w-2xl pr-6"
          >
            <span className="text-xs font-semibold tracking-widest uppercase bg-teal px-3 py-1 rounded-full mb-3 inline-block">
              {slides[current].category}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mt-3 mb-5">
              {slides[current].title}
            </h2>
            <Link to={slides[current].link} className="bg-white text-navy px-6 py-2.5 rounded-xl font-semibold hover:bg-cream transition-colors shadow-lg inline-block">
              Read More
            </Link>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Dots - bottom left */}
      <div className="absolute bottom-5 sm:bottom-6 left-6 sm:left-12 flex gap-2 items-center">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i) }}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-8 sm:w-10 bg-white' : 'w-3 bg-white/40'}`}
          />
        ))}
      </div>

      {/* Arrows - bottom right */}
      <div className="absolute bottom-4 right-4 sm:right-6 flex gap-2">
        <button onClick={prev} className="bg-white/15 hover:bg-white/30 backdrop-blur-sm text-white rounded-full w-10 h-10 flex items-center justify-center border border-white/20">‹</button>
        <button onClick={next} className="bg-white/15 hover:bg-white/30 backdrop-blur-sm text-white rounded-full w-10 h-10 flex items-center justify-center border border-white/20">›</button>
      </div>
    </div>
  )
}