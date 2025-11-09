"use client"

import Image, { ImageProps } from "next/image"
import { useState } from "react"

type FallbackImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: ImageProps["src"]
  alt: ImageProps["alt"]
  fallbackSrc: ImageProps["src"]
}

export function FallbackImage({ fallbackSrc, src, alt, onError, ...props }: FallbackImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src)

  return (
    <Image
      {...props}
      alt={alt}
      src={currentSrc}
      onError={(event) => {
        setCurrentSrc(fallbackSrc)
        onError?.(event)
      }}
    />
  )
}

