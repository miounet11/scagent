'use client'

/**
 * TypewriterText v1.0 - Cinematic Text Reveal
 *
 * Features:
 * - Character-by-character reveal at configurable speed (default: 80 chars/sec)
 * - Blinking cursor with spotlight-gold color
 * - Click/tap to skip animation and show full text
 * - Respects prefers-reduced-motion
 * - Tracks completed messages to prevent replay
 */

import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { Box, Text } from '@mantine/core'
import { useReducedMotion } from '@mantine/hooks'

// Theater color palette
const theaterColors = {
  cursor: 'rgba(245, 197, 66, 0.8)', // spotlight-gold
  cursorGlow: 'rgba(245, 197, 66, 0.3)',
}

interface TypewriterTextProps {
  /** The text content to display */
  content: string
  /** Characters per second (default: 80) */
  speed?: number
  /** Unique ID for this message (used to track completion) */
  messageId?: string
  /** Set of already completed message IDs */
  completedIds?: Set<string>
  /** Callback when typing animation completes */
  onComplete?: () => void
  /** Callback to mark message as completed */
  onMarkComplete?: (messageId: string) => void
  /** Custom className for the container */
  className?: string
  /** Text size */
  size?: 'xs' | 'sm' | 'md' | 'lg'
  /** Text color */
  color?: string
  /** Enable sound effects */
  soundEnabled?: boolean
}

function TypewriterText({
  content,
  speed = 80,
  messageId,
  completedIds,
  onComplete,
  onMarkComplete,
  className = '',
  size = 'sm',
  color = 'rgba(255, 255, 255, 0.95)',
  soundEnabled = false,
}: TypewriterTextProps) {
  const reduceMotion = useReducedMotion()

  // Check if this message was already completed
  const isAlreadyCompleted = messageId && completedIds?.has(messageId)

  const [displayedLength, setDisplayedLength] = useState(
    isAlreadyCompleted || reduceMotion ? content.length : 0
  )
  const [isComplete, setIsComplete] = useState(
    isAlreadyCompleted || reduceMotion || false
  )
  const [showCursor, setShowCursor] = useState(!isAlreadyCompleted && !reduceMotion)

  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const charAccumulatorRef = useRef<number>(0)

  // Calculate interval between characters (in ms)
  const charInterval = 1000 / speed

  // Handle click/tap to skip
  const handleSkip = useCallback(() => {
    if (!isComplete) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      setDisplayedLength(content.length)
      setIsComplete(true)
      setShowCursor(false)

      if (messageId) {
        onMarkComplete?.(messageId)
      }
      onComplete?.()
    }
  }, [isComplete, content.length, messageId, onMarkComplete, onComplete])

  // Animation loop
  useEffect(() => {
    // Skip animation if already completed or reduced motion
    if (isAlreadyCompleted || reduceMotion) {
      setDisplayedLength(content.length)
      setIsComplete(true)
      setShowCursor(false)
      return
    }

    if (isComplete) return

    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime
      }

      const deltaTime = currentTime - lastTimeRef.current
      lastTimeRef.current = currentTime

      // Accumulate time for character reveal
      charAccumulatorRef.current += deltaTime

      // Calculate how many characters to reveal
      const charsToReveal = Math.floor(charAccumulatorRef.current / charInterval)

      if (charsToReveal > 0) {
        charAccumulatorRef.current -= charsToReveal * charInterval

        setDisplayedLength(prev => {
          const newLength = Math.min(prev + charsToReveal, content.length)

          if (newLength >= content.length) {
            setIsComplete(true)
            setShowCursor(false)
            if (messageId) {
              onMarkComplete?.(messageId)
            }
            onComplete?.()
            return content.length
          }

          return newLength
        })
      }

      if (displayedLength < content.length) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [content, charInterval, isComplete, isAlreadyCompleted, reduceMotion, messageId, onMarkComplete, onComplete, displayedLength])

  // Cursor blink effect
  const [cursorVisible, setCursorVisible] = useState(true)

  useEffect(() => {
    if (!showCursor) return

    const blinkInterval = setInterval(() => {
      setCursorVisible(prev => !prev)
    }, 530) // 530ms blink speed

    return () => clearInterval(blinkInterval)
  }, [showCursor])

  // Reset when content changes
  useEffect(() => {
    if (!isAlreadyCompleted && !reduceMotion) {
      setDisplayedLength(0)
      setIsComplete(false)
      setShowCursor(true)
      lastTimeRef.current = 0
      charAccumulatorRef.current = 0
    }
  }, [content, isAlreadyCompleted, reduceMotion])

  const displayedText = content.slice(0, displayedLength)
  const hiddenText = content.slice(displayedLength)

  return (
    <Box
      ref={containerRef}
      className={`typewriter-container ${className}`}
      onClick={handleSkip}
      style={{
        cursor: isComplete ? 'default' : 'pointer',
        userSelect: isComplete ? 'text' : 'none',
      }}
      role="article"
      aria-label={isComplete ? content : `Loading text... ${Math.round((displayedLength / content.length) * 100)}%`}
    >
      <Text
        size={size}
        style={{
          color,
          lineHeight: 1.7,
          letterSpacing: '0.01em',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
        component="span"
      >
        {/* Visible text */}
        <span>{displayedText}</span>

        {/* Cursor */}
        {showCursor && (
          <span
            className="typewriter-cursor"
            style={{
              color: theaterColors.cursor,
              textShadow: cursorVisible ? `0 0 8px ${theaterColors.cursorGlow}` : 'none',
              opacity: cursorVisible ? 1 : 0,
              transition: 'opacity 0.1s ease',
              marginLeft: '1px',
            }}
            aria-hidden="true"
          >
            ▋
          </span>
        )}

        {/* Hidden text (for layout stability) */}
        <span
          style={{
            visibility: 'hidden',
            position: 'absolute',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          {hiddenText}
        </span>
      </Text>

      {/* Skip hint - only show on hover when not complete */}
      {!isComplete && (
        <Text
          size="xs"
          c="dimmed"
          style={{
            position: 'absolute',
            bottom: '-1.5rem',
            right: 0,
            opacity: 0,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
          }}
          className="typewriter-skip-hint"
          aria-hidden="true"
        >
          Click to skip
        </Text>
      )}

      <style jsx global>{`
        .typewriter-container:hover .typewriter-skip-hint {
          opacity: 0.6 !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .typewriter-cursor {
            display: none;
          }
        }
      `}</style>
    </Box>
  )
}

export default memo(TypewriterText)
