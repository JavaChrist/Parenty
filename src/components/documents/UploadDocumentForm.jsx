import { useState } from 'react'
import { useAddDocument, DOCUMENT_CATEGORIES } from '../../hooks/useDocuments'
import { useChildren } from '../../hooks/useChildren'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

export default function UploadDocumentForm({ onSuccess, onCancel }) {
  const addDoc = useAddDocument()
  const { data: children = [] } = useChildren()

  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('other')
  const [childId, setChildId] = useState('')
  const [error, setError] = useState(null)

  const onFile = (e) => {
    const f = e.target.files?.[0]
    setFile(f || null)
    if (f && !title) {
      // Pré-remplit le titre avec le nom du fichier (sans extension)
      setTitle(f.name.replace(/\.[^.]+$/, ''))
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!file) return setError('Choisis un fichier.')
    if (!title.trim()) return setError('Donne un titre au document.')
    try {
      await addDoc.mutateAsync({ file, title, category, child_id: childId })
      onSuccess?.()
    } catch (err) {
      const msg = err?.message || "Erreur lors de l'upload."
      if (msg.includes('free_plan_limit_documents')) {
        setError(
          'Plan gratuit limité à 10 documents. Passe en Premium pour en stocker plus.',
        )
      } else {
        setError(msg)
      }
    }
  }

  return (
    <form onSubmit={submit} className="space-y-md">
      <div>
        <label className="label" htmlFor="file">Fichier (PDF, image — 20 Mo max)</label>
        <input
          id="file"
          type="file"
          required
          accept="application/pdf,image/*"
          onChange={onFile}
          className="input p-2"
        />
        {file && (
          <p className="text-caption text-on-surface-variant mt-1">
            {file.name} · {formatSize(file.size)}
          </p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="title">Titre</label>
        <input
          id="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          placeholder="ex : Carnet de vaccination"
        />
      </div>

      <div>
        <label className="label" htmlFor="category">Catégorie</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="input"
        >
          {DOCUMENT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {children.length > 0 && (
        <div>
          <label className="label" htmlFor="child_id">Enfant concerné (optionnel)</label>
          <select
            id="child_id"
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            className="input"
          >
            <option value="">Toute la fratrie</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.first_name}</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="text-body-md text-on-error-container bg-error-container rounded-md p-3">
          {error}
        </div>
      )}

      <div className="flex gap-md pt-sm">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Annuler
        </button>
        <button type="submit" disabled={addDoc.isPending} className="btn-primary flex-1">
          {addDoc.isPending ? 'Upload…' : 'Déposer'}
        </button>
      </div>
    </form>
  )
}
