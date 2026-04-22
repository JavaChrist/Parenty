import { useState, useMemo } from 'react'
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { useEventsForMonth, EVENT_KINDS } from '../hooks/useEvents'
import Modal from '../components/ui/Modal'
import AddEventForm from '../components/events/AddEventForm'

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const KIND_META = Object.fromEntries(
  EVENT_KINDS.map((k) => [k.value, k])
)

// Classes Tailwind par kind (Tailwind ne peut pas générer des classes dynamiques)
const KIND_BG = {
  custody: 'bg-primary-container text-on-primary-container',
  vacation: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  school: 'bg-surface-container-high text-on-surface',
  medical: 'bg-error-container text-on-error-container',
  other: 'bg-surface-container text-on-surface-variant',
}

// Retourne un tableau de 42 cases (6 semaines) pour afficher le mois
function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  // Lundi = 1 en France. getDay() renvoie 0 pour dimanche
  const startOffset = (first.getDay() + 6) % 7
  const days = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(year, month, i - startOffset + 1)
    days.push(date)
  }
  return days
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function overlapsDay(event, day) {
  const start = new Date(event.starts_at)
  const end = new Date(event.ends_at)
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
  return start < dayEnd && end >= dayStart
}

export default function Calendar() {
  const today = new Date()
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selectedDate, setSelectedDate] = useState(today)
  const [addOpen, setAddOpen] = useState(false)

  const { data: events = [], isLoading } = useEventsForMonth(cursor.year, cursor.month)

  const days = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor])

  const activeEvents = events.filter((e) => !e.cancelled_at)

  const eventsOnSelected = activeEvents.filter((e) => overlapsDay(e, selectedDate))

  const goMonth = (delta) => {
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  return (
    <div className="space-y-md">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goMonth(-1)}
            className="p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant"
            aria-label="Mois précédent"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="h-title">
            {MONTHS[cursor.month]} {cursor.year}
          </h1>
          <button
            onClick={() => goMonth(1)}
            className="p-2 rounded-full hover:bg-surface-container-low text-on-surface-variant"
            aria-label="Mois suivant"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <button
          onClick={() => setCursor({ year: today.getFullYear(), month: today.getMonth() })}
          className="text-label-sm text-primary font-semibold"
        >
          Aujourd'hui
        </button>
      </header>

      <section className="card-elevated p-md">
        <div className="grid grid-cols-7 mb-sm">
          {WEEK_DAYS.map((d, i) => (
            <div key={i} className="text-center text-label-sm text-on-surface-variant py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const inMonth = day.getMonth() === cursor.month
            const isToday = sameDay(day, today)
            const isSelected = sameDay(day, selectedDate)
            const dayEvents = activeEvents.filter((e) => overlapsDay(e, day))
            const firstKind = dayEvents[0]?.kind

            return (
              <button
                key={i}
                onClick={() => setSelectedDate(day)}
                className={[
                  'aspect-square flex flex-col items-center justify-center rounded-lg text-body-md relative transition-all',
                  !inMonth && 'opacity-30',
                  isSelected
                    ? 'bg-primary text-on-primary font-bold shadow-card scale-105 z-10'
                    : firstKind
                      ? KIND_BG[firstKind]
                      : 'hover:bg-surface-container-low',
                  isToday && !isSelected && 'ring-2 ring-primary',
                ].filter(Boolean).join(' ')}
              >
                <span>{day.getDate()}</span>
                {dayEvents.length > 1 && !isSelected && (
                  <span className="absolute bottom-1 text-[10px] font-semibold opacity-70">
                    +{dayEvents.length - 1}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* Légende */}
      <div className="flex items-center gap-md flex-wrap px-sm">
        {EVENT_KINDS.map((k) => (
          <div key={k.value} className="flex items-center gap-sm">
            <span className={`w-3 h-3 rounded-sm ${KIND_BG[k.value].split(' ')[0]}`} />
            <span className="text-caption text-on-surface-variant">{k.label}</span>
          </div>
        ))}
      </div>

      {/* Détail du jour sélectionné */}
      <section className="space-y-sm">
        <h2 className="h-section text-h3 px-sm capitalize">
          {selectedDate.toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long',
          })}
        </h2>

        {isLoading && (
          <div className="card p-lg text-center text-on-surface-variant">Chargement…</div>
        )}

        {!isLoading && eventsOnSelected.length === 0 && (
          <div className="card p-lg text-center">
            <div className="h-12 w-12 rounded-full bg-surface-container mx-auto flex items-center justify-center text-on-surface-variant mb-sm">
              <CalendarIcon size={22} />
            </div>
            <p className="text-body-md text-on-surface-variant">
              Aucun événement ce jour-là.
            </p>
          </div>
        )}

        {eventsOnSelected.map((e) => (
          <article key={e.id} className="card p-md flex gap-md items-start">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${KIND_BG[e.kind]}`}>
              <Clock size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-body-md font-semibold text-on-surface">
                  {e.title}
                </h3>
                <span className="pill-neutral whitespace-nowrap">
                  {KIND_META[e.kind]?.label}
                </span>
              </div>
              <p className="text-caption text-on-surface-variant mt-0.5">
                {new Date(e.starts_at).toLocaleTimeString('fr-FR', {
                  hour: '2-digit', minute: '2-digit',
                })}
                {' → '}
                {new Date(e.ends_at).toLocaleTimeString('fr-FR', {
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
              {e.description && (
                <p className="text-body-md text-on-surface-variant mt-sm">
                  {e.description}
                </p>
              )}
            </div>
          </article>
        ))}
      </section>

      {/* CTA */}
      <button onClick={() => setAddOpen(true)} className="btn-primary w-full">
        <Plus size={18} strokeWidth={2.5} />
        Ajouter un événement
      </button>

      <p className="text-caption text-on-surface-variant/70 text-center">
        Règle : les événements ne sont jamais supprimés — ils sont annulés et historisés.
      </p>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nouvel événement">
        <AddEventForm
          initialDate={selectedDate}
          onSuccess={() => setAddOpen(false)}
          onCancel={() => setAddOpen(false)}
        />
      </Modal>
    </div>
  )
}
