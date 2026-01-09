/**
 * Animation configurations for immersive chat UI
 * Provides consistent motion design with accessibility support
 */

/**
 * Cubic bezier easing functions for smooth animations
 */
export const easings = {
  /** Smooth ease out with slight bounce */
  backOut: [0.175, 0.885, 0.32, 1.275] as const,
  /** Standard ease out */
  easeOut: [0.25, 0.46, 0.45, 0.94] as const,
  /** Standard ease in-out */
  easeInOut: [0.42, 0, 0.58, 1] as const,
  /** Sharp ease out */
  sharpEaseOut: [0.4, 0, 0.2, 1] as const,
} as const;

/**
 * Message entrance animation configuration
 * Applied when new messages appear in the chat
 */
export const messageEntrance = {
  /** Initial state */
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  /** Final animated state */
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  /** Animation timing */
  transition: {
    duration: 0.4,
    ease: easings.easeOut,
  },
  /** Stagger delay between multiple messages */
  stagger: 0.08,
  /** Reduced motion override */
  reduceMotion: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.2 },
  },
} as const;

/**
 * Emotion transition animation configuration
 * Applied when emotion badges change or appear
 */
export const emotionTransition = {
  /** Animation duration in milliseconds */
  duration: 800,
  /** Easing function */
  ease: easings.easeInOut,
  /** Scale animation */
  scale: {
    from: 0.8,
    to: 1,
  },
  /** Opacity animation */
  opacity: {
    from: 0,
    to: 1,
  },
  /** Reduced motion override */
  reduceMotion: {
    duration: 200,
    ease: easings.easeOut,
  },
} as const;

/**
 * Radial menu opening animation configuration
 * Applied to context menus and action menus
 */
export const radialMenuOpen = {
  /** Initial state */
  initial: {
    opacity: 0,
    scale: 0.8,
    rotate: -10,
  },
  /** Final animated state */
  animate: {
    opacity: 1,
    scale: 1,
    rotate: 0,
  },
  /** Animation timing */
  transition: {
    duration: 0.3,
    ease: easings.backOut,
  },
  /** Stagger delay between menu items */
  stagger: 0.03,
  /** Reduced motion override */
  reduceMotion: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.15 },
  },
} as const;

/**
 * Fade in/out animation configuration
 * General purpose fade for modals, tooltips, and overlays
 */
export const fadeInOut = {
  /** Animation duration in milliseconds */
  duration: 200,
  /** Easing function */
  ease: easings.easeOut,
  /** Initial state */
  initial: { opacity: 0 },
  /** Visible state */
  animate: { opacity: 1 },
  /** Exit state */
  exit: { opacity: 0 },
  /** Reduced motion override */
  reduceMotion: {
    duration: 100,
  },
} as const;

/**
 * Typewriter cursor blink animation configuration
 * Applied to typing indicators and text input cursors
 */
export const typewriterCursor = {
  /** Blink animation duration in milliseconds */
  duration: 530,
  /** Animation keyframes */
  keyframes: {
    '0%, 49%': { opacity: 1 },
    '50%, 100%': { opacity: 0 },
  },
  /** Animation iteration count */
  iterationCount: 'infinite' as const,
  /** Reduced motion override - solid cursor */
  reduceMotion: {
    keyframes: {
      '0%, 100%': { opacity: 1 },
    },
  },
} as const;

/**
 * Utility function to get animation config with reduced motion support
 * @param animation - Animation configuration object
 * @param prefersReducedMotion - Whether user prefers reduced motion
 * @returns Animation configuration appropriate for user's motion preference
 */
export function getAnimationConfig<T extends { reduceMotion: unknown }>(
  animation: T,
  prefersReducedMotion: boolean
): T | T['reduceMotion'] {
  return prefersReducedMotion ? animation.reduceMotion : animation;
}

/**
 * CSS animation string for typewriter cursor
 * Can be used directly in CSS-in-JS or inline styles
 */
export const typewriterCursorCSS = `
  @keyframes blink-cursor {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
  animation: blink-cursor ${typewriterCursor.duration}ms infinite;
`;
