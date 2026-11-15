import type { Metadata } from 'next'
import Link from 'next/link'
import { identity } from '@/lib/identity'
import { prisma } from '@/lib/db'
import { Article, PageLegale } from '@/components/legal/PageLegale'

export const metadata: Metadata = {
  title: 'Conseils & montage',
  description:
    'Comment poser vos housses de siège et vos tapis de sol : préparation, sièges avant, banquette arrière, airbags latéraux, tapis et entretien.',
  alternates: { canonical: '/guides' },
}

const MISE_A_JOUR = '15 novembre 2026'

/**
 * Conseils de montage.
 *
 * Remplace le gabarit « page non encore construite » vers lequel pointaient
 * l'en-tête, le pied de page, l'aide et l'accueil (« Voir les guides de
 * montage »).
 *
 * **Que des règles générales, vraies pour tous les véhicules.** Rien ici ne
 * décrit un modèle en particulier : l'accès à un feu varie d'une voiture à
 * l'autre, et une consigne fausse pour un véhicule ferait casser une agrafe ou
 * perdre une heure. Ce qui dépend du véhicule renvoie vers l'équipe. Les
 * guides par véhicule (table `Guide`) viendront s'ajouter sous cette page.
 */
export default async function Page() {
  const contact = identity.contact
  const guides = await prisma.guide
    .findMany({
      where: { publishedAt: { not: null } },
      orderBy: { title: 'asc' },
      select: { slug: true, title: true, summary: true },
    })
    .catch(() => [])

  return (
    <PageLegale
      titre="Conseils & montage"
      chapeau="Les gestes qui valent pour tous les véhicules. Une notice et, pour beaucoup de gammes, une vidéo de montage accompagnent chaque housse ; pour le reste, notre équipe vous répond."
      miseAJour={MISE_A_JOUR}
    >
      <Article numero={1} id="avant" titre="Avant de commencer">
        <ul className="list-disc pl-5">
          <li>
            Vérifiez que la housse correspond à vos sièges : nombre de places, banquette entière ou
            fractionnée, accoudoirs, appuie-tête. Le croquis de la fiche produit vous aide à
            comparer.
          </li>
          <li>
            Sortez les housses de leur emballage quelques heures avant la pose, de préférence dans
            une pièce tempérée : la matière se détend et se pose plus facilement.
          </li>
          <li>
            Aspirez les sièges, reculez les sièges avant au maximum et retirez les appuie-tête.
            Comptez environ une heure pour un véhicule complet.
          </li>
        </ul>
      </Article>

      <Article numero={2} id="sieges-avant" titre="Sièges avant">
        <ul className="list-disc pl-5">
          <li>
            <strong>Commencez par le dossier</strong> : enfilez la housse par le haut, en la
            descendant de façon égale des deux côtés, coutures alignées sur les bords du siège.
          </li>
          <li>
            Passez les sangles et les élastiques <strong>entre le dossier et l&apos;assise</strong>,
            puis accrochez-les sous le siège. Ne les attachez jamais sur un câble, un rail ou un
            mécanisme de réglage.
          </li>
          <li>
            Posez ensuite l&apos;assise, tendez-la de l&apos;avant vers l&apos;arrière et fixez-la
            sous le siège avec les crochets fournis.
          </li>
          <li>Remettez les appuie-tête, puis enfilez leur housse.</li>
        </ul>
      </Article>

      <Article numero={3} id="airbags" titre="Airbags latéraux : le point à respecter">
        <p>
          Si vos sièges ont un airbag latéral (étiquette « AIRBAG » sur le côté du dossier), la
          housse porte une <strong>couture spéciale ou une découpe</strong> qui s&apos;ouvre au
          déclenchement. Placez-la exactement du côté de l&apos;airbag, sans rien ajouter par-dessus
          : pas d&apos;épingle, pas de sangle supplémentaire, pas de coussin.
        </p>
      </Article>

      <Article numero={4} id="banquette" titre="Banquette arrière">
        <p>
          Sur la plupart des véhicules, l&apos;assise de la banquette se soulève ou se déclipse :
          c&apos;est plus simple de la retirer pour poser la housse. Sur une banquette fractionnée,
          posez chaque partie séparément et vérifiez que le rabattement fonctionne encore. Gardez
          les boucles de ceinture et les fixations Isofix accessibles par les ouvertures prévues.
        </p>
      </Article>

      <Article numero={5} id="tapis" titre="Tapis de sol">
        <ul className="list-disc pl-5">
          <li>
            Retirez les anciens tapis : <strong>ne superposez jamais deux tapis</strong> côté
            conducteur, ils peuvent gêner les pédales.
          </li>
          <li>
            Fixez le tapis conducteur sur les plots ou crochets d&apos;origine du véhicule, puis
            vérifiez qu&apos;il ne glisse pas et n&apos;accroche aucune pédale, enfoncée à fond.
          </li>
        </ul>
      </Article>

      <Article numero={6} id="entretien" titre="Entretien">
        <ul className="list-disc pl-5">
          <li>
            Suivez l&apos;étiquette d&apos;entretien de votre gamme. En général : aspirateur et
            nettoyage à l&apos;éponge humide avec un savon doux ; pas de javel ni de solvant.
          </li>
          <li>
            Les tapis moquette s&apos;aspirent et se brossent ; les tapis caoutchouc se rincent à
            l&apos;eau claire.
          </li>
        </ul>
      </Article>

      {guides.length > 0 ? (
        <Article numero={7} id="guides" titre="Guides par véhicule">
          <ul className="list-disc pl-5">
            {guides.map((guide) => (
              <li key={guide.slug}>
                <Link href={`/guides/${guide.slug}`} className="underline underline-offset-2">
                  {guide.title}
                </Link>
                {guide.summary ? <span className="text-muted-strong"> — {guide.summary}</span> : null}
              </li>
            ))}
          </ul>
        </Article>
      ) : null}

      <Article numero={guides.length > 0 ? 8 : 7} id="aide" titre="Besoin d'aide pour votre véhicule ?">
        <p>
          Envoyez-nous le modèle et l&apos;année de votre véhicule, et si possible une photo de
          vos sièges, depuis le{' '}
          <Link href={contact.contactPath} className="underline underline-offset-2">
            formulaire de contact
          </Link>
          {contact.email ? (
            <>
              {' '}
              ou à{' '}
              <a href={`mailto:${contact.email}`} className="underline underline-offset-2">
                {contact.email}
              </a>
            </>
          ) : null}
          . Nous vous expliquons la pose pour votre véhicule.
        </p>
      </Article>
    </PageLegale>
  )
}
