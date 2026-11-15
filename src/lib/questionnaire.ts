/**
 * Questionnaire des fiches « sur mesure » (repris du site PrestaShop de
 * France Housses : marque, modèle, finition, mise en circulation, portes,
 * accoudoirs, vide-poches, tablettes, dossiers, appuis-tête, commentaire).
 *
 * Le questionnaire est partagé entre plusieurs fiches (table `Questionnaire`).
 * Les libellés et les valeurs possibles font foi côté serveur : le navigateur
 * n'envoie que des identifiants de champ et des valeurs, que l'on contrôle ici
 * avant de les figer dans le panier puis dans la commande.
 *
 * Volontairement sans 'server-only' : la fiche produit (composant client)
 * s'en sert pour savoir quels champs afficher.
 */

export type ChampQuestionnaire = {
  id: string
  label: string
  type: 'text' | 'select' | 'textarea'
  required?: boolean
  placeholder?: string | null
  options?: Array<{ value: string; label: string }>
}

/**
 * Affichage conditionnel, au format du module d'origine :
 * `hidden` = champs masqués tant qu'aucune réponse ne les fait apparaître ;
 * `dependencies[champ][valeur]` = champs qui apparaissent pour cette réponse.
 */
export type DependancesQuestionnaire = {
  hidden?: Record<string, string>
  dependencies?: Record<string, Record<string, string[]>>
}

export type Questionnaire = {
  fields: unknown
  dependencies?: unknown
}

export type ReponseBrute = { id: string; value: string }

/** Réponse figée : libellé et valeur lisible, tels que la commande les montrera. */
export type ReponseFigee = { id: string; label: string; value: string }

/** Une valeur de liste qui veut dire « pas de réponse ». */
function estVide(valeur: string | undefined | null): boolean {
  const v = (valeur ?? '').trim()
  return v === '' || v === '0' || v === '-'
}

export function lireChamps(q: Questionnaire | null | undefined): ChampQuestionnaire[] {
  if (!q || !Array.isArray(q.fields)) return []
  return (q.fields as ChampQuestionnaire[]).filter(
    (c) => c && typeof c.id === 'string' && typeof c.label === 'string',
  )
}

export function lireDependances(q: Questionnaire | null | undefined): DependancesQuestionnaire {
  const d = q?.dependencies
  if (!d || typeof d !== 'object') return {}
  return d as DependancesQuestionnaire
}

/** Champs visibles compte tenu des réponses en cours. */
export function champsVisibles(
  champs: ChampQuestionnaire[],
  dependances: DependancesQuestionnaire,
  valeurs: Record<string, string>,
): ChampQuestionnaire[] {
  const masques = new Set(Object.keys(dependances.hidden ?? {}))
  const reveles = new Set<string>()
  for (const [champ, parValeur] of Object.entries(dependances.dependencies ?? {})) {
    const choisie = valeurs[champ]
    if (choisie && parValeur[choisie]) for (const id of parValeur[choisie]) reveles.add(id)
  }
  return champs.filter((c) => !masques.has(c.id) || reveles.has(c.id))
}

/**
 * Contrôle et fige les réponses. `key` distingue deux lignes de panier du même
 * article commandé pour deux véhicules différents.
 */
export function normaliserReponses(
  q: Questionnaire | null | undefined,
  brutes: ReponseBrute[],
): { ok: true; answers: ReponseFigee[]; key: string } | { ok: false; error: string } {
  const champs = lireChamps(q)
  if (champs.length === 0) return { ok: true, answers: [], key: '' }

  const valeurs: Record<string, string> = {}
  for (const r of brutes) valeurs[r.id] = (r.value ?? '').slice(0, 1000)

  const visibles = champsVisibles(champs, lireDependances(q), valeurs)
  const answers: ReponseFigee[] = []
  for (const champ of visibles) {
    const brute = valeurs[champ.id]
    if (champ.type === 'select') {
      const option = (champ.options ?? []).find((o) => o.value === brute)
      if (!option || estVide(option.value)) {
        if (champ.required) return { ok: false, error: `Merci de répondre à « ${champ.label} ».` }
        continue
      }
      answers.push({ id: champ.id, label: champ.label, value: option.label.trim() })
    } else {
      const texte = (brute ?? '').replace(/[<>{}=]/g, '').trim()
      if (!texte) {
        if (champ.required) return { ok: false, error: `Merci de renseigner « ${champ.label} ».` }
        continue
      }
      answers.push({ id: champ.id, label: champ.label, value: texte })
    }
  }

  const key = answers.length ? empreinte(answers.map((a) => `${a.id}=${a.value}`).join('|')) : ''
  return { ok: true, answers, key }
}

/** Empreinte courte (FNV-1a, deux passes) : tient dans l'index unique du panier. */
function empreinte(texte: string): string {
  let h1 = 0x811c9dc5
  let h2 = 0x01000193 ^ texte.length
  for (let i = 0; i < texte.length; i++) {
    const c = texte.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0
    h2 = Math.imul(h2 ^ c, 0x5bd1e995) >>> 0
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')
}

/** Lit des réponses figées (panier, commande) sans faire confiance au JSON. */
export function lireReponses(json: unknown): ReponseFigee[] {
  if (!Array.isArray(json)) return []
  return json.filter(
    (r): r is ReponseFigee =>
      !!r && typeof r === 'object' && typeof (r as ReponseFigee).label === 'string' && typeof (r as ReponseFigee).value === 'string',
  )
}
