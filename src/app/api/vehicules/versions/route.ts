import { NextResponse, connection } from 'next/server'
import { prisma } from '@/lib/db'
import { GENERATION_VISIBLE } from '@/lib/queries/vehicules-visibles'
import { lectureCatalogue } from '@/lib/cache-catalogue'
import { libelleAnnees } from '@/lib/annees'

/**
 * Versions (générations) d'un modèle, pour le sélecteur de véhicule.
 *
 * Chez France Housses, un modèle se décline en versions précises — « Clio 4 »,
 * « Clio 4 Estate », « Clio 5 »… — avec leur période de production : c'est le
 * niveau auquel les housses sont taillées. L'année seule n'y suffit pas (deux
 * versions de la même année n'ont pas les mêmes sièges).
 */
export async function GET(request: Request) {
  await connection()
  const modelId = new URL(request.url).searchParams.get('modelId')
  if (!modelId) return NextResponse.json({ items: [] })
  try {
    const items = await versionsEnCache(modelId)
    return NextResponse.json({ items })
  } catch (error) {
    console.error('[vehicules/versions]', error)
    return NextResponse.json({ items: [], error: 'Catalogue véhicules indisponible' }, { status: 503 })
  }
}

const versionsEnCache = lectureCatalogue('selecteur-versions-v1', async (modelId: string) => {
  const generations = await prisma.vehicleGeneration.findMany({
    where: { modelId, ...GENERATION_VISIBLE },
    orderBy: [{ yearFrom: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, yearFrom: true, yearTo: true },
  })
  return generations.map((g) => ({
    id: g.id,
    name: g.name,
    years: libelleAnnees(g.yearFrom, g.yearTo),
  }))
})
