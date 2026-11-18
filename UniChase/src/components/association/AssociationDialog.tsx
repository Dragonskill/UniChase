import { useEffect, useId, useRef, type ReactNode } from 'react'

export default function AssociationDialog({ title, close, children }: {
  title: string
  close: () => void
  children: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const element = dialog.current
    if (!element) return
    element.showModal()
    return () => element.close()
  }, [])

  return (
    <dialog ref={dialog} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); close() }}
      className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-auto rounded-2xl bg-surface p-5 text-ink shadow-xl backdrop:bg-black/50">
      <h3 id={titleId} className="mb-2 text-lg font-bold text-navy">{title}</h3>
      {children}
    </dialog>
  )
}
