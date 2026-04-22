import LegalLayout, { LegalSection } from '../../components/layout/LegalLayout'

export default function CGU() {
  return (
    <LegalLayout title="Conditions générales d'utilisation" updatedAt="23 avril 2026">
      <p>
        Les présentes Conditions Générales d'Utilisation (ci-après « CGU »)
        régissent l'accès et l'utilisation de l'application{' '}
        <strong>Parenty</strong> (ci-après « l'Application »), éditée par
        Christian Grohens.
      </p>
      <p>
        En créant un compte sur Parenty, vous reconnaissez avoir lu, compris
        et accepté sans réserve les présentes CGU. Si vous ne les acceptez
        pas, vous ne devez pas utiliser l'Application.
      </p>

      <LegalSection title="1. Objet">
        <p>
          Parenty est un service en ligne destiné à faciliter l'organisation
          parentale partagée entre deux co-parents, séparés ou non, autour
          d'un ou plusieurs enfants communs. L'Application propose notamment :
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Un agenda familial partagé (gardes, vacances, rendez-vous)</li>
          <li>Un suivi des dépenses communes avec validation par l'autre parent</li>
          <li>Un espace de stockage de documents</li>
          <li>Une messagerie entre co-parents</li>
          <li>Un historique traçable des modifications</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Accès au service">
        <p>
          L'accès à Parenty est réservé aux personnes physiques majeures
          (18 ans ou plus) disposant de la capacité juridique pour contracter.
        </p>
        <p>
          La création d'un compte nécessite la fourniture d'une adresse email
          valide et d'un mot de passe. Vous êtes seul responsable de la
          confidentialité de vos identifiants. Toute action effectuée sous
          votre compte est réputée être de votre fait.
        </p>
        <p>
          L'accès au service est proposé à titre gratuit pour les
          fonctionnalités essentielles. Certaines fonctionnalités étendues
          peuvent faire l'objet d'un abonnement payant, régi par les
          Conditions Générales de Vente (CGV).
        </p>
      </LegalSection>

      <LegalSection title="3. Compte et famille">
        <p>
          Chaque utilisateur crée un compte individuel et peut constituer une
          « famille » (espace partagé). Un utilisateur ne peut appartenir
          qu'à une seule famille à la fois.
        </p>
        <p>
          L'invitation d'un co-parent se fait par email. Le co-parent invité
          doit accepter explicitement l'invitation pour rejoindre l'espace
          familial. Un lien d'invitation a une validité limitée (7 jours).
        </p>
      </LegalSection>

      <LegalSection title="4. Comportement de l'utilisateur">
        <p>Vous vous engagez à utiliser l'Application de manière loyale et à
          ne pas :</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Publier de contenus illégaux, injurieux, diffamatoires,
            menaçants, discriminatoires ou portant atteinte à la dignité
            humaine</li>
          <li>Utiliser l'Application à des fins commerciales, publicitaires
            ou de prospection</li>
          <li>Tenter de contourner les mesures de sécurité de l'Application</li>
          <li>Utiliser l'Application pour surveiller, harceler ou nuire à
            quiconque, notamment à un co-parent ou aux enfants</li>
          <li>Téléverser des contenus dont vous ne détenez pas les droits</li>
          <li>Automatiser l'accès au service (bots, scrapers) sans
            autorisation préalable</li>
        </ul>
        <p>
          Parenty n'a pas vocation à servir de preuve dans une procédure
          judiciaire contre un co-parent. L'historique conservé par
          l'Application est un outil de mémoire partagée, pas un dispositif
          de surveillance.
        </p>
      </LegalSection>

      <LegalSection title="5. Contenus publiés par l'utilisateur">
        <p>
          Vous restez propriétaire des contenus que vous publiez (messages,
          documents, photos, descriptions). Vous accordez à l'éditeur une
          licence non-exclusive et gratuite pour stocker, afficher et
          transmettre ces contenus aux autres membres de votre famille, dans
          le seul but de faire fonctionner le service.
        </p>
        <p>
          Vous garantissez détenir tous les droits nécessaires sur les
          contenus publiés et déclarez assumer seul la responsabilité de leur
          contenu.
        </p>
      </LegalSection>

      <LegalSection title="6. Disponibilité et évolutions">
        <p>
          L'éditeur s'efforce de maintenir l'Application accessible 24h/24,
          7j/7, sans garantie de disponibilité ininterrompue. Des périodes
          de maintenance, de mise à jour ou d'indisponibilité technique
          peuvent survenir.
        </p>
        <p>
          L'éditeur se réserve le droit de faire évoluer, modifier ou
          supprimer à tout moment tout ou partie des fonctionnalités, sans
          préavis. En cas de modification substantielle défavorable pour
          l'utilisateur, un délai raisonnable de notification sera respecté.
        </p>
      </LegalSection>

      <LegalSection title="7. Responsabilité">
        <p>
          Parenty est fourni « en l'état ». L'éditeur ne peut être tenu
          responsable :
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Des pertes ou dommages liés à une indisponibilité temporaire du
            service</li>
          <li>De l'exactitude des informations saisies par les utilisateurs</li>
          <li>Des éventuels conflits entre co-parents utilisant l'Application</li>
          <li>De la perte de données résultant d'une action de l'utilisateur
            (suppression de compte, erreur de manipulation)</li>
        </ul>
        <p>
          L'utilisateur est responsable de la sauvegarde de ses données
          sensibles. Des fonctionnalités d'export pourront être proposées à
          cet effet.
        </p>
      </LegalSection>

      <LegalSection title="8. Résiliation">
        <p>
          Vous pouvez supprimer votre compte à tout moment depuis
          l'Application ou en contactant le support. La suppression entraîne
          l'effacement de vos données personnelles sous 30 jours, sous
          réserve des obligations légales de conservation.
        </p>
        <p>
          L'éditeur se réserve le droit de suspendre ou de résilier votre
          compte en cas de manquement grave aux présentes CGU, notamment en
          cas d'usage frauduleux, malveillant ou contraire à la loi.
        </p>
      </LegalSection>

      <LegalSection title="9. Propriété intellectuelle">
        <p>
          Le code source de l'Application, son design, son nom, ses logos et
          tout élément qui la compose sont la propriété exclusive de
          Christian Grohens, à l'exception des contenus publiés par les
          utilisateurs. Toute utilisation non autorisée est constitutive de
          contrefaçon.
        </p>
      </LegalSection>

      <LegalSection title="10. Protection des données">
        <p>
          Les modalités de collecte, d'utilisation et de protection de vos
          données personnelles sont détaillées dans notre{' '}
          <a
            href="/privacy"
            className="text-primary font-semibold hover:underline"
          >
            Politique de confidentialité
          </a>
          , à laquelle vous adhérez en acceptant les présentes CGU.
        </p>
      </LegalSection>

      <LegalSection title="11. Modifications des CGU">
        <p>
          L'éditeur peut modifier les présentes CGU à tout moment. Toute
          modification substantielle fera l'objet d'une notification par
          email ou via l'Application, au moins 15 jours avant sa prise
          d'effet. Sans résiliation de votre part dans ce délai, les
          nouvelles CGU seront réputées acceptées.
        </p>
      </LegalSection>

      <LegalSection title="12. Droit applicable et litiges">
        <p>
          Les présentes CGU sont soumises au droit français. En cas de
          litige, les parties tenteront de trouver une solution amiable. À
          défaut, les tribunaux compétents seront ceux du ressort du
          domicile du défendeur conformément aux règles du Code de procédure
          civile.
        </p>
        <p>
          Conformément à l'article L.612-1 du Code de la consommation, vous
          pouvez recourir gratuitement à un médiateur de la consommation en
          vue de la résolution amiable d'un litige.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
