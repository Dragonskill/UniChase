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
    category: 'COMMUNITY',
    title: 'Find your community. Make Korea feel like home.',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1400&q=80',
    link: '/universities/korea-university#student-community',
  },
  {
    id: 2,
    category: 'UNIVERSITY',
    title: 'Your next chapter starts with the right university',
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
