import { Link } from "react-router-dom"

export type University = {
  id: number
  name: string
  location: string
  image: string
  logo: string
  description: string
  mainColor: string
  acceptanceRate?: string
  qsRanking?: string
}

function UniversityCard({ uni }: { uni: University }) {
  return (
    <Link
      to={`/University/${uni.id}`}
      className="group block bg-white rounded-2xl border border-gray-200 border-l-[5px] shadow-sm overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1"
      style={{ borderLeftColor: uni.mainColor }}
    >
      <div className="relative">
        <img
          className="w-full h-[150px] object-cover block"
          src={uni.image}
          alt={uni.name}
        />
        <button
          onClick={(e) => {
            e.preventDefault()
          }}
          className="absolute top-3 right-3 cursor-pointer bg-white/95 backdrop-blur px-4 py-1.5 rounded-full text-sm font-medium text-gray-800 shadow-sm transition-colors hover:bg-white"
        >
          + Follow
        </button>
      </div>

      <div className="px-5 pb-5 text-left">
        {/* Logo */}
        <img
          className="w-[72px] h-[72px] object-contain rounded-2xl bg-white p-1.5 shadow-md -mt-12 relative"
          src={uni.logo}
          alt={uni.name + " logo"}
        />

        {/* Name */}
        <h2 className="mt-3 mb-2 text-2xl font-bold text-gray-900 leading-tight">
          {uni.name}
        </h2>

        {/* Location */}
        <p className="mb-4 flex items-center gap-1.5 text-[15px] text-gray-500">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {uni.location}
        </p>

        {/* QS ranking+Acceptance rate*/}
        {(uni.qsRanking || uni.acceptanceRate) && (
          <div className="mb-4 flex flex-col gap-2 border-b border-gray-200 pb-4 text-sm text-gray-700">
            {uni.qsRanking && (
              <span className="flex items-center gap-1.5">
                <img
                  src="https://files.bpcontent.cloud/2025/06/20/06/20250620064449-IG082B2O.png"
                  alt="QS"
                  className="h-5 w-auto rounded"
                />
                #{uni.qsRanking}
              </span>
            )}
            {uni.acceptanceRate && (
              <span className="text-gray-500">
                Acceptance rate:{" "}
                <span className="font-medium text-gray-700">{uni.acceptanceRate}</span>
              </span>
            )}
          </div>
        )}

        {/*Bio*/}
        <p className="text-[15px] leading-relaxed text-gray-600">
          {uni.description}
        </p>
      </div>
    </Link>
  )
}

export default UniversityCard