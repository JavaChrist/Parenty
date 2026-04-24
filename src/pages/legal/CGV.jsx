import LegalLayout, { LegalSection, LegalContact } from '../../components/layout/LegalLayout'

export default function CGV() {
  return (
    <LegalLayout title="Conditions générales de vente" updatedAt="24 avril 2026">
      <p>
        Les présentes Conditions Générales de Vente (ci-après « CGV »)
        régissent les relations contractuelles entre Christian Grohens
        (ci-après « l'Éditeur ») et toute personne physique (ci-après
        « le Client ») souscrivant à l'offre payante{' '}
        <strong>Parenty Premium</strong>.
      </p>

      <LegalSection title="1. Identification du vendeur">
        <LegalContact />
        <p>SIRET : 338 593 312 — RCS Toulouse.</p>
      </LegalSection>

      <LegalSection title="2. Offres proposées">
        <p>Parenty est proposé selon deux formules :</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Plan gratuit</strong> : accès à l'ensemble des
            fonctionnalités de l'Application (agenda, dépenses, documents,
            messagerie, invitation du co-parent), avec une limite de{' '}
            <strong>1&nbsp;enfant par espace familial</strong>.
          </li>
          <li>
            <strong>Parenty Premium</strong> : accès identique, sans
            limitation du nombre d'enfants, au tarif de{' '}
            <strong>6,99&nbsp;€&nbsp;TTC par mois</strong>, sans
            engagement de durée, résiliable à tout moment depuis
            l'Application.
          </li>
        </ul>
        <p>
          Aucune période d'essai gratuite n'est proposée : la souscription
          déclenche immédiatement l'ouverture de l'accès Premium et le
          premier prélèvement.
        </p>
      </LegalSection>

      <LegalSection title="3. Tarif et modalités de paiement">
        <p>
          Le tarif de l'abonnement Parenty Premium est de{' '}
          <strong>6,99&nbsp;€ TTC par mois</strong>, TVA française
          applicable. Le prélèvement est mensuel et reconduit
          automatiquement à chaque échéance.
        </p>
        <p>
          Le paiement s'effectue par carte bancaire ou tout autre moyen de
          paiement proposé par le prestataire, via la plateforme{' '}
          <strong>Mollie B.V.</strong> (Keizersgracht 313, 1016 EE
          Amsterdam, Pays-Bas), prestataire de paiement agréé en qualité
          d'établissement de monnaie électronique.
        </p>
        <p>
          <strong>Aucune donnée bancaire n'est conservée par l'Éditeur.</strong>{' '}
          Les coordonnées de paiement sont collectées et traitées
          exclusivement par Mollie, conformément à ses propres conditions
          et à la réglementation PCI-DSS.
        </p>
      </LegalSection>

      <LegalSection title="4. Souscription et durée">
        <p>
          L'abonnement Parenty Premium est souscrit pour une durée
          mensuelle. Il est <strong>reconduit tacitement</strong> chaque
          mois à la date anniversaire de la souscription, sauf résiliation
          par le Client avant cette date.
        </p>
        <p>
          La résiliation peut être effectuée à tout moment, sans motif et
          sans pénalité, depuis l'Application (<em>Profil → Résilier
          l'abonnement</em>) ou par email auprès du support à{' '}
          <a
            href="mailto:support@javachrist.fr"
            className="text-primary font-semibold hover:underline"
          >
            support@javachrist.fr
          </a>
          . Elle prend effet <strong>à la fin de la période mensuelle en
          cours déjà payée</strong>, sans prorata temporis : aucun nouveau
          prélèvement ne sera effectué et l'accès Premium reste actif
          jusqu'à la date d'échéance.
        </p>
      </LegalSection>

      <LegalSection title="5. Droit de rétractation">
        <p>
          Conformément à l'article L.221-18 du Code de la consommation, le
          Client consommateur dispose d'un délai de{' '}
          <strong>14 jours</strong> à compter de la souscription pour
          exercer son droit de rétractation, sans avoir à justifier de
          motifs ni à payer de pénalités.
        </p>
        <p>
          Toutefois, en activant immédiatement l'accès au service Premium,
          le Client reconnaît expressément demander l'exécution immédiate de
          la prestation et <strong>renoncer à son droit de
          rétractation</strong>, conformément à l'article L.221-28
          du Code de la consommation.
        </p>
        <p>
          Pour exercer ce droit de rétractation (lorsqu'il est applicable),
          le Client doit notifier sa décision par email à{' '}
          <a
            href="mailto:support@javachrist.fr"
            className="text-primary font-semibold hover:underline"
          >
            support@javachrist.fr
          </a>
          {' '}en précisant ses coordonnées et la référence de la commande.
        </p>
      </LegalSection>

      <LegalSection title="6. Remboursement">
        <p>
          En cas d'exercice valide du droit de rétractation, l'Éditeur
          rembourse l'intégralité des sommes versées, au plus tard dans les
          14 jours suivant la notification de la rétractation, sur le moyen
          de paiement utilisé lors de la souscription.
        </p>
        <p>
          Les paiements déjà effectués pour des périodes précédant la
          résiliation ne sont pas remboursables, sauf situation
          exceptionnelle appréciée par l'Éditeur (erreur de facturation,
          indisponibilité prolongée du service).
        </p>
      </LegalSection>

      <LegalSection title="7. Facturation">
        <p>
          Un reçu électronique est émis à chaque paiement par le
          prestataire Mollie et transmis par email à l'adresse renseignée
          par le Client. L'historique des prélèvements est également
          consultable à tout moment dans l'Application, depuis{' '}
          <em>Profil → Historique des paiements</em>.
        </p>
        <p>
          Le Client peut demander l'émission d'une facture nominative par
          email à{' '}
          <a
            href="mailto:support@javachrist.fr"
            className="text-primary font-semibold hover:underline"
          >
            support@javachrist.fr
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="8. Modification des tarifs">
        <p>
          L'Éditeur se réserve le droit de modifier ses tarifs à tout
          moment. Toute modification tarifaire applicable aux abonnements
          en cours sera notifiée au Client par email, au moins{' '}
          <strong>30 jours</strong> avant sa prise d'effet. Le Client
          disposera alors de la faculté de résilier son abonnement sans
          pénalité avant l'application des nouveaux tarifs.
        </p>
      </LegalSection>

      <LegalSection title="9. Suspension en cas de non-paiement">
        <p>
          En cas d'échec répété du prélèvement (insuffisance de provision,
          carte expirée, opposition), l'accès aux fonctionnalités Premium
          pourra être suspendu après notification par email et un délai
          raisonnable pour régulariser la situation.
        </p>
        <p>
          La suspension n'entraîne pas la suppression des données :
          l'utilisateur conserve l'accès aux fonctionnalités gratuites et
          peut réactiver son abonnement à tout moment.
        </p>
      </LegalSection>

      <LegalSection title="10. Service client">
        <p>
          Pour toute question, réclamation ou demande relative à votre
          abonnement, vous pouvez contacter le service client :
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            Par email :{' '}
            <a
              href="mailto:support@javachrist.fr"
              className="text-primary font-semibold hover:underline"
            >
              support@javachrist.fr
            </a>
          </li>
          <li>Par téléphone : +33 9 52 62 31 71</li>
        </ul>
        <p>Une réponse vous sera apportée dans un délai raisonnable (48h ouvrées).</p>
      </LegalSection>

      <LegalSection title="11. Responsabilité et garanties">
        <p>
          L'Éditeur est soumis aux garanties légales de conformité (articles
          L.217-4 et suivants du Code de la consommation) et contre les
          vices cachés (articles 1641 et suivants du Code civil).
        </p>
        <p>
          Pour les Clients non-consommateurs (usage professionnel), toute
          responsabilité de l'Éditeur est limitée au montant effectivement
          payé par le Client au titre des 12 derniers mois.
        </p>
      </LegalSection>

      <LegalSection title="12. Médiation et litiges">
        <p>
          Conformément à l'article L.612-1 du Code de la consommation, le
          Client consommateur a la possibilité de recourir gratuitement à
          un médiateur de la consommation en cas de litige non résolu à
          l'amiable.
        </p>
        <p>
          Les présentes CGV sont régies par le droit français. À défaut de
          résolution amiable, les tribunaux français seront seuls
          compétents.
        </p>
        <p>
          Conformément au règlement (UE) n°524/2013, la plateforme
          européenne de règlement en ligne des litiges est accessible à
          l'adresse suivante :{' '}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-semibold hover:underline"
          >
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
