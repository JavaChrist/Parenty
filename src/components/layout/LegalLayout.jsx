import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

/**
 * Mise en page commune aux pages légales (Mentions, Privacy, CGU, CGV).
 *
 * Ces pages sont volontairement accessibles **sans authentification** — il
 * est obligatoire (RGPD, LCEN) que ces contenus soient consultables par
 * tout visiteur, même non-inscrit. Elles sont donc montées à la racine du
 * router, hors ProtectedRoute.
 *
 * Le contenu est formaté via des classes `prose-like` définies inline ici
 * (pas de @tailwindcss/typography pour éviter d'alourdir le bundle).
 */
export default function LegalLayout({ title, updatedAt, children }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/40">
        <div className="max-w-2xl mx-auto flex items-center gap-md px-4 h-16">
          <Link
            to="/"
            className="p-2 -ml-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant"
            aria-label="Retour"
          >
            <ArrowLeft size={20} />
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 font-display text-h3 font-extrabold tracking-tight text-primary"
          >
            <img
              src="/icons/logo64.png"
              alt=""
              className="h-8 w-8 rounded-lg"
              width="32"
              height="32"
            />
            <span>Parenty</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="h-title mb-2">{title}</h1>
        {updatedAt && (
          <p className="text-caption text-on-surface-variant mb-lg">
            Dernière mise à jour : {updatedAt}
          </p>
        )}

        <article className="space-y-md text-body-md text-on-surface leading-relaxed">
          {children}
        </article>

        <div className="mt-xl pt-lg border-t border-outline-variant/40">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-caption text-primary font-semibold"
          >
            <ArrowLeft size={14} />
            Retour à Parenty
          </Link>
        </div>
      </main>
    </div>
  )
}

/**
 * Sous-composants réutilisables pour structurer le contenu légal de façon
 * cohérente entre les 4 pages.
 */
export function LegalSection({ title, children }) {
  return (
    <section className="space-y-sm">
      <h2 className="h-section text-h3 text-on-surface pt-md">{title}</h2>
      <div className="space-y-sm text-on-surface-variant">{children}</div>
    </section>
  )
}

export function LegalContact() {
  return (
    <div className="card-flat p-md text-on-surface-variant space-y-1 text-body-md">
      <p className="font-semibold text-on-surface">Christian Grohens</p>
      <p>5, rue Maurice Fonvieille</p>
      <p>31120 Portet-sur-Garonne, France</p>
      <p className="pt-sm">
        Email :{' '}
        <a
          href="mailto:support@javachrist.fr"
          className="text-primary font-semibold hover:underline"
        >
          support@javachrist.fr
        </a>
      </p>
      <p>Téléphone : +33 9 52 62 31 71</p>
    </div>
  )
}
