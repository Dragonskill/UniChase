import { useState } from 'react'
import UniversityCard from '@/components/ui/UniversityCard'

const initialData = [
  {
    id: 1,
    name: "Seoul National University",
    location: "Seoul",
    image: "https://en.snu.ac.kr/webdata/uploads/eng/image/2020/02/index-campas-img02.jpg",
    logo: "https://upload.wikimedia.org/wikipedia/en/7/77/Seoul_national_university_emblem.svg",
    description: "SNU, founded in 1946, is one of the most prestigious universities in Korea.",
    mainColor: "#15397F",
    acceptanceRate: "12%",     
    qsRanking: "29"             
  }
]

function UniversityList() {
  const [universities, setUniversities] = useState(initialData)
  const [newUni, setNewUni] = useState({
    name: '',
    location: '',
    image: '',
    logo: '',
    description: '',
    mainColor: '#4f46e5',
    acceptanceRate: '',    
    qsRanking: ''          
  })

  function addUniversity() {
    setUniversities([
      ...universities,
      { id: universities.length + 1, ...newUni }
    ])
    setNewUni({ 
      name: '', location: '', image: '', logo: '', description: '', 
      mainColor: '#4f46e5', acceptanceRate: '', qsRanking: ''    
    })
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">

      {/* Admin*/}
      <div className="mb-10 p-6 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-end gap-3">
        <h2 className="w-full text-lg font-bold text-gray-900 mb-1">
          Yangi universitet qo'shish
        </h2>
        <input
          className="flex-1 min-w-[140px] px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
          placeholder="Name"
          value={newUni.name}
          onChange={e => setNewUni({ ...newUni, name: e.target.value })} />
        <input
          className="flex-1 min-w-[140px] px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
          placeholder="City"
          value={newUni.location}
          onChange={e => setNewUni({ ...newUni, location: e.target.value })} />
        <input
          className="flex-1 min-w-[140px] px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
          placeholder="Image URL"
          value={newUni.image}
          onChange={e => setNewUni({ ...newUni, image: e.target.value })} />
        <input
          className="flex-1 min-w-[140px] px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
          placeholder="Logo URL"
          value={newUni.logo}
          onChange={e => setNewUni({ ...newUni, logo: e.target.value })} />
        <textarea
          className="flex-1 min-w-[140px] px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-y min-h-[44px] focus:outline-none focus:border-indigo-500"
          placeholder="Bio"
          value={newUni.description}
          onChange={e => setNewUni({ ...newUni, description: e.target.value })} />

        <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 cursor-pointer">
          Color
          <input
            type="color"
            className="w-8 h-8 p-0 border-0 rounded cursor-pointer bg-transparent"
            value={newUni.mainColor}
            onChange={e => setNewUni({ ...newUni, mainColor: e.target.value })} />
        </label>

        <input
          className="flex-1 min-w-[100px] px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
          placeholder="Acceptance rate"
          value={newUni.acceptanceRate}
          onChange={e => setNewUni({ ...newUni, acceptanceRate: e.target.value })} />

        {/* QS */}
        <input
          className="flex-1 min-w-[100px] px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
          placeholder="QS Ranking"
          value={newUni.qsRanking}
          onChange={e => setNewUni({ ...newUni, qsRanking: e.target.value })} />

        <button
          className="min-w-[120px] px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-[15px] font-medium cursor-pointer transition-colors hover:bg-indigo-500"
          onClick={addUniversity}>
          Add
        </button>
      </div>

      {/*Grid */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
        {universities.map(uni => (
          <UniversityCard key={uni.id} uni={uni} />
        ))}
      </div>

    </div>
  )
}

export default UniversityList