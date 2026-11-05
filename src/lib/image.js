/**
 * Compresses an image file or blob:
 * - Respects EXIF orientation using createImageBitmap with imageOrientation 'from-image' (falls back to Image element if unsupported)
 * - Scales the longest side down to maxSide only if it is larger
 * - Draws onto a 2D canvas and exports as JPEG
 * - Returns { dataUrl, base64, mimeType: "image/jpeg", width, height }
 */
export async function compressImage(fileOrBlob, { maxSide = 1600, quality = 0.8 } = {}) {
  let source = null
  let width = 0
  let height = 0

  // 1. Try createImageBitmap with automatic EXIF orientation
  if (typeof createImageBitmap === 'function') {
    try {
      source = await createImageBitmap(fileOrBlob, { imageOrientation: 'from-image' })
      width = source.width
      height = source.height
    } catch {
      try {
        source = await createImageBitmap(fileOrBlob)
        width = source.width
        height = source.height
      } catch {
        source = null
      }
    }
  }

  // 2. Fallback to standard Image loading if createImageBitmap is not available
  if (!source) {
    source = await new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(fileOrBlob)
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve(img)
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image file'))
      }
      img.src = url
    })
    width = source.naturalWidth || source.width
    height = source.naturalHeight || source.height
  }

  // 3. Scale down proportionally only if larger than maxSide
  let targetWidth = width
  let targetHeight = height

  if (targetWidth > maxSide || targetHeight > maxSide) {
    if (targetWidth >= targetHeight) {
      targetHeight = Math.round((targetHeight * maxSide) / targetWidth)
      targetWidth = maxSide
    } else {
      targetWidth = Math.round((targetWidth * maxSide) / targetHeight)
      targetHeight = maxSide
    }
  }

  // 4. Render to canvas
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext('2d')
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight)

  // 5. Export as JPEG with specified quality
  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  const base64 = dataUrl.split(',')[1] || ''

  return {
    dataUrl,
    base64,
    mimeType: 'image/jpeg',
    width: targetWidth,
    height: targetHeight,
  }
}

