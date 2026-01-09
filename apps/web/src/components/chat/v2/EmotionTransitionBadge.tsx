'use client'

/**
 * EmotionTransitionBadge v1.0 - Animated Emotion Display
 *
 * Features:
 * - Shows emotion transitions: [😊 happy → 😳 shy]
 * - Animated color transitions (800ms)
 * - Background glow based on emotion
 * - Supports single emotion or transition
 * - WCAG AA accessible
 */

import { useState, useEffect, memo, useMemo } from 'react'
import { Badge, Group, Text } from '@mantine/core'
import { useReducedMotion } from '@mantine/hooks'
import { IconArrowRight } from '@tabler/icons-react'

// Emotion type definitions
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
  | 'excited'

// Emotion color system (Theater Soul Experience)
export const EMOTION_COLORS: Record<
  EmotionType,
  { bg: string; border: string; glow: string; primary: string }
> = {
  happy: {
    bg: 'rgba(251, 191, 36, 0.12)',
    border: 'rgba(251, 191, 36, 0.4)',
    glow: 'rgba(251, 191, 36, 0.25)',
    primary: '#fbbf24',
  },
  love: {
    bg: 'rgba(236, 72, 153, 0.12)',
    border: 'rgba(236, 72, 153, 0.4)',
    glow: 'rgba(236, 72, 153, 0.25)',
    primary: '#ec4899',
  },
  shy: {
    bg: 'rgba(244, 114, 182, 0.12)',
    border: 'rgba(244, 114, 182, 0.4)',
    glow: 'rgba(244, 114, 182, 0.25)',
    primary: '#f472b6',
  },
  angry: {
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.4)',
    glow: 'rgba(239, 68, 68, 0.25)',
    primary: '#ef4444',
  },
  sad: {
    bg: 'rgba(96, 165, 250, 0.12)',
    border: 'rgba(96, 165, 250, 0.4)',
    glow: 'rgba(96, 165, 250, 0.25)',
    primary: '#60a5fa',
  },
  surprised: {
    bg: 'rgba(251, 146, 60, 0.12)',
    border: 'rgba(251, 146, 60, 0.4)',
    glow: 'rgba(251, 146, 60, 0.25)',
    primary: '#fb923c',
  },
  scared: {
    bg: 'rgba(167, 139, 250, 0.12)',
    border: 'rgba(167, 139, 250, 0.4)',
    glow: 'rgba(167, 139, 250, 0.25)',
    primary: '#a78bfa',
  },
  neutral: {
    bg: 'rgba(156, 163, 175, 0.12)',
    border: 'rgba(156, 163, 175, 0.4)',
    glow: 'rgba(156, 163, 175, 0.25)',
    primary: '#9ca3af',
  },
  smug: {
    bg: 'rgba(217, 119, 6, 0.12)',
    border: 'rgba(217, 119, 6, 0.4)',
    glow: 'rgba(217, 119, 6, 0.25)',
    primary: '#d97706',
  },
  crying: {
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.4)',
    glow: 'rgba(59, 130, 246, 0.25)',
    primary: '#3b82f6',
  },
  thinking: {
    bg: 'rgba(139, 92, 246, 0.12)',
    border: 'rgba(139, 92, 246, 0.4)',
    glow: 'rgba(139, 92, 246, 0.25)',
    primary: '#8b5cf6',
  },
  excited: {
    bg: 'rgba(234, 179, 8, 0.12)',
    border: 'rgba(234, 179, 8, 0.4)',
    glow: 'rgba(234, 179, 8, 0.25)',
    primary: '#eab308',
  },
}

// Emotion to emoji mapping
export const EMOTION_EMOJI: Record<EmotionType, string> = {
  happy: '😊',
  love: '💕',
  shy: '😳',
  angry: '😤',
  sad: '😢',
  surprised: '😮',
  scared: '😨',
  neutral: '😐',
  smug: '😏',
  crying: '😭',
  thinking: '🤔',
  excited: '🤩',
}

// Emotion to Chinese label
export const EMOTION_LABEL: Record<EmotionType, string> = {
  happy: '开心',
  love: '爱意',
  shy: '害羞',
  angry: '生气',
  sad: '悲伤',
  surprised: '惊讶',
  scared: '害怕',
  neutral: '平静',
  smug: '得意',
  crying: '哭泣',
  thinking: '思考',
  excited: '兴奋',
}

interface EmotionTransitionBadgeProps {
  /** Current emotion or starting emotion in transition */
  emotion: EmotionType
  /** Target emotion (for transition display) */
  toEmotion?: EmotionType
  /** Animation duration in ms (default: 800) */
  transitionDuration?: number
  /** Size of the badge */
  size?: 'xs' | 'sm' | 'md'
  /** Show label text */
  showLabel?: boolean
  /** Custom className */
  className?: string
}

function EmotionTransitionBadge({
  emotion,
  toEmotion,
  transitionDuration = 800,
  size = 'xs',
  showLabel = false,
  className = '',
}: EmotionTransitionBadgeProps) {
  const reduceMotion = useReducedMotion()

  // Animation state
  const [animationPhase, setAnimationPhase] = useState<'from' | 'transitioning' | 'to'>('from')
  const [displayEmotion, setDisplayEmotion] = useState(emotion)

  // Calculate current colors based on animation phase
  const currentColors = useMemo(() => {
    if (!toEmotion || animationPhase === 'from') {
      return EMOTION_COLORS[emotion]
    }
    if (animationPhase === 'to') {
      return EMOTION_COLORS[toEmotion]
    }
    // During transition, blend colors (simplified - just use target)
    return EMOTION_COLORS[toEmotion]
  }, [emotion, toEmotion, animationPhase])

  // Handle transition animation
  useEffect(() => {
    if (!toEmotion || reduceMotion) {
      setAnimationPhase('to')
      setDisplayEmotion(toEmotion || emotion)
      return
    }

    // Start transition
    setAnimationPhase('transitioning')

    const midPoint = transitionDuration / 2
    const endPoint = transitionDuration

    // Mid-point: switch to target emotion
    const midTimer = setTimeout(() => {
      setDisplayEmotion(toEmotion)
    }, midPoint)

    // End: complete transition
    const endTimer = setTimeout(() => {
      setAnimationPhase('to')
    }, endPoint)

    return () => {
      clearTimeout(midTimer)
      clearTimeout(endTimer)
    }
  }, [emotion, toEmotion, transitionDuration, reduceMotion])

  // Reset when emotion changes
  useEffect(() => {
    setAnimationPhase('from')
    setDisplayEmotion(emotion)
  }, [emotion])

  const emoji = EMOTION_EMOJI[displayEmotion]
  const label = EMOTION_LABEL[displayEmotion]

  const isTransitioning = toEmotion && animationPhase === 'transitioning'

  return (
    <Badge
      variant="light"
      size={size}
      className={`emotion-transition-badge ${className}`}
      style={{
        background: currentColors.bg,
        border: `1px solid ${currentColors.border}`,
        boxShadow: `0 0 ${isTransitioning ? '12px' : '8px'} ${currentColors.glow}`,
        transition: reduceMotion ? 'none' : `all ${transitionDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        transform: isTransitioning ? 'scale(1.05)' : 'scale(1)',
      }}
      role="status"
      aria-label={
        toEmotion
          ? `Emotion changed from ${EMOTION_LABEL[emotion]} to ${EMOTION_LABEL[toEmotion]}`
          : `Current emotion: ${label}`
      }
    >
      <Group gap={4} wrap="nowrap" align="center">
        {/* From emotion (when showing transition) */}
        {toEmotion && (
          <>
            <Text
              component="span"
              size={size}
              style={{
                opacity: animationPhase === 'to' ? 0.5 : 1,
                transition: reduceMotion ? 'none' : 'opacity 0.3s ease',
              }}
            >
              {EMOTION_EMOJI[emotion]}
            </Text>

            <IconArrowRight
              size={size === 'xs' ? 10 : size === 'sm' ? 12 : 14}
              style={{
                color: currentColors.primary,
                opacity: 0.7,
              }}
              aria-hidden="true"
            />
          </>
        )}

        {/* Current/Target emotion */}
        <Text
          component="span"
          size={size}
          style={{
            opacity: animationPhase === 'transitioning' ? 0.8 : 1,
            transform: isTransitioning ? 'scale(1.1)' : 'scale(1)',
            transition: reduceMotion ? 'none' : 'all 0.3s ease',
          }}
        >
          {toEmotion ? EMOTION_EMOJI[toEmotion] : emoji}
        </Text>

        {/* Label text (optional) */}
        {showLabel && (
          <Text
            component="span"
            size={size}
            fw={500}
            style={{
              color: currentColors.primary,
              marginLeft: 2,
            }}
          >
            {toEmotion ? EMOTION_LABEL[toEmotion] : label}
          </Text>
        )}
      </Group>

      <style jsx global>{`
        .emotion-transition-badge {
          text-transform: none;
        }

        @keyframes emotion-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }

        .emotion-transition-badge.transitioning {
          animation: emotion-pulse 0.4s ease-in-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .emotion-transition-badge {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </Badge>
  )
}

export default memo(EmotionTransitionBadge)
