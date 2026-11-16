import { useEffect } from 'react'
import HeroCarousel from '@/components/ui/HeroCarousel'
import ReviewsSection from '@/components/sections/ReviewsSection'
import NewsSection from '@/components/sections/NewsSection'
import CommunitySection from '@/components/sections/CommunitySection'
import NewsletterBanner from '@/components/sections/NewsletterBanner'
import StudentToolkitSection from '@/components/sections/StudentToolkitSection'
import ScrollReveal from '@/components/ui/ScrollReveal'
import { applySeo } from '@/lib/seo'

export default function Home() {
  useEffect(() => {
    applySeo({
      title: 'UniChase | Korean University Discovery',
      description: 'Discover Korean universities, compare programs, track deadlines, and find your best university match.',
      canonicalPath: '/',
    })
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-6">
      <h1 className="sr-only">UniChase: discover universities and student life in South Korea</h1>
      <ScrollReveal><HeroCarousel /></ScrollReveal>
      <ScrollReveal delay={0.04}><ReviewsSection /></ScrollReveal>
      <ScrollReveal delay={0.04}><StudentToolkitSection /></ScrollReveal>
      <ScrollReveal delay={0.04}><NewsSection /></ScrollReveal>
      <ScrollReveal delay={0.04}><CommunitySection /></ScrollReveal>
      <ScrollReveal delay={0.04}><NewsletterBanner /></ScrollReveal>
    </div>
  )
}
