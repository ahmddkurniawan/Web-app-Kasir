export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  // Set canvas size to the cropped size (e.g. 250x250)
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // Compress if image is large, else standard jpeg
  let targetWidth = pixelCrop.width;
  let targetHeight = pixelCrop.height;
  const MAX_SIZE = 250;
  
  if (targetWidth > MAX_SIZE || targetHeight > MAX_SIZE) {
      if (targetWidth > targetHeight) {
          targetHeight *= MAX_SIZE / targetWidth;
          targetWidth = MAX_SIZE;
      } else {
          targetWidth *= MAX_SIZE / targetHeight;
          targetHeight = MAX_SIZE;
      }
      
      const resizedCanvas = document.createElement('canvas');
      resizedCanvas.width = targetWidth;
      resizedCanvas.height = targetHeight;
      const resizedCtx = resizedCanvas.getContext('2d');
      resizedCtx?.drawImage(canvas, 0, 0, targetWidth, targetHeight);
      return resizedCanvas.toDataURL('image/jpeg', 0.8);
  }

  return canvas.toDataURL('image/jpeg', 0.8)
}
