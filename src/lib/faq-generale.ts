import 'server-only'
import { commercialTerms, dureeGarantie, formatPrice } from './identity'
import { getZonesDeLivraison } from './shipping'
import { leVehicule } from './types-produit'

/**
 * Questions fréquentes par défaut, tant que le back-office n'en publie pas.
 *
 * Ce sont les questions qu'un client se pose avant un premier achat sur une
 * boutique qu'il ne connaît pas. **Chaque réponse est tirée de la
 * configuration** (garantie, livraison, retours) ou de ce que le site fait
 * réellement : rien ne peut annoncer un tarif ou une durée qui ne serait pas
 * celui du panier. Des questions publiées en base (`FaqItem`, portée
 * « general ») prennent la place de celles-ci.
 */
export type QuestionReponse = { question: string; answer: string }

export async function faqGeneraleParDefaut(): Promise<QuestionReponse[]> {
  const zones = await getZonesDeLivraison()
  const france = zones.find((zone) => zone.countries.includes('FR'))
  const offre = france?.offres
    .slice()
    .sort((a, b) => a.priceCents - b.priceCents)[0]
  const garantie = dureeGarantie()
  const retour = commercialTerms.returnWindowDays

  const questions: Array<QuestionReponse | null> = [
    {
      question: 'Comment être sûr que la housse convient à mon véhicule ?',
      answer:
        'Choisissez votre véhicule (type, marque, modèle, version) : le site ne vous montre que les housses prévues pour lui. Vérifiez aussi le nombre de places et comparez vos sièges au croquis de la fiche. En cas de doute, appelez-nous au 05 58 93 95 39 ou envoyez-nous une photo de vos sièges : nous vérifions avant la fabrication.',
    },
    {
      question: 'Les housses sont-elles compatibles avec les airbags latéraux ?',
      answer:
        'Oui. Nos housses ont une couture qui s’ouvre au déclenchement de l’airbag latéral, sans le retarder. Elles sont aussi compatibles avec les sièges chauffants.',
    },
    {
      question: 'Quel est le délai de fabrication ?',
      answer:
        'Les produits en stock partent sous 24 h ouvrées. Une housse ou un tapis sur mesure est fabriqué à la commande : le délai (15 à 35 jours ouvrés selon la gamme) est indiqué sur la fiche et rappelé à la commande.',
    },
    garantie
      ? {
          question: 'Quelle est la garantie ?',
          answer: `Tous nos produits sont garantis ${garantie} à compter de la livraison. Le détail est sur la page Garanties.`,
        }
      : null,
    offre
      ? {
          question: 'Combien coûte la livraison, et en combien de temps ?',
          answer: [
            `${offre.label}${offre.carrier ? ` (${offre.carrier})` : ''} : ${formatPrice(offre.priceCents)}`,
            offre.freeFromCents ? `, offerte dès ${formatPrice(offre.freeFromCents)} d’achat en France` : '',
            offre.minDays && offre.maxDays
              ? `. Délai estimé : ${offre.minDays} à ${offre.maxDays} jours ouvrés après l’expédition.`
              : '.',
            ' Le prix exact est toujours affiché dans le panier, avant le paiement.',
          ].join(''),
        }
      : null,
    retour
      ? {
          question: 'Puis-je retourner un produit ?',
          answer: `Les produits standard (universels, accessoires) : oui, vous avez ${retour} jours à compter de la réception pour changer d’avis, frais de retour à votre charge. Les housses et tapis fabriqués sur mesure ne sont pas concernés par le droit de rétractation (article L221-28 du code de la consommation) : vérifiez bien votre véhicule avant de commander.`,
        }
      : null,
    {
      question: 'Le paiement est-il sécurisé ?',
      answer:
        'Oui. Vous payez par carte bancaire sur une page de paiement sécurisée : votre numéro de carte ne nous est jamais transmis.',
    },
    {
      question: 'Comment entretenir mes housses ?',
      answer:
        'Les housses en tissu se lavent en machine à 30 °C (programme délicat, essorage doux) ou à la main. Le simili cuir se nettoie d’un coup d’éponge humide ou d’un chiffon doux imbibé d’eau savonneuse.',
    },
  ]

  return questions.filter((question): question is QuestionReponse => question !== null)
}

/**
 * Questions par défaut d'une fiche produit, tant que le back-office ne lui en
 * donne pas (`product.faq`).
 *
 * Sans elles, la fiche n'avait aucune section « Vos questions » : le client
 * qui hésite repartait chercher ailleurs ce qu'il voulait savoir. Ce sont les
 * questions générales, sauf le paiement (déjà dit dans le bloc d'achat), avec
 * en tête la compatibilité, dite pour le véhicule de la fiche quand on le
 * connaît. Elles ne partent pas en données structurées : le même texte sur des
 * milliers de fiches n'apporte rien à Google.
 */
export async function faqFicheParDefaut(
  concuPour: string | null,
  nomDuProduit = '',
  moto = false,
): Promise<QuestionReponse[]> {
  const generales = await faqGeneraleParDefaut()
  const autres = generales.filter(
    (question) => !question.question.startsWith('Le paiement') && !question.question.startsWith('Comment être sûr'),
  )
  const compatibilite: QuestionReponse = concuPour
    ? {
        question: 'Cette housse convient-elle à mon véhicule ?',
        answer: `Elle est prévue pour ${leVehicule(concuPour, moto)}. Vérifiez le nombre de places et comparez vos sièges au croquis de la fiche. En cas de doute sur votre version, appelez-nous ou écrivez-nous avant de commander : nous vérifions.`,
      }
    : generales.find((question) => question.question.startsWith('Comment être sûr')) ?? generales[0]
  void nomDuProduit
  return [compatibilite, ...autres]
}
