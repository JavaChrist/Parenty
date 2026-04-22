/**
 * Gestion du "token d'invitation en attente".
 *
 * Quand un user arrive via un lien d'invitation mais n'est pas encore connecté,
 * il doit s'inscrire (signup) puis confirmer son email. Entre ces deux étapes,
 * le query param `?token=...` est perdu : on le persiste donc en localStorage.
 *
 * Une fois la session créée et l'invitation consommée, on nettoie le storage.
 *
 * Utilisé dans :
 *  - AcceptInvite.jsx       (stocke + nettoie)
 *  - SignUp.jsx             (stocke avant l'appel signUp)
 *  - SignIn.jsx             (optionnel — permet de relancer le flow)
 *  - RequireFamily.jsx      (lit pour détourner vers /invite?token=xxx)
 */

const STORAGE_KEY = 'parenty:pending_invite_token'

export function setPendingInviteToken(token) {
  if (!token || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, token)
  } catch {
    // quota / mode privé — on ignore silencieusement
  }
}

export function getPendingInviteToken() {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function clearPendingInviteToken() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
