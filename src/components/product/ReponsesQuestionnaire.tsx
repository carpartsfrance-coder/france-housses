import { lireReponses } from '@/lib/questionnaire'
import { cn } from '@/lib/cn'

/**
 * Réponses au questionnaire d'une ligne (véhicule décrit, commentaire), telles
 * qu'elles ont été figées au panier puis à la commande. Rien n'est affiché
 * quand il n'y a pas de réponse.
 */
export function ReponsesQuestionnaire({
  reponses,
  className,
  compact = false,
}: {
  reponses: unknown
  className?: string
  compact?: boolean
}) {
  const liste = lireReponses(reponses)
  if (liste.length === 0) return null
  return (
    <dl
      className={cn(
        'mt-1.5 grid gap-x-3 gap-y-0.5 rounded-md bg-surface-soft px-2.5 py-2',
        compact ? 'text-[10px]' : 'text-xs',
        'grid-cols-[auto_minmax(0,1fr)]',
        className,
      )}
    >
      {liste.map((r) => (
        <div key={r.id} className="contents">
          <dt className="text-muted">{r.label}</dt>
          <dd className="m-0 font-semibold break-words text-ink">{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}
