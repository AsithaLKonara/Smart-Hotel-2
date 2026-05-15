'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export interface CinematicHeroProps {
  videoMp4Url?: string;
  videoWebmUrl?: string;
  fallbackImageUrl?: string;
  overlayOpacity?: number; // scale 0 to 1
  children?: React.ReactNode;
  parallaxSpeed?: number; // scale 0 to 1
}

export const CinematicHero: React.FC<CinematicHeroProps> = ({
  videoMp4Url = '/videos/hotel-cinematic.mp4',
  videoWebmUrl,
  fallbackImageUrl = '/images/hotel/hotel-hero-2.jpg',
  overlayOpacity = 0.55,
  children,
  parallaxSpeed = 0.3,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isTabActive, setIsTabActive] = useState(true);

  // Monitor window scrolls to execute cinematic GPU-accelerated parallax translation
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // CPU Savings: Pause video loops if current browser tab is minimized or inactive
  useEffect(() => {
    const handleVisibilityChange = () => {
      const active = document.visibilityState === 'visible';
      setIsTabActive(active);
      
      if (videoRef.current) {
        if (active) {
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.pause();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Trigger loading state once video metadata successfully loads
  const handleVideoLoaded = () => {
    setIsLoaded(true);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#09050D] flex items-center justify-center">
      {/* Cinematic Parallax Video Box */}
      <motion.div
        className="absolute inset-0 w-full h-[120%] pointer-events-none"
        style={{
          y: scrollY * parallaxSpeed,
        }}
      >
        {/* Soft Background Fallback Image */}
        <Image
          src={fallbackImageUrl}
          alt="Luxury Backdrop"
          fill
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
            isLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          sizes="100vw"
        />

        {/* Looping Ambient Video */}
        {(videoMp4Url || videoWebmUrl) && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={handleVideoLoaded}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              isLoaded && isTabActive ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {videoWebmUrl && <source src={videoWebmUrl} type="video/webm" />}
            {videoMp4Url && <source src={videoMp4Url} type="video/mp4" />}
          </video>
        )}
      </motion.div>

      {/* Cinematic Luxury Vignette & Dark Readability Gradients */}
      <div 
        className="absolute inset-0 z-10 pointer-events-none transition-all duration-700"
        style={{
          background: `linear-gradient(to bottom, 
            rgba(9, 5, 13, 0.4) 0%, 
            rgba(9, 5, 13, ${overlayOpacity}) 50%, 
            rgba(9, 5, 13, 0.95) 100%)`
        }}
      />
      
      {/* Ambient Radial Vignette Effect to lock visually premium margins */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(9,5,13,0.7)_100%)]" />

      {/* Hero Foreground Contents */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 h-full flex flex-col justify-center items-center text-center">
        <AnimatePresence>
          {children && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="w-full flex flex-col items-center"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Gentle Floating Settle indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
        <motion.div
          animate={{
            y: [0, 8, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="flex flex-col items-center space-y-2 opacity-50"
        >
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#FBFAF7]">Discover</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-[#FBFAF7] to-transparent" />
        </motion.div>
      </div>
    </div>
  );
};

export default CinematicHero;
