import { useState } from 'react'
import {
  Search,
  Upload,
  FileText,
  FileImage,
  FileSpreadsheet,
  HeartPulse,
  GraduationCap,
  Landmark,
  ChevronRight,
} from 'lucide-react'

const CATEGORIES = [
  { key: 'sante', label: 'Santé', icon: HeartPulse, count: 3 },
  { key: 'ecole', label: 'École', icon: GraduationCap, count: 5 },
  { key: 'admin', label: 'Administratif', icon: Landmark, count: 2 },
]

const DEMO_FILES = [
  {
    id: 1,
    name: 'Carnet de santé — page vaccins',
    category: 'Santé',
    size: '1.2 Mo',
    type: 'pdf',
    date: '20 oct.',
  },
  {
    id: 2,
    name: 'Bulletin CE1 — trimestre 1',
    category: 'École',
    size: '840 Ko',
    type: 'pdf',
    date: '14 oct.',
  },
  {
    id: 3,
    name: 'Jugement de divorce (extrait)',
    category: 'Administratif',
    size: '2.1 Mo',
    type: 'pdf',
    date: '02 oct.',
  },
  {
    id: 4,
    name: 'Photo de classe',
    category: 'École',
    size: '3.4 Mo',
    type: 'image',
    date: '28 sep.',
  },
]

const FILE_ICONS = {
  pdf: FileText,
  image: FileImage,
  sheet: FileSpreadsheet,
}

export default function Documents() {
  const [q, setQ] = useState('')
  const visible = DEMO_FILES.filter((f) =>
    f.name.toLowerCase().includes(q.toLowerCase()),
  )

  return (
    <div className="space-y-lg">
      <header>
        <h1 className="h-title">Documents</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Coffre-fort partagé : actes, scolarité, santé.
        </p>
      </header>

      {/* Recherche */}
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
      <section className="grid grid-cols-3 gap-md">
        {CATEGORIES.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            className="card p-md flex flex-col items-start gap-2 hover:shadow-card-hover transition-shadow"
          >
            <div className="h-10 w-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
              <Icon size={20} strokeWidth={2} />
            </div>
            <div>
              <p className="text-label-sm text-on-surface">{label}</p>
              <p className="text-caption text-on-surface-variant">
                {count} fichier{count > 1 ? 's' : ''}
              </p>
            </div>
          </button>
        ))}
      </section>

      {/* CTA upload */}
      <button className="btn-primary w-full">
        <Upload size={18} strokeWidth={2.5} />
        Déposer un document
      </button>

      {/* Liste récents */}
      <section className="space-y-sm">
        <h2 className="text-label-sm text-on-surface-variant uppercase tracking-wide px-sm">
          Récents
        </h2>

        <div className="card divide-y divide-outline-variant/40">
          {visible.length === 0 && (
            <p className="p-lg text-center text-body-md text-on-surface-variant">
              Aucun document trouvé.
            </p>
          )}
          {visible.map((f) => {
            const Icon = FILE_ICONS[f.type] ?? FileText
            return (
              <button
                key={f.id}
                className="w-full flex items-center gap-md p-md hover:bg-surface-container-low transition-colors text-left"
              >
                <div className="h-11 w-11 rounded-md bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
                  <Icon size={20} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-semibold text-on-surface truncate">
                    {f.name}
                  </p>
                  <p className="text-caption text-on-surface-variant">
                    {f.category} · {f.size} · {f.date}
                  </p>
                </div>
                <ChevronRight
                  size={18}
                  className="text-on-surface-variant flex-shrink-0"
                />
              </button>
            )
          })}
        </div>
      </section>

      <p className="text-caption text-on-surface-variant/70 text-center">
        Règle : pas d'édition possible. Suppression = soft delete.
      </p>
    </div>
  )
}
