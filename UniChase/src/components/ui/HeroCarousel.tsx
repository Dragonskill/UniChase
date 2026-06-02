import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { slides } from '@/data/carousel'
import GlowLetters from '@/components/ui/GlowLetters'

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const [, setDirection] = useState(1)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDirection(1)
      setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1))
    }, 8000)
    return () => window.clearInterval(timer)
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
    <div className="relative w-full h-[360px] sm:h-[480px] md:h-[560px] overflow-hidden rounded-2xl shadow-lg">
      <AnimatePresence mode="sync">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <img
            src={slides[current].image}
            alt={slides[current].title}
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover"
          />
          <div className="hero-carousel-overlay absolute inset-0" />

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-16 sm:bottom-20 left-6 sm:left-12 text-white max-w-2xl pr-6"
          >
            <span className="text-xs font-semibold tracking-widest uppercase bg-teal px-3 py-1 rounded-full mb-3 inline-block">
              {slides[current].category}
            </span>
            <GlowLetters
              as="h2"
              text={slides[current].title}
              variant="hero"
              className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mt-3 mb-5"
            />
            <Link to={slides[current].link} className="hero-carousel-cta bg-white text-navy px-6 py-2.5 rounded-xl font-semibold hover:bg-cream transition-colors shadow-lg inline-block">
              Read More
            </Link>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-5 sm:bottom-6 left-6 sm:left-12 flex gap-2 items-center">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => {
              setDirection(i > current ? 1 : -1)
              setCurrent(i)
            }}
            className={`hero-carousel-dot h-1.5 rounded-full transition-all duration-300 ${i === current ? 'hero-carousel-dot--active w-8 sm:w-10' : 'w-3'}`}
          />
        ))}
      </div>

      <div className="absolute bottom-4 right-4 sm:right-6 flex gap-2">
        <button type="button" onClick={prev} aria-label="Previous slide" className="hero-carousel-arrow rounded-full w-10 h-10 flex items-center justify-center">
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button type="button" onClick={next} aria-label="Next slide" className="hero-carousel-arrow rounded-full w-10 h-10 flex items-center justify-center">
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
