import sharp from 'sharp'

/**
 * Les photos de l'ancien site sont souvent une petite image posée au milieu
 * d'un grand carré blanc (1 440 px pour une housse de 300 px) : sur le
 * nouveau site, la housse apparaissait minuscule dans sa vignette.
 *
 * On retire le blanc autour, puis on remet l'image dans un carré avec une
 * marge régulière. Une vraie photo (fond non uni) n'est pas touchée.
 */
export async function recadrerPhoto(
  octets: Buffer,
): Promise<{ octets: Buffer; width: number; height: number } | null> {
  const image = sharp(octets, { limitInputPixels: 60_000_000 })
  const meta = await image.metadata()
  if (!meta.width || !meta.height || meta.format === 'gif' || meta.format === 'svg') return null
  const { data, info } = await sharp(octets).trim({ threshold: 14 }).toBuffer({ resolveWithObject: true })
  const part = (info.width * info.height) / (meta.width * meta.height)
  if (part > 0.7 || info.width < 24 || info.height < 24) return null
  const cote = Math.round(Math.max(info.width, info.height) * 1.12)
  const fond = meta.hasAlpha ? { r: 255, g: 255, b: 255, alpha: 0 } : { r: 255, g: 255, b: 255, alpha: 1 }
  let sortie = sharp(data).extend({
    top: Math.floor((cote - info.height) / 2),
    bottom: Math.ceil((cote - info.height) / 2),
    left: Math.floor((cote - info.width) / 2),
    right: Math.ceil((cote - info.width) / 2),
    background: fond,
  })
  sortie =
    meta.format === 'png'
      ? sortie.png()
      : meta.format === 'webp'
        ? sortie.webp({ quality: 90 })
        : sortie.jpeg({ quality: 90 })
  const resultat = await sortie.toBuffer({ resolveWithObject: true })
  return { octets: resultat.data, width: resultat.info.width, height: resultat.info.height }
}
