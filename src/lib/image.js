/**
 * Utilitaires de traitement d'images côté client via canvas.
 *
 * - Les GIF animés sont retournés tels quels (le canvas écraserait l'animation).
 * - Les images non reconnues par createImageBitmap (corrompues, format exotique) sont
 *   retournées telles quelles en fallback silencieux — l'upload décidera ensuite.
 */

const GIF_MIME = 'image/gif'

/**
 * Redimensionne une image en préservant son ratio.
 * Si `square` est vrai, l'image est recadrée au centre en carré (utile pour un avatar).
 *
 * @param {File} file             Fichier source
 * @param {object} [opts]
 * @param {number} [opts.maxSize] Plus grande dimension cible en pixels (défaut 1600)
 * @param {number} [opts.quality] Qualité JPEG 0..1 (défaut 0.85)
 * @param {boolean} [opts.square] Crop carré au centre (défaut false)
 * @returns {Promise<File>}
 */
export async function resizeImage(
  file,
  { maxSize = 1600, quality = 0.85, square = false } = {},
) {
  if (!file || !file.type?.startsWith('image/')) return file
  if (file.type === GIF_MIME) return file

  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file

  let sx = 0
  let sy = 0
  let sw = bitmap.width
  let sh = bitmap.height
  let dw
  let dh

  if (square) {
    const side = Math.min(bitmap.width, bitmap.height)
    sx = (bitmap.width - side) / 2
    sy = (bitmap.height - side) / 2
    sw = side
    sh = side
    dw = Math.min(maxSize, side)
    dh = dw
  } else {
    const longest = Math.max(bitmap.width, bitmap.height)
    const ratio = longest > maxSize ? maxSize / longest : 1
    dw = Math.round(bitmap.width * ratio)
    dh = Math.round(bitmap.height * ratio)
    // Si l'image est déjà plus petite ET son format est déjà compressé (JPEG/WebP),
    // on évite un re-encodage potentiellement plus lourd.
    if (ratio === 1 && (file.type === 'image/jpeg' || file.type === 'image/webp')) {
      bitmap.close?.()
      return file
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = dw
  canvas.height = dh
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close?.()
    return file
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, dw, dh)
  bitmap.close?.()

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  )
  if (!blob) return file

  // Garde-fou : si le JPEG produit est plus gros que l'original (cas PNG déjà
  // très compressés, illustrations plates...), on renvoie l'original.
  if (blob.size >= file.size) return file

  const baseName = (file.name || 'image').replace(/\.[^.]+$/, '') || 'image'
  return new File([blob], `${baseName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}
