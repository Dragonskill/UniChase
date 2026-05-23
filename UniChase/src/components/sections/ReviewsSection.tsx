import { Link } from 'react-router-dom'
import ArticleCard from '@/components/ui/ArticleCard'

const featured = {
  category: 'CAREERS',
  title: 'How to conquer the Job Fair for International Students',
  excerpt: 'The season for the Job Fair for International Students is officially here! As one of Korea\'s biggest annual job fairs dedicated to international students, this is your golden ticket.',
  image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
  author: 'Editor_Cho',
  date: '20 May 2026',
}

const articles = [
  { id: 1, category: 'UNIVERSITY', readTime: '4 minute read', title: 'A Different Kind of Festival Experience in Korea', image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=400&q=80', linkTo: '/reviews/1' },
  { id: 2, category: 'STUDY', readTime: '2 minute read', title: 'The best ways to study Korean before arriving', image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&q=80', linkTo: '/reviews/2' },
  { id: 3, category: 'STUDY', readTime: '4 minute read', title: 'The Reality of Team Projects in Korean Universities', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80', linkTo: '/reviews/3' },
  { id: 4, category: 'FOOD & TRAVEL', readTime: '2 minute read', title: 'My Favorite Restaurant Near Campus', image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&q=80', linkTo: '/reviews/4' },
]

export default function ReviewsSection() {
  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold tracking-wide text-gray-900">REAL LIFE REVIEWS</h2>
        <Link to="/reviews" className="text-sm text-gray-500 hover:text-blue-500">See all →</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link to="/reviews/1" className="block hover:opacity-90 transition-opacity">
          <img src={featured.image} alt={featured.title} className="w-full h-64 object-cover rounded-xl mb-3" />
          <p className="text-xs text-gray-500 mb-1">{featured.category}</p>
          <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2">{featured.title}</h3>
          <p className="text-sm text-gray-500 line-clamp-3 mb-3">{featured.excerpt}</p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="font-medium text-gray-600">{featured.author}</span>
            <span>{featured.date}</span>
          </div>
        </Link>
        <div className="flex flex-col gap-5">
          {articles.map((a) => (
            <ArticleCard key={a.id} {...a} />
          ))}
        </div>
      </div>
    </section>
  )
}