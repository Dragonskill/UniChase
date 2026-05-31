import { type CSSProperties, type ElementType, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type GlowLettersProps = {
  as?: ElementType
  text: string
  className?: string
  variant?: 'brand' | 'hero' | 'title' | 'section'
}

export default function GlowLetters({
  as: Component = 'span',
  text,
  className,
  variant = 'title',
}: GlowLettersProps) {
  const words = text.split(' ')
  const wordOffsets = words.reduce<number[]>((offsets, _word, index) => {
    const previousOffset = offsets[index - 1] ?? 0
    const previousLength = index === 0 ? 0 : words[index - 1].length
    offsets.push(previousOffset + previousLength)
    return offsets
  }, [])

  const content = words.map((word, wordIndex) => (
    <span key={`${word}-${wordIndex}`} className="glow-word" aria-hidden="true">
      {word.split('').map((letter, index) => {
        const currentIndex = wordOffsets[wordIndex] + index

        return (
          <span
            key={`${letter}-${index}-${currentIndex}`}
            className="glow-letter"
            style={{ '--letter-index': currentIndex } as CSSProperties}
          >
            {letter}
          </span>
        )
      })}
    </span>
  ))

  return (
    <Component className={cn('letter-glow', `letter-glow--${variant}`, className)} aria-label={text}>
      {content.reduce<ReactNode[]>((nodes, word, index) => {
        if (index > 0) {
          nodes.push(<span key={`space-${index}`} className="glow-space" aria-hidden="true" />)
        }

        nodes.push(word)
        return nodes
      }, [])}
    </Component>
  )
}
