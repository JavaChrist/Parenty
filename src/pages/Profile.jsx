import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  User,
  Users,
  Bell,
  Crown,
  ChevronRight,
  LogOut,
  Shield,
  FileText,
  Plus,
  UserPlus,
  Baby,
  Trash2,
  Lock,
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useFamily } from '../hooks/useFamily'
import { useFamilyMembers } from '../hooks/useFamilyMembers'
import { useChildren } from '../hooks/useChildren'
import { useRemoveChild } from '../hooks/useChildrenMutations'
import { useMyProfile, useProfiles, getAvatarUrl } from '../hooks/useProfile'
import Modal from '../components/ui/Modal'
import AddChildForm from '../components/profile/AddChildForm'
import InviteCoParentForm from '../components/profile/InviteCoParentForm'
import PersonalInfoForm from '../components/profile/PersonalInfoForm'
import ChangePasswordForm from '../components/profile/ChangePasswordForm'

export default function Profile() {
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const { data: familyData } = useFamily()
  const { data: members = [] } = useFamilyMembers()
  const { data: children = [] } = useChildren()
  const removeChild = useRemoveChild()
  const { data: myProfile } = useMyProfile()

  const [addChildOpen, setAddChildOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [personalInfoOpen, setPersonalInfoOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

  // Deep-link : /profile?edit=personal ouvre directement la modale d'édition
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    if (searchParams.get('edit') === 'personal') {
      setPersonalInfoOpen(true)
      searchParams.delete('edit')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const prenom = myProfile?.first_name?.trim() || user?.email?.split('@')[0] || 'Parent'
  const nomComplet =
    [myProfile?.first_name, myProfile?.last_name].filter(Boolean).join(' ').trim() || prenom
  const initial = (myProfile?.first_name?.[0] ?? user?.email?.[0] ?? 'P').toUpperCase()
  const avatarUrl = getAvatarUrl(myProfile?.avatar_path, myProfile?.updated_at)

  const family = familyData?.family
  const myRole = familyData?.familyMember?.role
  const otherMembers = members.filter((m) => m.user_id !== user?.id)
  const hasCoParent = otherMembers.length > 0

  const coParentIds = otherMembers.map((m) => m.user_id)
  const { data: coParentProfiles = {} } = useProfiles(coParentIds)

  return (
    <div className="space-y-lg">
      <header>
        <h1 className="h-title">Profil & Paramètres</h1>
      </header>

      {/* Identité */}
      <section className="card-elevated p-lg flex flex-col items-center text-center">
        <div className="h-20 w-20 rounded-full overflow-hidden bg-primary-container flex items-center justify-center text-on-primary-container font-display text-h2 font-bold">
          {avatarUrl ? (
            <img src={avatarUrl} alt={nomComplet} className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <h2 className="h-section text-h3 mt-md capitalize">{nomComplet}</h2>
        <p className="text-body-md text-on-surface-variant">{user?.email}</p>
        {myProfile?.phone && (
          <p className="text-caption text-on-surface-variant mt-0.5">{myProfile.phone}</p>
        )}
        {family && (
          <span className="pill-primary mt-sm">
            {family.name} · {myRole === 'owner' ? 'Owner' : 'Parent'}
          </span>
        )}
      </section>

      {/* Enfants */}
      <section className="space-y-sm">
        <div className="flex items-center justify-between px-sm">
          <h2 className="text-label-sm text-on-surface-variant uppercase tracking-wide">
            Enfants ({children.length})
          </h2>
          <button
            onClick={() => setAddChildOpen(true)}
            className="text-label-sm text-primary font-semibold inline-flex items-center gap-1"
          >
            <Plus size={16} strokeWidth={2.5} /> Ajouter
          </button>
        </div>

        {children.length === 0 ? (
          <div className="card p-lg text-center text-on-surface-variant">
            Aucun enfant pour l'instant.
          </div>
        ) : (
          <div className="card divide-y divide-outline-variant/40">
            {children.map((c) => (
              <div key={c.id} className="flex items-center gap-md p-md">
                <div className="h-11 w-11 rounded-full bg-primary-container/20 flex items-center justify-center text-primary flex-shrink-0">
                  <Baby size={20} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-semibold text-on-surface">
                    {c.first_name}
                  </p>
                  <p className="text-caption text-on-surface-variant">
                    Né·e le{' '}
                    {new Date(c.birth_date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Retirer ${c.first_name} de la famille ?`)) {
                      removeChild.mutate(c.id)
                    }
                  }}
                  className="p-2 rounded-full text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-colors"
                  aria-label="Retirer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Co-parent */}
      <section className="space-y-sm">
        <h2 className="text-label-sm text-on-surface-variant uppercase tracking-wide px-sm">
          Famille
        </h2>
        <div className="card p-md">
          {hasCoParent ? (
            otherMembers.map((m) => {
              const p = coParentProfiles[m.user_id]
              const coName =
                [p?.first_name, p?.last_name].filter(Boolean).join(' ').trim() || 'Co-parent'
              const coAvatar = getAvatarUrl(p?.avatar_path, p?.updated_at)
              const coInitial = (p?.first_name?.[0] ?? 'C').toUpperCase()
              return (
                <div key={m.id} className="flex items-center gap-md">
                  <div className="h-11 w-11 rounded-full overflow-hidden bg-primary-container flex items-center justify-center text-on-primary-container font-semibold">
                    {coAvatar ? (
                      <img src={coAvatar} alt={coName} className="h-full w-full object-cover" />
                    ) : p?.first_name ? (
                      coInitial
                    ) : (
                      <Users size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-semibold text-on-surface truncate">
                      {coName}
                    </p>
                    <p className="text-caption text-on-surface-variant">
                      Membre depuis le{' '}
                      {new Date(m.joined_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className="pill-primary">Actif</span>
                </div>
              )
            })
          ) : (
            <button
              onClick={() => setInviteOpen(true)}
              className="w-full flex items-center gap-md text-left hover:bg-surface-container-low transition-colors rounded-md -m-md p-md"
            >
              <div className="h-11 w-11 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed-variant flex-shrink-0">
                <UserPlus size={20} strokeWidth={2} />
              </div>
              <div className="flex-1">
                <p className="text-body-md font-semibold text-on-surface">
                  Inviter le co-parent
                </p>
                <p className="text-caption text-on-surface-variant">
                  Partage les dépenses, l'agenda et les documents.
                </p>
              </div>
              <ChevronRight size={18} className="text-on-surface-variant" />
            </button>
          )}
        </div>
      </section>

      {/* Réglages */}
      <section className="space-y-sm">
        <h2 className="text-label-sm text-on-surface-variant uppercase tracking-wide px-sm">
          Compte
        </h2>
        <div className="card divide-y divide-outline-variant/40">
          <SettingRow
            icon={User}
            label="Informations personnelles"
            onClick={() => setPersonalInfoOpen(true)}
          />
          <SettingRow
            icon={Lock}
            label="Mot de passe"
            onClick={() => setPasswordOpen(true)}
          />
          <SettingRow icon={Bell} label="Notifications" hint="À venir" />
        </div>
      </section>

      {/* Abonnement */}
      <section className="card-elevated p-lg bg-gradient-to-br from-tertiary-fixed to-tertiary-fixed-dim">
        <div className="flex items-start gap-md">
          <div className="h-10 w-10 rounded-full bg-white/40 flex items-center justify-center text-on-tertiary-fixed-variant">
            <Crown size={20} strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="text-label-sm text-on-tertiary-fixed-variant uppercase tracking-wide">
              Abonnement
            </p>
            <h3 className="font-display text-h3 text-on-tertiary-fixed mt-1">
              {family?.subscription_status === 'active' ? 'Premium' : 'Plan gratuit'}
            </h3>
            <p className="text-body-md text-on-tertiary-fixed-variant mt-1">
              {family?.subscription_status === 'active'
                ? 'Accès complet.'
                : 'Enfants et dépenses limités. Passe en Premium pour tout débloquer.'}
            </p>
          </div>
        </div>
        {family?.subscription_status !== 'active' && (
          <button className="btn-accent w-full mt-md" disabled>
            Passer au Premium (bientôt)
          </button>
        )}
      </section>

      {/* Légal */}
      <section className="space-y-sm">
        <h2 className="text-label-sm text-on-surface-variant uppercase tracking-wide px-sm">
          Légal
        </h2>
        <div className="card divide-y divide-outline-variant/40">
          <SettingRow icon={FileText} label="Mentions légales" to="/mentions-legales" />
          <SettingRow icon={Shield} label="Politique de confidentialité" to="/privacy" />
          <SettingRow icon={FileText} label="CGU" to="/cgu" />
          <SettingRow icon={FileText} label="CGV" to="/cgv" />
        </div>
      </section>

      <button onClick={() => signOut()} className="btn-danger w-full">
        <LogOut size={18} strokeWidth={2.5} />
        Se déconnecter
      </button>

      {/* Modales */}
      <Modal open={addChildOpen} onClose={() => setAddChildOpen(false)} title="Ajouter un enfant">
        <AddChildForm
          onSuccess={() => setAddChildOpen(false)}
          onCancel={() => setAddChildOpen(false)}
        />
      </Modal>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Inviter le co-parent">
        <InviteCoParentForm onCancel={() => setInviteOpen(false)} />
      </Modal>

      <Modal
        open={personalInfoOpen}
        onClose={() => setPersonalInfoOpen(false)}
        title="Informations personnelles"
      >
        <PersonalInfoForm
          onSuccess={() => setPersonalInfoOpen(false)}
          onCancel={() => setPersonalInfoOpen(false)}
        />
      </Modal>

      <Modal
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title="Changer de mot de passe"
      >
        <ChangePasswordForm
          onSuccess={() => setPasswordOpen(false)}
          onCancel={() => setPasswordOpen(false)}
        />
      </Modal>
    </div>
  )
}

function SettingRow({ icon: Icon, label, hint, to, onClick }) {
  const commonClasses =
    'w-full flex items-center gap-md p-md hover:bg-surface-container-low transition-colors text-left'

  const inner = (
    <>
      <div className="h-10 w-10 rounded-full bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body-md font-semibold text-on-surface">{label}</p>
        {hint && <p className="text-caption text-on-surface-variant">{hint}</p>}
      </div>
      <ChevronRight size={18} className="text-on-surface-variant flex-shrink-0" />
    </>
  )

  if (to) {
    return (
      <Link to={to} className={commonClasses}>
        {inner}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={commonClasses}>
      {inner}
    </button>
  )
}
