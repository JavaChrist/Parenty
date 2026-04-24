/**
 * Couleurs stables par parent, calculées à partir de l'UUID user_id.
 * On veut :
 *   - Un code couleur visible et contrasté
 *   - La même couleur pour un même user à travers toutes les sessions
 *   - Classes Tailwind statiques (car tailwind ne génère pas de classes
 *     dynamiques, d'où cette palette limitée)
 */
const PALETTE = [
  {
    bg: 'bg-blue-100',
    text: 'text-blue-900',
    dot: 'bg-blue-500',
    border: 'border-blue-300',
    bar: 'bg-blue-400',
  },
  {
    bg: 'bg-orange-100',
    text: 'text-orange-900',
    dot: 'bg-orange-500',
    border: 'border-orange-300',
    bar: 'bg-orange-400',
  },
  {
    bg: 'bg-emerald-100',
    text: 'text-emerald-900',
    dot: 'bg-emerald-500',
    border: 'border-emerald-300',
    bar: 'bg-emerald-400',
  },
  {
    bg: 'bg-rose-100',
    text: 'text-rose-900',
    dot: 'bg-rose-500',
    border: 'border-rose-300',
    bar: 'bg-rose-400',
  },
]

function hashString(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

export function custodyColorFor(userId) {
  if (!userId) return PALETTE[0]
  return PALETTE[hashString(userId) % PALETTE.length]
}
