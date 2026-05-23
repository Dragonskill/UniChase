import { Link } from 'react-router-dom'
import CommunityRow from '@/components/ui/CommunityRow'

const posts = [
  { id: 1, tag: 'Promotion', title: 'Recruitment Notice for the 2026 Daegu Chimac Festival 99 Cheers Challenge', isNew: true, comments: 1, date: '20 May' },
  { id: 2, tag: 'Promotion', title: '2026 Daegu Chimac Festival Global Chimac Friends Recruitment', date: '20 May' },
  { id: 3, tag: 'Career', title: 'CJ ChaeilJedang Global Internship Interview', date: '18 May' },
  { id: 4, tag: 'Career', title: 'Interested in Living in Korea While Learning Beauty Skills?', date: '13 May' },
  { id: 5, tag: 'Promotion', title: 'A Meditative Concert in Between <Sai... Sori... Sum...>', date: '12 May' },
]

export default function CommunitySection() {
  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold tracking-wide text-gray-900">COMMUNITY</h2>
        <Link to="/community" className="text-sm text-gray-500 hover:text-blue-500">See all →</Link>
      </div>
      <div className="flex flex-col">
        {posts.map((p) => (
          <CommunityRow key={p.id} {...p} />
        ))}
      </div>
    </section>
  )
}