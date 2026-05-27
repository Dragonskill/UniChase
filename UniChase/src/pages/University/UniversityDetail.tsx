import { useParams, Link } from "react-router-dom"
import { universities } from "@/data/universities"

function UniversityDetail() {
  const { id } = useParams()
  const uni = universities.find((u) => u.id === Number(id))


  if (!uni) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <p className="text-gray-600">University topilmadi.</p>
        <Link to="/University" className="text-indigo-600 hover:underline">
          ← Ro'yxatga qaytish
        </Link>
      </div>
    )
  }
  return (
    <div className="page-fade max-w-6xl mx-auto px-6 py-8">


      <img
        src={uni.image}
        alt={uni.name}
        className="mt-4 h-64 w-full object-cover rounded-2xl"
      />


      <div className="mt-6 flex items-center gap-4">
        <img
          src={uni.logo}
          alt={`${uni.name} logo`}
          className="h-14 w-14 object-contain"
        />
        <div>
          <h1
            className="text-3xl font-bold"
            style={{ color: uni.mainColor }}
          >
            {uni.name}
          </h1>
          <p className="text-gray-500">{uni.location}</p>
        </div>
      </div>


      <div className="mt-4 flex flex-wrap gap-6">
        {uni.qsRanking && (
          <span className="text-sm text-gray-700">
            QS Ranking: <strong>{uni.qsRanking}</strong>
          </span>
        )}
        {uni.acceptanceRate && (
          <span className="text-sm text-gray-700">
            Acceptance rate: <strong>{uni.acceptanceRate}</strong>
          </span>
        )}
      </div>


      <p className="mt-6 text-gray-700 leading-relaxed">{uni.description}</p>
    </div>
  )
}

export default UniversityDetail
