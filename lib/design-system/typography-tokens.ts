/**
 * SmartHotel OS — Typography Hierarchy Tokens
 * Maps elegant serif display elements and modern, highly legible sans UI typography.
 */

export const TYPOGRAPHY_FONTS = {
  // Primary luxury serif font family stack
  PRIMARY_DISPLAY: "'Cormorant Garamond', 'Playfair Display', Georgia, serif",
  
  // Secondary modern clean UI font stack
  SECONDARY_UI: "'Inter', 'Manrope', system-ui, -apple-system, sans-serif",
  
  // Monospaced audit/logging font stack
  MONO_AUDIT: "'JetBrains Mono', Courier, monospace",
} as const;

export const TYPOGRAPHY_SIZES = {
  HERO: { fontSize: '4rem', lineHeight: '1.1', fontWeight: '300' },
  SECTION_TITLE: { fontSize: '2.5rem', lineHeight: '1.2', fontWeight: '400' },
  CARD_HEADER: { fontSize: '1.5rem', lineHeight: '1.35', fontWeight: '500' },
  OPERATIONAL_BODY: { fontSize: '1rem', lineHeight: '1.5', fontWeight: '400' },
  KPI_METRIC: { fontSize: '3.5rem', lineHeight: '1', fontWeight: '300' },
  COMPACT_TABLE: { fontSize: '0.875rem', lineHeight: '1.4', fontWeight: '400' },
  FINANCIAL_VALUE: { fontSize: '1.125rem', lineHeight: '1.4', fontWeight: '600' },
} as const;

export const TYPOGRAPHY_UTILITIES = {
  // Elegant display headers with luxury metallic gradients
  luxuryHeading: `font-family: ${TYPOGRAPHY_FONTS.PRIMARY_DISPLAY}; font-weight: 300; tracking-wide;`,
  
  // High-legibility administrative metrics
  adminMetric: `font-family: ${TYPOGRAPHY_FONTS.SECONDARY_UI}; font-weight: 600; font-variant-numeric: tabular-nums;`,
} as const;
