/**
 * Emotion color system for immersive chat UI
 * Provides consistent color schemes for emotion-based visual feedback
 */

/**
 * Supported emotion types
 */
export type EmotionType =
  | 'happy'
  | 'love'
  | 'shy'
  | 'angry'
  | 'sad'
  | 'surprised'
  | 'scared'
  | 'neutral'
  | 'smug'
  | 'crying'
  | 'thinking'
  | 'excited';

/**
 * Color scheme for a specific emotion
 */
interface EmotionColorScheme {
  /** Background color */
  bg: string;
  /** Border color */
  border: string;
  /** Glow/shadow color */
  glow: string;
  /** Primary accent color */
  primary: string;
}

/**
 * Emotion color mappings
 * Each emotion has a coordinated color palette for backgrounds, borders, glows, and accents
 */
export const EMOTION_COLORS: Record<EmotionType, EmotionColorScheme> = {
  happy: {
    bg: 'rgba(251, 207, 232, 0.15)',
    border: 'rgba(251, 207, 232, 0.4)',
    glow: 'rgba(251, 207, 232, 0.3)',
    primary: '#fbcfe8',
  },
  love: {
    bg: 'rgba(251, 113, 133, 0.15)',
    border: 'rgba(251, 113, 133, 0.4)',
    glow: 'rgba(251, 113, 133, 0.3)',
    primary: '#fb7185',
  },
  shy: {
    bg: 'rgba(254, 205, 211, 0.15)',
    border: 'rgba(254, 205, 211, 0.4)',
    glow: 'rgba(254, 205, 211, 0.3)',
    primary: '#fecdd3',
  },
  angry: {
    bg: 'rgba(248, 113, 113, 0.15)',
    border: 'rgba(248, 113, 113, 0.4)',
    glow: 'rgba(248, 113, 113, 0.3)',
    primary: '#f87171',
  },
  sad: {
    bg: 'rgba(147, 197, 253, 0.15)',
    border: 'rgba(147, 197, 253, 0.4)',
    glow: 'rgba(147, 197, 253, 0.3)',
    primary: '#93c5fd',
  },
  surprised: {
    bg: 'rgba(253, 224, 71, 0.15)',
    border: 'rgba(253, 224, 71, 0.4)',
    glow: 'rgba(253, 224, 71, 0.3)',
    primary: '#fde047',
  },
  scared: {
    bg: 'rgba(196, 181, 253, 0.15)',
    border: 'rgba(196, 181, 253, 0.4)',
    glow: 'rgba(196, 181, 253, 0.3)',
    primary: '#c4b5fd',
  },
  neutral: {
    bg: 'rgba(156, 163, 175, 0.15)',
    border: 'rgba(156, 163, 175, 0.4)',
    glow: 'rgba(156, 163, 175, 0.3)',
    primary: '#9ca3af',
  },
  smug: {
    bg: 'rgba(167, 139, 250, 0.15)',
    border: 'rgba(167, 139, 250, 0.4)',
    glow: 'rgba(167, 139, 250, 0.3)',
    primary: '#a78bfa',
  },
  crying: {
    bg: 'rgba(96, 165, 250, 0.15)',
    border: 'rgba(96, 165, 250, 0.4)',
    glow: 'rgba(96, 165, 250, 0.3)',
    primary: '#60a5fa',
  },
  thinking: {
    bg: 'rgba(134, 239, 172, 0.15)',
    border: 'rgba(134, 239, 172, 0.4)',
    glow: 'rgba(134, 239, 172, 0.3)',
    primary: '#86efac',
  },
  excited: {
    bg: 'rgba(252, 165, 165, 0.15)',
    border: 'rgba(252, 165, 165, 0.4)',
    glow: 'rgba(252, 165, 165, 0.3)',
    primary: '#fca5a5',
  },
};

/**
 * Emoji representations for each emotion
 */
export const EMOTION_EMOJI: Record<EmotionType, string> = {
  happy: '😊',
  love: '❤️',
  shy: '😳',
  angry: '😠',
  sad: '😢',
  surprised: '😲',
  scared: '😨',
  neutral: '😐',
  smug: '😏',
  crying: '😭',
  thinking: '🤔',
  excited: '🤩',
};

/**
 * Chinese labels for each emotion
 */
export const EMOTION_LABEL: Record<EmotionType, string> = {
  happy: '开心',
  love: '爱意',
  shy: '害羞',
  angry: '生气',
  sad: '伤心',
  surprised: '惊讶',
  scared: '害怕',
  neutral: '平静',
  smug: '得意',
  crying: '哭泣',
  thinking: '思考',
  excited: '兴奋',
};
