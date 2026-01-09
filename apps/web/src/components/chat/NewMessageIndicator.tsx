/**
 * NewMessageIndicator - 新消息浮动提示组件
 *
 * 当用户向上滚动查看历史消息时，如果有新消息到达，
 * 显示一个浮动按钮提示用户跳转到最新消息
 *
 * Features:
 * - Smooth appear animation with bounce effect
 * - Attention-grabbing bounce animation when idle
 * - Hover lift effect with enhanced shadow
 * - Respects prefers-reduced-motion
 */

'use client'

import { memo, useState, useEffect } from 'react'
import { Button, Transition } from '@mantine/core'
import { useReducedMotion } from '@mantine/hooks'
import { IconArrowDown, IconMessageCircle } from '@tabler/icons-react'

interface NewMessageIndicatorProps {
  /** 是否显示指示器 */
  visible: boolean
  /** 新消息数量 */
  newMessageCount?: number
  /** 点击回调 */
  onClick: () => void
  /** 是否是移动端 */
  isMobile?: boolean
  /** 是否启用弹跳动画 */
  enableBounce?: boolean
}

function NewMessageIndicator({
  visible,
  newMessageCount = 1,
  onClick,
  isMobile = false,
  enableBounce = true,
}: NewMessageIndicatorProps) {
  const reduceMotion = useReducedMotion()
  const [isHovered, setIsHovered] = useState(false)
  const [hasAppeared, setHasAppeared] = useState(false)

  // Track when the indicator has finished appearing
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setHasAppeared(true), 300)
      return () => clearTimeout(timer)
    } else {
      setHasAppeared(false)
    }
  }, [visible])

  // Determine animation classes
  const getAnimationClass = () => {
    if (reduceMotion) return ''
    if (!hasAppeared) return 'scroll-btn-appear'
    if (enableBounce && !isHovered) return 'scroll-btn-bounce'
    return ''
  }

  return (
    <Transition
      mounted={visible}
      transition={reduceMotion ? 'fade' : 'slide-up'}
      duration={reduceMotion ? 0 : 200}
      timingFunction="ease-out"
    >
      {(styles) => (
        <Button
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
            gpu-accelerated
            ${getAnimationClass()}
            ${!reduceMotion ? 'scroll-btn-hover' : ''}
          `}
          style={{
            ...styles,
            position: 'fixed',
            bottom: isMobile ? '140px' : '120px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            background: 'linear-gradient(135deg, rgba(245, 197, 66, 0.95) 0%, rgba(234, 179, 8, 0.95) 100%)',
            color: '#1a1429',
            border: 'none',
            borderRadius: '24px',
            padding: isMobile ? '8px 16px' : '10px 20px',
            fontSize: isMobile ? '13px' : '14px',
            fontWeight: 600,
            boxShadow: isHovered
              ? '0 6px 24px rgba(245, 197, 66, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3)'
              : '0 4px 20px rgba(245, 197, 66, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
            transition: reduceMotion ? 'none' : 'box-shadow 0.2s ease, transform 0.2s ease',
            minHeight: isMobile ? '40px' : '44px',
          }}
          leftSection={<IconMessageCircle size={isMobile ? 16 : 18} />}
          rightSection={
            <IconArrowDown
              size={isMobile ? 14 : 16}
              style={{
                transition: reduceMotion ? 'none' : 'transform 0.2s ease',
                transform: isHovered ? 'translateY(2px)' : 'translateY(0)',
              }}
            />
          }
        >
          {newMessageCount > 1 ? `${newMessageCount} 条新消息` : '新消息'}
        </Button>
      )}
    </Transition>
  )
}

export default memo(NewMessageIndicator)
