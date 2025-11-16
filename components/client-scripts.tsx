"use client"

import { useEffect } from 'react'

export default function ClientScripts() {
  useEffect(() => {
    // Service Worker Registration (only in production and if supported)
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      window.addEventListener('load', function() {
        navigator.serviceWorker
          .register('/sw.js')
          .then(function(registration) {
            // SW registration log kept for monitoring (expected behavior)
            if (process.env.NODE_ENV !== 'production') {
              console.log('SW registered: ', registration);
            }
            
            // Check for updates
            registration.addEventListener('updatefound', function() {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', function() {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New content is available, show update notification
                    // Only show notification, don't force reload
                    // SW update notification (only in dev)
                    if (process.env.NODE_ENV !== 'production') {
                      console.log('New service worker available');
                    }
                  }
                });
              }
            });
          })
          .catch(function(registrationError) {
            // Silently fail - service worker is optional
            // Only log in dev mode
            if (process.env.NODE_ENV !== 'production') {
              console.warn('SW registration failed: ', registrationError);
            }
          });
      });
    }

    // Initialize performance optimizations
    if (typeof window !== 'undefined') {
      // Note: Preloading images removed to avoid console warnings
      // Images will load naturally when needed
      // Preloading should only be used for above-the-fold critical images
      // that are guaranteed to be used within a few seconds
      
      // Global error handler to suppress expected resource loading errors
      const originalConsoleError = console.error
      console.error = (...args: any[]) => {
        const errorMessage = args[0]?.toString() || ''
        const errorString = JSON.stringify(args)
        
        // Suppress expected errors:
        // 1. Unsplash image 404s (handled by FallbackImage component) - now obsolete but keeping for compatibility
        const isExpectedError = 
          errorMessage.includes('images.unsplash.com') ||
          errorString.includes('images.unsplash.com') ||
          (errorString.includes('Failed to load resource') && errorString.includes('unsplash'))
        
        // Only suppress expected errors - log all others
        if (!isExpectedError) {
          originalConsoleError.apply(console, args)
        }
        // Expected errors are silently handled (fallbacks are used)
      }
      
      // Also intercept window error events for resource loading
      window.addEventListener('error', (event) => {
        const target = event.target as HTMLElement
        const src = (target as HTMLImageElement)?.src || (target as HTMLVideoElement)?.src || ''
        
        // Suppress expected resource loading errors (only Unsplash now, Vimeo removed)
        if (
          target instanceof HTMLImageElement &&
          src.includes('images.unsplash.com')
        ) {
          event.preventDefault()
          event.stopPropagation()
          return false
        }
      }, true) // Use capture phase to catch errors early
      
      // Initialize lazy loading
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
              }
            }
          });
        });
        
        // Observe all lazy images
        document.querySelectorAll('img[data-src]').forEach(img => {
          imageObserver.observe(img);
        });
      }
    }
  }, []);

  return null;
}
