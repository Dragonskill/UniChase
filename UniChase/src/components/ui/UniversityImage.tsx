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
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#d9ebf4"/>
          <stop offset=".58" stop-color="#f4eee4"/>
          <stop offset="1" stop-color="#d8dfd4"/>
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${color}" stop-opacity=".88"/>
          <stop offset="1" stop-color="${color}" stop-opacity=".58"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="675" fill="url(#sky)"/>
      <circle cx="1010" cy="112" r="72" fill="#fff" opacity=".62"/>
      <path d="M0 360 L170 245 L315 338 L485 205 L685 355 L865 235 L1200 382 L1200 675 L0 675 Z" fill="#839ca1" opacity=".34"/>
      <path d="M0 410 C210 350 365 425 565 365 C785 300 980 390 1200 322 L1200 675 L0 675 Z" fill="#78967d" opacity=".54"/>
      <rect x="158" y="300" width="884" height="246" rx="14" fill="url(#glass)"/>
      <path d="M118 315 L600 154 L1082 315 Z" fill="${color}" opacity=".92"/>
      <rect x="245" y="354" width="120" height="142" rx="4" fill="#eef5f5" opacity=".48"/>
      <rect x="405" y="354" width="120" height="142" rx="4" fill="#eef5f5" opacity=".48"/>
      <rect x="675" y="354" width="120" height="142" rx="4" fill="#eef5f5" opacity=".48"/>
      <rect x="835" y="354" width="120" height="142" rx="4" fill="#eef5f5" opacity=".48"/>
      <rect x="552" y="390" width="96" height="156" rx="48" fill="#f4eee4" opacity=".9"/>
      <path d="M0 555 C230 478 390 615 610 520 C820 428 990 528 1200 452 L1200 675 L0 675 Z" fill="#6f957c"/>
      <rect x="80" y="52" width="1040" height="108" rx="24" fill="#10243a" opacity=".7"/>
      <text x="600" y="105" text-anchor="middle" font-family="Inter, Arial" font-size="38" font-weight="700" fill="#fff">${safeLabel}</text>
      <text x="600" y="139" text-anchor="middle" font-family="Inter, Arial" font-size="19" fill="#fff" opacity=".82">Campus image pending verification</text>
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
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const currentSrc = !src || failedSrc === src ? fallback : src

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      width={kind === "logo" ? 160 : 1200}
      height={kind === "logo" ? 160 : 675}
      onError={() => setFailedSrc(src || null)}
      className={className}
    />
  )
}
