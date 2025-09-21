"use client"

import { useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'

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
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [showControls, setShowControls] = useState(false)
  const [videoError, setVideoError] = useState(false)

  // Default hotel video URL (you can replace with your own)
  const defaultVideoUrl = videoUrl || "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c0fd273d2c6d9a064f3ae35579b2bbdf&profile_id=165&oauth2_token_id=57447761"

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowControls(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [showControls])

  return (
    <div 
      className={`relative min-h-screen overflow-hidden ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        {!videoError && defaultVideoUrl ? (
          <video
            className="w-full h-full object-cover"
            autoPlay
            muted={isMuted}
            loop
            playsInline
            poster={fallbackImage}
            onError={() => setVideoError(true)}
            style={{
              filter: 'brightness(0.6) contrast(1.1)'
            }}
          >
            <source src={defaultVideoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div 
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${fallbackImage})`,
              filter: 'brightness(0.6) contrast(1.1)'
            }}
          />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
      </div>

      {/* Video Controls */}
      <div className={`absolute bottom-4 right-4 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
          <button
            onClick={togglePlayPause}
            className="p-2 text-white hover:bg-white/20 rounded transition-colors"
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={toggleMute}
            className="p-2 text-white hover:bg-white/20 rounded transition-colors"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  )
}
