import { useState } from 'react'
import { Car, PenLine, Plus, ArrowLeftRight } from 'lucide-react'

// Petite simulation d'un mois de garde partagée
// (teal = moi, orange doux = autre parent)
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const DEMO_DAYS = Array.from({ length: 28 }, (_, i) => {
  const n = i + 1
  // Alternance 2-3-2 jours de façon simple
  const weekIndex = Math.floor(i / 7)
  const dayInWeek = i % 7
  const mom = (weekIndex % 2 === 0 && dayInWeek < 3) || (weekIndex % 2 === 1 && dayInWeek >= 5)
  return { day: n, owner: mom ? 'moi' : 'autre', handover: n === 11 }
})

export default function Calendar() {
  const now = new Date()
  const [view, setView] = useState('month')
  const [selected, setSelected] = useState(20)

  return (
    <div className="space-y-md">
      <header className="flex items-center justify-between">
        <h1 className="h-title">
          {MONTHS[now.getMonth()]} {now.getFullYear()}
        </h1>

        <div className="flex p-1 bg-surface-container rounded-full">
          {['week', 'month'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={[
                'px-4 py-1.5 rounded-full text-label-sm transition-all',
                view === v
                  ? 'bg-surface-container-lowest shadow-soft text-on-surface'
                  : 'text-on-surface-variant',
              ].join(' ')}
            >
              {v === 'week' ? 'Semaine' : 'Mois'}
            </button>
          ))}
        </div>
      </header>

      {/* Légende */}
      <div className="flex items-center gap-lg px-sm">
        <LegendItem color="bg-primary-container" label="Mes jours" />
        <LegendItem color="bg-tertiary-fixed" label="Co-parent" />
      </div>

      {/* Grille calendrier */}
      <section className="card-elevated p-md">
        <div className="grid grid-cols-7 mb-sm">
          {WEEK_DAYS.map((d, i) => (
            <div
              key={i}
              className="text-center text-label-sm text-on-surface-variant py-1"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {DEMO_DAYS.map(({ day, owner, handover }, i) => {
            const isMom = owner === 'moi'
            const isSelected = selected === day
            const prevOwner = i > 0 ? DEMO_DAYS[i - 1].owner : null
            const nextOwner = i < DEMO_DAYS.length - 1 ? DEMO_DAYS[i + 1].owner : null
            const roundLeft = prevOwner !== owner
            const roundRight = nextOwner !== owner
            const baseBg = isMom
              ? 'bg-primary-container text-on-primary-container'
              : 'bg-tertiary-fixed text-on-tertiary-fixed-variant'

            return (
              <button
                key={day}
                onClick={() => setSelected(day)}
                className={[
                  'relative aspect-square flex items-center justify-center text-body-md transition-all',
                  roundLeft ? 'rounded-l-lg ml-1' : '',
                  roundRight ? 'rounded-r-lg' : '',
                  isSelected
                    ? 'bg-primary text-on-primary rounded-lg shadow-card scale-105 z-10 font-bold'
                    : baseBg,
                ].join(' ')}
              >
                <span>{day}</span>
                {handover && !isSelected && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* Détail du jour sélectionné */}
      <section className="space-y-sm">
        <h2 className="h-section text-h3 px-sm">
          {selected && dateLabel(now, selected)}
        </h2>

        <div className="card-elevated p-lg space-y-md">
          <EventRow
            icon={Car}
            title="Dépose école"
            subtitle="Lincoln Elementary"
            timeLabel="08:00"
          />

          <div className="h-px bg-outline-variant/40" />

          <div className="flex items-center gap-sm text-on-surface-variant">
            <ArrowLeftRight size={16} strokeWidth={2} />
            <span className="text-caption text-secondary">
              Passage de garde vers le co-parent
            </span>
          </div>

          <button className="inline-flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <PenLine size={18} strokeWidth={2} />
            <span className="text-label-sm">Ajouter une note pour le co-parent</span>
          </button>
        </div>
      </section>

      {/* CTA ajout événement */}
      <button className="btn-primary w-full mt-md">
        <Plus size={18} strokeWidth={2.5} />
        Ajouter un événement
      </button>

      <p className="text-caption text-on-surface-variant/70 text-center mt-sm">
        Règle : aucun événement ne peut être supprimé. Toute modification est historisée.
      </p>
    </div>
  )
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-sm">
      <span className={`w-3 h-3 rounded-sm ${color}`} />
      <span className="text-label-sm text-on-surface-variant">{label}</span>
    </div>
  )
}

function EventRow({ icon: Icon, title, subtitle, timeLabel }) {
  return (
    <div className="flex gap-md items-start">
      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h4 className="text-label-sm text-on-surface font-semibold">{title}</h4>
            <p className="text-body-md text-on-surface-variant">{subtitle}</p>
          </div>
          <span className="pill-primary">{timeLabel}</span>
        </div>
      </div>
    </div>
  )
}

function dateLabel(now, day) {
  const d = new Date(now.getFullYear(), now.getMonth(), day)
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}
