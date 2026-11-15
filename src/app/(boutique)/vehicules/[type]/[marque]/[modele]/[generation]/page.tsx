import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { generationRenommee } from '@/lib/queries/adresses-renommees'
import {
  LIBELLE_PAR_CHEMIN,
  TYPE_PAR_CHEMIN,
  getPackGeneration,
} from '@/lib/queries/vehicules'
import { getSelectedVehicle } from '@/lib/session'
import { Breadcrumb } from '@/components/catalogue/Breadcrumb'
import { EmptyState } from '@/components/ui/Surface'
import { PackReadFailure } from '@/components/vehicules/PackReadFailure'
import { ButtonLink } from '@/components/ui/Button'
import {
  IconArrowRight,
  IconCheckCircle,
  IconChevronDown,
  IconHeadset,
  IconInfo,
} from '@/components/ui/icons'
import { cartesDesPacks, totalDesCartes } from '@/lib/packs-vue'
import { phaseUtile } from '@/lib/resultats-vue'
import { BandeauVehicule } from '@/components/vehicule/BandeauVehicule'
import { BarreVehicule } from '@/components/vehicule/BarreVehicule'
import { EclairagesParZone } from '@/components/vehicule/EclairagesParZone'
import { TotalEclairage } from '@/components/vehicule/TotalEclairage'
import { PromessesAchat } from '@/components/confiance/PromessesAchat'
import { dureeGarantie } from '@/lib/identity'

type PageProps = {
  params: Promise<{ type: string; marque: string; modele: string; generation: string }>
}

/**
 * Éclairages documentés pour une génération, groupés par emplacement.
 *
 * **Ce que cette page affirme, et ce qu'elle n'affirme pas.** Elle montre ce
 * qui est documenté pour la génération, toutes configurations confondues. Tant
 * que l'équipement d'origine n'est pas choisi, aucune compatibilité n'est
 * confirmée pour LE véhicule du client : la page le dit en tête et mène à
 * l'étape d'équipement. Consulter un modèle ne vaut pas sélection.
 *
 * Les cartes portent le prix du conditionnement conseillé par la règle
 * partagée (`lib/recommendation.ts`) : le même que la fiche produit et les
 * résultats véhicule.
 *
 * **Une seule grille, l'emplacement sur la carte.** La page donnait à chaque
 * emplacement sa section, titre et compteur compris. Sur 10 178 couples
 * (génération, emplacement), 10 068 ne portent qu'un seul produit : le titre
 * coûtait plus de hauteur que ce qu'il annonçait, et sept emplacements
 * tenaient sur trois écrans et demi de téléphone. L'emplacement se lit
 * maintenant sur la carte, ce qui le dit aussi bien et laisse les produits se
 * suivre. Un produit documenté sur deux emplacements n'apparaît qu'une fois,
 * et les nomme tous les deux.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type, marque, modele, generation } = await params
  const vehicleType = TYPE_PAR_CHEMIN[type]
  if (!vehicleType) return { title: 'Housses par véhicule' }

  const lecture = await getPackGeneration(vehicleType, marque, modele, generation)
  // Une lecture en échec ne titre pas « introuvable » : on ne l'a pas constaté.
  if (lecture.state !== 'found') {
  /*
    `noindex` sur l'absence, et sur elle seule.

    Le 404 suffirait à tenir Google à l'écart, mais il n'est pas toujours lu
    comme tel par les outils tiers, et le `noindex` global vient aujourd'hui du
    mode préproduction : le jour où il s'éteindra, cette page le perdrait.
    Deux mécanismes valent mieux qu'un sur une adresse qu'un véhicule
    redeviendra peut-être.

    Rien de tel sur `unavailable` : une base injoignable n'est pas une page
    absente, et demander à Google de désindexer une page qui existe à cause
    d'un incident de lecture coûterait des mois à rattraper.
  */
    return lecture.state === 'absent'
      ? { title: 'Véhicule introuvable', robots: { index: false, follow: false } }
      : { title: 'Housses par véhicule' }
  }

  const data = lecture.data
  const emplacements = [...new Set(data.groups.map((groupe) => groupe.label))]
  return {
    title: `Housses de siège et tapis ${data.makeName} ${data.generationName} (${data.years})`,
    description: [
      emplacements.length > 0
        ? `Pour ${data.makeName} ${data.generationName} (${data.years}) : ${emplacements.slice(0, 5).join(', ').toLowerCase()}${emplacements.length > 5 ? '…' : '.'}`
        : `Housses de siège et tapis pour ${data.makeName} ${data.generationName} (${data.years}).`,
      'Fabriqués pour votre véhicule par France Housses, depuis 1986.',
      dureeGarantie() ? `Garantie ${dureeGarantie()}.` : '',
    ]
      .filter(Boolean)
      .join(' '),
    alternates: { canonical: `/vehicules/${type}/${marque}/${modele}/${generation}` },
  }
}

export default async function PacksGenerationPage({ params }: PageProps) {
  const { type, marque, modele, generation } = await params
  const vehicleType = TYPE_PAR_CHEMIN[type]
  const libelle = LIBELLE_PAR_CHEMIN[type]
  if (!vehicleType || !libelle) notFound()

  const [lecture, vehicle] = await Promise.all([
    getPackGeneration(vehicleType, marque, modele, generation),
    getSelectedVehicle(),
  ])

  /*
    Une génération absente du référentiel reste un 404. Une lecture en échec
    sort ici, avant tout rendu : c'est ce qui l'empêche de passer pour une
    génération inconnue, puis — plus bas — pour une génération dépourvue de
    compatibilités. Rien de ce qui suit n'affirme quoi que ce soit sur un
    véhicule dont la fiche n'a pas été lue.
  */
  if (lecture.state === 'unavailable') return <PackReadFailure type={type} libelle={libelle} />
  if (lecture.state === 'absent') {
    // Adresse renommée (« -photo-manquante » retiré) : renvoi permanent.
    const renommee = await generationRenommee({ type, marque, modele, generation })
    if (renommee) permanentRedirect(renommee)
    notFound()
  }

  const data = lecture.data
  const cartes = cartesDesPacks(data.groups)
  const totalProduits = cartes.length
  const total = totalDesCartes(cartes)
  const plusieursEquipements = data.equipments.length > 1
  /*
    Le véhicule retenu est-il celui de cette page ? On compare la configuration
    choisie aux configurations de la génération : c'est la seule égalité sûre.
    Comparer des libellés ferait passer « A8 D2 » pour « A8 D3 » un jour de
    reformulation.
  */
  const vehiculeChoisi = Boolean(
    vehicle && data.equipments.some((e) => e.configurationId === vehicle.configurationId),
  )

  return (
    <div className="container-page pb-10 fiche:pb-14">
      <Breadcrumb
        items={[
          { label: 'Accueil', href: '/' },
          { label: libelle.long, href: `/vehicules/${type}` },
          { label: data.makeName, href: `/vehicules/${type}/${marque}` },
          { label: data.modelName, href: `/vehicules/${type}/${marque}/${modele}` },
          { label: `${data.generationName} ${data.years}` },
        ]}
      />

      <BandeauVehicule
        surtitre={`${data.makeName} ${data.generationName} · ${data.years}`}
        titre="Housses & tapis"
        sousTitre={`pour ${data.makeName} ${data.generationName}`}
        description={
          totalProduits > 0
            ? 'Housses de siège, tapis de sol et protections pour ce véhicule.'
            : 'Aucun produit n’est encore en ligne pour cette version.'
        }
        marque={data.makeName}
        logo={data.makeLogo}
        action={
          totalProduits > 0 ? (
            <ButtonLink
              href="#packs"
              className="min-h-[43px] gap-2.5 rounded-lg px-[15px] text-[12px]"
              iconRight={<IconArrowRight className="size-4 rotate-90" />}
            >
              Voir les {totalProduits} produit{totalProduits > 1 ? 's' : ''}
            </ButtonLink>
          ) : null
        }
      />

      <BarreVehicule
        nom={`${data.makeName} ${data.generationName}`}
        annees={data.years}
        nombreDePacks={totalProduits}
        moto={false}
        action={
          vehiculeChoisi ? (
            <span className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-ok-border bg-ok-soft px-3 text-[12px] font-bold text-ok">
              <IconCheckCircle className="size-4 shrink-0" />
              Véhicule sélectionné
            </span>
          ) : (
            <ButtonLink
              href="/vehicule"
              variant="secondary"
              className="min-h-10 gap-2 rounded-lg px-3 text-[12px]"
            >
              {plusieursEquipements ? "Indiquer mon équipement" : 'Choisir ce véhicule'}
            </ButtonLink>
          )
        }
      />

      {phaseUtile(data.phase, data.generationName) ? (
        <p className="mt-2 text-[12px] text-muted-strong">{data.phase}</p>
      ) : null}

      {totalProduits > 0 ? <PromessesAchat className="mt-3" /> : null}

      {/*
        L'avertissement qui empêche cette page de mentir.

        Elle montre ce qui est documenté pour la génération. Si celle-ci a été
        vendue avec plusieurs équipements d'origine, aucun des statuts affichés
        ne vaut pour un véhicule donné tant que l'équipement n'est pas choisi.
      */}
      {totalProduits > 0 && plusieursEquipements ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-[7px] bg-warn-soft p-3 text-[#8d5420]">
          <IconInfo className="mt-px size-4 shrink-0" />
          <div className="min-w-0 text-[11px] leading-[1.7]">
            <p className="font-bold">
              Cette génération a été vendue avec {data.equipments.length} équipements
              d&apos;origine.
            </p>
            <p>
              Un phare halogène et un xénon n&apos;acceptent pas les mêmes pièces. Les éclairages
              ci-dessous sont ceux documentés pour la génération ; indiquez votre équipement pour
              savoir lesquels conviennent à votre véhicule.
            </p>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {data.equipments.map((equipment) => (
                <span key={equipment.configurationId} className="font-semibold">
                  {equipment.label}
                </span>
              ))}
            </p>
          </div>
        </div>
      ) : null}

      {totalProduits === 0 ? (
        <EmptyState
          className="mt-6"
          title="Aucun produit n'est encore en ligne pour cette version."
          description="Nous fabriquons aussi sur mesure à la commande. Décrivez-nous votre véhicule : nous vous répondons avec la bonne housse."
          action={{ label: 'Nous contacter', href: '/contact' }}
        />
      ) : (
        <>
          <section id="packs" className="mt-[25px] scroll-mt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3.5">
              <h2 className="text-[clamp(24px,2.9vw,34px)] leading-[1.15] font-extrabold tracking-[-0.048em]">
                Choisissez vos housses et tapis
              </h2>
              <p className="text-[13px] whitespace-nowrap text-muted-strong">
                {totalProduits} produit{totalProduits > 1 ? 's' : ''}
              </p>
            </div>

            <EclairagesParZone cartes={cartes} />

            {false && total.produits > 1 ? (
              <TotalEclairage
                titre={`${data.makeName} ${data.generationName}`}
                produits={total.produits}
                emplacements={total.emplacements}
                totalCents={total.totalCents}
                variantIds={total.variantIds}
              />
            ) : null}

            <div className="mt-[29px] grid gap-5 border-t border-line pt-[22px] pb-[26px] fiche:grid-cols-[1fr_1.3fr] fiche:gap-x-8">
              <div>
                <h2 className="text-[20px] font-extrabold tracking-[-0.035em]">
                  Un doute sur vos sièges ?
                </h2>
                <p className="mt-1 text-[13px] text-muted-strong">
                  Retrouvez les repères pour choisir la bonne housse.
                </p>
                <Link
                  href="/contact"
                  className="mt-3 inline-flex items-center gap-2 text-[12px] font-bold text-slate-ink underline decoration-line-strong underline-offset-4 hover:text-brand hover:decoration-brand"
                >
                  <IconHeadset className="size-4 shrink-0" strokeWidth={1.5} />
                  Contacter un conseiller
                </Link>
              </div>

              <div>
                <details className="border-b border-line">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-bold marker:content-none">
                    Sur mesure, à la commande ou universelle ?
                    <IconChevronDown className="size-4 shrink-0" />
                  </summary>
                  <p className="pr-2.5 pb-3 text-[13px] text-muted-strong">
                    Les housses sur mesure sont taillées pour les sièges de cette version :
                    ajustement précis, découpes pour appuie-tête, accoudoirs et ceintures. Les
                    gammes à la commande sont fabriquées d&apos;après la description de votre
                    véhicule. Les universelles s&apos;adaptent à la plupart des sièges.
                  </p>
                </details>
                <details className="border-b border-line">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-bold marker:content-none">
                    Comment être sûr que la housse convient ?
                    <IconChevronDown className="size-4 shrink-0" />
                  </summary>
                  <p className="pr-2.5 pb-3 text-[13px] text-muted-strong">
                    Vérifiez le nombre de places et comparez vos sièges au croquis de la fiche.
                    En cas de doute, appelez-nous au 05 58 93 95 39 ou envoyez-nous une photo de
                    vos sièges : nous vérifions avant la fabrication.
                  </p>
                </details>
                {dureeGarantie() ? (
                  <details className="border-b border-line">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-bold marker:content-none">
                      Et en cas de défaut ?
                      <IconChevronDown className="size-4 shrink-0" />
                    </summary>
                    <p className="pr-2.5 pb-3 text-[13px] text-muted-strong">
                      Tous nos produits sont garantis {dureeGarantie()} à compter de la
                      livraison : écrivez-nous avec votre numéro de commande, nous remplaçons
                      le produit à nos frais.{' '}
                      <Link href="/garanties" className="font-bold text-slate-ink underline underline-offset-4">
                        Voir la garantie
                      </Link>
                    </p>
                  </details>
                ) : null}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
