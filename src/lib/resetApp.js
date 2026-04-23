/**
 * Nettoyage nucléaire de l'appli côté navigateur.
 *
 * Désenregistre tous les service workers, vide tous les caches (CacheStorage),
 * efface localStorage + sessionStorage, puis recharge la page. C'est LE filet
 * de sécurité en cas de SW corrompu ou de cache Supabase pollué (auth.uid()
 * null alors que la session semble valide, splash infini, etc.).
 *
 * Usage : bouton "Réinitialiser l'appli" du splash d'App.jsx, ou appel manuel
 * depuis la console en debug (`window.__parentyReset?.()`).
 */
export async function resetApp() {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((r) => r.unregister()))
    }

    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }

    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {
      // Stockage peut être bloqué (mode navigation privée) — on ignore.
    }
  } catch (err) {
    console.error('[resetApp] erreur pendant le nettoyage', err)
  } finally {
    // `location.reload(true)` est deprecated mais on veut bypasser tout cache HTTP.
    window.location.href = `/?rescue=${Date.now()}`
  }
}

// Expose un handle global pour debug depuis la console.
if (typeof window !== 'undefined') {
  window.__parentyReset = resetApp
}
