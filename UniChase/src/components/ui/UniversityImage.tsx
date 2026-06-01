import { useState } from "react"

type UniversityImageProps = {
  src?: string | null
  alt: string
  className?: string
  fallbackLabel: string
  color?: string
  loading?: "lazy" | "eager"
  kind?: "campus" | "logo"
}

function escapeSvg(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function universityImageFallback(label: string, color = "#15397F", kind: "campus" | "logo" = "campus") {
  const safeLabel = escapeSvg(label)

  if (kind === "logo") {
    const initials = safeLabel
      .replace(/\([^)]*\)/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((part) => part[0])
      .join("")
      .toUpperCase()

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="74" fill="#ffffff" stroke="${color}" stroke-width="10"/>
        <text x="80" y="94" text-anchor="middle" font-family="Inter, Arial" font-size="42" font-weight="700" fill="${color}">${initials}</text>
      </svg>
    `)}`
  }

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675">
      <rect width="1200" height="675" fill="#f7f5ef"/>
      <rect width="1200" height="675" fill="${color}" opacity=".12"/>
      <rect x="170" y="225" width="860" height="260" rx="18" fill="${color}" opacity=".88"/>
      <rect x="235" y="280" width="120" height="160" fill="#ffffff" opacity=".22"/>
      <rect x="400" y="280" width="120" height="160" fill="#ffffff" opacity=".22"/>
      <rect x="565" y="280" width="120" height="160" fill="#ffffff" opacity=".22"/>
      <rect x="730" y="280" width="120" height="160" fill="#ffffff" opacity=".22"/>
      <rect x="515" y="360" width="170" height="125" fill="#f7f5ef" opacity=".88"/>
      <path d="M0 555 C230 480 390 610 610 515 C820 420 990 520 1200 440 L1200 675 L0 675 Z" fill="#98b9a5"/>
      <text x="600" y="128" text-anchor="middle" font-family="Inter, Arial" font-size="54" font-weight="700" fill="${color}">${safeLabel}</text>
    </svg>
  `)}`
}

export default function UniversityImage({
  src,
  alt,
  className = "",
  fallbackLabel,
  color,
  loading = "lazy",
  kind = "campus",
}: UniversityImageProps) {
  const fallback = universityImageFallback(fallbackLabel, color, kind)
  const [currentSrc, setCurrentSrc] = useState(src || fallback)

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setCurrentSrc(fallback)}
      className={className}
    />
  )
}
