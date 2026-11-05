import { useRef } from 'react'
import { compressImage } from './image'

const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25 MB

/**
 * Hook to manage hidden file inputs for Camera and Gallery picker.
 * Ensures input.click() is called directly within a user-initiated click handler.
 */
export function useImagePicker({ onImagePicked, onError }) {
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    // Always reset input so the user can re-pick the same file if needed
    e.target.value = ''

    if (!file) return

    // Validate that it is an image and <= 25 MB
    if (!file.type.startsWith('image/') || file.size > MAX_FILE_SIZE) {
      onError?.('Please choose a photo of your bill.')
      return
    }

    try {
      const compressed = await compressImage(file)
      onImagePicked?.(compressed)
    } catch (err) {
      onError?.('Please choose a photo of your bill.')
    }
  }

  const openCamera = () => {
    cameraInputRef.current?.click()
  }

  const openGallery = () => {
    galleryInputRef.current?.click()
  }

  return {
    cameraInputRef,
    galleryInputRef,
    openCamera,
    openGallery,
    handleFileChange,
  }
}

