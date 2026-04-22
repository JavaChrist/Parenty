import LegalLayout, { LegalSection, LegalContact } from '../../components/layout/LegalLayout'

export default function CGV() {
  return (
    <LegalLayout title="Conditions générales de vente" updatedAt="23 avril 2026">
      <div className="card-flat p-md bg-primary-container/40">
        <p className="text-on-primary-container">
          <strong>À noter :</strong> à ce jour, l'ensemble des fonctionnalités
          de Parenty est proposé à titre gratuit. Les présentes CGV
          s'appliqueront dès la mise en place d'une offre payante
          (abonnement « Premium »). Elles sont publiées par anticipation
          pour garantir la transparence contractuelle.
        </p>
      </div>

      <p>
        Les présentes Conditions Générales de Vente (ci-après « CGV »)
        régissent les relations contractuelles entre Christian Grohens
        (ci-après « l'Éditeur ») et toute personne physique (ci-après
        « le Client ») souscrivant à une offre payante de l'application
        <strong> Parenty</strong>.
      </p>

      <LegalSection title="1. Identification du vendeur">
        <LegalContact />
        <p>SIRET : 338 593 312 — RCS Toulouse.</p>
      </LegalSection>

      <LegalSection title="2. Offres proposées">
        <p>
          Parenty est actuellement proposé en offre gratuite, avec
          certaines limitations d'usage. L'offre payante « Premium », qui
          sera prochainement disponible, donnera accès à l'ensemble des
          fonctionnalités sans limitation.
        </p>
        <p>
          Les caractéristiques, prix et conditions exactes de l'offre
          Premium seront précisés lors de son lancement, directement dans
          l'Application et sur le site web de l'Éditeur.
        </p>
      </LegalSection>

      <LegalSection title="3. Tarif et modalités de paiement">
        <p>
          Les prix sont indiqués en euros (EUR), toutes taxes comprises
          (TVA française applicable). Le paiement s'effectue par carte
          bancaire via un prestataire de paiement sécurisé agréé.
        </p>
        <p>
          Aucune donnée bancaire n'est conservée par l'Éditeur. Les
          coordonnées de paiement sont collectées et traitées directement
          par le prestataire de paiement, selon ses propres conditions.
        </p>
      </LegalSection>

      <LegalSection title="4. Souscription et durée">
        <p>
          L'abonnement Premium est souscrit pour une durée mensuelle ou
          annuelle selon l'offre choisie par le Client. Il est reconduit
          tacitement à chaque échéance, sauf résiliation par le Client avant
          la date de reconduction.
        </p>
        <p>
          La résiliation peut être effectuée à tout moment depuis
          l'Application (paramètres du compte) ou par email auprès du
          support. Elle prend effet à la fin de la période en cours, sans
          prorata.
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
          Une facture électronique est émise à chaque paiement et mise à
          disposition du Client dans son espace personnel. Le Client peut
          également en demander copie par email.
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
