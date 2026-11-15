/**
 * Identité commerciale et coordonnées — point unique de modification.
 *
 * La marque est **FRANCE HOUSSES**, sur le domaine france-housses.fr. Le code
 * vient de LEDVROOM (même design, mêmes fonctions).
 *
 * Changer la marque, le domaine, les coordonnées ou les conditions affichées
 * se fait ici (ou, une fois la base en place, depuis la table `Setting` qui
 * reprend les mêmes clés et prend le pas sur ces valeurs par défaut).
 *
 * Rien dans ce fichier ne doit affirmer un délai garanti, une certification ou
 * un volume de ventes : les champs correspondants restent vides tant que
 * l'information n'a pas été validée.
 */

export const identity = {
  /** Nom affiché partout : header, footer, e-mails, documents. */
  name: 'FRANCE HOUSSES',
  /** Suffixe du mot-symbole écrit en texte (e-mails, documents). */
  wordmarkSuffix: '',
  /**
   * Début du nom porté en rouge dans les rendus textuels — « FRANCE » de
   * FRANCE HOUSSES, comme sur le logotype. Les e-mails réécrivent le mot en
   * texte (beaucoup de messageries bloquent les images) : ce champ dit où le
   * couper pour retrouver les deux couleurs.
   */
  wordmarkAccent: 'FRANCE',
  baseline: 'Housses & tapis sur mesure',
  tagline: 'Housses de siège, tapis et bâches fabriqués pour votre véhicule.',

  /**
   * Identité légale de l'éditeur.
   *
   * Vérifiée au registre (Pappers / RNE) le 15 novembre 2026 à partir du SIREN
   * 488 728 254. Les champs à `null` ne sont **pas affichés** : une mention
   * légale fausse expose davantage qu'une mention absente.
   */
  legal: {
    companyName: 'FRANCE HOUSSES' as string | null,
    legalForm: 'SAS — société par actions simplifiée' as string | null,
    /** SIRET du siège. */
    siret: '488 728 254 00027' as string | null,
    vatNumber: 'FR92488728254' as string | null,
    capital: '8 000 €' as string | null,
    address: '120 rue du Docteur Grouille, 40000 Mont-de-Marsan, France' as string | null,
    city: 'Mont-de-Marsan' as string | null,
    rcs: 'RCS Mont-de-Marsan 488 728 254' as string | null,
    /** Représentant légal : le président de la SAS. */
    publicationDirector: 'Patrick Thibaut' as string | null,
    hostingProvider: 'Render Services, Inc.',
    hostingAddress: '525 Brannan Street, Suite 300, San Francisco, CA 94107, États-Unis' as
      | string
      | null,
    /**
     * Médiateur de la consommation. Obligatoire pour un vendeur en ligne
     * (art. L612-1). Aucun n'est indiqué sur l'ancien site : à renseigner dès
     * que France Housses aura adhéré à un médiateur agréé — d'ici là la
     * mention manque et l'état de l'installation le signale.
     */
    mediator: null as { name: string; url: string; address: string } | null,
  },

  contact: {
    /** Adresse affichée aux clients (page contact, pied de page, CGV…). */
    email: 'contact@france-housses.fr' as string | null,
    phone: '05 58 93 95 39' as string | null,
    /** Horaires d'assistance, affichés seulement s'ils sont renseignés. */
    hours: 'Du lundi au vendredi, 9h–12h et 14h–17h' as string | null,
    contactPath: '/contact',
    helpPath: '/aide',
  },

  /** Showroom (magasin) : affiché sur la page contact et à propos. */
  showroom: '125 avenue du Maréchal Juin (parking Action), 40000 Mont-de-Marsan' as string | null,

  /** Note réelle de la Société des Avis Garantis, avec lien vers les avis. */
  avis: {
    note: '9,2/10',
    label: 'Société des Avis Garantis',
    url: 'https://www.societe-des-avis-garantis.fr/www-france-housses-fr/',
  } as { note: string; label: string; url: string } | null,

  locale: {
    lang: 'fr',
    country: 'FR',
    currency: 'EUR',
    currencySymbol: '€',
  },
} as const

/**
 * Conditions commerciales affichées dans le bandeau haut et les réassurances.
 * `null` = information non validée → la mention n'est pas affichée.
 */
export const commercialTerms = {
  /** Seuil de livraison offerte en centimes TTC. Aucun annoncé par France Housses. */
  freeShippingThresholdCents: null as number | null,
  /** Délai de rétractation légal (produits standard ; le sur-mesure en est exclu). */
  returnWindowDays: 14 as number | null,
  /** Pas de « satisfait ou remboursé » chez France Housses. */
  satisfaitDays: null as number | null,
  /** Pas de garantie commerciale chiffrée : garanties légales seulement. */
  warrantyMonths: null as number | null,
  /** Paiement en 3 fois sans frais, à partir de ce montant (centimes TTC). */
  installmentsFromCents: 20000 as number | null,
  /** Expédition des produits en stock. */
  dispatchEstimate: 'Expédié sous 24 h ouvrées' as string | null,
} as const

export const siteConfig = {
  /** Utilisé pour les URL canoniques, les sitemaps et les e-mails. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3400',
  defaultMetaTitle: 'FRANCE HOUSSES — Housses de siège et tapis sur mesure',
  defaultMetaDescription:
    'Housses de siège, tapis de sol et bâches sur mesure pour voiture, utilitaire, camping-car et poids lourd. Choisissez votre véhicule : nous fabriquons à ses mesures. Depuis 1986.',
  /**
   * Bandeau « maquette » : visible tant que le site n'est pas ouvert.
   * Les maquettes fournies l'affichaient ; on le garde tant que des données de
   * démonstration sont présentes, pour qu'aucun visiteur ne les prenne pour
   * des données réelles.
   */
  demoBanner: process.env.NEXT_PUBLIC_DEMO_MODE !== 'off',
  demoBannerLabel: 'Préproduction · données de démonstration',
} as const

/**
 * Formate un montant en centimes : « 99,90 € », et « 80 € » pour un montant
 * rond — c'est la graphie des maquettes, et la plus lisible dans un bandeau.
 * `alwaysDecimals` force les deux décimales, pour les totaux et les documents
 * comptables où l'alignement des colonnes prime.
 */
export function formatPrice(
  cents: number,
  { withCurrency = true, alwaysDecimals = false }: { withCurrency?: boolean; alwaysDecimals?: boolean } = {},
): string {
  const isRound = cents % 100 === 0
  const value = (cents / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: alwaysDecimals || !isRound ? 2 : 0,
    maximumFractionDigits: 2,
  })
  return withCurrency ? `${value} ${identity.locale.currencySymbol}` : value
}

/** « 5 ans », « 18 mois »… ou null s'il n'y a pas de garantie commerciale. */
export function dureeGarantie(): string | null {
  const mois = commercialTerms.warrantyMonths
  if (!mois) return null
  if (mois % 12 === 0) return mois === 12 ? '1 an' : `${mois / 12} ans`
  return `${mois} mois`
}

/** « Satisfait ou remboursé N jours », sinon « Retours sous 14 jours », sinon null. */
export function promesseRetour(): string | null {
  if (commercialTerms.satisfaitDays) return `Satisfait ou remboursé ${commercialTerms.satisfaitDays} jours`
  if (commercialTerms.returnWindowDays) return `Retours sous ${commercialTerms.returnWindowDays} jours`
  return null
}
