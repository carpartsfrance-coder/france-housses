import { describe, expect, it } from 'vitest'
import { lireAncienneAdresse, PAGES_FIXES } from '@/lib/anciennes-url'

describe('anciennes adresses france-housses.fr', () => {
  it('reconnaît une fiche produit PrestaShop', () => {
    expect(
      lireAncienneAdresse('/housse-siege-auto/grande-serie/1000-housse-captur-de-2013.html'),
    ).toEqual({ nature: 'produit', legacyId: 1000, mots: 'housse-captur-de-2013' })
  })

  it('reconnaît une page véhicule', () => {
    expect(lireAncienneAdresse('/vehicules/housses-sieges-auto/porsche-/103/4359/productlist')).toEqual({
      nature: 'vehicule',
      type: 'CAR',
      marque: '103',
      modele: '4359',
    })
  })

  it('reconnaît les pages fixes et les catégories', () => {
    expect(lireAncienneAdresse('/content/3-conditions-utilisation')).toEqual({ nature: 'fixe', vers: '/cgv' })
    expect(lireAncienneAdresse('/12-housses-sieges-auto')).toEqual({
      nature: 'categorie',
      chemin: '/12-housses-sieges-auto',
    })
  })

  it('laisse passer les adresses du nouveau site', () => {
    for (const chemin of ['/', '/panier', '/commande', '/connexion', '/recherche', '/p/x', '/c/housses', '/vehicules/auto/renault/clio/clio-4-2012']) {
      expect(lireAncienneAdresse(chemin)).toBeNull()
    }
  })

  it('ne redirige jamais une page fixe vers elle-même', () => {
    for (const [de, vers] of Object.entries(PAGES_FIXES)) expect(de).not.toBe(vers)
  })
})
