"use client"

interface HeroVideoBackgroundProps {
  videoUrl?: string
  fallbackImage: string
  children: React.ReactNode
  className?: string
}

export default function HeroVideoBackground({ 
  videoUrl, 
  fallbackImage, 
  children, 
  className = "" 
}: HeroVideoBackgroundProps) {
  // Note: Using static image background instead of external video to avoid 404s
  // videoUrl prop is kept for backwards compatibility but not used

  return (
    <div 
      className={`relative min-h-screen overflow-hidden ${className}`}
    >
      {/* Video Background - Using static image to avoid external video 404s */}
      <div className="absolute inset-0 z-0">
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${fallbackImage})`,
            filter: 'brightness(0.6) contrast(1.1)'
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  )
}
