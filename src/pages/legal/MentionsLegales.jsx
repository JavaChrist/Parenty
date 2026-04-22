import LegalLayout, { LegalSection, LegalContact } from '../../components/layout/LegalLayout'

export default function MentionsLegales() {
  return (
    <LegalLayout title="Mentions légales" updatedAt="23 avril 2026">
      <p>
        Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour
        la confiance en l'économie numérique (LCEN), il est précisé aux
        utilisateurs de l'application <strong>Parenty</strong> l'identité des
        différents intervenants dans le cadre de sa réalisation et de son suivi.
      </p>

      <LegalSection title="Édition du site">
        <p>
          La présente application, accessible à l'URL{' '}
          <strong>parenty.vercel.app</strong> (ci-après « l'Application »), est
          éditée par :
        </p>
        <LegalContact />
        <p>
          Christian Grohens exerce en qualité d'auto-entrepreneur, inscrit au
          R.C.S. de Toulouse sous le numéro{' '}
          <strong>RCS TOULOUSE 338 593 312</strong>. Le siège social est situé
          au 5, rue Maurice Fonvieille, 31120 Portet-sur-Garonne.
        </p>
      </LegalSection>

      <LegalSection title="Directeur de la publication">
        <p>Le directeur de la publication est Christian Grohens.</p>
      </LegalSection>

      <LegalSection title="Hébergement de l'Application">
        <p>
          L'application Parenty (front-end) est hébergée par :
        </p>
        <div className="card-flat p-md text-on-surface-variant space-y-1 text-body-md">
          <p className="font-semibold text-on-surface">Vercel Inc.</p>
          <p>340 S Lemon Ave #4133</p>
          <p>Walnut, CA 91789, États-Unis</p>
          <p>
            Site :{' '}
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline"
            >
              vercel.com
            </a>
          </p>
        </div>

        <p className="pt-sm">
          Les données personnelles et applicatives (base PostgreSQL,
          authentification, stockage de fichiers) sont hébergées par :
        </p>
        <div className="card-flat p-md text-on-surface-variant space-y-1 text-body-md">
          <p className="font-semibold text-on-surface">Supabase Inc.</p>
          <p>970 Toa Payoh North #07-04</p>
          <p>Singapour 318992</p>
          <p>
            Site :{' '}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline"
            >
              supabase.com
            </a>
          </p>
          <p className="text-caption pt-sm">
            Région de stockage des données : Union européenne (Francfort).
          </p>
        </div>
      </LegalSection>

      <LegalSection title="Nous contacter">
        <p>
          Pour toute question relative à l'Application, vous pouvez nous
          contacter par les moyens suivants :
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
          <li>Par courrier : 5, rue Maurice Fonvieille, 31120 Portet-sur-Garonne</li>
        </ul>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          L'ensemble des contenus accessibles via l'Application (code source,
          textes, graphismes, logos, icônes, images, photographies,
          arborescence, design) est la propriété exclusive de Christian
          Grohens, sauf mention contraire. Toute reproduction, représentation,
          modification ou adaptation totale ou partielle, par quelque procédé
          que ce soit, est strictement interdite sans autorisation écrite
          préalable.
        </p>
      </LegalSection>

      <LegalSection title="Limitation de responsabilité">
        <p>
          L'éditeur s'efforce d'assurer au mieux de ses possibilités
          l'exactitude et la mise à jour des informations diffusées sur
          l'Application. Toutefois, il ne peut garantir l'exactitude, la
          précision ou l'exhaustivité des informations mises à disposition.
        </p>
        <p>
          L'éditeur ne saurait être tenu responsable des dommages directs ou
          indirects résultant de l'accès ou de l'utilisation de l'Application,
          incluant notamment l'inaccessibilité, les pertes de données, les
          intrusions, virus, ou tout dysfonctionnement technique.
        </p>
      </LegalSection>

      <LegalSection title="Droit applicable">
        <p>
          Les présentes mentions légales sont régies par le droit français.
          En cas de litige, et à défaut de résolution amiable, les tribunaux
          français seront seuls compétents.
        </p>
      </LegalSection>
    </LegalLayout>
  )
}
