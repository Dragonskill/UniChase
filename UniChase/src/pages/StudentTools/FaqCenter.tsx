import { useEffect } from "react"
import GlowLetters from "@/components/ui/GlowLetters"
import { faqItems } from "@/data/studentGuides"
import { applySeo } from "@/lib/seo"

export default function FaqCenter() {
  useEffect(() => {
    applySeo({
      title: "FAQ Center | UniChase",
      description: "Answers to common South Korea university application questions.",
      canonicalPath: "/faq",
    })
  }, [])

  return (
    <div className="page-fade max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <p className="text-sm text-teal font-semibold">Student tools</p>
        <h1 className="text-3xl font-bold text-navy">
          <GlowLetters text="FAQ center" />
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {faqItems.map((item) => (
          <section key={item.question} className="bg-surface rounded-2xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-navy">{item.question}</h2>
            <p className="mt-3 text-sm text-gray-700 leading-relaxed">{item.answer}</p>
          </section>
        ))}
      </div>
    </div>
  )
}

