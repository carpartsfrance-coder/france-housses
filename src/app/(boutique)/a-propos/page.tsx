import type { Metadata } from 'next'
import Link from 'next/link'
import { commercialTerms, dureeGarantie, formatPrice, identity } from '@/lib/identity'
import { getSeuilLivraisonOfferte } from '@/lib/shipping'
import { Article, PageLegale } from '@/components/legal/PageLegale'

export const metadata: Metadata = {
  title: 'Qui sommes-nous',
  description:
    'France Housses fabrique des housses de siège et des tapis sur mesure pour voiture, utilitaire, camping-car et poids lourd, depuis 1986. Société basée à Mont-de-Marsan.',
  alternates: { canonical: '/a-propos' },
}

const MISE_A_JOUR = '15 novembre 2026'

/**
 * Qui sommes-nous — France Housses.
 *
 * Le texte reprend ce que l'ancien site disait de l'entreprise (depuis 1986,
 * le camion magasin qui sillonne la France, plus de 500 références, fabrication
 * française et européenne), sans rien ajouter qui ne soit établi.
 */
export default async function Page() {
  const seuil = await getSeuilLivraisonOfferte()
  const garantie = dureeGarantie()
  const retour = commercialTerms.returnWindowDays
  const { legal, contact } = identity

  return (
    <PageLegale
      titre="Qui sommes-nous"
      chapeau={`${identity.name}, la housse de siège sur mesure depuis 1986.`}
      miseAJour={MISE_A_JOUR}
    >
      <Article numero={1} id="histoire" titre="Depuis 1986, au contact des conducteurs">
        <p>
          Depuis 1986, le camion magasin de France Housses sillonne la France de ville en ville. Ce
          contact permanent avec nos clients nous a donné une connaissance précise de la housse de
          voiture : ce qui tient, ce qui s’use, ce qui va vraiment sur un siège.
        </p>
        <p>
          Plus de 500 références de housses, tapis et accessoires pour l’auto, le camping-car,
          l’utilitaire et le poids lourd sont disponibles dans le camion — et toutes sont
          désormais en ligne.
        </p>
      </Article>

      <Article numero={2} id="sur-mesure" titre="Le sur mesure, véhicule par véhicule">
        <p>
          Une housse sur mesure reprend la forme exacte des sièges d’origine, avec les découpes
          prévues pour les appuie-tête, les accoudoirs et les ceintures. Vous choisissez votre
          véhicule — type, marque, modèle, version — et le site ne vous montre que ce qui lui est
          destiné, avec le croquis de vos sièges.
        </p>
        <p>
          Votre véhicule n’est pas dans la liste ? Nos gammes fabriquées à la commande partent de la
          description que vous nous donnez : marque, modèle, finition, nombre de places, accoudoirs,
          appuie-tête. Fabrication française et européenne selon les gammes.
        </p>
      </Article>

      <Article numero={3} id="engagements" titre="Nos engagements">
        <ul className="list-disc pl-5">
          {garantie ? (
            <li>
              <strong>Garantie {garantie}</strong> sur tous nos produits.{' '}
              <Link href="/garanties" className="underline underline-offset-2">
                Ce qui est couvert
              </Link>
            </li>
          ) : null}
          {seuil ? (
            <li>
              <strong>Livraison offerte dès {formatPrice(seuil)}</strong> en France.
            </li>
          ) : null}
          <li>
            <strong>Expédition sous 24 h ouvrées</strong> pour les produits en stock, en France, en
            Belgique et au Luxembourg.{' '}
            <Link href="/livraison-retours" className="underline underline-offset-2">
              Tarifs et délais
            </Link>
          </li>
          {retour ? (
            <li>
              <strong>{retour} jours pour changer d’avis</strong> sur les produits standard (le sur
              mesure en est exclu par la loi).
            </li>
          ) : null}
          <li>
            <strong>Compatibles airbags latéraux</strong> : nos housses ont une couture qui s’ouvre
            au déclenchement de l’airbag.
          </li>
          <li>
            <strong>Une vraie personne pour vous répondre</strong>, du lundi au vendredi, de 9 h à
            12 h et de 14 h à 17 h{contact.phone ? <> au {contact.phone}</> : null}.
          </li>
        </ul>
      </Article>

      <Article numero={4} id="societe" titre="Qui est derrière France Housses">
        <p>
          <strong>{legal.companyName ?? identity.name}</strong>, société française
          {legal.address ? <>, dont le siège est au {legal.address}</> : null}.
          {identity.showroom ? <> Notre showroom vous accueille au {identity.showroom}.</> : null}
        </p>
        <p className="text-[12px] text-muted-strong">
          {[legal.legalForm, legal.capital ? `capital ${legal.capital}` : null, legal.siret ? `SIRET ${legal.siret}` : null, legal.rcs, legal.vatNumber ? `TVA ${legal.vatNumber}` : null]
            .filter(Boolean)
            .join(' · ')}
          . Toutes les mentions sur la page{' '}
          <Link href="/mentions-legales" className="underline underline-offset-2">
            Mentions légales
          </Link>
          .
        </p>
        {identity.avis ? (
          <p>
            Nos clients nous notent{' '}
            <a href={identity.avis.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
              {identity.avis.note} sur la {identity.avis.label}
            </a>
            .
          </p>
        ) : null}
      </Article>

      <Article numero={5} id="contact" titre="Nous joindre">
        <p>
          Une question sur une housse, sur la configuration de vos sièges ou sur une commande ?
          Écrivez-nous depuis le{' '}
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
          {contact.phone ? <>, ou appelez-nous au {contact.phone}</> : null}.
        </p>
      </Article>
    </PageLegale>
  )
}
