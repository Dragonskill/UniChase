export interface Review {
  id: number
  category: string
  readTime: string
  title: string
  excerpt: string
  content: string
  image: string
  author: string
  date: string
}

export const reviews: Review[] = [
  {
    id: 1,
    category: 'University',
    readTime: '4 minute read',
    title: 'A Different Kind of Festival Experience in Korea',
    excerpt: 'Experiencing my first university festival as an international student was unforgettable.',
    content: 'Full review text goes here.\n\nMore paragraphs about the festival experience.',
    image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
    author: 'Maria_S',
    date: '20 May 2026',
  },
  {
    id: 2,
    category: 'Study',
    readTime: '2 minute read',
    title: 'The best ways to study Korean before arriving',
    excerpt: 'Tips and resources that helped me get a head start on Korean.',
    content: 'Full review text goes here.\n\nMy favorite study methods.',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80',
    author: 'James_K',
    date: '18 May 2026',
  },
  {
    id: 3,
    category: 'Study',
    readTime: '4 minute read',
    title: 'The Reality of Team Projects in Korean Universities',
    excerpt: 'What nobody tells you about group work in Korean academic culture.',
    content: 'Full review text goes here.\n\nThe ups and downs of team projects.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
    author: 'Anna_L',
    date: '15 May 2026',
  },
  {
    id: 4,
    category: 'Food & Travel',
    readTime: '2 minute read',
    title: 'My Favorite Restaurant Near Campus',
    excerpt: 'A hidden gem that became my second home during exam season.',
    content: 'Full review text goes here.\n\nWhy I love this place.',
    image: 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=800&q=80',
    author: 'David_M',
    date: '12 May 2026',
  },
  {
    id: 5,
    category: 'Food & Travel',
    readTime: '5 minute read',
    title: '12 Hours in Taebaek: A Fruitful Day Trip',
    excerpt: 'How I spent a perfect day exploring this underrated city.',
    content: 'Full review text goes here.\n\nMy Taebaek itinerary.',
    image: 'https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?w=800&q=80',
    author: 'Sofia_R',
    date: '10 May 2026',
  },
  {
    id: 6,
    category: 'University',
    readTime: '3 minute read',
    title: 'Living in a Korean University Dormitory',
    excerpt: 'Everything you need to know about dorm life as a foreigner.',
    content: 'Full review text goes here.\n\nDorm life pros and cons.',
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80',
    author: 'Liam_T',
    date: '8 May 2026',
  },
]