import { useState, useEffect } from 'react'
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
  const [direction, setDirection] = useState(1)

  useEffect(() => {
    const timer = setInterval(() => {
    setDirection(1)
    setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1))
    }, 8000)  // change this number — 8000 = 8 seconds
    return () => clearInterval(timer)
  }, [])

  const prev = () => {
    setDirection(-1)
    setCurrent((c) => (c === 0 ? slides.length - 1 : c - 1))
  }

  const next = () => {
    setDirection(1)
    setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1))
  }

  return (
    <div className="relative w-full h-[560px] overflow-hidden rounded-2xl shadow-xl">
        <AnimatePresence mode="sync">
        <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute inset-0"
        >
          {/* Image */}
          <img
            src={slides[current].image}
            alt={slides[current].title}
            className="w-full h-full object-cover will-change-transform"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="absolute bottom-20 left-12 text-white max-w-2xl"
          >
            <span className="text-xs font-semibold tracking-widest uppercase bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-4 inline-block">
              {slides[current].category}
            </span>
            <h2 className="text-4xl font-bold leading-tight mt-3 mb-5 drop-shadow-lg">
              {slides[current].title}
            </h2>
            <button className="bg-white text-black px-7 py-2.5 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg">
              Read More
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>

    {/* Arrows */}
    <div className="absolute bottom-4 right-6 flex gap-2">
    <button
        onClick={prev}
        className="bg-white/10 hover:bg-white/30 backdrop-blur-sm text-white rounded-full w-11 h-11 flex items-center justify-center transition-all border border-white/20"
    >
        ‹
    </button>
    <button
        onClick={next}
        className="bg-white/10 hover:bg-white/30 backdrop-blur-sm text-white rounded-full w-11 h-11 flex items-center justify-center transition-all border border-white/20"
    >
        ›
    </button>
    </div>

    {/* Dots */}
    <div className="absolute bottom-6 left-12 flex gap-2 items-center">
    {slides.map((_, i) => (
        <button
        key={i}
        onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i) }}
        className={`h-1.5 rounded-full transition-all duration-300 ${
            i === current ? 'w-10 bg-white' : 'w-3 bg-white/40 hover:bg-white/70'
        }`}
        />
    ))}
    </div>
    </div>
  )
}