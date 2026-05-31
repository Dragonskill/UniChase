type SeoOptions = {
  title: string
  description: string
  image?: string
  canonicalPath?: string
  structuredData?: Record<string, unknown>
}

function setMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)

  if (!element) {
    element = document.createElement("meta")
    document.head.appendChild(element)
  }

  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value))
}

export function applySeo({ title, description, image, canonicalPath, structuredData }: SeoOptions) {
  document.title = title
  setMeta('meta[name="description"]', { name: "description", content: description })
  setMeta('meta[property="og:title"]', { property: "og:title", content: title })
  setMeta('meta[property="og:description"]', { property: "og:description", content: description })
  setMeta('meta[property="og:type"]', { property: "og:type", content: "website" })
  setMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" })
  setMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title })
  setMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description })

  if (image) {
    setMeta('meta[property="og:image"]', { property: "og:image", content: image })
    setMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image })
  }

  if (canonicalPath) {
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')

    if (!link) {
      link = document.createElement("link")
      link.rel = "canonical"
      document.head.appendChild(link)
    }

    link.href = `${window.location.origin}${canonicalPath}`
  }

  document.getElementById("unichase-structured-data")?.remove()

  if (structuredData) {
    const script = document.createElement("script")
    script.id = "unichase-structured-data"
    script.type = "application/ld+json"
    script.text = JSON.stringify(structuredData)
    document.head.appendChild(script)
  }
}
