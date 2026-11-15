/**
 * Import du catalogue de l'ancien site france-housses.fr (PrestaShop).
 *
 *   npm run import:france-housses                    — tout (catégories, véhicules, produits, photos)
 *   npm run import:france-housses -- --sans-photos   — sans télécharger les photos
 *   npm run import:france-housses -- --limite 200    — les 200 premiers produits (essai)
 *
 * Source : `prisma/france-housses/catalogue.json`, produit par l'aspiration du
 * site public (voir docs/import-france-housses.md). Rejouable : chaque ligne est
 * retrouvée par son identifiant d'origine (slug de catégorie, type + slug de
 * marque, legacyId de produit et de déclinaison) et mise à jour, jamais doublée.
 *
 * Les photos sont téléchargées depuis france-housses.fr (tant que l'ancien site
 * répond) puis déposées par le pilote de stockage du site (local en
 * développement, S3/R2 en production). Une photo identique, octet pour octet,
 * n'est stockée qu'une fois : beaucoup de fiches partagent les mêmes visuels.
 * Un cache disque (`IMAGES_CACHE`, par défaut `.cache/images-fh`) évite de les
 * retélécharger d'un import à l'autre.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { PrismaClient, type Prisma } from '@prisma/client'
import { putFile } from '../src/lib/storage/driver'
import { sniffMime, ALLOWED_MIME } from '../src/lib/storage/file-type'

const prisma = new PrismaClient()
const args = process.argv.slice(2)
const SANS_PHOTOS = args.includes('--sans-photos')
const LIMITE = (() => {
  const i = args.indexOf('--limite')
  return i >= 0 ? Number(args[i + 1]) : Infinity
})()
const CACHE = process.env.IMAGES_CACHE || path.join(process.cwd(), '.cache', 'images-fh')
const SOURCE = path.join(process.cwd(), 'prisma', 'france-housses', 'catalogue.json')
const UA = 'Mozilla/5.0 (compatible; FranceHoussesMigration/1.0; import du catalogue)'

type Cat = {
  slug: string
  name: string
  shortName: string | null
  parent: string | null
  family: string
  position: number
  description: string | null
}
type Gen = { name: string; slug: string; yearFrom: number; yearTo: number | null; legacy: string[]; legacyName: string }
type Make = {
  type: 'CAR' | 'VAN' | 'MOTORHOME' | 'TRUCK'
  name: string
  slug: string
  logo: string | null
  legacyId: string
  models: Array<{ name: string; slug: string; generations: Gen[] }>
}
type Variant = {
  legacyId: number | null
  name: string
  priceCents: number
  compareAtCents: number | null
  swatch: string | null
  image: string | null
}
type Product = {
  legacyId: number
  legacyPath: string
  slug: string
  name: string
  tagline: string | null
  description: string
  body: string
  category: string
  vehicleType: 'CAR' | 'VAN' | 'MOTORHOME' | 'TRUCK' | 'BOTH'
  scope: 'VEHICLE' | 'MADE_TO_ORDER' | 'UNIVERSAL'
  position: string | null
  madeToMeasure: boolean
  leadTimeDays: number | null
  questionnaire: string | null
  metaTitle: string | null
  metaDescription: string | null
  images: Array<{ url: string; legacyId: string; croquis: boolean }>
  variants: Variant[]
  stock: number
  specs: Array<[string, string]>
  video: string | null
  fitments: Array<[string, string, string, string]>
  active: boolean
}
type Catalogue = {
  categories: Cat[]
  categoryRedirects: Record<string, string>
  questionnaires: Array<{ code: string; name: string; fields: unknown; dependencies: unknown }>
  vehicles: Make[]
  products: Product[]
}

const TYPE_DES_LISTES: Record<string, string> = {
  CAR: 'auto',
  VAN: 'utilitaire',
  MOTORHOME: 'camping-car',
  TRUCK: 'poids-lourd',
}

/* -------------------------------------------------------------------------- */
/* Photos                                                                     */
/* -------------------------------------------------------------------------- */

const mediaParEmpreinte = new Map<string, string>()
const mediaParUrl = new Map<string, string | null>()
const urlDuMedia = new Map<string, string>()

async function telecharger(url: string): Promise<Buffer | null> {
  const fichier = path.join(CACHE, createHash('sha1').update(url).digest('hex'))
  try {
    return await readFile(fichier)
  } catch {
    /* pas en cache */
  }
  for (let essai = 0; essai < 3; essai++) {
    try {
      const reponse = await fetch(url, { headers: { 'User-Agent': UA } })
      if (reponse.status === 404) return null
      if (!reponse.ok) throw new Error(String(reponse.status))
      const octets = Buffer.from(await reponse.arrayBuffer())
      await mkdir(CACHE, { recursive: true })
      await writeFile(fichier, octets)
      return octets
    } catch {
      await new Promise((r) => setTimeout(r, 1500 * (essai + 1)))
    }
  }
  return null
}

/** Dépose une photo (une seule fois par contenu) et rend l'identifiant du média. */
async function media(
  url: string,
  alt: string,
  options: { prefix: string; nature: 'PRODUCT_PHOTO' | 'ILLUSTRATION' | 'DIAGRAM' | 'UNSPECIFIED' },
): Promise<string | null> {
  if (SANS_PHOTOS) return null
  if (mediaParUrl.has(url)) return mediaParUrl.get(url)!
  const octets = await telecharger(url)
  if (!octets) {
    mediaParUrl.set(url, null)
    return null
  }
  const empreinte = createHash('sha256').update(octets).digest('hex').slice(0, 12)
  const connu = mediaParEmpreinte.get(empreinte)
  if (connu) {
    mediaParUrl.set(url, connu)
    return connu
  }
  const mime = sniffMime(octets)
  if (!mime || !ALLOWED_MIME.has(mime)) {
    mediaParUrl.set(url, null)
    return null
  }
  const stocke = await putFile({ bytes: octets, mimeType: mime, extension: ALLOWED_MIME.get(mime)!, prefix: options.prefix, empreinte })
  // Dimensions : la galerie et le choix du visuel de catégorie s'en servent.
  if (!stocke.width) {
    try {
      const { default: sharp } = await import('sharp')
      const meta = await sharp(octets).metadata()
      stocke.width = meta.width ?? null
      stocke.height = meta.height ?? null
    } catch {
      /* image illisible : dimensions inconnues */
    }
  }
  const cree = await prisma.media.create({
    data: {
      storageKey: stocke.key,
      url: stocke.url,
      mimeType: stocke.mimeType,
      width: stocke.width ?? null,
      height: stocke.height ?? null,
      sizeBytes: stocke.sizeBytes,
      alt: alt.slice(0, 250),
      nature: options.nature,
      caption: options.nature === 'DIAGRAM' ? 'Croquis des sièges' : null,
    },
  })
  mediaParEmpreinte.set(empreinte, cree.id)
  mediaParUrl.set(url, cree.id)
  urlDuMedia.set(cree.id, cree.url)
  return cree.id
}

/** Pastille de tissu : déposée dans le stockage du site, l'ancien site disparaîtra. */
async function pastille(swatch: string | null): Promise<string | null> {
  if (!swatch || !/^https?:/.test(swatch)) return swatch
  const id = await media(swatch, 'Pastille de couleur', { prefix: 'nuancier', nature: 'ILLUSTRATION' })
  return id ? urlDuMedia.get(id) ?? null : null
}

async function chargerMediasExistants() {
  const tous = await prisma.media.findMany({ select: { id: true, storageKey: true, url: true } })
  for (const m of tous) {
    const e = /-([0-9a-f]{12})\.[a-z0-9]+$/.exec(m.storageKey)
    if (e) mediaParEmpreinte.set(e[1], m.id)
    urlDuMedia.set(m.id, m.url)
  }
}

/* -------------------------------------------------------------------------- */
/* Étapes                                                                     */
/* -------------------------------------------------------------------------- */

async function importerCategories(cats: Cat[]) {
  const ids = new Map<string, string>()
  for (const cat of [...cats].sort((a, b) => Number(a.parent !== null) - Number(b.parent !== null))) {
    const parentId = cat.parent ? ids.get(cat.parent) ?? null : null
    const data = {
      name: cat.name,
      shortName: cat.shortName,
      description: cat.description,
      family: cat.family as Prisma.CategoryCreateInput['family'],
      position: cat.position,
      published: true,
      parentId,
    }
    const enregistree = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: data,
      create: { slug: cat.slug, ...data },
    })
    ids.set(cat.slug, enregistree.id)
  }
  console.log(`  ${cats.length} catégories`)
  return ids
}

async function importerQuestionnaires(qs: Catalogue['questionnaires']) {
  const ids = new Map<string, string>()
  for (const q of qs) {
    const data = {
      name: q.name,
      fields: q.fields as Prisma.InputJsonValue,
      dependencies: (q.dependencies ?? undefined) as Prisma.InputJsonValue | undefined,
    }
    const r = await prisma.questionnaire.upsert({ where: { code: q.code }, update: data, create: { code: q.code, ...data } })
    ids.set(q.code, r.id)
  }
  console.log(`  ${qs.length} questionnaires`)
  return ids
}

/** Rend, pour chaque génération, l'identifiant de sa configuration « origine ». */
async function importerVehicules(makes: Make[]) {
  const equipement = await prisma.lightingEquipment.findUnique({ where: { code: 'ORIGINE' } })
  if (!equipement) throw new Error("Équipement « ORIGINE » absent : lancez d'abord `npm run seed`.")
  const configurations = new Map<string, string>()
  const redirections: Array<{ fromPath: string; toPath: string }> = []
  let nbGenerations = 0
  for (const [rang, mk] of makes.entries()) {
    const logoId = mk.logo ? await media(mk.logo, `Logo ${mk.name}`, { prefix: 'marques', nature: 'UNSPECIFIED' }) : null
    const marque = await prisma.vehicleMake.upsert({
      where: { type_slug: { type: mk.type, slug: mk.slug } },
      update: { name: mk.name, ...(logoId ? { logoMediaId: logoId } : {}) },
      create: { type: mk.type, slug: mk.slug, name: mk.name, position: rang, logoMediaId: logoId },
    })
    const chemin = TYPE_DES_LISTES[mk.type]
    redirections.push({ fromPath: `veh:${mk.type}:${mk.legacyId}`, toPath: `/vehicules/${chemin}/${mk.slug}` })
    for (const mo of mk.models) {
      const modele = await prisma.vehicleModel.upsert({
        where: { makeId_slug: { makeId: marque.id, slug: mo.slug } },
        update: { name: mo.name },
        create: { makeId: marque.id, slug: mo.slug, name: mo.name },
      })
      for (const g of mo.generations) {
        const gen = await prisma.vehicleGeneration.upsert({
          where: { modelId_slug: { modelId: modele.id, slug: g.slug } },
          update: { name: g.name, yearFrom: g.yearFrom, yearTo: g.yearTo },
          create: { modelId: modele.id, slug: g.slug, name: g.name, yearFrom: g.yearFrom, yearTo: g.yearTo },
        })
        nbGenerations++
        let config = await prisma.vehicleConfiguration.findFirst({
          where: { generationId: gen.id, equipmentId: equipement.id, trimId: null, headlampRef: null },
        })
        if (!config) {
          config = await prisma.vehicleConfiguration.create({
            data: { generationId: gen.id, equipmentId: equipement.id, label: `${mk.name} ${g.name}` },
          })
        }
        configurations.set(`${mk.type}|${mk.slug}|${mo.slug}|${g.slug}`, config.id)
        for (const id of g.legacy) {
          redirections.push({
            fromPath: `veh:${mk.type}:${mk.legacyId}:${id}`,
            toPath: `/vehicules/${chemin}/${mk.slug}/${mo.slug}/${g.slug}`,
          })
        }
      }
    }
  }
  console.log(`  ${makes.length} marques, ${nbGenerations} générations`)
  return { configurations, redirections }
}

async function importerProduits(
  produits: Product[],
  categories: Map<string, string>,
  questionnaires: Map<string, string>,
  configurations: Map<string, string>,
) {
  const tva = await prisma.vatRate.findUnique({ where: { code: 'FR_STANDARD' } })
  const emplacements = new Map((await prisma.lightPosition.findMany()).map((p) => [p.code, p.id]))
  let n = 0
  let nbFit = 0
  const debut = Date.now()
  for (const p of produits.slice(0, LIMITE)) {
    n++
    const data = {
      name: p.name,
      tagline: p.tagline,
      description: p.description || null,
      body: p.body || null,
      status: (p.active ? 'PUBLISHED' : 'DRAFT') as 'PUBLISHED' | 'DRAFT',
      publishedAt: p.active ? new Date() : null,
      vehicleType: p.vehicleType,
      scope: p.scope,
      madeToMeasure: p.madeToMeasure,
      leadTimeDays: p.leadTimeDays,
      questionnaireId: p.questionnaire ? questionnaires.get(p.questionnaire) ?? null : null,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      legacyPath: p.legacyPath,
      brand: 'France Housses',
    }
    const existant = await prisma.product.findUnique({ where: { legacyId: p.legacyId } })
    const produit = existant
      ? await prisma.product.update({ where: { id: existant.id }, data })
      : await prisma.product.create({ data: { ...data, slug: p.slug, legacyId: p.legacyId } })

    // Catégorie
    const categoryId = categories.get(p.category)
    if (categoryId) {
      await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: produit.id, categoryId } },
        update: {},
        create: { productId: produit.id, categoryId, position: n },
      })
    }

    // Caractéristiques
    await prisma.productSpec.deleteMany({ where: { productId: produit.id } })
    const specs: Array<[string, string]> = [...p.specs]
    if (p.video) specs.push(['Notice de montage (vidéo)', p.video])
    if (specs.length) {
      await prisma.productSpec.createMany({
        data: specs.map(([label, value], position) => ({ productId: produit.id, label, value, position })),
      })
    }

    // Photos
    const mediaDeLImage = new Map<string, string>()
    let position = 0
    for (const image of p.images) {
      const id = await media(image.url, image.croquis ? `${p.name} — croquis des sièges` : p.name, {
        prefix: 'produits',
        nature: image.croquis ? 'DIAGRAM' : 'ILLUSTRATION',
      })
      if (!id) continue
      mediaDeLImage.set(image.legacyId, id)
      await prisma.productMedia.upsert({
        where: { productId_mediaId_role: { productId: produit.id, mediaId: id, role: 'PRODUCT' } },
        update: { position },
        create: { productId: produit.id, mediaId: id, role: 'PRODUCT', position },
      })
      position++
    }

    // Déclinaisons
    for (const [rang, v] of p.variants.entries()) {
      const sku = `FH-${p.legacyId}-${v.legacyId ?? 'U'}`
      const vdata = {
        name: v.name,
        priceCents: v.priceCents,
        compareAtCents: v.compareAtCents,
        swatch: await pastille(v.swatch),
        legacyId: v.legacyId,
        position: rang,
        active: true,
        imageId: v.image ? mediaDeLImage.get(v.image) ?? null : null,
        packaging: 'UNIT' as const,
        // Le sur-mesure se fabrique à la commande : pas de rupture possible.
        backorder: p.madeToMeasure || p.leadTimeDays !== null || p.stock <= 0,
        vatRateId: tva?.id ?? null,
      }
      await prisma.productVariant.upsert({
        where: { sku },
        update: vdata,
        create: { ...vdata, sku, productId: produit.id, stockOnHand: Math.max(0, p.stock) },
      })
    }

    // Compatibilités (fiches « grande série »)
    const positionId = p.position ? emplacements.get(p.position) : undefined
    if (positionId && p.fitments.length) {
      const variantes = await prisma.productVariant.findMany({ where: { productId: produit.id }, select: { id: true } })
      for (const [type, marque, modele, generation] of p.fitments) {
        const configurationId = configurations.get(`${type}|${marque}|${modele}|${generation}`)
        if (!configurationId) continue
        for (const variante of variantes) {
          await prisma.fitment.upsert({
            where: { configurationId_positionId_variantId: { configurationId, positionId, variantId: variante.id } },
            update: { status: 'CONFIRMED' },
            create: {
              configurationId,
              positionId,
              variantId: variante.id,
              status: 'CONFIRMED',
              quantity: 1,
              source: 'france-housses.fr (fiche véhicule de l’ancien site)',
              verifiedAt: new Date(),
              verifiedBy: 'import',
            },
          })
          nbFit++
        }
      }
    }

    if (n % 100 === 0) {
      const s = Math.round((Date.now() - debut) / 1000)
      console.log(`  ${n} produits (${s} s, ${mediaParEmpreinte.size} photos distinctes)`)
    }
  }
  console.log(`  ${n} produits, ${nbFit} compatibilités`)
}

async function importerRedirections(cat: Catalogue, vehicules: Array<{ fromPath: string; toPath: string }>) {
  const lignes: Array<{ fromPath: string; toPath: string }> = [...vehicules]
  for (const [ancien, slug] of Object.entries(cat.categoryRedirects)) {
    lignes.push({ fromPath: `/${ancien}`, toPath: `/c/${slug}` })
  }
  for (const l of lignes) {
    await prisma.redirection.upsert({ where: { fromPath: l.fromPath }, update: { toPath: l.toPath }, create: l })
  }
  console.log(`  ${lignes.length} redirections`)
}

/**
 * Visuel de chaque catégorie qui n'en a pas : la plus grande photo PRODUIT
 * (pas un croquis) d'un produit publié de la catégorie ou de ses
 * sous-catégories. Modifiable ensuite dans le back-office.
 */
async function visuelsDesCategories() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, heroMediaId: true, children: { select: { id: true } } },
  })
  let n = 0
  for (const c of categories) {
    if (c.heroMediaId) continue
    const ids = [c.id, ...c.children.map((e) => e.id)]
    const lien = await prisma.productMedia.findFirst({
      where: {
        product: { status: 'PUBLISHED', categories: { some: { categoryId: { in: ids } } } },
        media: { nature: { not: 'DIAGRAM' }, width: { gte: 500 } },
      },
      orderBy: [{ product: { featured: 'desc' } }, { media: { width: 'desc' } }, { position: 'asc' }],
      select: { mediaId: true },
    })
    if (!lien) continue
    await prisma.category.update({ where: { id: c.id }, data: { heroMediaId: lien.mediaId } })
    n++
  }
  console.log(`  ${n} visuels de catégorie`)
}

/**
 * Vitrine de l'accueil (« Mettre en avant sur l'accueil ») : quatre gammes
 * phares, seulement si aucune n'a encore été choisie dans le back-office.
 */
const VITRINE = [837, 904, 898, 1149]
async function vitrineParDefaut() {
  if ((await prisma.product.count({ where: { featured: true } })) > 0) return
  const r = await prisma.product.updateMany({ where: { legacyId: { in: VITRINE } }, data: { featured: true } })
  console.log(`  vitrine de l'accueil : ${r.count} produits`)
}

async function main() {
  const catalogue = JSON.parse(await readFile(SOURCE, 'utf8')) as Catalogue
  console.log(`→ Import France Housses (${catalogue.products.length} produits)${SANS_PHOTOS ? ' — sans photos' : ''}`)
  await chargerMediasExistants()
  const categories = await importerCategories(catalogue.categories)
  const questionnaires = await importerQuestionnaires(catalogue.questionnaires)
  const { configurations, redirections } = await importerVehicules(catalogue.vehicles)
  await importerProduits(catalogue.products, categories, questionnaires, configurations)
  await importerRedirections(catalogue, redirections)
  if (!SANS_PHOTOS) await visuelsDesCategories()
  await vitrineParDefaut()
  console.log('Terminé. Pensez à vider le cache du catalogue (redémarrage du site).')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
