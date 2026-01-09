'use client'
/**
 * MessageInput v2.1 - Theater Soul Enhanced Input
 *
 * Major enhancements over v1:
 * - Inline CreativeDirectivePills
 * - Integrated emotion selector dropdown
 * - SendButtonWithGlow with long-press radial menu
 * - Simplified, minimal design
 * - Mobile gesture support
 * - Enhanced focus animations with glow effects
 * - Smooth transitions and visual feedback
 * - Respects prefers-reduced-motion
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Box,
  Textarea,
  ActionIcon,
  Group,
  Text,
  Tooltip,
  Menu,
  Stack,
  Badge,
  Popover,
  ScrollArea,
} from '@mantine/core'
import { useReducedMotion } from '@mantine/hooks'
import {
  IconSend,
  IconMicrophone,
  IconChevronDown,
  IconSparkles,
  IconMoodSmile,
  IconX,
  IconCheck,
} from '@tabler/icons-react'
import { theaterColors } from '../utils/theaterColors'
import { EMOTION_COLORS, EMOTION_EMOJI, EMOTION_LABEL, type EmotionType } from '../utils/emotionColors'

// ====== Types ======
interface CreativeDirective {
  id: string
  emoji: string
  label: string
  category: string
}

type SendState = 'idle' | 'sending' | 'success' | 'error'

interface MessageInputV2Props {
  className?: string
  placeholder?: string
  disabled?: boolean
  value?: string
  onChange?: (value: string) => void
  onSend?: (message: string) => Promise<void>
  isLoading?: boolean
  characterName?: string
  // Emotion
  currentEmotion?: EmotionType
  onEmotionChange?: (emotion: EmotionType) => void
  // Creative directives
  activeDirectives?: CreativeDirective[]
  onToggleDirective?: (directive: CreativeDirective) => void
  onOpenDirectivePanel?: () => void
  // Long press
  onLongPressSend?: () => void
  // Rate limiter
  cooldownSeconds?: number
  canSend?: boolean
  isPremium?: boolean
}

// Emotion options for dropdown
const EMOTIONS: EmotionType[] = [
  'happy', 'love', 'shy', 'angry', 'sad',
  'surprised', 'scared', 'neutral', 'smug', 'excited'
]

// ====== Main Component ======
export default function MessageInputV2({
  className = '',
  placeholder,
  disabled = false,
  value = '',
  onChange,
  onSend,
  isLoading = false,
  characterName,
  currentEmotion = 'neutral',
  onEmotionChange,
  activeDirectives = [],
  onToggleDirective,
  onOpenDirectivePanel,
  onLongPressSend,
  cooldownSeconds = 0,
  canSend = true,
  isPremium = false,
}: MessageInputV2Props) {
  // State
  const [isFocused, setIsFocused] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [emotionOpen, setEmotionOpen] = useState(false)
  const [sendState, setSendState] = useState<SendState>('idle')

  // Hooks
  const reduceMotion = useReducedMotion()

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const composingRef = useRef(false)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressRef = useRef(false)

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
    }
  }, [value])

  // Reset send state after animation
  useEffect(() => {
    if (sendState === 'success' || sendState === 'error') {
      const timer = setTimeout(() => setSendState('idle'), 600)
      return () => clearTimeout(timer)
    }
  }, [sendState])

  // Send message
  const handleSend = useCallback(async () => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false
      return
    }

    const trimmed = value.trim()
    if (!trimmed || disabled || isLoading || !canSend) return

    setSendState('sending')
    onChange?.('')

    try {
      await onSend?.(trimmed)
      setSendState('success')
    } catch {
      setSendState('error')
    }
  }, [value, disabled, isLoading, canSend, onChange, onSend])

  // Keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (composingRef.current || e.repeat) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Long press handlers
  const handleTouchStart = () => {
    isLongPressRef.current = false
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      onLongPressSend?.()
    }, 500)
  }

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  // Computed
  const sendEnabled = !disabled && !isLoading && value.trim() && canSend
  const emotionColor = EMOTION_COLORS[currentEmotion]
  const isTyping = value.trim().length > 0

  // Get send button animation class
  const getSendButtonClass = () => {
    if (reduceMotion) return 'send-button-glow'
    if (sendState === 'sending') return 'send-button-glow send-btn-click'
    if (sendState === 'success') return 'send-button-glow send-btn-success'
    if (sendState === 'error') return 'send-button-glow send-btn-error'
    if (isTyping && sendEnabled) return 'send-button-glow send-button-pulse'
    return 'send-button-glow'
  }

  return (
    <Box
      className={`${className} message-input-v2`}
      style={{
        width: '100%',
        background: theaterColors.glassBackground,
        backdropFilter: 'blur(16px)',
        borderTop: `1px solid ${theaterColors.glassBorder}`,
      }}
    >
      <Stack gap="xs" p={isMobile ? 'xs' : 'sm'}>
        {/* Active Directives Pills */}
        {activeDirectives.length > 0 && (
          <ScrollArea type="never" offsetScrollbars={false}>
            <Group gap={6} wrap="nowrap">
              {activeDirectives.slice(0, 3).map((directive) => (
                <Badge
                  key={directive.id}
                  variant="light"
                  size="sm"
                  rightSection={
                    <ActionIcon
                      size="xs"
                      variant="transparent"
                      onClick={() => onToggleDirective?.(directive)}
                      style={{ marginLeft: -4 }}
                    >
                      <IconX size={10} />
                    </ActionIcon>
                  }
                  className="directive-pill"
                  style={{
                    background: 'rgba(245, 197, 66, 0.15)',
                    border: `1px solid ${theaterColors.spotlightGoldDim}`,
                    color: theaterColors.spotlightGold,
                    cursor: 'default',
                    flexShrink: 0,
                    transition: reduceMotion ? 'none' : 'all 0.2s ease',
                  }}
                >
                  {directive.emoji} {directive.label}
                </Badge>
              ))}

              {activeDirectives.length > 3 && (
                <Badge
                  variant="light"
                  size="sm"
                  className="directive-pill"
                  style={{
                    background: 'rgba(245, 197, 66, 0.1)',
                    color: theaterColors.spotlightGold,
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: reduceMotion ? 'none' : 'all 0.2s ease',
                  }}
                  onClick={onOpenDirectivePanel}
                >
                  +{activeDirectives.length - 3}
                </Badge>
              )}

              <ActionIcon
                size="xs"
                variant="subtle"
                onClick={onOpenDirectivePanel}
                className="action-btn-hover"
                style={{
                  color: theaterColors.spotlightGold,
                  flexShrink: 0,
                }}
              >
                <IconSparkles size={14} />
              </ActionIcon>
            </Group>
          </ScrollArea>
        )}

        {/* Main Input Row */}
        <Group gap={8} align="flex-end" wrap="nowrap">
          {/* Emotion Selector */}
          <Popover
            opened={emotionOpen}
            onChange={setEmotionOpen}
            position="top-start"
            shadow="md"
            width={280}
          >
            <Popover.Target>
              <ActionIcon
                variant="subtle"
                size={isMobile ? 'md' : 'lg'}
                onClick={() => setEmotionOpen(!emotionOpen)}
                className="action-btn-hover emotion-selector"
                style={{
                  color: emotionColor.primary,
                  background: emotionColor.bg,
                  border: `1px solid ${emotionColor.border}`,
                  transition: reduceMotion ? 'none' : 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                <Text size="md">{EMOTION_EMOJI[currentEmotion]}</Text>
              </ActionIcon>
            </Popover.Target>

            <Popover.Dropdown
              style={{
                background: theaterColors.voidDark,
                border: `1px solid ${theaterColors.glassBorder}`,
                padding: '0.75rem',
              }}
            >
              <Text size="xs" c="dimmed" mb="xs">
                选择情感态度
              </Text>
              <Group gap={6}>
                {EMOTIONS.map((emotion) => {
                  const isActive = emotion === currentEmotion
                  const color = EMOTION_COLORS[emotion]
                  return (
                    <Tooltip key={emotion} label={EMOTION_LABEL[emotion]}>
                      <ActionIcon
                        variant={isActive ? 'filled' : 'subtle'}
                        size="lg"
                        onClick={() => {
                          onEmotionChange?.(emotion)
                          setEmotionOpen(false)
                        }}
                        className="action-btn-hover"
                        style={{
                          background: isActive ? color.primary : color.bg,
                          border: `1px solid ${color.border}`,
                          transition: reduceMotion ? 'none' : 'all 0.2s ease',
                        }}
                      >
                        <Text size="md">{EMOTION_EMOJI[emotion]}</Text>
                      </ActionIcon>
                    </Tooltip>
                  )
                })}
              </Group>
            </Popover.Dropdown>
          </Popover>

          {/* Text Input */}
          <Box
            style={{ flex: 1, minWidth: 0 }}
            className={`input-container ${isFocused ? 'input-focused' : ''}`}
          >
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange?.(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => { composingRef.current = true }}
              onCompositionEnd={() => { composingRef.current = false }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder || '说些什么...'}
              disabled={disabled || isLoading}
              minRows={1}
              maxRows={isMobile ? 3 : 4}
              autosize
              className={`chat-input gpu-accelerated ${isFocused ? 'input-focus-glow' : ''}`}
              styles={{
                input: {
                  backgroundColor: 'rgba(26, 20, 41, 0.6)',
                  borderColor: isFocused ? theaterColors.spotlightGold : theaterColors.glassBorder,
                  color: 'rgba(255, 255, 255, 0.95)',
                  minHeight: isMobile ? '40px' : '44px',
                  fontSize: isMobile ? '16px' : '0.9375rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '12px',
                  transition: reduceMotion ? 'none' : 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isFocused
                    ? `0 0 0 3px ${theaterColors.spotlightGoldDim}, 0 0 20px ${theaterColors.spotlightGoldDim}`
                    : 'none',
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.4)',
                  },
                },
              }}
            />
          </Box>

          {/* Creative Directive Button (when no active) */}
          {activeDirectives.length === 0 && (
            <Tooltip label="创意指令">
              <ActionIcon
                variant="subtle"
                size={isMobile ? 'md' : 'lg'}
                onClick={onOpenDirectivePanel}
                className="action-btn-hover action-btn-ripple"
                style={{
                  color: theaterColors.spotlightGold,
                  flexShrink: 0,
                }}
              >
                <IconSparkles size={isMobile ? 16 : 18} />
              </ActionIcon>
            </Tooltip>
          )}

          {/* Send Button */}
          <Tooltip
            label={
              cooldownSeconds > 0
                ? isPremium
                  ? `付费会员10秒限1次，请等待 ${cooldownSeconds} 秒`
                  : `非付费会员20秒限1次，请等待 ${cooldownSeconds} 秒（升级会员可缩短）`
                : '发送 (Enter)'
            }
          >
            <ActionIcon
              variant="filled"
              size={isMobile ? 36 : 40}
              onClick={handleSend}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              disabled={!sendEnabled && canSend}
              className={`gpu-accelerated ${getSendButtonClass()}`}
              style={{
                background: sendState === 'success'
                  ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                  : sendState === 'error'
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : cooldownSeconds > 0
                  ? 'linear-gradient(135deg, #f97316, #ea580c)'
                  : `linear-gradient(135deg, ${theaterColors.spotlightGold} 0%, #e8d7b0 100%)`,
                opacity: sendEnabled ? 1 : 0.5,
                minWidth: cooldownSeconds > 0 ? (isMobile ? '50px' : '56px') : undefined,
                transition: reduceMotion ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: sendEnabled ? `0 0 20px ${theaterColors.spotlightGoldDim}` : 'none',
                borderRadius: '12px',
                flexShrink: 0,
                transform: 'scale(1)',
                '--glow-color': theaterColors.spotlightGoldDim,
              } as React.CSSProperties}
            >
              {cooldownSeconds > 0 ? (
                <Text size="sm" fw={700} c="white">
                  {cooldownSeconds}
                </Text>
              ) : sendState === 'success' ? (
                <IconCheck size={isMobile ? 16 : 18} style={{ color: 'white' }} />
              ) : (
                <IconSend size={isMobile ? 16 : 18} style={{ color: '#1a1429' }} />
              )}
            </ActionIcon>
          </Tooltip>
        </Group>
      </Stack>

      {/* Enhanced animation styles */}
      <style jsx global>{`
        .send-button-glow:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 0 30px var(--glow-color, ${theaterColors.spotlightGoldDim}) !important;
        }

        .send-button-glow:active:not(:disabled) {
          transform: scale(0.95);
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px var(--glow-color, ${theaterColors.spotlightGoldDim});
          }
          50% {
            box-shadow: 0 0 35px var(--glow-color, ${theaterColors.spotlightGoldDim});
          }
        }

        .send-button-pulse {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        /* Directive pill hover */
        .directive-pill:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(245, 197, 66, 0.3);
        }

        /* Emotion selector bounce on open */
        .emotion-selector:active {
          transform: scale(0.9);
        }

        /* Input focus animation */
        .input-container {
          position: relative;
        }

        .input-container::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 14px;
          background: linear-gradient(135deg, ${theaterColors.spotlightGold}40, transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
          z-index: -1;
        }

        .input-container.input-focused::after {
          opacity: 1;
        }

        /* Respect reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .send-button-glow,
          .send-button-pulse,
          .directive-pill,
          .emotion-selector,
          .input-container::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </Box>
  )
}

// ====== Named Export ======
export { MessageInputV2 }
