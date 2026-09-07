import type { CSSProperties } from "react"
import { Link } from "react-router-dom"
import type { University } from "@/data/universities"
import UniversityImage from "@/components/ui/UniversityImage"
import { universityVerification } from "@/lib/universityDisplay"
import { useI18n } from "@/lib/i18n"

type Props = {
  uni: University
  isSaved?: boolean
  isFollowed?: boolean
  isCompared?: boolean
  compareDisabled?: boolean
  savePending?: boolean
  followPending?: boolean
  onToggleSaved?: (id: number) => void
  onToggleFollowed?: (id: number) => void
  onToggleCompare?: (id: number) => void
}

export default function UniversityCard({ uni, isSaved = false, isFollowed = false, isCompared = false, compareDisabled = false, savePending, followPending, onToggleSaved, onToggleFollowed, onToggleCompare }: Props) {
  const { t } = useI18n()
  return (
    <article className="university-card-link university-card-shell group relative">
      <div className="university-card-media bg-cream-dark">
        <UniversityImage src={uni.image} alt={uni.imageAlt || `${uni.name} campus`} fallbackLabel={uni.name} color={uni.mainColor} className="h-full w-full object-cover object-center" />
        {onToggleFollowed && <button type="button" disabled={followPending} aria-pressed={isFollowed} aria-label={`${isFollowed ? t('unfollow') : t('follow')} ${uni.name}`} onClick={() => onToggleFollowed(uni.id)} className={`university-follow-button z-10 ${isFollowed ? "university-follow-button--saved" : ""}`}>{isFollowed ? t('followed') : `+ ${t('follow')}`}</button>}
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-5">
        <div className="grid min-h-[74px] grid-cols-[48px_minmax(0,1fr)] items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cream border border-gray-100">
            <UniversityImage src={uni.logo} alt={`${uni.name} logo`} fallbackLabel={uni.name} color={uni.mainColor} kind="logo" className="h-10 w-10 object-contain" />
          </div>
          <div className="min-w-0">
            <h3 className="university-card-title min-h-[44px] text-lg font-bold leading-tight line-clamp-2" style={{ "--uni-color": uni.mainColor } as CSSProperties}>
              <Link to={`/universities/${uni.slug || uni.id}`} className="university-card-main-link" title={uni.name}>{uni.name}</Link>
            </h3>
            <p className="truncate text-sm text-muted">{uni.location}</p>
          </div>
        </div>
        <div className="mt-4 min-h-[92px] flex flex-col gap-2 border-b border-gray-100 pb-4 text-sm text-gray-700">
          <span>QS {uni.qsRankingYear || ""}: {uni.qsRanking || "Not verified"}</span>
          <span>Acceptance rate: {uni.acceptanceRate || "Not verified"}</span>
          <span className="w-fit rounded-full border border-gray-200 bg-cream px-2.5 py-0.5 text-xs text-muted">{universityVerification(uni)}</span>
        </div>
        <p className="mt-4 min-h-[60px] text-sm text-gray-600 line-clamp-3">{uni.description}</p>
        <div className="relative z-10 mt-auto flex items-center justify-between gap-2 pt-4 text-sm">
          {onToggleSaved && <button type="button" disabled={savePending} aria-pressed={isSaved} aria-label={`${isSaved ? t('unsave') : t('save')} ${uni.name}`} onClick={() => onToggleSaved(uni.id)} className={`rounded-full border px-3 py-1.5 ${isSaved ? "border-teal bg-teal/10 text-teal" : "border-gray-200 text-muted hover:border-teal"}`}>{isSaved ? t('saved') : t('save')}</button>}
          {onToggleCompare && <label className="flex cursor-pointer items-center gap-2 text-gray-700"><input type="checkbox" checked={isCompared} disabled={!isCompared && compareDisabled} onChange={() => onToggleCompare(uni.id)} className="h-4 w-4 accent-teal" />{t('compare')}</label>}
        </div>
      </div>
    </article>
  )
}
