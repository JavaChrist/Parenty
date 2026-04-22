import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Download } from 'lucide-react'

/**
 * Overlay plein écran pour visualiser une image en grand.
 *
 * - Clic sur le fond ou touche Escape → ferme
 * - Lien de téléchargement si `downloadUrl` est fourni
 * - Rendu via Portal pour sortir de la hiérarchie de scroll du chat
 * - Empêche le scroll de la page en arrière-plan tant qu'il est ouvert
 */
export default function ImageLightbox({ src, alt = '', name, onClose, downloadUrl }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  if (!src) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt || 'Image en plein écran'}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {downloadUrl && (
          <a
            href={downloadUrl}
            download={name || undefined}
            onClick={(e) => e.stopPropagation()}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Télécharger l'image"
          >
            <Download size={20} />
          </a>
        )}
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>
      </div>

      <img
        src={src}
        alt={alt}
        className="max-w-[96vw] max-h-[92vh] object-contain rounded-lg shadow-2xl select-none"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {name && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-caption text-white/80 bg-black/40 px-3 py-1 rounded-full max-w-[80vw] truncate">
          {name}
        </p>
      )}
    </div>,
    document.body,
  )
}
