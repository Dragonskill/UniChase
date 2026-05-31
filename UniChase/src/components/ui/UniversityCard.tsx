import { Link } from "react-router-dom"
import type { University } from "@/data/universities"

type Props = {
  uni: University
  isSaved?: boolean
  isCompared?: boolean
  compareDisabled?: boolean
  onToggleSaved?: (id: number) => void
  onToggleCompare?: (id: number) => void
}

function UniversityCard({
  uni,
  isSaved = false,
  isCompared = false,
  compareDisabled = false,
  onToggleSaved,
  onToggleCompare,
}: Props) {
  return (
    <Link
      to={`/universities/${uni.slug || uni.id}`}
      className="block group rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
    >
      {/* Banner image + Follow button */}
      <div className="relative">
        <img
          src={uni.image}
          alt={uni.name}
          className="h-44 w-full object-cover"
        />
        <button
          onClick={(e) => {
            e.preventDefault()
            onToggleSaved?.(uni.id)
          }}
          className="absolute top-3 right-3 cursor-pointer bg-white/95 backdrop-blur px-4 py-1.5 rounded-full text-sm font-medium text-gray-800 shadow-sm transition-colors hover:bg-white"
        >
          {isSaved ? "Saved" : "+ Follow"}
        </button>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Logo + name + location */}
        <div className="flex items-center gap-3">
          <img
            src={uni.logo}
            alt={`${uni.name} logo`}
            className="h-10 w-10 object-contain"
          />
          <div>
            <h3
              className="text-lg font-bold leading-tight"
              style={{ color: uni.mainColor }}
            >
              {uni.name}
            </h3>
            <p className="text-sm text-gray-500">{uni.location}</p>
          </div>
        </div>

        {/* QS + acceptance rate */}
        <div className="mt-4 flex flex-col gap-2 border-b border-gray-100 pb-4">
          {uni.qsRanking && (
            <div className="flex items-center gap-2">
              <img
                src="https://files.bpcontent.cloud/2025/06/20/06/20250620064449-IG082B2O.png"
                alt="QS"
                className="h-5 w-auto rounded"
              />
              <span className="text-sm text-gray-700">QS: {uni.qsRanking}</span>
            </div>
          )}
          {uni.acceptanceRate && (
            <span className="text-sm text-gray-700">
              Acceptance rate: {uni.acceptanceRate}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="mt-4 text-sm text-gray-600 line-clamp-3">
          {uni.description}
        </p>

        {onToggleCompare && (
          <label
            onClick={(e) => e.stopPropagation()}
            className="mt-4 flex items-center gap-2 text-sm text-gray-700"
          >
            <input
              type="checkbox"
              checked={isCompared}
              disabled={!isCompared && compareDisabled}
              onChange={(e) => {
                e.preventDefault()
                onToggleCompare(uni.id)
              }}
              className="h-4 w-4 rounded border-gray-300 text-teal focus:ring-teal"
            />
            Compare
          </label>
        )}
      </div>
    </Link>
  )
}
export default UniversityCard
