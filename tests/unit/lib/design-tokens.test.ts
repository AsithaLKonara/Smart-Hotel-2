import { designTokens, motionVariants, componentSizes } from '@/lib/design-tokens'

describe('lib/design-tokens', () => {
  it('exposes expected color palette and typography tokens', () => {
    expect(designTokens.colors.primary[500]).toBe('#f59e0b')
    expect(designTokens.colors.neutral[900]).toBe('#171717')
    expect(designTokens.colors.accent).toMatchObject({ teal: '#14b8a6', gold: '#f59e0b' })

    expect(designTokens.typography.fontFamily.heading).toEqual(['Playfair Display', 'serif'])
    expect(designTokens.typography.fontSize['3xl']).toBe('1.875rem')
    expect(designTokens.typography.lineHeight.relaxed).toBe('1.625')

    expect(Object.keys(designTokens.spacing)).toEqual([
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '8',
      '10',
      '12',
      '16',
      '20',
      '24',
    ])
  })

  it('defines consistent motion variants for UI transitions', () => {
    expect(motionVariants.fadeIn).toMatchObject({
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 },
    })

    expect(motionVariants.slideUp.transition?.duration).toBeCloseTo(0.3)
    expect(motionVariants.scalePop.transition?.ease).toBe('cubic-bezier(.22,1,.36,1)')
    expect(motionVariants.stagger.animate.transition?.staggerChildren).toBe(0.05)
  })

  it('provides component sizing scales for controls and surfaces', () => {
    expect(componentSizes.button.md).toEqual({ height: '2.5rem', padding: '0.75rem 1rem', fontSize: '1rem' })
    expect(componentSizes.input.lg).toEqual({ height: '3rem', padding: '0.875rem 1.5rem', fontSize: '1.125rem' })
    expect(componentSizes.card.sm).toEqual({ padding: '1rem', borderRadius: '0.75rem' })
  })
})
