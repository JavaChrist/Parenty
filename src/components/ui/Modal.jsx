import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Modal mobile-first : s'affiche en bottom-sheet sur petit écran,
 * en feuille centrée sur desktop. Fermeture via ESC ou backdrop.
 */
export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fermer"
        tabIndex={-1}
      />

      {/* Feuille */}
      <div className="relative bg-surface-container-lowest w-full sm:max-w-md sm:mx-4 rounded-t-3xl sm:rounded-3xl shadow-card-hover pb-[env(safe-area-inset-bottom)] animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-lg pt-lg pb-md">
          <h2 id="modal-title" className="h-section text-h3">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-lg pb-lg">{children}</div>
      </div>
    </div>
  )
}
