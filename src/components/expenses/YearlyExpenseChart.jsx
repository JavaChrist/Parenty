import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useExpenses, expenseSplit } from '../../hooks/useExpenses'
import { useFamilyMembers } from '../../hooks/useFamilyMembers'
import { useProfiles } from '../../hooks/useProfile'
import { useAuthStore } from '../../stores/authStore'
import { custodyColorFor } from '../calendar/custodyColors'

const MONTHS_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
]

const fmtEur = (cents) =>
  `${(cents / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`

/**
 * Construit, pour une année donnée, les totaux mensuels de paiement par
 * parent ainsi que les parts équitables (dues) de chaque parent.
 *
 * Retourne :
 *   - months: tableau de 12 entrées { paid: { [userId]: cents }, totalCents }
 *   - yearly: { paid: { [userId]: cents }, share: { [userId]: cents }, totalCents }
 *
 * Les dépenses refusées sont ignorées. Pour les dépenses validées et en
 * attente, on agrège : c'est utile pour visualiser la charge réelle
 * encourue, indépendamment de l'état de validation.
 */
function buildYearStats(expenses, year, parentIds) {
  const months = Array.from({ length: 12 }, () => ({
    paid: Object.fromEntries(parentIds.map((id) => [id, 0])),
    share: Object.fromEntries(parentIds.map((id) => [id, 0])),
    totalCents: 0,
  }))
  const yearly = {
    paid: Object.fromEntries(parentIds.map((id) => [id, 0])),
    share: Object.fromEntries(parentIds.map((id) => [id, 0])),
    totalCents: 0,
  }

  for (const e of expenses) {
    if (e.status === 'rejected') continue
    if (!e.incurred_on?.startsWith(`${year}-`)) continue
    const monthIdx = Number(e.incurred_on.slice(5, 7)) - 1
    if (monthIdx < 0 || monthIdx > 11) continue

    const split = expenseSplit(e)
    const payerId = e.payer_id
    if (!parentIds.includes(payerId)) continue
    const coparentId = parentIds.find((id) => id !== payerId)

    months[monthIdx].paid[payerId] += e.amount_cents
    months[monthIdx].totalCents += e.amount_cents
    months[monthIdx].share[payerId] += split.payerCharge
    if (coparentId) months[monthIdx].share[coparentId] += split.coparentOwes

    yearly.paid[payerId] += e.amount_cents
    yearly.totalCents += e.amount_cents
    yearly.share[payerId] += split.payerCharge
    if (coparentId) yearly.share[coparentId] += split.coparentOwes
  }

  return { months, yearly }
}

/**
 * Carte “Cumul annuel” : sélecteur d'année, totaux par parent, et un
 * graphique en barres mensuelles empilées (couleur = parent ayant payé).
 */
export default function YearlyExpenseChart() {
  const user = useAuthStore((s) => s.user)
  const { data: expenses = [], isLoading } = useExpenses()
  const { data: members = [] } = useFamilyMembers()
  const memberIds = useMemo(() => members.map((m) => m.user_id), [members])
  const { data: profilesById = {} } = useProfiles(memberIds)

  const [year, setYear] = useState(new Date().getFullYear())

  // Liste ordonnée des deux parents : utilisateur courant d'abord.
  const parents = useMemo(() => {
    const ids = members.map((m) => m.user_id)
    if (user?.id) {
      ids.sort((a, b) => (a === user.id ? -1 : b === user.id ? 1 : 0))
    }
    return ids.map((id) => ({
      id,
      name:
        id === user?.id
          ? 'Toi'
          : profilesById[id]?.first_name || 'Co-parent',
      color: custodyColorFor(id),
    }))
  }, [members, user?.id, profilesById])

  const parentIds = parents.map((p) => p.id)

  const { months, yearly } = useMemo(
    () => buildYearStats(expenses, year, parentIds),
    [expenses, year, parentIds],
  )

  // Échelle Y : on prend le max entre la valeur la plus haute du mois et
  // un plancher pour éviter qu'un seul mois écrase tous les autres.
  const maxMonth = Math.max(1, ...months.map((m) => m.totalCents))

  // Solde annuel : pour chaque parent, paid - share = ce qu'on lui doit.
  // (positif = on lui doit, négatif = il doit)
  const balanceUser = parents[0]
    ? (yearly.paid[parents[0].id] ?? 0) - (yearly.share[parents[0].id] ?? 0)
    : 0

  const hasData = parents.length >= 2 && yearly.totalCents > 0

  return (
    <section className="card-elevated p-lg space-y-md">
      <header className="flex items-center justify-between gap-md">
        <div>
          <h2 className="text-h3 font-bold text-on-surface">Cumul annuel</h2>
          <p className="text-caption text-on-surface-variant mt-0.5">
            Tout ce qui a été dépensé sur l'année (hors refusées).
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setYear((y) => y - 1)}
            className="p-2 rounded-full hover:bg-surface-container"
            aria-label="Année précédente"
          >
            <ChevronLeft size={18} strokeWidth={2.2} />
          </button>
          <span className="font-display text-h3 font-bold tabular-nums w-16 text-center">
            {year}
          </span>
          <button
            type="button"
            onClick={() => setYear((y) => y + 1)}
            disabled={year >= new Date().getFullYear()}
            className="p-2 rounded-full hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Année suivante"
          >
            <ChevronRight size={18} strokeWidth={2.2} />
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="text-center text-on-surface-variant py-lg">
          Chargement…
        </div>
      ) : !hasData ? (
        <div className="text-center text-on-surface-variant py-lg">
          Aucune dépense enregistrée pour {year}.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-sm">
            {parents.map((p) => {
              const paid = yearly.paid[p.id] ?? 0
              const share = yearly.share[p.id] ?? 0
              return (
                <div
                  key={p.id}
                  className={[
                    'rounded-lg p-md border',
                    p.color.bg,
                    p.color.border,
                    p.color.text,
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2">
                    <span className={['h-2.5 w-2.5 rounded-full', p.color.dot].join(' ')} />
                    <span className="text-label-sm font-semibold uppercase tracking-wide">
                      {p.name}
                    </span>
                  </div>
                  <p className="text-caption mt-1 opacity-80">A payé</p>
                  <p className="font-display text-h3 font-bold tabular-nums">
                    {fmtEur(paid)}
                  </p>
                  <p className="text-caption opacity-80 mt-1">
                    Part équitable&nbsp;: {fmtEur(share)}
                  </p>
                </div>
              )
            })}
          </div>

          {parents.length >= 2 && (
            <div className="rounded-lg p-md bg-tertiary-container text-on-tertiary-container">
              {balanceUser === 0 ? (
                <p className="text-body-md">
                  Comptes équilibrés sur {year}.
                </p>
              ) : balanceUser > 0 ? (
                <p className="text-body-md">
                  <span className="font-semibold">{parents[1].name}</span> te doit{' '}
                  <span className="font-bold tabular-nums">{fmtEur(balanceUser)}</span>{' '}
                  sur l'année.
                </p>
              ) : (
                <p className="text-body-md">
                  Tu dois{' '}
                  <span className="font-bold tabular-nums">{fmtEur(-balanceUser)}</span>{' '}
                  à <span className="font-semibold">{parents[1].name}</span> sur l'année.
                </p>
              )}
              <p className="text-caption opacity-80 mt-1">
                Solde basé sur le partage défini de chaque dépense (validées et en attente).
              </p>
            </div>
          )}

          <div>
            <p className="text-label-sm uppercase tracking-wide text-on-surface-variant mb-sm">
              Dépenses mensuelles · payées par
            </p>
            <div className="space-y-1">
              <div className="flex items-end gap-1 h-40">
                {months.map((m, i) => {
                  const heightPct = (m.totalCents / maxMonth) * 100
                  return (
                    <div
                      key={i}
                      className="flex-1 h-full flex items-end"
                      title={`${MONTHS_FR[i]} ${year} — ${fmtEur(m.totalCents)}`}
                    >
                      <div
                        className="w-full flex flex-col-reverse rounded-t-md overflow-hidden bg-surface-container-low/60"
                        style={{
                          height: `${heightPct}%`,
                          minHeight: m.totalCents > 0 ? 4 : 0,
                        }}
                      >
                        {parents.map((p) => {
                          const cents = m.paid[p.id] ?? 0
                          if (cents === 0) return null
                          const pct = (cents / m.totalCents) * 100
                          return (
                            <div
                              key={p.id}
                              className={p.color.bar}
                              style={{ height: `${pct}%` }}
                              title={`${p.name} — ${fmtEur(cents)}`}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-1">
                {months.map((_, i) => {
                  const isCurrent =
                    year === new Date().getFullYear() &&
                    i === new Date().getMonth()
                  return (
                    <span
                      key={i}
                      className={[
                        'flex-1 text-center text-caption tabular-nums',
                        isCurrent
                          ? 'font-bold text-primary'
                          : 'text-on-surface-variant',
                      ].join(' ')}
                    >
                      {MONTHS_FR[i]}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-md flex-wrap">
            {parents.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <span className={['h-3 w-3 rounded-sm', p.color.bar].join(' ')} />
                <span className="text-caption text-on-surface-variant">
                  Payé par {p.name}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
