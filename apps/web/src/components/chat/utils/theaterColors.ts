/**
 * Theater mode color system
 * Cinematic color palette inspired by stage lighting and theatrical effects
 */

/**
 * Theater color palette
 * These colors create an immersive, stage-like atmosphere for the chat interface
 */
export const theaterColors = {
  /**
   * Spotlight gold - Primary accent color
   * Used for highlights, focus states, and key UI elements
   */
  spotlightGold: '#f5c542',

  /**
   * Dimmed spotlight gold - Subtle accent
   * Used for secondary highlights and subtle emphasis
   */
  spotlightGoldDim: 'rgba(245, 197, 66, 0.3)',

  /**
   * Moonlight - Cool ambient light
   * Used for subtle background highlights and secondary accents
   */
  moonlight: 'rgba(196, 181, 253, 0.6)',

  /**
   * Emotion rose - Warm accent light
   * Used for emotional emphasis and character-focused elements
   */
  emotionRose: 'rgba(232, 72, 106, 0.6)',

  /**
   * Void dark - Deep background
   * Primary background color for theater mode, creates depth and focus
   */
  voidDark: 'rgba(26, 20, 41, 0.95)',

  /**
   * Glass border - Subtle container outline
   * Used for glassmorphic UI elements and subtle separators
   */
  glassBorder: 'rgba(245, 197, 66, 0.15)',

  /**
   * Glass background - Semi-transparent container
   * Used for glassmorphic panels and overlays
   */
  glassBackground: 'rgba(26, 20, 41, 0.85)',
} as const;

/**
 * Type helper for theater color keys
 */
export type TheaterColorKey = keyof typeof theaterColors;
