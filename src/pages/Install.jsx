import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import {
  ArrowLeft,
  Smartphone,
  Apple,
  Share2,
  Printer,
  Check,
  Copy,
} from 'lucide-react'

/**
 * Page publique d'installation — sert à la fois de page web partageable et de
 * flyer imprimable A4. Contient un QR code qui pointe vers la racine de l'app
 * et deux notices pas-à-pas (Android / iOS).
 *
 * Layout print optimisé pour tenir sur UNE seule page A4 :
 *   - @page définit une marge raisonnable (1 cm)
 *   - notices Android + iOS forcées en 2 colonnes
 *   - header, boutons et éléments "web" masqués
 *   - signature JavaChrist en pied de page
 *
 * Route publique (pas d'authentification) : c'est le point d'entrée pour
 * quelqu'un qui reçoit l'appli par mail, QR code, signature mail, etc.
 */
export default function Install() {
  // L'URL partagée via QR doit TOUJOURS être joignable depuis un autre appareil.
  // En dev (`npm run dev` sur localhost:5173), on force donc l'URL publique :
  // sinon le QR scanné depuis un téléphone pointerait vers le PC de dev
  // → "site inaccessible" chez le testeur.
  // On réutilise VITE_APP_URL déjà défini pour les liens d'invitation.
  const installUrl = useMemo(() => {
    const envUrl = import.meta.env.VITE_APP_URL
    const fallback = 'https://parenty.vercel.app/'

    if (typeof window !== 'undefined') {
      const host = window.location.host
      const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1')
      if (!isLocal) {
        return `${window.location.protocol}//${host}/`
      }
    }

    if (envUrl) return envUrl.endsWith('/') ? envUrl : `${envUrl}/`
    return fallback
  }, [])

  const prettyUrl = useMemo(
    () => installUrl.replace(/^https?:\/\//, '').replace(/\/$/, ''),
    [installUrl]
  )

  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(installUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API indisponible (contexte non sécurisé par ex) — silencieux.
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Parenty',
          text: 'Organisation parentale partagée, simple et factuelle.',
          url: installUrl,
        })
      } catch {
        // L'utilisateur a annulé le partage — on ne fait rien.
      }
    } else {
      handleCopy()
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Règles d'impression A4 compactes — marges serrées pour tenir en 1 page.
          Le layout print est en flex column avec min-height = hauteur A4 utile,
          pour que la signature JavaChrist soit poussée en bas (mt-auto). */}
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm 14mm; }
          html, body { background: white !important; }
          .page-print {
            max-width: 100% !important;
            min-height: calc(297mm - 24mm);
            display: flex;
            flex-direction: column;
          }
          .page-print > footer { margin-top: auto; }
        }
      `}</style>

      {/* Header — masqué à l'impression */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/40 print:hidden">
        <div className="max-w-3xl mx-auto flex items-center gap-md px-4 h-16">
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

      <main className="page-print max-w-3xl mx-auto px-4 py-8 print:py-0 print:px-0">
        {/* Bloc QR code — titre Parenty au-dessus, QR centré, URL en dessous */}
        <section className="card-elevated p-lg md:p-xl flex flex-col items-center gap-md print:p-4 print:gap-2 print:shadow-none print:border print:border-outline-variant print:rounded-lg">
          <div className="flex items-center gap-2 print:gap-2">
            <img
              src="/icons/logo64.png"
              alt=""
              className="h-12 w-12 rounded-lg print:h-10 print:w-10"
              width="48"
              height="48"
            />
            <p className="font-display text-display text-primary font-extrabold leading-none print:text-3xl">
              Parenty
            </p>
          </div>

          <p className="text-body-md text-on-surface-variant text-center print:text-sm">
            Organisation parentale partagée, simple et factuelle.
          </p>

          <div className="flex-shrink-0 bg-white p-4 rounded-xl border border-outline-variant print:p-2">
            <QRCodeSVG
              value={installUrl}
              size={180}
              level="M"
              includeMargin={false}
              imageSettings={{
                src: '/icons/logo96.png',
                height: 36,
                width: 36,
                excavate: true,
              }}
            />
          </div>

          <p className="text-body-md text-on-surface-variant text-center max-w-md print:text-sm">
            Scanne ce QR code pour installer l'application sur ton téléphone.
          </p>
          <p className="hidden print:block text-xs text-on-surface-variant text-center">
            Ou ouvre directement :{' '}
            <span className="font-semibold text-on-surface">{prettyUrl}</span>
          </p>

          <div className="flex items-center gap-2 justify-center print:hidden">
            <code className="text-caption text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-md truncate max-w-full">
              {installUrl}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant flex-shrink-0"
              aria-label="Copier le lien"
              title={copied ? 'Copié' : 'Copier le lien'}
            >
              {copied ? (
                <Check size={16} className="text-primary" />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>
        </section>

        {/* Actions — masquées à l'impression */}
        <div className="flex flex-wrap gap-sm justify-center mt-lg print:hidden">
          <button
            type="button"
            onClick={handleShare}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Share2 size={16} />
            Partager le lien
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Printer size={16} />
            Imprimer cette page
          </button>
        </div>

        {/* Notices d'installation — forcées en 2 colonnes à l'impression */}
        <section className="mt-xl space-y-lg print:mt-4 print:space-y-2">
          <h2 className="h-title text-center print:text-base print:font-bold print:mb-1">
            Comment installer Parenty ?
          </h2>

          <div className="grid md:grid-cols-2 gap-lg print:grid-cols-2 print:gap-3">
            <InstallGuide
              icon={<Smartphone size={28} strokeWidth={2.2} />}
              title="Sur Android"
              subtitle="avec Chrome"
              steps={[
                <>
                  Ouvre <strong>Chrome</strong> et va sur{' '}
                  <code className="bg-surface-container-low px-1.5 py-0.5 rounded text-caption">
                    {prettyUrl}
                  </code>
                </>,
                <>
                  Tape les <strong>⋮ trois points</strong> en haut à droite,
                  puis <strong>« Installer l'application »</strong>.
                </>,
                <>
                  Confirme avec <strong>Installer</strong>. L'icône apparaît
                  sur l'écran d'accueil.
                </>,
                <>
                  Utilise <strong>l'icône</strong> désormais, pas le
                  navigateur.
                </>,
              ]}
            />

            <InstallGuide
              icon={<Apple size={28} strokeWidth={2.2} />}
              title="Sur iPhone / iPad"
              subtitle="avec Safari"
              steps={[
                <>
                  Ouvre <strong>Safari</strong> (pas Chrome sur iOS) et va sur{' '}
                  <code className="bg-surface-container-low px-1.5 py-0.5 rounded text-caption">
                    {prettyUrl}
                  </code>
                </>,
                <>
                  Tape le bouton <strong>Partager</strong> (carré + flèche vers
                  le haut) en bas.
                </>,
                <>
                  Fais défiler et choisis{' '}
                  <strong>« Sur l'écran d'accueil »</strong>.
                </>,
                <>
                  Confirme avec <strong>Ajouter</strong>. L'icône apparaît sur
                  l'écran d'accueil.
                </>,
              ]}
            />
          </div>
        </section>

        {/* Bloc rassurant — web & print (compact à l'impression) */}
        <section className="mt-xl card-flat p-lg space-y-sm text-body-md text-on-surface-variant print:mt-3 print:p-3 print:shadow-none print:border print:border-outline-variant print:rounded-md print:space-y-1 print:text-[11px] print:leading-snug">
          <div className="flex items-center gap-2 text-on-surface font-semibold print:text-xs">
            <span className="h-2 w-2 rounded-full bg-primary print:h-1.5 print:w-1.5" />
            <span>Pas d'App Store, pas de téléchargement</span>
          </div>
          <p>
            Parenty est une application web progressive (<strong>PWA</strong>).
            Elle s'installe directement depuis ton navigateur, sans passer par
            le Play Store ni l'App Store. Elle fonctionne comme une vraie
            application : icône sur l'écran d'accueil, ouverture en plein
            écran, fonctionne même sans réseau pour les données déjà chargées.
          </p>
          <p className="print:hidden">
            Tes données sont hébergées en Europe (Francfort) et chiffrées au
            repos. Pour en savoir plus, consulte la{' '}
            <Link
              to="/privacy"
              className="text-primary font-semibold hover:underline"
            >
              politique de confidentialité
            </Link>
            .
          </p>
          <p className="hidden print:block">
            Données hébergées en Europe (Francfort), chiffrées au repos — RGPD.
          </p>
        </section>

        {/* Footer / signature JavaChrist — mode print compact */}
        <footer className="mt-xl pt-lg border-t border-outline-variant/40 print:mt-4 print:pt-3 print:border-outline-variant">
          {/* Version web (visible à l'écran uniquement) */}
          <div className="text-center text-caption text-on-surface-variant space-y-1 print:hidden">
            <p className="font-semibold text-on-surface">
              Parenty — {prettyUrl}
            </p>
            <p>Organisation parentale partagée, simple et factuelle.</p>
            <p className="pt-sm">
              <Link
                to="/"
                className="text-primary font-semibold hover:underline"
              >
                Retour à Parenty
              </Link>
            </p>
          </div>

          {/* Version print : signature JavaChrist compacte */}
          <div className="hidden print:flex items-center justify-between gap-md text-xs">
            <div className="flex items-center gap-2">
              <img
                src="/icons/javachrist.png"
                alt="JavaChrist"
                className="h-8 w-8"
                width="32"
                height="32"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div className="leading-tight">
                <p className="font-bold text-on-surface">JavaChrist</p>
                <p className="text-on-surface-variant">
                  Christian Grohens — Autoentrepreneur
                </p>
              </div>
            </div>
            <div className="text-right leading-tight text-on-surface-variant">
              <p className="font-semibold text-on-surface">{prettyUrl}</p>
              <p>
                <a
                  href="mailto:support@javachrist.fr"
                  className="text-on-surface-variant"
                >
                  support@javachrist.fr
                </a>
                {' · '}javachrist.fr
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

function InstallGuide({ icon, title, subtitle, steps }) {
  return (
    <div className="card p-lg space-y-md print:shadow-none print:border print:border-outline-variant print:p-3 print:space-y-2 print:rounded-md">
      <div className="flex items-center gap-md print:gap-2">
        <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 print:h-8 print:w-8">
          <span className="print:scale-75">{icon}</span>
        </div>
        <div>
          <h3 className="text-h3 font-semibold text-on-surface leading-tight print:text-sm">
            {title}
          </h3>
          <p className="text-caption text-on-surface-variant print:text-[10px]">
            {subtitle}
          </p>
        </div>
      </div>
      <ol className="space-y-sm print:space-y-1">
        {steps.map((step, i) => (
          <li
            key={i}
            className="flex items-start gap-md text-body-md print:gap-2 print:text-[11px] print:leading-snug"
          >
            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-container text-on-primary-container text-label-sm font-bold flex items-center justify-center print:h-4 print:w-4 print:text-[9px]">
              {i + 1}
            </span>
            <span className="text-on-surface-variant pt-0.5 leading-relaxed print:pt-0 print:leading-snug">
              {step}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
