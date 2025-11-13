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
            console.log('SW registered: ', registration);
            
            // Check for updates
            registration.addEventListener('updatefound', function() {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', function() {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New content is available, show update notification
                    // Only show notification, don't force reload
                    console.log('New service worker available');
                  }
                });
              }
            });
          })
          .catch(function(registrationError) {
            // Silently fail - service worker is optional
            console.warn('SW registration failed: ', registrationError);
          });
      });
    }

    // Initialize performance optimizations
    if (typeof window !== 'undefined') {
      // Note: Preloading images removed to avoid console warnings
      // Images will load naturally when needed
      // Preloading should only be used for above-the-fold critical images
      // that are guaranteed to be used within a few seconds
      
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
