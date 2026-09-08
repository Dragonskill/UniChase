import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import { slides } from "@/data/carousel"

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [focused, setFocused] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (paused || focused || reduceMotion || document.hidden || slides.length < 2) return
    const timer = window.setInterval(() => setCurrent((value) => (value + 1) % slides.length), 8000)
    return () => window.clearInterval(timer)
  }, [focused, paused, reduceMotion])

  const select = (index: number) => setCurrent((index + slides.length) % slides.length)
  const slide = slides[current]
  if (!slide) return null

  return <section aria-roledescription="carousel" aria-label="Featured UniChase stories" onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false) }} className="relative h-[360px] w-full overflow-hidden rounded-2xl shadow-lg sm:h-[480px] md:h-[560px]">
    <AnimatePresence mode="sync" initial={false}><motion.div key={slide.id} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.48, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0">
      <img src={slide.image} alt="" loading={current === 0 ? "eager" : "lazy"} fetchPriority={current === 0 ? "high" : "auto"} decoding="async" draggable={false} width="1400" height="788" className="h-full w-full object-cover" />
      <div className="hero-carousel-overlay absolute inset-0" />
      <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.35, delay: reduceMotion ? 0 : 0.12 }} className="absolute bottom-16 left-5 max-w-2xl pr-5 text-white sm:bottom-20 sm:left-12 sm:pr-8">
        <span className="mb-3 inline-block rounded-full bg-teal px-3 py-1 text-xs font-semibold uppercase tracking-widest">{slide.category}</span>
        <h2 className="mb-5 mt-3 text-2xl font-bold leading-tight text-white drop-shadow-lg sm:text-3xl md:text-4xl">{slide.title}</h2>
        <Link to={slide.link} className="hero-carousel-cta inline-block rounded-xl bg-white px-5 py-2.5 font-semibold text-navy shadow-lg hover:bg-cream">Read More</Link>
      </motion.div>
    </motion.div></AnimatePresence>
    <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Resume automatic slides" : "Pause automatic slides"} className="hero-carousel-arrow absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full">{paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}</button>
    <div className="absolute bottom-5 left-5 flex items-center gap-2 sm:bottom-6 sm:left-12">{slides.map((item, index) => <button key={item.id} type="button" aria-label={`Show slide ${index + 1}: ${item.title}`} aria-current={index === current ? "true" : undefined} onClick={() => select(index)} className={`hero-carousel-dot h-2 rounded-full ${index === current ? "hero-carousel-dot--active w-8 sm:w-10" : "w-3"}`} />)}</div>
    <div className="absolute bottom-4 right-4 flex gap-2 sm:right-6"><button type="button" onClick={() => select(current - 1)} aria-label="Previous slide" className="hero-carousel-arrow flex h-10 w-10 items-center justify-center rounded-full"><ChevronLeft className="h-5 w-5" aria-hidden="true" /></button><button type="button" onClick={() => select(current + 1)} aria-label="Next slide" className="hero-carousel-arrow flex h-10 w-10 items-center justify-center rounded-full"><ChevronRight className="h-5 w-5" aria-hidden="true" /></button></div>
  </section>
}
