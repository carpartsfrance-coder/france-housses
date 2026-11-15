/**
 * Référentiels et contenus éditoriaux de FRANCE HOUSSES.
 *
 * Le nom du fichier vient de LEDVROOM, où il portait un jeu de démonstration.
 * Ici, aucune donnée de démonstration : le catalogue réel arrive par
 * `npm run import:france-housses`. Le fichier garde :
 * - les « emplacements » (ce qu'on achète pour un véhicule : housses, tapis,
 *   bâche) et l'équipement d'origine unique ;
 * - la livraison de départ (prix À CONFIRMER par France Housses) ;
 * - les textes de l'accueil et les questions fréquentes.
 */

/** Plus de catégories de démonstration : l'arborescence vient de l'import. */
export const demoCategories = [] as const

/**
 * Ce qu'on achète pour un véhicule. Le modèle hérité de LEDVROOM appelle ces
 * lignes des « emplacements » ; la page d'un véhicule les liste dans cet ordre.
 */
export const demoLightPositions = [
  { code: 'HOUSSES', label: 'Housses de siège sur mesure', family: 'SEAT_COVER', defaultQty: 1, position: 1 },
  { code: 'TAPIS', label: 'Tapis de sol sur mesure', family: 'FLOOR_MAT', defaultQty: 1, position: 2 },
  { code: 'BACHE', label: 'Bâche de protection', family: 'BODY_COVER', defaultQty: 1, position: 3 },
] as const

/**
 * Un seul « équipement d'origine » : la question halogène / xénon de LEDVROOM
 * n'a pas d'équivalent pour des sièges. La configuration des sièges (nombre de
 * places, banquette…) se lit dans le titre de chaque fiche et dans son croquis.
 */
export const demoEquipment = [
  {
    code: 'ORIGINE',
    label: "Sièges d'origine",
    position: 1,
    description: "Configuration d'origine du véhicule.",
    hint: 'Vérifiez le nombre de places et le croquis des sièges sur la fiche.',
  },
] as const

/** Plus de véhicule de démonstration. Gardé vide pour l'ancien jeu `--demo`. */
export const demoVehicle = null

export type DemoProduct = never
export const demoProducts: DemoProduct[] = []
export type DemoFitment = never
export const demoFitments: DemoFitment[] = []
export const demoRelations: never[] = []

export const demoHomeBlocks = {
  hero: {
    eyebrow: 'Housses & tapis sur mesure',
    /* Coupure explicite : deux lignes dans la colonne du panneau. */
    title: 'Vos sièges,\nà leur mesure.',
    subtitle: 'Housses de siège, tapis et bâches.\nFabriqués pour votre véhicule.',
    ctaLabel: 'Découvrir les housses',
    ctaHref: '/vehicules/auto',
    /* Image extraite de la vidéo d'accueil de france-housses.fr. */
    image: '/visuels-fh/hero-housses.webp',
    imageCaption: 'Visuel d’illustration',
    bases: [],
  },
  vehicleBand: {
    eyebrow: 'Mon véhicule',
    title: 'Trouvez les housses pour votre véhicule',
    shortcutLabel: 'Ou tapez votre véhicule : « clio 4 »',
    note: "Chaque housse sur mesure reprend la forme de vos sièges d'origine.",
  },
  reassurance: [
    {
      icon: 'car',
      title: 'Fabriquées pour votre véhicule',
      text: 'Découpes pour appuie-tête, accoudoirs et ceintures',
    },
    {
      icon: 'shield',
      title: 'Compatibles airbags latéraux',
      text: 'Couture qui s’ouvre au déclenchement',
    },
    {
      icon: 'truck',
      title: 'Expédié sous 24 h ouvrées',
      text: 'Produits en stock, hors sur mesure',
    },
    {
      icon: 'headset',
      title: "Conseils avant et après l'achat",
      text: 'Une équipe pour vous accompagner',
    },
  ],
  universes: {
    eyebrow: 'Découvrez nos univers',
    title: 'Trouvez la protection qu’il vous faut',
    subtitle: 'Housses, tapis, bâches et accessoires pour tous vos véhicules.',
  },
  comparison: {
    eyebrow: 'Sur mesure, au coloris de votre choix',
    title: '« On dirait des sièges neufs. »',
    subtitle: 'La remarque qu’on entend quand une housse épouse vraiment la forme des sièges.',
    ctaLabel: 'Voir les housses sur mesure',
    ctaHref: '/vehicules/auto',
    /* Deux extraits de la vidéo d'accueil de france-housses.fr. */
    image: '/visuels-fh/comparatif-housses.webp',
    caption: 'Exemples de housses posées — visuels d’illustration. Matières et coloris selon la gamme.',
  },
  products: {
    eyebrow: 'Nos housses et tapis du moment',
    title: 'Votre intérieur commence ici.',
  },
  method: {
    title: 'Le bon produit. Les bons conseils.',
    eyebrow: 'Plus simple quand on est bien accompagné',
    steps: [],
  },
  /* Le panneau « moto » de LEDVROOM devient celui des professionnels. */
  moto: {
    title: 'Utilitaires, camions,\ncamping-cars.',
    subtitle: 'Des housses robustes pour les sièges qui travaillent tous les jours.',
    ctaLabel: 'Trouver pour mon utilitaire',
    ctaHref: '/vehicules/utilitaire',
    image: '/visuels-fh/pro-utilitaires.webp',
    caption: 'Visuel d’illustration',
    eyebrow: 'Et pour les pros ?',
  },
  help: {
    title: 'Le bon conseil, au bon moment.',
    text: 'Un doute sur votre modèle ou la configuration de vos sièges ? Appelez-nous au 05 58 93 95 39, du lundi au vendredi.',
    ctaLabel: 'Demander conseil',
    ctaHref: '/contact',
  },
}

/** Questions fréquentes, reprises de la FAQ de france-housses.fr. */
export const demoFaq = [
  {
    question: 'Comment être sûr que la housse convient à mon véhicule ?',
    answer:
      "Choisissez le type de véhicule, la marque puis le modèle : le site ne vous montre que les housses prévues pour lui. Vérifiez aussi l'année, le nombre de places et le croquis des sièges sur la fiche. En cas de doute, appelez-nous ou envoyez-nous une photo de vos sièges.",
  },
  {
    question: 'Les housses sont-elles compatibles avec les airbags latéraux ?',
    answer:
      "Oui. Nos housses sur mesure et universelles ont une couture qui s'ouvre au déclenchement de l'airbag latéral, sans le retarder. Elles sont aussi compatibles avec les sièges chauffants.",
  },
  {
    question: 'Quel est le délai de fabrication ?',
    answer:
      "Les produits en stock partent sous 24 h ouvrées. Une housse ou un tapis sur mesure est fabriqué à la commande : le délai (15 à 35 jours ouvrés selon la gamme) est indiqué sur chaque fiche et rappelé à la commande.",
  },
  {
    question: 'Puis-je retourner une housse sur mesure ?',
    answer:
      "Non : une housse ou un tapis fabriqué aux mesures de votre véhicule est exclu du droit de rétractation. Les produits standard (universels, accessoires) se retournent sous 14 jours. Vérifiez bien votre véhicule avant de commander, et contactez-nous au moindre doute.",
  },
  {
    question: 'Quelle différence entre une housse sur mesure et une housse universelle ?',
    answer:
      "La housse sur mesure est taillée pour les sièges de votre modèle : ajustement précis, accès aux réglages, accoudoirs et appuie-tête. La housse universelle s'adapte à la plupart des sièges grâce à des attaches réglables, avec un ajustement moins précis.",
  },
  {
    question: 'Comment entretenir mes housses ?',
    answer:
      'Les housses en tissu se lavent en machine à 30 °C (programme délicat, essorage doux) ou à la main. Le simili cuir se nettoie d’un coup d’éponge humide ou d’un chiffon doux imbibé d’eau savonneuse.',
  },
]

/**
 * Livraison de départ. PRIX À CONFIRMER PAR FRANCE HOUSSES : l'ancien site ne
 * les affiche nulle part. Ils se règlent dans le back-office (« Livraison »)
 * et ne sont jamais réécrits par l'amorçage.
 */
export const demoShipping = {
  zone: { code: 'FR', label: 'France métropolitaine (Corse incluse)', countries: ['FR'] },
  methods: [
    {
      code: 'COLISSIMO',
      label: 'Livraison à domicile (Colissimo suivi)',
      carrier: 'Colissimo',
      priceCents: 990,
      freeFromCents: null,
      minDays: 2,
      maxDays: 3,
      position: 1,
    },
  ],
}

/** Belgique et Luxembourg : desservis par France Housses. Prix à confirmer. */
export const demoShippingEurope = {
  zone: { code: 'BE-LU', label: 'Belgique et Luxembourg', countries: ['BE', 'LU'] },
  methods: [
    {
      code: 'COLISSIMO-EU',
      label: 'Livraison à domicile (Colissimo international)',
      carrier: 'Colissimo',
      priceCents: 1490,
      freeFromCents: null,
      minDays: 3,
      maxDays: 5,
      position: 1,
    },
  ],
}
