/**
 * Période de production d'une génération, telle qu'on l'affiche.
 *
 * France Housses référence aussi des véhicules sans années (« Tout modèle ») :
 * `yearFrom` vaut alors 0, et `yearTo` peut seul être connu (« jusqu'à 2011 »).
 */
export function libelleAnnees(yearFrom: number, yearTo: number | null): string {
  if (!yearFrom || yearFrom < 1900) return yearTo ? `jusqu’à ${yearTo}` : 'tous millésimes'
  if (yearTo === yearFrom) return String(yearFrom)
  return yearTo ? `${yearFrom}–${yearTo}` : `depuis ${yearFrom}`
}
