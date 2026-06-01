import { Link } from "react-router-dom"
import type { University } from "@/data/universities"
import UniversityImage from "@/components/ui/UniversityImage"

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
      className="block h-full group rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
    >
      <article className="flex h-full min-h-[545px] flex-col">
      <div className="relative aspect-[16/9] bg-cream-dark">
        <UniversityImage
          src={uni.image}
          alt={uni.imageAlt || `${uni.name} campus image`}
          fallbackLabel={uni.name}
          color={uni.mainColor}
          className="h-full w-full object-cover"
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

      <div className="flex flex-1 flex-col p-5">
        <div className="grid min-h-[74px] grid-cols-[48px_minmax(0,1fr)] items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cream border border-gray-100">
            <UniversityImage
            src={uni.logo}
            alt={`${uni.name} logo`}
            fallbackLabel={uni.name}
            color={uni.mainColor}
            kind="logo"
            className="h-10 w-10 object-contain"
          />
          </div>
          <div className="min-w-0">
            <h3
              className="min-h-[44px] text-lg font-bold leading-tight line-clamp-2"
              style={{ color: uni.mainColor }}
            >
              {uni.name}
            </h3>
            <p className="text-sm text-gray-500">{uni.location}</p>
          </div>
        </div>

        {/* QS + acceptance rate */}
        <div className="mt-4 min-h-[78px] flex flex-col gap-2 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <img
              src="https://files.bpcontent.cloud/2025/06/20/06/20250620064449-IG082B2O.png"
              alt="QS"
              className="h-5 w-auto rounded"
            />
            <span className="text-sm text-gray-700">QS: {uni.qsRanking || "Not available"}</span>
          </div>
          <span className="text-sm text-gray-700">
            Acceptance rate: {uni.acceptanceRate || "Not available"}
          </span>
          <span className="w-fit rounded-full border border-gray-200 bg-cream px-2.5 py-0.5 text-xs text-muted">
            {uni.imageLastVerifiedAt || uni.lastVerifiedAt ? "Verified" : "Needs verification"}
          </span>
        </div>

        <p className="mt-4 min-h-[60px] text-sm text-gray-600 line-clamp-3">
          {uni.description}
        </p>

        {onToggleCompare && (
          <label
            onClick={(e) => e.stopPropagation()}
            className="mt-auto flex items-center gap-2 pt-4 text-sm text-gray-700"
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
      </article>
    </Link>
  )
}
export default UniversityCard
