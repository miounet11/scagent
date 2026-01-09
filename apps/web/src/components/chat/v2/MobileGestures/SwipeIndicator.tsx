'use client'

/**
 * SwipeIndicator - v13 手势视觉反馈组件
 *
 * 功能:
 * - 显示滑动方向提示
 * - 手势进度可视化
 * - 完成时的反馈动画
 * - Safe area 兼容
 */

import { memo, useEffect, useState } from 'react'
import { Box, Text } from '@mantine/core'
import {
  IconChevronUp,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import { theaterColors } from '../../utils/theaterColors'

// ====== Types ======
export type SwipeDirection = 'up' | 'down' | 'left' | 'right'

interface SwipeIndicatorProps {
  /** Active swipe direction */
  direction?: SwipeDirection | null
  /** Swipe progress (0-1) */
  progress?: number
  /** Whether gesture was completed (triggered action) */
  completed?: boolean
  /** Label to show */
  label?: string
  /** Is visible */
  isVisible?: boolean
  /** Safe area bottom (for iOS notch devices) */
  safeAreaBottom?: number
}

// ====== Direction Config ======
const DIRECTION_CONFIG = {
  up: {
    icon: IconChevronUp,
    position: { bottom: 80, left: '50%', transform: 'translateX(-50%)' },
    animation: { y: [10, 0, 10] },
    label: '上滑打开动作面板',
  },
  down: {
    icon: IconChevronDown,
    position: { top: 80, left: '50%', transform: 'translateX(-50%)' },
    animation: { y: [-10, 0, -10] },
    label: '下滑关闭',
  },
  left: {
    icon: IconChevronLeft,
    position: { right: 20, top: '50%', transform: 'translateY(-50%)' },
    animation: { x: [10, 0, 10] },
    label: '左滑关闭',
  },
  right: {
    icon: IconChevronRight,
    position: { left: 20, top: '50%', transform: 'translateY(-50%)' },
    animation: { x: [-10, 0, -10] },
    label: '右滑查看角色',
  },
}

function SwipeIndicator({
  direction,
  progress = 0,
  completed = false,
  label,
  isVisible = true,
  safeAreaBottom = 0,
}: SwipeIndicatorProps) {
  const [showCompleted, setShowCompleted] = useState(false)

  // Show completed animation
  useEffect(() => {
    if (completed) {
      setShowCompleted(true)
      const timer = setTimeout(() => setShowCompleted(false), 500)
      return () => clearTimeout(timer)
    }
  }, [completed])

  if (!direction || !isVisible) {
    return null
  }

  const config = DIRECTION_CONFIG[direction]
  const Icon = config.icon
  const displayLabel = label || config.label
  const opacity = Math.min(0.3 + progress * 0.7, 1)
  const scale = 1 + progress * 0.3

  // Adjust position for safe area if direction is bottom-facing
  const positionStyle = {
    ...config.position,
    ...(direction === 'up' && safeAreaBottom ? { bottom: 80 + safeAreaBottom } : {}),
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          zIndex: 9998,
          pointerEvents: 'none',
          ...positionStyle,
        }}
      >
        {/* Indicator Circle */}
        <motion.div
          animate={showCompleted ? { scale: [1, 1.5, 1] } : config.animation}
          transition={
            showCompleted
              ? { duration: 0.3 }
              : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
          }
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {/* Icon */}
          <Box
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: showCompleted
                ? theaterColors.spotlightGold
                : `rgba(0, 0, 0, ${0.4 + progress * 0.3})`,
              backdropFilter: 'blur(8px)',
              border: `2px solid ${showCompleted ? theaterColors.spotlightGold : `rgba(255, 255, 255, ${0.1 + progress * 0.4})`}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${scale})`,
              transition: 'all 0.2s ease-out',
              boxShadow: showCompleted
                ? `0 0 20px ${theaterColors.spotlightGold}`
                : progress > 0.5
                ? `0 0 10px rgba(249, 200, 109, ${progress - 0.5})`
                : 'none',
            }}
          >
            <Icon
              size={24}
              style={{
                color: showCompleted ? '#1a1429' : `rgba(255, 255, 255, ${opacity})`,
                transition: 'color 0.2s',
              }}
            />
          </Box>

          {/* Label */}
          {displayLabel && progress > 0.2 && (
            <motion.div
              initial={{ opacity: 0, y: direction === 'up' ? 10 : -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Text
                size="xs"
                style={{
                  color: `rgba(255, 255, 255, ${opacity})`,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayLabel}
              </Text>
            </motion.div>
          )}

          {/* Progress Ring (only when actively swiping) */}
          {progress > 0 && !showCompleted && (
            <svg
              width={56}
              height={56}
              style={{
                position: 'absolute',
                top: -4,
                left: '50%',
                transform: 'translateX(-50%) rotate(-90deg)',
              }}
            >
              <circle
                cx={28}
                cy={28}
                r={26}
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth={2}
              />
              <motion.circle
                cx={28}
                cy={28}
                r={26}
                fill="none"
                stroke={theaterColors.spotlightGold}
                strokeWidth={2}
                strokeDasharray={`${progress * 163} 163`}
                strokeLinecap="round"
              />
            </svg>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default memo(SwipeIndicator)

// ====== Gesture Hint Toast ======
// Shows a brief hint when entering immersive mode

interface GestureHintToastProps {
  isVisible?: boolean
  message?: string
  onDismiss?: () => void
  autoDismiss?: number // ms
}

export const GestureHintToast = memo(function GestureHintToast({
  isVisible = true,
  message = '上滑打开动作面板，右滑查看角色',
  onDismiss,
  autoDismiss = 3000,
}: GestureHintToastProps) {
  const [show, setShow] = useState(isVisible)

  useEffect(() => {
    setShow(isVisible)
    if (isVisible && autoDismiss > 0) {
      const timer = setTimeout(() => {
        setShow(false)
        onDismiss?.()
      }, autoDismiss)
      return () => clearTimeout(timer)
    }
  }, [isVisible, autoDismiss, onDismiss])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            bottom: 100,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9997,
          }}
        >
          <Box
            onClick={() => {
              setShow(false)
              onDismiss?.()
            }}
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(12px)',
              borderRadius: 20,
              padding: '8px 16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
            }}
          >
            <Text size="xs" c="dimmed" ta="center">
              {message}
            </Text>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
