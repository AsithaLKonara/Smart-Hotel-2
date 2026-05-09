/**
 * SmartHotel OS — Luxury Theme Tokens
 * Centralized semantic palette definitions representing brand-aligned luxury colors,
 * executive styles, and high-contrast accessibility variations.
 */

export const THEME_COLORS = {
  PRIMARY_GOLD: '#D4AF37',       // Elegant luxury gold
  DEEP_CHARCOAL: '#121118',      // Rich warm charcoal background base
  MIDNIGHT_BLACK: '#09050D',     // Ultra-deep space black base
  IVORY_WHITE: '#FBFAF7',        // Premium off-white
  ROYAL_BRONZE: '#9C8259',       // Secondary warm metallic bronze
  EMERALD_SUCCESS: '#10B981',    // Emerald green for successful operations
  CRIMSON_ALERT: '#EF4444',      // Crimson red for critical alerts
  SLATE_MUTED: '#8E8C94',        // Warm slate gray for subtitles and captions
} as const;

export type ThemeMode = 'DARK_LUXURY' | 'EXECUTIVE_LOUNGE' | 'HIGH_CONTRAST';

export interface ThemeConfig {
  mode: ThemeMode;
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    surface: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    accent: string;
  };
  borders: {
    soft: string;
    metallic: string;
  };
  accents: {
    brand: string;
    gold: string;
    success: string;
    danger: string;
  };
}

export const THEME_MODES: Record<ThemeMode, ThemeConfig> = {
  DARK_LUXURY: {
    mode: 'DARK_LUXURY',
    background: {
      primary: THEME_COLORS.MIDNIGHT_BLACK,
      secondary: THEME_COLORS.DEEP_CHARCOAL,
      tertiary: '#1B1922',
      surface: 'rgba(18, 17, 24, 0.7)',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#E6E5EA',
      muted: THEME_COLORS.SLATE_MUTED,
      accent: THEME_COLORS.PRIMARY_GOLD,
    },
    borders: {
      soft: 'rgba(255, 255, 255, 0.06)',
      metallic: 'rgba(212, 175, 55, 0.15)',
    },
    accents: {
      brand: '#8B5CF6',
      gold: THEME_COLORS.PRIMARY_GOLD,
      success: THEME_COLORS.EMERALD_SUCCESS,
      danger: THEME_COLORS.CRIMSON_ALERT,
    },
  },
  EXECUTIVE_LOUNGE: {
    mode: 'EXECUTIVE_LOUNGE',
    background: {
      primary: '#0B0D11',
      secondary: '#13171F',
      tertiary: '#1A202C',
      surface: 'rgba(19, 23, 31, 0.75)',
    },
    text: {
      primary: THEME_COLORS.IVORY_WHITE,
      secondary: '#D2D6DC',
      muted: '#6B7280',
      accent: THEME_COLORS.ROYAL_BRONZE,
    },
    borders: {
      soft: 'rgba(255, 255, 255, 0.04)',
      metallic: 'rgba(156, 130, 89, 0.2)',
    },
    accents: {
      brand: THEME_COLORS.ROYAL_BRONZE,
      gold: THEME_COLORS.ROYAL_BRONZE,
      success: '#34D399',
      danger: '#F87171',
    },
  },
  HIGH_CONTRAST: {
    mode: 'HIGH_CONTRAST',
    background: {
      primary: '#000000',
      secondary: '#121212',
      tertiary: '#1E1E1E',
      surface: '#121212',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#F3F4F6',
      muted: '#9CA3AF',
      accent: '#FFFF00', // Highly accessible true-yellow
    },
    borders: {
      soft: '#FFFFFF',
      metallic: '#FFFF00',
    },
    accents: {
      brand: '#FFFFFF',
      gold: '#FFFF00',
      success: '#00FF00', // Pure green
      danger: '#FF0000',  // Pure red
    },
  },
};
