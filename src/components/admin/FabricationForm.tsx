'use client'

import { useActionState } from 'react'
import { SelectField, TextField } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { updateProductFabrication } from '@/lib/actions/admin-product-content'
import { ETAT_VIDE, Retour } from './ContentFields'

export const PORTEE_LABELS = {
  VEHICLE: 'Pour des véhicules précis (onglet Compatibilités)',
  MADE_TO_ORDER: 'À la commande : tous les véhicules du type, avec questionnaire',
  UNIVERSAL: 'Universel : tous les véhicules du type',
} as const

/**
 * Portée, sur mesure, délai de fabrication et questionnaire d'un produit
 * France Housses. Le questionnaire est rempli par le client au moment de
 * l'ajout au panier ; ses réponses suivent la commande jusqu'à la préparation.
 */
export function FabricationForm({
  productId,
  valeurs,
  questionnaires,
  mayEdit,
}: {
  productId: string
  valeurs: { scope: string; madeToMeasure: boolean; leadTimeDays: number | null; questionnaireId: string | null }
  questionnaires: Array<{ id: string; name: string }>
  mayEdit: boolean
}) {
  const [state, action, pending] = useActionState(updateProductFabrication, ETAT_VIDE)
  const nomQuestionnaire = questionnaires.find((q) => q.id === valeurs.questionnaireId)?.name

  if (!mayEdit) {
    return (
      <dl className="mt-3 grid gap-1 text-sm">
        <div>Portée : {PORTEE_LABELS[valeurs.scope as keyof typeof PORTEE_LABELS] ?? valeurs.scope}</div>
        <div>Sur mesure : {valeurs.madeToMeasure ? 'oui (pas de rétractation)' : 'non'}</div>
        <div>Délai de fabrication : {valeurs.leadTimeDays ? `${valeurs.leadTimeDays} jours ouvrés` : 'aucun'}</div>
        <div>Questionnaire : {nomQuestionnaire ?? 'aucun'}</div>
      </dl>
    )
  }

  return (
    <form action={action} className="mt-3 rounded-lg border border-line p-4">
      <input type="hidden" name="productId" value={productId} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SelectField
          key={`scope-${valeurs.scope}`}
          id="scope"
          name="scope"
          label="Portée"
          defaultValue={valeurs.scope}
          hint="Où le produit apparaît dans la recherche par véhicule."
        >
          {Object.entries(PORTEE_LABELS).map(([valeur, libelle]) => (
            <option key={valeur} value={valeur}>
              {libelle}
            </option>
          ))}
        </SelectField>
        <SelectField
          key={`q-${valeurs.questionnaireId ?? ''}`}
          id="questionnaireId"
          name="questionnaireId"
          label="Questionnaire client"
          defaultValue={valeurs.questionnaireId ?? ''}
          hint="Les questions posées avant l’ajout au panier (marque, modèle, places…)."
        >
          <option value="">Aucun</option>
          {questionnaires.map((q) => (
            <option key={q.id} value={q.id}>
              {q.name}
            </option>
          ))}
        </SelectField>
        <TextField
          id="leadTimeDays"
          name="leadTimeDays"
          label="Délai de fabrication (jours ouvrés)"
          hint="Vide pour un produit en stock. Affiché sur la fiche et rappelé à la commande."
          type="text"
          inputMode="numeric"
          defaultValue={valeurs.leadTimeDays === null ? '' : String(valeurs.leadTimeDays)}
          maxLength={3}
        />
        <label className="flex items-start gap-3 self-end pb-2 text-sm">
          <input
            type="checkbox"
            name="madeToMeasure"
            defaultChecked={valeurs.madeToMeasure}
            className="mt-0.5 size-4 accent-[var(--color-brand)]"
          />
          <span>
            <strong>Fabriqué sur mesure</strong>
            <br />
            <span className="text-muted-strong">
              Exclu du droit de rétractation (art. L221-28 du code de la consommation) : la fiche
              et le panier le disent au client.
            </span>
          </span>
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        <Retour state={state} />
      </div>
    </form>
  )
}
