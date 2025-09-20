"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  quality?: number
  fill?: boolean
  lazy?: boolean
  onLoad?: () => void
  onError?: () => void
}

// Blur placeholder component
function BlurPlaceholder({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-gray-200", className)}>
      <svg
        className="w-full h-full text-gray-300"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        fill="currentColor"
        viewBox="0 0 640 512"
      >
        <path d="M480 80C480 35.82 515.8 0 560 0C604.2 0 640 35.82 640 80C640 124.2 604.2 160 560 160C515.8 160 480 124.2 480 80zM0 456.1C0 445.6 2.964 435.3 8.551 426.4L225.3 81.01C231.9 70.42 243.5 64 256 64C268.5 64 280.1 70.42 286.8 81.01L412.7 281.7L460.9 202.7C464.1 196.1 472.2 192 480 192C487.8 192 495 196.1 499.1 202.7L631.1 419.1C636.9 428.6 640 439.7 640 450.9C640 484.6 612.6 512 578.9 512H55.91C25.03 512 .0006 486.1 .0006 456.1L0 456.1z" />
      </svg>
    </div>
  )
}

// Loading skeleton component
function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn("animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200", className)}
    />
  )
}

// Error placeholder component
function ErrorPlaceholder({ className, onRetry }: { className?: string; onRetry?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "flex flex-col items-center justify-center bg-gray-100 text-gray-400",
        className
      )}
    >
      <svg
        className="w-12 h-12 mb-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <span className="text-sm">Failed to load</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
        >
          Retry
        </button>
      )}
    </motion.div>
  )
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  quality = 75,
  fill = false,
  lazy = true,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(!lazy || priority)
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isInView) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px', // Load images 50px before they come into view
        threshold: 0.1
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [lazy, priority, isInView])

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  const handleRetry = () => {
    setHasError(false)
    setIsLoading(true)
  }

  // Generate blur data URL if not provided
  const defaultBlurDataURL = blurDataURL || `data:image/svg+xml;base64,${Buffer.from(
    `<svg width="${width || 400}" height="${height || 300}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/></svg>`
  ).toString('base64')}`

  return (
    <div
      ref={imgRef}
      className={cn("relative overflow-hidden", className)}
      style={fill ? { width: '100%', height: '100%' } : { width, height }}
    >
      <AnimatePresence mode="wait">
        {hasError ? (
          <ErrorPlaceholder
            key="error"
            className={fill ? "absolute inset-0" : ""}
            onRetry={handleRetry}
          />
        ) : isLoading ? (
          <LoadingSkeleton
            key="loading"
            className={fill ? "absolute inset-0" : ""}
          />
        ) : isInView ? (
          <motion.div
            key="image"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={fill ? "absolute inset-0" : ""}
          >
            <Image
              src={src}
              alt={alt}
              width={fill ? undefined : width}
              height={fill ? undefined : height}
              fill={fill}
              priority={priority}
              placeholder={placeholder}
              blurDataURL={placeholder === 'blur' ? defaultBlurDataURL : undefined}
              sizes={sizes || (fill ? "100vw" : undefined)}
              quality={quality}
              onLoad={handleLoad}
              onError={handleError}
              className="object-cover"
              {...props}
            />
          </motion.div>
        ) : (
          <BlurPlaceholder
            key="placeholder"
            className={fill ? "absolute inset-0" : ""}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Specialized image components for different use cases
export function HeroImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      priority={true}
      quality={90}
      sizes="100vw"
      placeholder="blur"
    />
  )
}

export function CardImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      quality={80}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      placeholder="blur"
    />
  )
}

export function ThumbnailImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      quality={60}
      sizes="(max-width: 768px) 50vw, 25vw"
      placeholder="empty"
    />
  )
}

// Gallery image with zoom functionality
export function GalleryImage({ 
  src, 
  alt, 
  className,
  onClick,
  ...props 
}: OptimizedImageProps & { onClick?: () => void }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn("cursor-pointer", className)}
      onClick={onClick}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        quality={85}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        placeholder="blur"
        {...props}
      />
    </motion.div>
  )
}

// Avatar image with fallback
export function AvatarImage({ 
  src, 
  alt, 
  className,
  size = 40,
  fallback,
  ...props 
}: OptimizedImageProps & { 
  size?: number
  fallback?: string 
}) {
  const [showFallback, setShowFallback] = useState(false)

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full bg-gradient-to-br from-gray-100 to-gray-200",
        className
      )}
      style={{ width: size, height: size }}
    >
      {showFallback && fallback ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 font-semibold">
          {fallback.charAt(0).toUpperCase()}
        </div>
      ) : (
        <OptimizedImage
          src={src}
          alt={alt}
          width={size}
          height={size}
          quality={80}
          placeholder="blur"
          onError={() => setShowFallback(true)}
          className="object-cover"
          {...props}
        />
      )}
    </div>
  )
}
