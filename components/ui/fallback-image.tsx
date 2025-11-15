"use client"

import Image, { ImageProps } from "next/image"
import { useState, useEffect } from "react"

type FallbackImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: ImageProps["src"]
  alt: ImageProps["alt"]
  fallbackSrc: ImageProps["src"]
}

export function FallbackImage({ fallbackSrc, src, alt, onError, ...props }: FallbackImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false)
    setCurrentSrc(src)
  }, [src])

  // If src is an Unsplash URL with sig parameter, ensure unoptimized is set
  const isUnsplash = typeof currentSrc === 'string' && currentSrc.startsWith('https://images.unsplash.com')
  const shouldUnoptimize = isUnsplash || props.unoptimized

  // Handle image errors gracefully, especially for expected Unsplash failures
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = event.target as HTMLImageElement
    
    // For Unsplash images, these 404s are expected - silently handle them
    if (isUnsplash && !hasError) {
      // Stop the error from propagating to browser console for expected failures
      event.stopPropagation()
      // Immediately switch to fallback
      if (target.src !== fallbackSrc) {
        setHasError(true)
        setCurrentSrc(fallbackSrc)
      }
    } else if (!hasError) {
      // For other images, handle normally
      setHasError(true)
      setCurrentSrc(fallbackSrc)
    }
    
    // Call custom onError if provided
    onError?.(event)
  }

  return (
    <Image
      {...props}
      alt={alt}
      src={hasError ? fallbackSrc : currentSrc}
      unoptimized={shouldUnoptimize}
      onError={handleImageError}
    />
  )
}

