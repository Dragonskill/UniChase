import HeroCarousel from '@/components/ui/HeroCarousel'
import ReviewsSection from '@/components/sections/ReviewsSection'
import NewsSection from '@/components/sections/NewsSection'
import CareersSection from '@/components/sections/CareersSection'
import CommunitySection from '@/components/sections/CommunitySection'
import NewsletterBanner from '@/components/sections/NewsletterBanner'

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-6 py-6">
      <HeroCarousel />
      <ReviewsSection />
      <NewsSection />
      <CareersSection />
      <CommunitySection />
      <NewsletterBanner />
    </div>
  )
}