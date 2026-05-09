/**
 * SmartHotel OS — Motion & Animation Tokens
 * High-performance, GPU-accelerated transition tokens and Framer Motion presets.
 */

export const MOTION_DURATIONS = {
  INSTANT: 0,
  FASTEST: 0.12,
  FAST: 0.22,
  NORMAL: 0.35,
  SLOW: 0.55,
  CINEMATIC: 0.85,
} as const;

export const MOTION_EASES = {
  LINEAR: 'linear',
  EASE_IN: [0.4, 0, 1, 1],
  EASE_OUT: [0, 0, 0.2, 1],
  EASE_IN_OUT: [0.4, 0, 0.2, 1],
  LUXURY_SOFT: [0.16, 1, 0.3, 1], // Custom ultra-smooth easeOutExpo variant
  CINEMATIC_ZOOM: [0.25, 1, 0.5, 1],
} as const;

export const MOTION_VARIANTS = {
  // Page routing crossfade & settle entrance
  pageEntrance: {
    initial: { opacity: 0, y: 6, scale: 0.995 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: MOTION_DURATIONS.SLOW,
        ease: MOTION_EASES.LUXURY_SOFT,
      },
    },
    exit: {
      opacity: 0,
      y: -6,
      scale: 0.995,
      transition: {
        duration: MOTION_DURATIONS.FAST,
        ease: MOTION_EASES.EASE_IN,
      },
    },
  },

  // Staggered card container reveal
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.04,
      },
    },
  },

  // Sliding hover expansion
  hoverMicroScale: {
    scale: 1.015,
    y: -2,
    transition: {
      duration: MOTION_DURATIONS.FAST,
      ease: MOTION_EASES.LUXURY_SOFT,
    },
  },

  // Interactive tap push
  tapPush: {
    scale: 0.985,
    transition: {
      duration: MOTION_DURATIONS.FASTEST,
    },
  },

  // Modals / Dialog popup scale-and-blur zoom
  modalPop: {
    initial: { opacity: 0, scale: 0.96, filter: 'blur(4px)' },
    animate: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: MOTION_DURATIONS.NORMAL,
        ease: MOTION_EASES.LUXURY_SOFT,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.96,
      filter: 'blur(4px)',
      transition: {
        duration: MOTION_DURATIONS.FAST,
        ease: MOTION_EASES.EASE_IN,
      },
    },
  },

  // Slow subtle parallax background zoom-out
  ambientParallax: {
    initial: { scale: 1.05 },
    animate: {
      scale: 1.0,
      transition: {
        duration: 3.5,
        ease: MOTION_EASES.CINEMATIC_ZOOM,
      },
    },
  },
} as const;
