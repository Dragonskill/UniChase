import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useRef, type PointerEvent } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'

const pageEase = [0.22, 1, 0.36, 1] as const

export default function App() {
  const location = useLocation()
  const outlet = useOutlet()
  const reduceMotion = useReducedMotion()
  const touchPress = useRef<Animation | null>(null)

  function handleTouchPress(event: PointerEvent) {
    if (reduceMotion || event.pointerType !== 'touch' || !event.isPrimary || !(event.target instanceof Element)) return

    const control = event.target.closest('button, a[href]')
    if (!control?.matches('button:not(:disabled), .animated-button-link, .clickable-card, .university-card-link')) return

    const pressedScale = control.matches('button, .animated-button-link') ? '0.97' : '0.988'
    touchPress.current?.cancel()
    const animation = control.animate(
      [{ scale: '1' }, { scale: pressedScale, offset: 0.25 }, { scale: '1' }],
      { duration: 200, easing: 'ease-out' },
    )
    touchPress.current = animation
    animation.onfinish = () => {
      if (touchPress.current === animation) touchPress.current = null
    }
  }

  function cancelTouchPress(event: PointerEvent) {
    if (event.pointerType !== 'touch' || !event.isPrimary) return
    touchPress.current?.cancel()
    touchPress.current = null
  }

  return (
    <div onPointerDownCapture={handleTouchPress} onPointerCancelCapture={cancelTouchPress}>
      <Navbar />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          initial={reduceMotion ? false : { opacity: 0.45, y: 7 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : {
            opacity: 0.45,
            y: -3,
            transition: { duration: 0.075, ease: 'easeIn' },
          }}
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: pageEase }}
        >
          {outlet}
        </motion.main>
      </AnimatePresence>
      <Footer />
    </div>
  )
}
