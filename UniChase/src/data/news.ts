export interface NewsArticle {
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

export const news: NewsArticle[] = [
  {
    id: 1,
    category: 'K-CAMPUS',
    readTime: '7 minute read',
    title: 'Kotra unveils company list, opens applications for annual international student job fair',
    excerpt: 'Applications are now open for the biggest international student career event of the year.',
    content: 'Full article text goes here. This is where the body of the news article would be displayed. You can write multiple paragraphs and they will all render on the detail page.\n\nThis is a second paragraph to show how content flows.',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=80',
    author: 'Editor_Kim',
    date: '21 May 2026',
  },
  {
    id: 2,
    category: 'K-CAMPUS',
    readTime: '2 minute read',
    title: 'Ukrainian student\'s love for Korean literary classics',
    excerpt: 'A deep dive into how one student fell in love with Korean literature and culture.',
    content: 'Full article text goes here for the second article.\n\nMore paragraphs follow.',
    image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1400&q=80',
    author: 'Editor_Lee',
    date: '20 May 2026',
  },
  {
    id: 3,
    category: 'NATIONAL',
    readTime: '3 minute read',
    title: 'Seoul court rules SNU professor\'s dismissal for misconduct',
    excerpt: 'The ruling marks a significant moment in Korean academic accountability.',
    content: 'Full article text goes here for the third article.\n\nMore details about the ruling.',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1400&q=80',
    author: 'Editor_Park',
    date: '19 May 2026',
  },
  {
    id: 4,
    category: 'K-CAMPUS',
    readTime: '4 minute read',
    title: 'Jeju to halve salary requirement, triple stay limit for foreign workers',
    excerpt: 'New policies aim to attract more international talent to Jeju island.',
    content: 'Full article text goes here for the fourth article.\n\nDetails about the new Jeju policies.',
    image: 'https://images.unsplash.com/photo-1546874177-9e664107314e?w=1400&q=80',
    author: 'Editor_Kim',
    date: '18 May 2026',
  },
  {
    id: 5,
    category: 'NATIONAL',
    readTime: '5 minute read',
    title: 'Korean universities race to attract international students',
    excerpt: 'While universities race to attract international students, many struggle to retain them.',
    content: 'Full article text goes here for the fifth article.\n\nA look at retention challenges.',
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1400&q=80',
    author: 'Editor_Lee',
    date: '17 May 2026',
  },
]