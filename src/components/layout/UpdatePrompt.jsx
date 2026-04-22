import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'

/**
 * Banner affiché quand une nouvelle version de l'app est disponible côté
 * service worker. Sans lui, un utilisateur peut rester bloqué plusieurs
 * jours sur un ancien bundle (fréquent en PWA installée : l'onglet ne se
 * ferme jamais vraiment).
 *
 * L'autre pattern utile (`onOfflineReady`) est aussi exposé mais on ne
 * l'affiche pas pour rester discret — l'app fonctionne déjà sans réseau
 * pour les pages déjà visitées.
 */
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      if (!registration) return
      // Vérifie périodiquement s'il y a une nouvelle version — utile pour
      // les PWA installées qui restent ouvertes des jours. 30 min est un bon
      // compromis entre fraîcheur et bande passante.
      setInterval(() => {
        registration.update().catch(() => {})
      }, 30 * 60 * 1000)
    },
    onRegisterError(err) {
      // En dev (npm run dev) le SW n'est pas généré : l'erreur est attendue.
      console.warn('[PWA] Erreur d\'enregistrement du service worker', err)
    },
  })

  if (!needRefresh) return null

  return (
    <div
      role="status"
      className="fixed bottom-24 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[60] card-elevated p-md bg-primary-container animate-slide-up"
    >
      <div className="flex items-start gap-md">
        <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center text-primary flex-shrink-0">
          <RefreshCw size={18} strokeWidth={2.25} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body-md font-semibold text-on-primary-container">
            Nouvelle version disponible
          </p>
          <p className="text-caption text-on-primary-container/80 mt-0.5">
            Recharge pour profiter des dernières améliorations.
          </p>
          <div className="flex gap-2 mt-sm">
            <button
              type="button"
              onClick={() => updateServiceWorker(true)}
              className="btn-primary !py-1.5 !text-label-sm"
            >
              Mettre à jour
            </button>
            <button
              type="button"
              onClick={() => setNeedRefresh(false)}
              className="btn-secondary !py-1.5 !text-label-sm"
            >
              Plus tard
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="p-1 rounded-full text-on-primary-container/60 hover:text-on-primary-container hover:bg-primary/10 transition-colors flex-shrink-0"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
