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

  return (
    <Image
      {...props}
      alt={alt}
      src={hasError ? fallbackSrc : currentSrc}
      unoptimized={shouldUnoptimize}
      onError={(event) => {
        if (!hasError) {
          setHasError(true)
          setCurrentSrc(fallbackSrc)
        }
        onError?.(event)
      }}
    />
  )
}

