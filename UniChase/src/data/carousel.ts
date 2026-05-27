export interface Slide {
  id: number
  category: string
  title: string
  image: string
  link: string
}

export const slides: Slide[] = [
  {
    id: 1,
    category: 'CAREERS',
    title: 'Kotra unveils company list, opens applications for annual international student job fair',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=80',
    link: '/news/1',
  },
  {
    id: 2,
    category: 'UNIVERSITY',
    title: 'Top universities in Korea open applications for international students 2025',
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1400&q=80',
    link: '/university',
  },
  {
    id: 3,
    category: 'FOOD & TRAVEL',
    title: '12 Hours in Taebaek: A Fruitful Day Trip',
    image: 'https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?w=1400&q=80',
    link: '/reviews/5',
  },
]