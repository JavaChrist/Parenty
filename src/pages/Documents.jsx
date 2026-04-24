import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Upload,
  FileText,
  FileImage,
  HeartPulse,
  GraduationCap,
  Landmark,
  Scale,
  Folder,
  Download,
  Trash2,
  Crown,
} from 'lucide-react'
import {
  useDocuments,
  useDeleteDocument,
  getDocumentSignedUrl,
  DOCUMENT_CATEGORIES,
} from '../hooks/useDocuments'
import { usePlanLimits } from '../hooks/usePlanLimits'
import Modal from '../components/ui/Modal'
import UploadDocumentForm from '../components/documents/UploadDocumentForm'

const CATEGORY_ICONS = {
  school: GraduationCap,
  medical: HeartPulse,
  admin: Landmark,
  legal: Scale,
  other: Folder,
}

const CATEGORY_LABELS = Object.fromEntries(
  DOCUMENT_CATEGORIES.map((c) => [c.value, c.label])
)

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function getFileIcon(mime) {
  if (mime?.startsWith('image/')) return FileImage
  return FileText
}

export default function Documents() {
  const { data: documents = [], isLoading } = useDocuments()
  const deleteDoc = useDeleteDocument()
  const { isPremium, atDocLimit, docCount, docLimit } = usePlanLimits()

  const [q, setQ] = useState('')
  const [categoryFilter, setCategoryFilter] = useState(null)
  const [uploadOpen, setUploadOpen] = useState(false)

  const filtered = documents.filter((d) => {
    const matchQ = d.title.toLowerCase().includes(q.toLowerCase())
    const matchCat = !categoryFilter || d.category === categoryFilter
    return matchQ && matchCat
  })

  const counts = DOCUMENT_CATEGORIES.map((c) => ({
    ...c,
    count: documents.filter((d) => d.category === c.value).length,
  }))

  const openDoc = async (doc) => {
    try {
      const url = await getDocumentSignedUrl(doc.storage_path)
      if (url) window.open(url, '_blank', 'noopener')
    } catch (err) {
      alert('Impossible d\'ouvrir : ' + err.message)
    }
  }

  const onDelete = (doc) => {
    if (confirm(`Supprimer "${doc.title}" ? (soft delete, le fichier physique est aussi retiré)`)) {
      deleteDoc.mutate(doc)
    }
  }

  return (
    <div className="space-y-lg">
      <header>
        <h1 className="h-title">Documents</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Coffre-fort partagé : actes, scolarité, santé.
        </p>
      </header>

      <label className="relative block">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un document…"
          className="input pl-11"
        />
      </label>

      {/* Catégories */}
      <section className="flex gap-md overflow-x-auto pb-2 -mx-4 px-4 scrollbar-soft">
        <CategoryChip
          label="Tout"
          icon={Folder}
          count={documents.length}
          active={categoryFilter === null}
          onClick={() => setCategoryFilter(null)}
        />
        {counts.map(({ value, label, count }) => {
          const Icon = CATEGORY_ICONS[value] ?? Folder
          return (
            <CategoryChip
              key={value}
              label={label}
              icon={Icon}
              count={count}
              active={categoryFilter === value}
              onClick={() =>
                setCategoryFilter(categoryFilter === value ? null : value)
              }
            />
          )
        })}
      </section>

      {!isPremium && (
        <p className="text-caption text-on-surface-variant text-center">
          Plan gratuit · {docCount} / {docLimit} documents
        </p>
      )}

      <button
        onClick={() => setUploadOpen(true)}
        disabled={atDocLimit}
        className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Upload size={18} strokeWidth={2.5} />
        Déposer un document
      </button>

      {atDocLimit && (
        <div className="card p-md bg-tertiary-fixed/50 border border-tertiary/20">
          <p className="text-body-md text-on-tertiary-fixed-variant">
            <Crown size={14} className="inline -mt-0.5 mr-1" strokeWidth={2} />
            Plan gratuit limité à {docLimit} documents.{' '}
            <Link to="/profile" className="font-semibold underline">
              Passe en Premium
            </Link>{' '}
            pour stocker plus.
          </p>
        </div>
      )}

      <section className="space-y-sm">
        <h2 className="text-label-sm text-on-surface-variant uppercase tracking-wide px-sm">
          {categoryFilter ? CATEGORY_LABELS[categoryFilter] : 'Tous'}
        </h2>

        {isLoading && (
          <div className="card p-lg text-center text-on-surface-variant">Chargement…</div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="card p-lg text-center text-on-surface-variant">
            Aucun document.
          </div>
        )}

        <div className="card divide-y divide-outline-variant/40">
          {filtered.map((d) => {
            const Icon = getFileIcon(d.mime_type)
            return (
              <div
                key={d.id}
                className="w-full flex items-center gap-md p-md hover:bg-surface-container-low transition-colors"
              >
                <button
                  onClick={() => openDoc(d)}
                  className="flex items-center gap-md flex-1 min-w-0 text-left"
                >
                  <div className="h-11 w-11 rounded-md bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-semibold text-on-surface truncate">
                      {d.title}
                    </p>
                    <p className="text-caption text-on-surface-variant">
                      {CATEGORY_LABELS[d.category] ?? d.category}
                      {d.size_bytes ? ` · ${formatSize(d.size_bytes)}` : ''}
                      {' · '}
                      {new Date(d.uploaded_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => openDoc(d)}
                  className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
                  aria-label="Télécharger"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={() => onDelete(d)}
                  disabled={deleteDoc.isPending}
                  className="p-2 rounded-full text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors"
                  aria-label="Supprimer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <p className="text-caption text-on-surface-variant/70 text-center">
        Règle : pas d'édition possible. Suppression = soft delete (log conservé).
      </p>

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Déposer un document"
      >
        <UploadDocumentForm
          onSuccess={() => setUploadOpen(false)}
          onCancel={() => setUploadOpen(false)}
        />
      </Modal>
    </div>
  )
}

function CategoryChip({ label, icon: Icon, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border transition-colors',
        active
          ? 'bg-primary text-on-primary border-primary'
          : 'bg-surface-container-lowest border-outline-variant text-on-surface hover:bg-surface-container-low',
      ].join(' ')}
    >
      <Icon size={16} strokeWidth={2} />
      <span className="text-label-sm font-semibold">{label}</span>
      <span className={`text-caption ${active ? 'opacity-80' : 'opacity-60'}`}>
        {count}
      </span>
    </button>
  )
}
