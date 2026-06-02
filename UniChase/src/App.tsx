import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useLocation, useOutlet } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'

export default function App() {
  const location = useLocation()
  const outlet = useOutlet()
  const reduceMotion = useReducedMotion()
  const pageTransition = reduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }

  return (
    <div>
      <Navbar />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -4 }}
          transition={pageTransition}
        >
          {outlet}
        </motion.main>
      </AnimatePresence>
      <Footer />
    </div>
  )
}
