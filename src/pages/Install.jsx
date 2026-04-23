import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import {
  ArrowLeft,
  Smartphone,
  Apple,
  Download,
  Share2,
  Printer,
  Check,
  Copy,
} from 'lucide-react'

/**
 * Page publique d'installation — sert à la fois de page web partageable et de
 * flyer imprimable. Contient un QR code qui pointe vers la racine de l'app et
 * deux notices pas-à-pas (Android / iOS) adaptées aux deux navigateurs
 * d'installation "officiels" : Chrome et Safari.
 *
 * Volontairement accessible sans authentification (route publique) : c'est le
 * point d'entrée pour quelqu'un qui reçoit l'appli par mail, par QR code sur
 * un flyer, par un lien dans une signature mail, etc.
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
  const [copied, setCopied] = useState(false)
  const printRef = useRef(null)

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

      <main ref={printRef} className="max-w-3xl mx-auto px-4 py-8 print:py-4">
        {/* Bloc QR code — toujours affiché, premier à l'impression */}
        <section className="card-elevated p-lg md:p-xl flex flex-col md:flex-row items-center gap-lg print:shadow-none print:border print:border-outline-variant">
          <div className="flex-shrink-0 bg-white p-4 rounded-xl border border-outline-variant">
            <QRCodeSVG
              value={installUrl}
              size={192}
              level="M"
              includeMargin={false}
              imageSettings={{
                src: '/icons/logo96.png',
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          </div>

          <div className="text-center md:text-left space-y-sm flex-1 min-w-0">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <img
                src="/icons/logo64.png"
                alt=""
                className="h-10 w-10 rounded-lg"
                width="40"
                height="40"
              />
              <p className="font-display text-display text-primary font-extrabold leading-none">
                Parenty
              </p>
            </div>
            <p className="text-body-lg text-on-surface-variant">
              Scanne ce QR code pour installer l'application sur ton téléphone.
            </p>
            <div className="flex items-center gap-2 justify-center md:justify-start pt-2 print:hidden">
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

        {/* Notices d'installation */}
        <section className="mt-xl space-y-lg">
          <h2 className="h-title text-center">Comment installer Parenty ?</h2>

          <div className="grid md:grid-cols-2 gap-lg">
            <InstallGuide
              icon={<Smartphone size={28} strokeWidth={2.2} />}
              title="Sur Android"
              subtitle="avec Chrome"
              steps={[
                <>
                  Ouvre <strong>Chrome</strong> et va sur{' '}
                  <code className="bg-surface-container-low px-1.5 py-0.5 rounded text-caption">
                    parenty.vercel.app
                  </code>
                </>,
                <>
                  Tape les <strong>⋮ trois points</strong> en haut à droite,
                  puis <strong>« Installer l'application »</strong> (ou
                  <strong> « Ajouter à l'écran d'accueil »</strong>).
                </>,
                <>
                  Confirme avec <strong>Installer</strong>. L'icône Parenty
                  apparaît sur ton écran d'accueil.
                </>,
                <>
                  Utilise <strong>l'icône</strong> à partir de maintenant, pas
                  le navigateur.
                </>,
              ]}
            />

            <InstallGuide
              icon={<Apple size={28} strokeWidth={2.2} />}
              title="Sur iPhone / iPad"
              subtitle="avec Safari"
              steps={[
                <>
                  Ouvre <strong>Safari</strong> (pas Chrome sur iOS, Apple
                  réserve l'installation à Safari) et va sur{' '}
                  <code className="bg-surface-container-low px-1.5 py-0.5 rounded text-caption">
                    parenty.vercel.app
                  </code>
                </>,
                <>
                  Tape le bouton <strong>Partager</strong> (carré avec flèche
                  vers le haut) en bas de l'écran.
                </>,
                <>
                  Fais défiler et choisis{' '}
                  <strong>« Sur l'écran d'accueil »</strong>.
                </>,
                <>
                  Confirme avec <strong>Ajouter</strong>. L'icône apparaît sur
                  ton écran d'accueil.
                </>,
              ]}
            />
          </div>
        </section>

        {/* Bloc rassurant */}
        <section className="mt-xl card-flat p-lg space-y-sm text-body-md text-on-surface-variant print:mt-lg print:shadow-none print:border print:border-outline-variant">
          <div className="flex items-center gap-2 text-on-surface font-semibold">
            <Download size={18} className="text-primary" />
            <span>Pas d'App Store, pas de téléchargement</span>
          </div>
          <p>
            Parenty est une application web progressive (<strong>PWA</strong>).
            Elle s'installe directement depuis ton navigateur, sans passer par
            le Play Store ni l'App Store. Elle fonctionne comme une vraie
            application : icône sur l'écran d'accueil, ouverture en plein
            écran, fonctionne même sans réseau pour les données déjà chargées.
          </p>
          <p>
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
        </section>

        {/* Footer imprimable */}
        <footer className="mt-xl pt-lg border-t border-outline-variant/40 text-center text-caption text-on-surface-variant space-y-1 print:mt-lg">
          <p className="font-semibold text-on-surface">
            Parenty — {installUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </p>
          <p>Organisation parentale partagée, simple et factuelle.</p>
          <p className="print:hidden">
            <Link to="/" className="text-primary font-semibold hover:underline">
              Retour à Parenty
            </Link>
          </p>
        </footer>
      </main>
    </div>
  )
}

function InstallGuide({ icon, title, subtitle, steps }) {
  return (
    <div className="card p-lg space-y-md print:shadow-none print:border print:border-outline-variant">
      <div className="flex items-center gap-md">
        <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-h3 font-semibold text-on-surface leading-tight">
            {title}
          </h3>
          <p className="text-caption text-on-surface-variant">{subtitle}</p>
        </div>
      </div>
      <ol className="space-y-sm">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-md text-body-md">
            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-container text-on-primary-container text-label-sm font-bold flex items-center justify-center">
              {i + 1}
            </span>
            <span className="text-on-surface-variant pt-0.5 leading-relaxed">
              {step}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
