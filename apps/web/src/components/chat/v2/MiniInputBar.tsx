'use client'

/**
 * MiniInputBar - v13 沉浸模式常驻迷你输入条
 *
 * 核心特性 (来自 v13 规划):
 * - 永不丢失文字输入能力（常驻可见）
 * - 毛玻璃视觉效果
 * - 空闲时降低不透明度，聚焦时提高不透明度并增强边界
 * - 展开入口：展开为完整输入
 * - 状态反馈：生成中状态显示
 * - 导演入口：快速访问导演面板
 */

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import {
  Box,
  TextInput,
  ActionIcon,
  Group,
  Text,
  Tooltip,
  Badge,
  Loader,
} from '@mantine/core'
import {
  IconSend,
  IconChevronUp,
  IconChevronDown,
  IconWand,
  IconPlayerStop,
  IconSparkles,
} from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import { theaterColors } from '../utils/theaterColors'
import { EMOTION_COLORS, EMOTION_EMOJI, type EmotionType } from '../utils/emotionColors'

// ====== Types ======
interface MiniInputBarProps {
  /** Input value (controlled) */
  value?: string
  /** Input change callback */
  onChange?: (value: string) => void
  /** Send message callback */
  onSend?: (message: string) => Promise<void>
  /** Expand to full input callback */
  onExpand?: () => void
  /** Open director panel callback */
  onOpenDirector?: () => void
  /** Stop generation callback */
  onStopGeneration?: () => void
  /** Is generating/loading */
  isGenerating?: boolean
  /** Is expanded (controlled) */
  isExpanded?: boolean
  /** Current emotion */
  currentEmotion?: EmotionType
  /** Rate limit cooldown seconds */
  cooldownSeconds?: number
  /** Can send message */
  canSend?: boolean
  /** Disabled state */
  disabled?: boolean
  /** Character name for placeholder */
  characterName?: string
  /** Status text (custom status display) */
  statusText?: string
  /** Show director button */
  showDirectorButton?: boolean
  /** Custom placeholder */
  placeholder?: string
  /** Is mobile device */
  isMobile?: boolean
  /** Safe area bottom padding (for mobile) */
  safeAreaBottom?: number
}

// ====== Opacity States ======
const OPACITY_IDLE = 0.65
const OPACITY_HOVER = 0.85
const OPACITY_FOCUS = 0.95

function MiniInputBar({
  value = '',
  onChange,
  onSend,
  onExpand,
  onOpenDirector,
  onStopGeneration,
  isGenerating = false,
  isExpanded = false,
  currentEmotion = 'neutral',
  cooldownSeconds = 0,
  canSend = true,
  disabled = false,
  characterName,
  statusText,
  showDirectorButton = true,
  placeholder,
  isMobile = false,
  safeAreaBottom = 0,
}: MiniInputBarProps) {
  // State
  const [isFocused, setIsFocused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const composingRef = useRef(false)

  // Emotion styling
  const emotionColor = EMOTION_COLORS[currentEmotion] || EMOTION_COLORS.neutral

  // Calculate opacity based on state
  const baseOpacity = isFocused ? OPACITY_FOCUS : isHovered ? OPACITY_HOVER : OPACITY_IDLE

  // Handle send
  const handleSend = useCallback(async () => {
    const trimmed = value.trim()
    if (!trimmed || disabled || isGenerating || !canSend || cooldownSeconds > 0) return

    onChange?.('')
    await onSend?.(trimmed)
  }, [value, disabled, isGenerating, canSend, cooldownSeconds, onChange, onSend])

  // Keyboard handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (composingRef.current || e.repeat) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Computed states
  const sendEnabled = !disabled && !isGenerating && value.trim() && canSend && cooldownSeconds === 0
  const showStatus = isGenerating || statusText

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: safeAreaBottom,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Status Bar - Above input when generating */}
      <AnimatePresence>
        {showStatus && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ marginBottom: 8 }}
          >
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '6px 12px',
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(8px)',
                borderRadius: 20,
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {isGenerating ? (
                <>
                  <Loader size={14} color={theaterColors.spotlightGold} />
                  <Text size="xs" c="dimmed">
                    {statusText || '正在生成回复...'}
                  </Text>
                  {onStopGeneration && (
                    <Tooltip label="停止生成">
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={onStopGeneration}
                      >
                        <IconPlayerStop size={12} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </>
              ) : (
                <Text size="xs" c="dimmed">
                  {statusText}
                </Text>
              )}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Bar */}
      <motion.div
        animate={{
          opacity: baseOpacity,
          scale: isFocused ? 1.01 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <Box
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 16,
            border: isFocused
              ? `2px solid ${emotionColor.primary}`
              : '1px solid rgba(255, 255, 255, 0.12)',
            padding: isMobile ? '8px 12px' : '10px 16px',
            boxShadow: isFocused
              ? `0 0 20px ${emotionColor.glow}, 0 8px 32px rgba(0, 0, 0, 0.3)`
              : '0 4px 20px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Group gap={8} wrap="nowrap" align="center">
            {/* Emotion Indicator */}
            <Tooltip label={`当前情绪: ${currentEmotion}`}>
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: emotionColor.bg,
                  border: `1px solid ${emotionColor.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
                onClick={onExpand}
              >
                <Text size="sm">{EMOTION_EMOJI[currentEmotion]}</Text>
              </Box>
            </Tooltip>

            {/* Text Input */}
            <TextInput
              ref={inputRef}
              value={value}
              onChange={(e) => onChange?.(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => { composingRef.current = true }}
              onCompositionEnd={() => { composingRef.current = false }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder || `对${characterName || '角色'}说些什么...`}
              disabled={disabled || isGenerating}
              size={isMobile ? 'sm' : 'md'}
              style={{ flex: 1, minWidth: 0 }}
              styles={{
                input: {
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontSize: isMobile ? '15px' : '14px',
                  padding: '4px 0',
                  height: 'auto',
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.4)',
                  },
                  '&:focus': {
                    outline: 'none',
                    boxShadow: 'none',
                  },
                },
                wrapper: {
                  flex: 1,
                },
              }}
            />

            {/* Expand Button */}
            {onExpand && (
              <Tooltip label={isExpanded ? '收起' : '展开完整输入'}>
                <ActionIcon
                  variant="subtle"
                  size={isMobile ? 'sm' : 'md'}
                  onClick={onExpand}
                  style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    flexShrink: 0,
                  }}
                >
                  {isExpanded ? (
                    <IconChevronDown size={16} />
                  ) : (
                    <IconChevronUp size={16} />
                  )}
                </ActionIcon>
              </Tooltip>
            )}

            {/* Director Button */}
            {showDirectorButton && onOpenDirector && (
              <Tooltip label="导演面板">
                <ActionIcon
                  variant="subtle"
                  size={isMobile ? 'sm' : 'md'}
                  onClick={onOpenDirector}
                  style={{
                    color: theaterColors.spotlightGold,
                    flexShrink: 0,
                  }}
                >
                  <IconWand size={16} />
                </ActionIcon>
              </Tooltip>
            )}

            {/* Send Button */}
            <Tooltip
              label={
                cooldownSeconds > 0
                  ? `等待 ${cooldownSeconds}s`
                  : isGenerating
                  ? '生成中...'
                  : '发送'
              }
            >
              <ActionIcon
                variant="filled"
                size={isMobile ? 32 : 36}
                onClick={handleSend}
                disabled={!sendEnabled}
                style={{
                  background: cooldownSeconds > 0
                    ? 'linear-gradient(135deg, #f97316, #ea580c)'
                    : sendEnabled
                    ? `linear-gradient(135deg, ${theaterColors.spotlightGold} 0%, #e8d7b0 100%)`
                    : 'rgba(255, 255, 255, 0.1)',
                  opacity: sendEnabled || cooldownSeconds > 0 ? 1 : 0.4,
                  borderRadius: 10,
                  flexShrink: 0,
                  transition: 'all 0.2s',
                  boxShadow: sendEnabled
                    ? `0 0 12px ${theaterColors.spotlightGoldDim}`
                    : 'none',
                }}
              >
                {cooldownSeconds > 0 ? (
                  <Text size="xs" fw={700} c="white">
                    {cooldownSeconds}
                  </Text>
                ) : (
                  <IconSend
                    size={isMobile ? 14 : 16}
                    style={{ color: sendEnabled ? '#1a1429' : 'rgba(255,255,255,0.5)' }}
                  />
                )}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Box>
      </motion.div>

      {/* Idle indicator - subtle hint that input is interactive */}
      {!isFocused && !isHovered && !isGenerating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            bottom: -4 + safeAreaBottom,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 40,
            height: 3,
            borderRadius: 2,
            background: `linear-gradient(90deg, transparent, ${theaterColors.spotlightGoldDim}, transparent)`,
          }}
        />
      )}
    </motion.div>
  )
}

export default memo(MiniInputBar)
