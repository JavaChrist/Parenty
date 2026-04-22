import { useState } from 'react'
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
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useFamily } from '../hooks/useFamily'
import { useFamilyMembers } from '../hooks/useFamilyMembers'
import { useChildren } from '../hooks/useChildren'
import { useRemoveChild } from '../hooks/useChildrenMutations'
import Modal from '../components/ui/Modal'
import AddChildForm from '../components/profile/AddChildForm'
import InviteCoParentForm from '../components/profile/InviteCoParentForm'

export default function Profile() {
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const { data: familyData } = useFamily()
  const { data: members = [] } = useFamilyMembers()
  const { data: children = [] } = useChildren()
  const removeChild = useRemoveChild()

  const [addChildOpen, setAddChildOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

  const initial = (user?.email?.[0] ?? 'P').toUpperCase()
  const prenom = user?.email?.split('@')[0] ?? 'Parent'
  const family = familyData?.family
  const myRole = familyData?.familyMember?.role
  const otherMembers = members.filter((m) => m.user_id !== user?.id)
  const hasCoParent = otherMembers.length > 0

  return (
    <div className="space-y-lg">
      <header>
        <h1 className="h-title">Profil & Paramètres</h1>
      </header>

      {/* Identité */}
      <section className="card-elevated p-lg flex flex-col items-center text-center">
        <div className="h-20 w-20 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-display text-h2 font-bold">
          {initial}
        </div>
        <h2 className="h-section text-h3 mt-md capitalize">{prenom}</h2>
        <p className="text-body-md text-on-surface-variant">{user?.email}</p>
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
            otherMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-md">
                <div className="h-11 w-11 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-semibold">
                  <Users size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-body-md font-semibold text-on-surface">
                    Co-parent
                  </p>
                  <p className="text-caption text-on-surface-variant">
                    Membre depuis le{' '}
                    {new Date(m.joined_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <span className="pill-primary">Actif</span>
              </div>
            ))
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
          <SettingRow icon={User} label="Informations personnelles" />
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
          <SettingRow icon={FileText} label="Mentions légales" href="/mentions-legales" />
          <SettingRow icon={Shield} label="Politique de confidentialité" href="/privacy" />
          <SettingRow icon={FileText} label="CGU" href="/cgu" />
          <SettingRow icon={FileText} label="CGV" href="/cgv" />
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
    </div>
  )
}

function SettingRow({ icon: Icon, label, hint, href, onClick }) {
  const Tag = href ? 'a' : 'button'
  return (
    <Tag
      href={href}
      onClick={onClick}
      type={Tag === 'button' ? 'button' : undefined}
      className="w-full flex items-center gap-md p-md hover:bg-surface-container-low transition-colors text-left"
    >
      <div className="h-10 w-10 rounded-full bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body-md font-semibold text-on-surface">{label}</p>
        {hint && <p className="text-caption text-on-surface-variant">{hint}</p>}
      </div>
      <ChevronRight size={18} className="text-on-surface-variant flex-shrink-0" />
    </Tag>
  )
}
