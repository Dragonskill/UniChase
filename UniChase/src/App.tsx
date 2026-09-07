import { useLayoutEffect } from 'react'

import { applySeo } from './lib/seo'

import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion'

import { useLocation, useOutlet, useNavigation } from 'react-router-dom'

import Navbar from './components/layout/Navbar'

import Footer from './components/layout/Footer'



export default function App() {

  const navigation = useNavigation()

  const location = useLocation()

  const outlet = useOutlet()

  useLayoutEffect(() => {

    const label = location.pathname === '/' ? 'Discover South Korean universities' : location.pathname.split('/').filter(Boolean).map(part => part.replaceAll('-', ' ')).join(' · ')

    applySeo({ title: `${label.charAt(0).toUpperCase() + label.slice(1)} | UniChase`, description: 'Discover universities and plan your international student application with UniChase.', canonicalPath: location.pathname })

  }, [location.pathname])

  const reduceMotion = useReducedMotion()

  const pageTransition = reduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }



  return (

    <MotionConfig reducedMotion="user"><div>

      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 bg-surface p-3 text-teal">Skip to content</a>

      {navigation.state !== 'idle' && <p role="status" className="fixed top-0 inset-x-0 z-50 bg-teal text-white text-center text-sm">Loading page…</p>}

      <Navbar />

      <AnimatePresence mode="wait" initial={false}>

        <motion.main

          id="main-content"

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
    </div></MotionConfig>
  )
}
