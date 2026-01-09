'use client'

/**
 * ImmersiveStatusBar - v13 沉浸模式状态反馈条
 *
 * 核心特性 (来自 v13 规划):
 * - 生成/流式输出状态：显示"生成中"状态，提供停止入口
 * - 导演规划加载中：loading 视觉提示
 * - 失败与重试：轻量错误条，提供重试/复制错误/退出沉浸
 *
 * 位置：底部输入条附近，不破坏沉浸体验
 */

import { memo, useCallback } from 'react'
import {
  Box,
  Text,
  ActionIcon,
  Group,
  Button,
  Loader,
  Tooltip,
  Badge,
} from '@mantine/core'
import {
  IconPlayerStop,
  IconRefresh,
  IconCopy,
  IconX,
  IconWand,
  IconAlertTriangle,
  IconCheck,
  IconSparkles,
} from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import { theaterColors } from '../utils/theaterColors'

// ====== Types ======
export type StatusType =
  | 'idle'
  | 'generating'
  | 'planning'
  | 'error'
  | 'success'
  | 'cooldown'

interface ImmersiveStatusBarProps {
  /** Current status type */
  status: StatusType
  /** Status message text */
  message?: string
  /** Error message (for error status) */
  errorMessage?: string
  /** Cooldown seconds remaining */
  cooldownSeconds?: number
  /** Stop generation callback */
  onStopGeneration?: () => void
  /** Retry callback (for error) */
  onRetry?: () => void
  /** Copy error callback */
  onCopyError?: () => void
  /** Exit immersive mode callback (fallback for errors) */
  onExitImmersive?: () => void
  /** Is visible (show/hide animation) */
  isVisible?: boolean
  /** Is mobile device */
  isMobile?: boolean
  /** Character name */
  characterName?: string
}

// ====== Status Configurations ======
const STATUS_CONFIG = {
  idle: {
    color: 'rgba(255, 255, 255, 0.5)',
    bgColor: 'rgba(0, 0, 0, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  generating: {
    color: theaterColors.spotlightGold,
    bgColor: 'rgba(249, 200, 109, 0.1)',
    borderColor: 'rgba(249, 200, 109, 0.3)',
  },
  planning: {
    color: '#a78bfa',
    bgColor: 'rgba(167, 139, 250, 0.1)',
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  error: {
    color: '#f87171',
    bgColor: 'rgba(248, 113, 113, 0.1)',
    borderColor: 'rgba(248, 113, 113, 0.3)',
  },
  success: {
    color: '#4ade80',
    bgColor: 'rgba(74, 222, 128, 0.1)',
    borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  cooldown: {
    color: '#fb923c',
    bgColor: 'rgba(251, 146, 60, 0.1)',
    borderColor: 'rgba(251, 146, 60, 0.3)',
  },
}

function ImmersiveStatusBar({
  status,
  message,
  errorMessage,
  cooldownSeconds = 0,
  onStopGeneration,
  onRetry,
  onCopyError,
  onExitImmersive,
  isVisible = true,
  isMobile = false,
  characterName,
}: ImmersiveStatusBarProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle

  // Don't render if idle and no message
  if (status === 'idle' && !message) {
    return null
  }

  // Copy error to clipboard
  const handleCopyError = useCallback(() => {
    if (errorMessage) {
      navigator.clipboard.writeText(errorMessage)
      onCopyError?.()
    }
  }, [errorMessage, onCopyError])

  // Default messages
  const getDefaultMessage = () => {
    switch (status) {
      case 'generating':
        return characterName ? `${characterName}正在思考...` : '正在生成回复...'
      case 'planning':
        return '导演规划中...'
      case 'error':
        return '生成失败'
      case 'success':
        return '完成'
      case 'cooldown':
        return `请稍等 ${cooldownSeconds} 秒`
      default:
        return ''
    }
  }

  const displayMessage = message || getDefaultMessage()

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: 10, height: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Box
            style={{
              background: config.bgColor,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 12,
              border: `1px solid ${config.borderColor}`,
              padding: isMobile ? '8px 12px' : '10px 16px',
              marginBottom: 8,
            }}
          >
            <Group gap="sm" wrap="nowrap" justify="space-between">
              {/* Left: Status indicator + message */}
              <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                {/* Status Icon */}
                {status === 'generating' && (
                  <Loader size={14} color={config.color} />
                )}
                {status === 'planning' && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <IconWand size={14} style={{ color: config.color }} />
                  </motion.div>
                )}
                {status === 'error' && (
                  <IconAlertTriangle size={14} style={{ color: config.color }} />
                )}
                {status === 'success' && (
                  <IconCheck size={14} style={{ color: config.color }} />
                )}
                {status === 'cooldown' && (
                  <Badge
                    size="sm"
                    variant="filled"
                    color="orange"
                    style={{ minWidth: 24 }}
                  >
                    {cooldownSeconds}
                  </Badge>
                )}

                {/* Message text */}
                <Text
                  size="xs"
                  style={{
                    color: config.color,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {displayMessage}
                </Text>

                {/* Error details (truncated) */}
                {status === 'error' && errorMessage && (
                  <Text
                    size="xs"
                    c="dimmed"
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1,
                    }}
                  >
                    {errorMessage}
                  </Text>
                )}
              </Group>

              {/* Right: Action buttons */}
              <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                {/* Generating: Stop button */}
                {status === 'generating' && onStopGeneration && (
                  <Tooltip label="停止生成">
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="red"
                      onClick={onStopGeneration}
                    >
                      <IconPlayerStop size={14} />
                    </ActionIcon>
                  </Tooltip>
                )}

                {/* Error: Retry + Copy + Exit */}
                {status === 'error' && (
                  <>
                    {onRetry && (
                      <Tooltip label="重试">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={onRetry}
                          style={{ color: 'rgba(255,255,255,0.6)' }}
                        >
                          <IconRefresh size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    {errorMessage && (
                      <Tooltip label="复制错误信息">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={handleCopyError}
                          style={{ color: 'rgba(255,255,255,0.6)' }}
                        >
                          <IconCopy size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    {onExitImmersive && (
                      <Tooltip label="退出沉浸模式">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={onExitImmersive}
                          style={{ color: 'rgba(255,255,255,0.6)' }}
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </>
                )}

                {/* Planning: Can add cancel if needed */}
                {status === 'planning' && onStopGeneration && (
                  <Tooltip label="取消规划">
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={onStopGeneration}
                      style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            </Group>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default memo(ImmersiveStatusBar)

// ====== Compact Status Badge ======
// A smaller version for inline status display

interface StatusBadgeProps {
  status: StatusType
  message?: string
  cooldownSeconds?: number
  size?: 'xs' | 'sm'
}

export const StatusBadge = memo(function StatusBadge({
  status,
  message,
  cooldownSeconds = 0,
  size = 'sm',
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle

  if (status === 'idle' && !message) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      <Badge
        size={size}
        variant="light"
        leftSection={
          status === 'generating' ? (
            <Loader size={10} color={config.color} />
          ) : status === 'planning' ? (
            <IconSparkles size={10} />
          ) : status === 'cooldown' ? (
            <Text size="xs" fw={700}>{cooldownSeconds}</Text>
          ) : null
        }
        style={{
          background: config.bgColor,
          border: `1px solid ${config.borderColor}`,
          color: config.color,
        }}
      >
        {message || (status === 'generating' ? '生成中' : status === 'planning' ? '规划中' : '')}
      </Badge>
    </motion.div>
  )
})
