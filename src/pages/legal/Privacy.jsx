import LegalLayout, { LegalSection, LegalContact } from '../../components/layout/LegalLayout'

export default function Privacy() {
  return (
    <LegalLayout title="Politique de confidentialité" updatedAt="23 avril 2026">
      <p>
        La présente politique de confidentialité décrit la manière dont{' '}
        <strong>Parenty</strong> (exploité par Christian Grohens) collecte,
        utilise et protège vos données personnelles lorsque vous utilisez
        l'Application. Elle est rédigée en conformité avec le Règlement
        Général sur la Protection des Données (RGPD — règlement UE 2016/679)
        et la loi Informatique et Libertés.
      </p>

      <LegalSection title="Responsable du traitement">
        <p>Le responsable du traitement des données est :</p>
        <LegalContact />
      </LegalSection>

      <LegalSection title="Données collectées">
        <p>
          Parenty collecte uniquement les données strictement nécessaires au
          fonctionnement de l'Application :
        </p>

        <div className="space-y-sm">
          <div className="card-flat p-md">
            <p className="font-semibold text-on-surface">Données d'identification</p>
            <ul className="list-disc pl-6 text-on-surface-variant mt-1">
              <li>Adresse email (obligatoire, utilisée pour la connexion)</li>
              <li>Mot de passe (stocké chiffré, jamais lisible par l'éditeur)</li>
              <li>Prénom, nom (optionnels)</li>
              <li>Numéro de téléphone (optionnel)</li>
              <li>Photo de profil (optionnelle)</li>
            </ul>
          </div>

          <div className="card-flat p-md">
            <p className="font-semibold text-on-surface">Données familiales</p>
            <ul className="list-disc pl-6 text-on-surface-variant mt-1">
              <li>Prénoms et dates de naissance des enfants que vous ajoutez</li>
              <li>Événements d'agenda (titre, horaires, type, description)</li>
              <li>Dépenses (montant, catégorie, description, justificatif)</li>
              <li>Documents téléversés</li>
              <li>Messages échangés avec le co-parent</li>
            </ul>
          </div>

          <div className="card-flat p-md">
            <p className="font-semibold text-on-surface">Données techniques</p>
            <ul className="list-disc pl-6 text-on-surface-variant mt-1">
              <li>Identifiants de session et jetons d'authentification</li>
              <li>Historique des modifications (créations, mises à jour,
                annulations) pour la traçabilité familiale</li>
              <li>Horodatage des actions (création, dernière connexion)</li>
            </ul>
          </div>
        </div>

        <p>
          <strong>Aucune donnée de géolocalisation</strong>,{' '}
          <strong>aucun tracker publicitaire</strong> et{' '}
          <strong>aucun outil d'analyse comportementale tiers</strong> ne sont
          utilisés.
        </p>
      </LegalSection>

      <LegalSection title="Finalités du traitement">
        <p>Vos données sont utilisées exclusivement pour :</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Fournir les fonctionnalités de l'Application (agenda partagé,
            gestion des dépenses, messagerie, stockage de documents)</li>
          <li>Permettre la connexion sécurisée et la récupération de votre compte</li>
          <li>Assurer la traçabilité des modifications entre co-parents</li>
          <li>Répondre à vos demandes de support</li>
          <li>Respecter nos obligations légales et réglementaires</li>
        </ul>
        <p>
          <strong>Vos données ne sont jamais vendues, louées ou cédées à des
          tiers</strong> à des fins commerciales.
        </p>
      </LegalSection>

      <LegalSection title="Base légale">
        <p>Le traitement de vos données repose sur :</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>L'exécution du contrat</strong> : les données nécessaires au
            fonctionnement du service que vous avez choisi d'utiliser</li>
          <li><strong>Votre consentement</strong> : pour les informations
            optionnelles (téléphone, photo)</li>
          <li><strong>Nos obligations légales</strong> : conservation à des fins
            comptables ou en cas de litige</li>
        </ul>
      </LegalSection>

      <LegalSection title="Durée de conservation">
        <p>
          Vos données sont conservées pour la durée nécessaire aux finalités
          décrites ci-dessus :
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Données de compte : tant que votre compte est actif</li>
          <li>Données familiales : conservées tant que la famille existe, sauf
            suppression de votre part</li>
          <li>Historique des modifications : <strong>10 ans</strong> à compter
            de l'action, pour permettre une traçabilité sur la durée de la
            minorité d'un enfant</li>
          <li>Logs techniques : <strong>12 mois</strong> maximum</li>
        </ul>
        <p>
          Sur demande de suppression de votre compte, vos données personnelles
          sont effacées sous 30 jours, à l'exception des éléments que nous
          sommes tenus de conserver pour des raisons légales (anonymisés
          lorsque possible).
        </p>
      </LegalSection>

      <LegalSection title="Hébergement et transferts">
        <p>
          Vos données sont hébergées au sein de l'Union européenne (région
          Francfort, Allemagne) via Supabase Inc. L'application elle-même est
          distribuée par Vercel Inc. (États-Unis). Aucune donnée personnelle
          ou familiale n'est transférée aux serveurs de Vercel — seul le code
          de l'interface y est hébergé.
        </p>
      </LegalSection>

      <LegalSection title="Sécurité">
        <p>
          Parenty met en œuvre les mesures techniques et organisationnelles
          suivantes pour protéger vos données :
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Chiffrement des échanges (HTTPS/TLS)</li>
          <li>Chiffrement au repos des fichiers et mots de passe</li>
          <li>Politiques de contrôle d'accès au niveau de la base (Row Level
            Security) : chaque utilisateur ne peut accéder qu'aux données de
            sa propre famille</li>
          <li>Authentification par jetons expirant automatiquement</li>
          <li>Sauvegardes régulières</li>
        </ul>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Droit d'accès</strong> : obtenir une copie de vos données</li>
          <li><strong>Droit de rectification</strong> : corriger des données
            inexactes</li>
          <li><strong>Droit à l'effacement</strong> (« droit à l'oubli »)</li>
          <li><strong>Droit à la limitation</strong> du traitement</li>
          <li><strong>Droit à la portabilité</strong> : recevoir vos données
            dans un format lisible</li>
          <li><strong>Droit d'opposition</strong></li>
          <li><strong>Droit de retirer votre consentement</strong> à tout moment</li>
        </ul>
        <p>
          Pour exercer ces droits, contactez-nous à{' '}
          <a
            href="mailto:support@javachrist.fr"
            className="text-primary font-semibold hover:underline"
          >
            support@javachrist.fr
          </a>
          . Une réponse vous sera apportée sous 30 jours maximum.
        </p>
        <p>
          Si vous estimez, après nous avoir contactés, que vos droits ne sont
          pas respectés, vous pouvez adresser une réclamation à la CNIL :{' '}
          <a
            href="https://www.cnil.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold hover:underline"
          >
            cnil.fr
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Cookies et stockage local">
        <p>
          Parenty n'utilise <strong>aucun cookie publicitaire ni cookie de
          traçage</strong>. L'Application stocke localement dans votre
          navigateur :
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Votre jeton de session (pour rester connecté)</li>
          <li>Un éventuel jeton d'invitation en cours (temporaire, effacé
            après utilisation)</li>
          <li>Le cache de l'application (Service Worker PWA) pour permettre
            un fonctionnement hors-ligne</li>
        </ul>
        <p>
          Ces éléments sont strictement techniques et ne nécessitent pas de
          consentement préalable.
        </p>
      </LegalSection>

      <LegalSection title="Modifications">
        <p>
          La présente politique peut être amenée à évoluer. Toute modification
          substantielle vous sera notifiée via l'Application ou par email avant
          sa prise d'effet.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
