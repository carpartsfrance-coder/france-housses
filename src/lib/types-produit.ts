/**
 * Les fiches qui ne sont pas des packs d'ampoules.
 *
 * Le catalogue par véhicule reprend, emplacement par emplacement, ce que vend
 * le revendeur partenaire (prisma/packs-vehicule*.json). Pour 1 566 fiches, ce
 * n'est pas un pack d'ampoules : des feux additionnels, des phares
 * additionnels, une centrale de clignotants, des clignotants complets… Elles
 * ont d'abord été retirées de la vente parce qu'elles s'annonçaient comme des
 * ampoules « sans modifier le câblage » (8 novembre 2026), puis remises en
 * ligne sous leur vrai nom, à la demande de l'exploitant : « le même catalogue
 * que LedPerf ».
 *
 * Le type se lit dans le nom de la fiche — c'est lui qui a été réécrit (voir
 * la migration 20261108170000). Il décide :
 * - du visuel : une seule photo, celle du produit devant la boîte LEDVROOM
 *   (`public/images-types/<image>.webp`), jamais les avant / après d'ampoules ;
 * - de la phrase de la description Google, à la place de « en pack prêt à
 *   monter sans modifier le câblage » ;
 * - de la réponse à « Faut-il modifier le câblage ? ».
 *
 * Volontairement sans 'server-only' : la galerie et le panier s'en servent.
 */

export type TypeDeProduit = {
  cle: string
  /** Ce que c'est, en quelques mots, pour la carte de la page du véhicule. */
  libelle?: string
  /** Le début du nom de la fiche. */
  prefixe: RegExp
  /** Fichier de `public/images-types/`, sans extension. */
  image: string
  /** Ce qu'on reçoit, en une phrase : description Google et flux. */
  contenu: string
  /** Réponse à « Faut-il modifier le câblage ? ». */
  cablage: string
  /**
   * Vrai pour des ampoules (kits LED de phares, ampoules xénon, feux stop…) :
   * seule la photo change ; le texte, les questions et la description Google
   * restent ceux d'un pack d'ampoules.
   */
  ampoules?: boolean
}

/*
  FRANCE HOUSSES : les types de produit d'éclairage de LEDVROOM (feux
  additionnels, centrales de clignotants…) n'ont pas d'équivalent. La liste est
  vide : aucune fiche n'en reçoit le visuel ni le texte.
*/
export const TYPES_DE_PRODUIT: TypeDeProduit[] = []

/** Le type d'une fiche qui a sa propre photo (ampoules comprises), ou null. */
export function typeDeProduit(nom: string): TypeDeProduit | null {
  return TYPES_DE_PRODUIT.find((type) => type.prefixe.test(nom.trim())) ?? null
}

/** Le type d'une fiche qui n'est PAS un pack d'ampoules, ou null. */
export function typeHorsAmpoules(nom: string): TypeDeProduit | null {
  const type = typeDeProduit(nom)
  return type && !type.ampoules ? type : null
}

/**
 * L'article devant un nom de véhicule : « le Toyota Hilux », « l’Audi A3 »,
 * et pour une moto « la Yamaha MT-07 », « l’Aprilia RS 125 ».
 *
 * Pas d'élision devant H ni devant Y : les marques s'y prononcent comme une
 * consonne (« la Honda », « le Hyundai Tucson », « la Yamaha ») — « l’Yamaha »
 * s'affichait sur toutes les fiches Yamaha et Honda (8 novembre 2026).
 */
export function leVehicule(nom: string, moto = false): string {
  if (/^[aeiouâàéèêîïôû]/i.test(nom.trim())) return `l’${nom}`
  return `${moto ? 'la' : 'le'} ${nom}`
}

/**
 * Ce qu'est le produit, en quelques mots : « Kit xénon HID », « Pack LED
 * clignotants arrière ». Sur la page d'un véhicule, plusieurs produits
 * partagent désormais un même emplacement (phares : effet xénon, kit LED,
 * kit xénon…) ; sans cette ligne, leurs cartes ne se distinguaient que par le
 * prix.
 */
export function natureDuProduit(nom: string, emplacement?: string | null): string | null {
  const n = nom.toLowerCase()
  // L'emplacement de la page véhicule tranche mieux que le nom : une housse
  // « camouflage » de la gamme universelle ne dit pas « universelle ».
  const universel = emplacement ? /UNIVERS/.test(emplacement) : /universel/.test(n)
  if (/tapis/.test(n)) {
    const matiere = /caoutchouc/.test(n) ? ' caoutchouc' : /moquette/.test(n) ? ' moquette' : /\b3d\b/.test(n) ? ' 3D' : /pvc/.test(n) ? ' PVC' : ''
    return universel ? `Tapis universels${matiere}` : `Tapis de sol sur mesure${matiere}`
  }
  if (/b[aâ]che|housse de protection carrosserie/.test(n)) return 'Bâche de protection'
  if (/mousse/.test(n)) return 'Mousse d’assise'
  if (/housse/.test(n)) {
    const matiere = /simili/.test(n) ? ' simili cuir' : /alcantara/.test(n) ? ' alcantara' : ''
    return universel ? `Housses universelles${matiere}` : `Housses sur mesure${matiere}`
  }
  return null
}
