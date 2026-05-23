import { Link } from 'react-router-dom'
import CareerCard from '@/components/ui/CareerCard'

const careers = [
  { id: 1, logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&q=80', title: '[MAMF] Korea Migrant Song Festival Applications', company: 'Migrants Arirang Multicultural Festival Committee', type: 'Extracurricular activities', daysLeft: 66 },
  { id: 2, logo: 'https://images.unsplash.com/photo-1567446537708-ac4aa75c9c28?w=100&q=80', title: 'Recruiting the 18th Jin Ramyun JIN&JINY "Go-To Jin!"', company: 'Otoki', type: 'Extracurricular activities', daysLeft: 24 },
  { id: 3, logo: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=100&q=80', title: '[Busan International Film Festival] Recruitment for Pla...', company: 'Busan International Film Festival Organizing Committee', type: 'Full time', daysLeft: 10 },
  { id: 4, logo: 'https://images.unsplash.com/photo-1541746972996-4e0b0f43e02a?w=100&q=80', title: '[DAEHAKNAEIL] Zetplanet-K member recruitment', company: 'DAEHAKNAEIL', type: 'Extracurricular activities', daysLeft: 10 },
  { id: 5, logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&q=80', title: '[HanmiGlobal] Recruitment for International Applicants', company: 'HanmiGlobal', type: 'Full time', daysLeft: 8 },
]

export default function CareersSection() {
  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold tracking-wide text-gray-900">CAREERS</h2>
        <Link to="/careers" className="text-sm text-gray-500 hover:text-blue-500">See all →</Link>
      </div>
      <div className="flex flex-col">
        {careers.map((c) => (
          <CareerCard key={c.id} {...c} />
        ))}
      </div>
    </section>
  )
}