import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { CHEMIN_DU_TYPE, lireAncienneAdresse } from '@/lib/anciennes-url'

/**
 * Redirection 301 d'une ancienne adresse france-housses.fr.
 * Appelée uniquement par le proxy (réécriture), jamais par un lien.
 */
export async function GET(request: NextRequest) {
  const chemin =
    request.headers.get('x-ancienne-adresse') ?? request.nextUrl.searchParams.get('chemin') ?? '/'
  const [path, qs] = chemin.split('?')
  const ancienne = lireAncienneAdresse(path, new URLSearchParams(qs ?? ''))
  const vers = await destination(ancienne)
  return NextResponse.redirect(new URL(vers, request.nextUrl.origin), vers.startsWith('/recherche') ? 302 : 301)
}

async function destination(a: ReturnType<typeof lireAncienneAdresse>): Promise<string> {
  if (!a) return '/'
  if (a.nature === 'fixe') return a.vers
  if (a.nature === 'produit') {
    const produit = await prisma.product.findUnique({
      where: { legacyId: a.legacyId },
      select: { slug: true, status: true },
    })
    if (produit && produit.status === 'PUBLISHED') return `/p/${produit.slug}`
    const mots = a.mots.replace(/-/g, ' ').trim()
    return mots ? `/recherche?q=${encodeURIComponent(mots)}` : '/'
  }
  if (a.nature === 'vehicule') {
    const cles = [
      a.modele ? `veh:${a.type}:${a.marque}:${a.modele}` : null,
      `veh:${a.type}:${a.marque}`,
    ].filter((c): c is string => Boolean(c))
    for (const cle of cles) {
      const r = await prisma.redirection.findUnique({ where: { fromPath: cle } })
      if (r) {
        await prisma.redirection.update({ where: { fromPath: cle }, data: { hits: { increment: 1 } } }).catch(() => {})
        return r.toPath
      }
    }
    return `/vehicules/${CHEMIN_DU_TYPE[a.type]}`
  }
  const r = await prisma.redirection.findUnique({ where: { fromPath: a.chemin } })
  if (r) {
    await prisma.redirection.update({ where: { fromPath: a.chemin }, data: { hits: { increment: 1 } } }).catch(() => {})
    return r.toPath
  }
  return '/c'
}
