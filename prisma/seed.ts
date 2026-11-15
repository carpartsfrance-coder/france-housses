/**
 * Amorçage de la base FRANCE HOUSSES.
 *
 *   npm run seed                 — référentiels indispensables (TVA, « emplacements »
 *                                  housses / tapis / bâche, équipement d'origine,
 *                                  zones de livraison, paramètres) + textes de
 *                                  l'accueil et questions fréquentes.
 *   npm run seed -- --purge-demo — retire tout ce qui porte isDemo (héritage LEDVROOM).
 *
 * Le catalogue (véhicules, produits, photos) arrive ensuite par
 * `npm run import:france-housses`.
 *
 * Aucun compte administrateur n'est créé ici : il se crée avec
 * `npm run admin:create`, qui demande le mot de passe.
 */
import { PrismaClient, type Prisma } from '@prisma/client'
import {
  demoEquipment,
  demoFaq,
  demoHomeBlocks,
  demoLightPositions,
  demoShipping,
  demoShippingEurope,
} from './demo-data'

const prisma = new PrismaClient()

const args = process.argv.slice(2)
const purgeDemo = args.includes('--purge-demo')

async function seedReferenceData() {
  console.log('→ Référentiels')

  await prisma.vatRate.upsert({
    where: { code: 'FR_STANDARD' },
    update: {},
    create: { code: 'FR_STANDARD', label: 'TVA 20 % (France)', rateBp: 2000, isDefault: true },
  })

  for (const position of demoLightPositions) {
    await prisma.lightPosition.upsert({
      where: { code: position.code },
      update: { label: position.label, family: position.family, defaultQty: position.defaultQty, position: position.position },
      create: { ...position },
    })
  }

  for (const equipment of demoEquipment) {
    await prisma.lightingEquipment.upsert({
      where: { code: equipment.code },
      update: { label: equipment.label, description: equipment.description, hint: equipment.hint },
      create: { ...equipment },
    })
  }

  for (const [index, shipping] of [demoShipping, demoShippingEurope].entries()) {
    const zone = await prisma.shippingZone.upsert({
      where: { code: shipping.zone.code },
      update: {},
      create: { ...shipping.zone, position: index },
    })
    for (const method of shipping.methods) {
      // Création seulement : prix, délais et activation se règlent dans le
      // back-office (page « Livraison ») et ne doivent pas être réécrits ici.
      await prisma.shippingMethod.upsert({
        where: { zoneId_code: { zoneId: zone.id, code: method.code } },
        update: {},
        create: { ...method, zoneId: zone.id },
      })
    }
  }

  const settings: Array<[string, string, Prisma.InputJsonValue, string]> = [
    ['shop.returnWindowDays', 'general', 14, 'Délai de rétractation (jours, produits standard)'],
    ['shop.currency', 'general', 'EUR', 'Devise'],
    ['order.prefix', 'general', 'CMD', 'Préfixe de numérotation des commandes'],
    ['order.paymentWindowMinutes', 'general', 60, "Délai avant libération du stock d'une commande impayée"],
    ['invoice.prefix', 'billing', 'FA', 'Préfixe de numérotation des factures'],
    ['invoice.creditPrefix', 'billing', 'AV', 'Préfixe de numérotation des avoirs'],
    ['payments.provider', 'payments', 'mollie', 'Prestataire de paiement actif'],
    ['payments.testMode', 'payments', true, 'Mode test du prestataire'],
    ['email.provider', 'email', 'log', 'Prestataire e-mail (log = envoi simulé)'],
  ]
  for (const [key, group, value, label] of settings) {
    await prisma.setting.upsert({
      where: { key },
      update: { label, group },
      create: { key, group, value, label },
    })
  }

  // --- Contenus de l'accueil et questions fréquentes ------------------------
  for (const [index, [key, payload]] of Object.entries(demoHomeBlocks).entries()) {
    await prisma.homeBlock.upsert({
      where: { key },
      update: {},
      create: { key, payload: payload as Prisma.InputJsonValue, position: index },
    })
  }
  for (const [index, item] of demoFaq.entries()) {
    const existing = await prisma.faqItem.findFirst({ where: { question: item.question } })
    if (existing) continue
    await prisma.faqItem.create({
      data: { question: item.question, answer: item.answer, position: index, scope: 'general' },
    })
  }
}

async function purge() {
  console.log('→ Suppression des données marquées « démonstration »')
  const demoVariants = await prisma.productVariant.findMany({ where: { isDemo: true }, select: { id: true } })
  const variantIds = demoVariants.map((v) => v.id)
  await prisma.fitmentAccessory.deleteMany({ where: { variantId: { in: variantIds } } })
  await prisma.fitment.deleteMany({ where: { variantId: { in: variantIds } } })
  await prisma.kitComponent.deleteMany({
    where: { OR: [{ kitId: { in: variantIds } }, { componentId: { in: variantIds } }] },
  })
  await prisma.productVariant.deleteMany({ where: { isDemo: true } })
  await prisma.product.deleteMany({ where: { isDemo: true } })
  await prisma.media.deleteMany({ where: { isDemo: true } })
  console.log('  données de démonstration retirées')
}

async function main() {
  if (purgeDemo) {
    await purge()
    return
  }
  await seedReferenceData()
  if (args.includes('--demo')) {
    console.log('  (pas de jeu de démonstration : le catalogue vient de npm run import:france-housses)')
  }
  console.log('Terminé.')
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
