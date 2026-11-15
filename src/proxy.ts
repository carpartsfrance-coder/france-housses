import { NextResponse, type NextRequest } from 'next/server'
import { redirectionVersDomainePublic } from '@/lib/domaine'
import { siteConfig } from '@/lib/identity'
import { lireAncienneAdresse } from '@/lib/anciennes-url'

/**
 * Redirige l'adresse technique de Render vers le domaine public.
 *
 * Ce fichier s'appelle `proxy.ts` et non `middleware.ts` : depuis Next 16, le
 * « middleware » a été renommé « proxy ». Le comportement est identique, seuls
 * le nom du fichier et celui de la fonction exportée changent.
 *
 * Il posait aussi un en-tête `x-pathname`, pour que la mise en page racine
 * sache si elle rendait une page du back-office et s'abstienne alors de poser
 * l'en-tête et le pied de page de la boutique. Cette lecture rendait **toutes**
 * les pages dynamiques : aucune ne pouvait plus être mise en cache. Le décor de
 * la boutique vit désormais dans un groupe de routes `(boutique)`, qui répond à
 * la même question sans rien lire de la requête — l'en-tête n'a plus d'objet.
 */
export function proxy(request: NextRequest) {
  // Adresse technique de Render → domaine public (voir lib/domaine.ts).
  const destination = redirectionVersDomainePublic(
    request.headers.get('x-forwarded-host') ?? request.headers.get('host'),
    request.nextUrl,
    siteConfig.url,
  )
  if (destination) return NextResponse.redirect(destination, 308)

  // Ancienne adresse de france-housses.fr (PrestaShop) → redirection 301,
  // calculée par /api/ancienne-url (qui lit la base).
  const { pathname, search } = request.nextUrl
  if (!pathname.startsWith('/api/') && lireAncienneAdresse(pathname, request.nextUrl.searchParams)) {
    const cible = request.nextUrl.clone()
    cible.pathname = '/api/ancienne-url'
    cible.search = ''
    // L'adresse d'origine passe par un en-tête : la route réécrite ne voit
    // pas toujours la chaîne de requête posée ici.
    const entetes = new Headers(request.headers)
    entetes.set('x-ancienne-adresse', pathname + search)
    return NextResponse.rewrite(cible, { request: { headers: entetes } })
  }

  return NextResponse.next()
}

export const config = {
  // Inutile sur les fichiers statiques et les images optimisées.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|demo/).*)'],
}
