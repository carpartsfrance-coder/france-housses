/**
 * Anciennes adresses de france-housses.fr (PrestaShop) → nouvelles adresses.
 *
 * Le proxy (src/proxy.ts) repère une ancienne adresse avec `estAncienneAdresse`
 * — un test sans base de données — et la confie à /api/ancienne-url, qui
 * cherche la destination (produit, catégorie, véhicule) et répond par une
 * redirection 301. Les liens Google, les favoris et les e-mails déjà envoyés
 * continuent ainsi de mener au bon endroit.
 */

/**
 * Pages fixes de l'ancien site. Aucune ne doit porter le chemin d'une page du
 * nouveau site (/panier, /commande, /connexion, /recherche…) : le proxy
 * bouclerait.
 */
export const PAGES_FIXES: Record<string, string> = {
  '/content/1-livraison': '/livraison-retours',
  '/content/2-mentions-legales': '/mentions-legales',
  '/content/3-conditions-utilisation': '/cgv',
  '/content/4-a-propos': '/a-propos',
  '/content/5-paiement-securise': '/paiement',
  '/content/6-notre-histoire': '/a-propos',
  '/content/46-faq': '/aide',
  '/contactez-nous': '/contact',
  '/nous-contacter': '/contact',
  '/mon-compte': '/compte',
  '/identite': '/compte',
  '/historique-commandes': '/compte',
  '/adresses': '/compte',
  '/commande-rapide': '/panier',
  '/meilleures-ventes': '/c',
  '/nouveaux-produits': '/c',
  '/promotions': '/c',
  '/plan-site': '/',
  '/magasins': '/a-propos',
}

/** Page « content » par son numéro, quel que soit le texte qui suit. */
const CONTENU_PAR_NUMERO: Record<string, string> = {
  '1': '/livraison-retours',
  '2': '/mentions-legales',
  '3': '/cgv',
  '4': '/a-propos',
  '5': '/paiement',
  '6': '/a-propos',
  '46': '/aide',
}

/** Listes de véhicules de l'ancien site → type de véhicule. */
export const TYPE_DES_LISTES: Record<string, 'CAR' | 'VAN' | 'MOTORHOME' | 'TRUCK'> = {
  'housses-sieges-auto': 'CAR',
  'tapis-auto': 'CAR',
  'baches-protection-auto': 'CAR',
  'housses-sieges-utilitaires': 'VAN',
  'tapis-utilitaire': 'VAN',
  'housses-sieges-camping-car': 'MOTORHOME',
  'tapis-camping-car': 'MOTORHOME',
  'housses-sieges-poids-lourds': 'TRUCK',
}

export const CHEMIN_DU_TYPE = {
  CAR: 'auto',
  VAN: 'utilitaire',
  MOTORHOME: 'camping-car',
  TRUCK: 'poids-lourd',
} as const

export type AncienneAdresse =
  | { nature: 'fixe'; vers: string }
  | { nature: 'produit'; legacyId: number; mots: string }
  | { nature: 'vehicule'; type: keyof typeof CHEMIN_DU_TYPE; marque: string; modele: string | null }
  | { nature: 'categorie'; chemin: string }

function sansBarreFinale(chemin: string) {
  return chemin.length > 1 ? chemin.replace(/\/+$/, '') : chemin
}

/**
 * Lit une ancienne adresse. Renvoie `null` si l'adresse n'a pas la forme d'une
 * adresse PrestaShop (elle appartient alors au nouveau site).
 */
export function lireAncienneAdresse(cheminBrut: string, query?: URLSearchParams): AncienneAdresse | null {
  const chemin = sansBarreFinale(cheminBrut.toLowerCase())

  // index.php?id_product=123&controller=product
  if (chemin === '/index.php' && query) {
    const id = query.get('id_product')
    if (id && /^\d+$/.test(id)) return { nature: 'produit', legacyId: Number(id), mots: '' }
    return { nature: 'fixe', vers: '/' }
  }

  if (PAGES_FIXES[chemin]) return { nature: 'fixe', vers: PAGES_FIXES[chemin] }

  const contenu = chemin.match(/^\/content\/(\d+)-/)
  if (contenu) return { nature: 'fixe', vers: CONTENU_PAR_NUMERO[contenu[1]] ?? '/aide' }

  // …/1000-housse-de-siege-…-captur.html
  const produit = chemin.match(/\/(\d+)(?:-\d+)?-([^/]*)\.html$/)
  if (produit) return { nature: 'produit', legacyId: Number(produit[1]), mots: produit[2] }

  // /vehicules/housses-sieges-auto/porsche-/103/4359/productlist
  const vehicule = chemin.match(/^\/vehicules\/([a-z-]+)\/[^/]*\/(\d+)(?:\/(\d+))?(?:\/productlist)?$/)
  if (vehicule && TYPE_DES_LISTES[vehicule[1]]) {
    return {
      nature: 'vehicule',
      type: TYPE_DES_LISTES[vehicule[1]],
      marque: vehicule[2],
      modele: vehicule[3] ?? null,
    }
  }
  const liste = chemin.match(/^\/vehicules\/([a-z-]+)$/)
  if (liste && TYPE_DES_LISTES[liste[1]]) {
    return { nature: 'fixe', vers: `/vehicules/${CHEMIN_DU_TYPE[TYPE_DES_LISTES[liste[1]]]}` }
  }

  // Catégories : /12-housses-sieges-auto
  if (/^\/\d+-[a-z0-9-]+$/.test(chemin)) return { nature: 'categorie', chemin }

  return null
}
