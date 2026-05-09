/**
 * SmartHotel OS — Glassmorphism Surfaces & Shadow Elevators
 * Exports centralized styling templates for building modern premium translucent panels
 * with integrated backdrop-blur indices and subtle depth.
 */

export const GLASS_SURFACES = {
  // Translucent premium panel (ideal for metrics dashboard grids and analytics widgets)
  standard: {
    backdropFilter: 'blur(16px) saturate(140%)',
    WebkitBackdropFilter: 'blur(16px) saturate(140%)',
    backgroundColor: 'rgba(18, 17, 24, 0.65)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
  },

  // Elegant golden/bronze glow glass panel (ideal for premium suites and executive accounts)
  goldTint: {
    backdropFilter: 'blur(20px) saturate(120%)',
    WebkitBackdropFilter: 'blur(20px) saturate(120%)',
    backgroundColor: 'rgba(21, 18, 13, 0.7)',
    border: '1px solid rgba(212, 175, 55, 0.12)',
    boxShadow: '0 12px 40px 0 rgba(212, 175, 55, 0.05)',
  },

  // Ultra-subtle header navigation backdrop
  headerNav: {
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    backgroundColor: 'rgba(9, 5, 13, 0.8)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
  },

  // Light floating popups (dialog boxes, notification alerts)
  floatingBubble: {
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    backgroundColor: 'rgba(28, 25, 34, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 20px 50px 0 rgba(0, 0, 0, 0.5)',
  },
} as const;

export const GLASS_ELEVATIONS = {
  NONE: 'none',
  LOW: '0 2px 8px rgba(0, 0, 0, 0.15)',
  MEDIUM: '0 8px 24px rgba(0, 0, 0, 0.3)',
  HIGH: '0 20px 48px rgba(0, 0, 0, 0.5)',
  GOLD_GLOW: '0 10px 30px rgba(212, 175, 55, 0.06), 0 1px 3px rgba(212, 175, 55, 0.1)',
} as const;
