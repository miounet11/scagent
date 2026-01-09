'use client'

/**
 * ImmersiveMessageBubble v2.0 - Theater Soul Experience
 *
 * Major enhancements over v1:
 * - TypewriterText for cinematic text reveal
 * - EmotionTransitionBadge for animated emotion display
 * - MessageContextMenu for hover-activated actions
 * - Enhanced glass morphism styling
 * - Better accessibility support
 * - Reduced motion support
 */

import { memo, useMemo, useState, useCallback, useRef, useEffect } from 'react'
import {
  Box,
  Group,
  Stack,
  Avatar,
  Text,
  Paper,
  Image,
  Tooltip,
} from '@mantine/core'
import { useReducedMotion, useMediaQuery } from '@mantine/hooks'
import {
  IconUser,
  IconRobot,
} from '@tabler/icons-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// Local v2 components
import TypewriterText from './TypewriterText'
import EmotionTransitionBadge, {
  EMOTION_COLORS,
  type EmotionType
} from './EmotionTransitionBadge'

// Existing imports
import { parseEnhancedMessage, parseEmotionTransition, parseEmotionTag } from '@/lib/immersiveChat/parser'
import type { ChoiceOption, ImmersiveChatConfig } from '@/lib/immersiveChat/types'
import InteractiveChoices from '../InteractiveChoices'
import toast from 'react-hot-toast'

// Theater color palette
const theaterColors = {
  spotlightGold: '#f5c542',
  voidDark: 'rgba(26, 20, 41, 0.95)',
  glassBorder: 'rgba(245, 197, 66, 0.15)',
  glassBackground: 'rgba(26, 20, 41, 0.85)',
  userBg: 'rgba(99, 102, 241, 0.08)',
  userBorder: 'rgba(99, 102, 241, 0.3)',
}

// ==================== Types ====================

interface ImmersiveMessageBubbleV2Props {
  /** Message ID */
  messageId: string
  /** Message role */
  role: 'user' | 'assistant' | 'system'
  /** Message content */
  content: string
  /** Timestamp */
  timestamp?: Date | string
  /** Character info */
  characterName?: string
  characterAvatar?: string
  /** Expression image URL */
  expressionImageUrl?: string
  /** Is this the last assistant message */
  isLastAssistantMessage?: boolean
  /** Enable immersive features */
  immersiveEnabled?: boolean
  /** Immersive config */
  immersiveConfig?: Partial<ImmersiveChatConfig>
  /** Intimacy level for CG unlock */
  intimacyLevel?: number
  /** Enable typewriter effect */
  typewriterEnabled?: boolean
  /** Typewriter speed (chars/sec) */
  typewriterSpeed?: number
  /** Set of completed message IDs (for typewriter) */
  completedMessageIds?: Set<string>
  /** Mark message as typed callback */
  onMarkTyped?: (messageId: string) => void
  /** Edit callback */
  onEdit?: (messageId: string, newContent: string) => void
  /** Delete callback */
  onDelete?: (messageId: string) => void
  /** Regenerate callback */
  onRegenerate?: (messageId: string) => void
  /** Choice select callback */
  onChoiceSelect?: (choice: ChoiceOption) => void
  /** CG click callback */
  onCGClick?: (imageUrl: string) => void
  /** TTS play callback */
  onPlayTTS?: (messageId: string) => void
  /** TTS playing state */
  isTTSPlaying?: boolean
  /** Selected choice ID */
  selectedChoiceId?: string
}

// ==================== Main Component ====================

function ImmersiveMessageBubbleV2({
  messageId,
  role,
  content,
  timestamp,
  characterName = '角色',
  characterAvatar,
  expressionImageUrl,
  isLastAssistantMessage = false,
  immersiveEnabled = true,
  immersiveConfig = {},
  intimacyLevel = 0,
  typewriterEnabled = true,
  typewriterSpeed = 80,
  completedMessageIds,
  onMarkTyped,
  onEdit,
  onDelete,
  onRegenerate,
  onChoiceSelect,
  onCGClick,
  onPlayTTS,
  isTTSPlaying = false,
  selectedChoiceId,
}: ImmersiveMessageBubbleV2Props) {
  const reduceMotion = useReducedMotion()
  const isUser = role === 'user'
  const isSystem = role === 'system'
  const containerRef = useRef<HTMLDivElement>(null)

  // Hover state for context menu
  const [isHovered, setIsHovered] = useState(false)

  // 🎭 v4.1: Local typewriter completion state
  const [isLocalTypewriterComplete, setIsLocalTypewriterComplete] = useState(false)

  // 🎭 v4.2: VN-style name plate visibility based on scroll position
  const [showNamePlate, setShowNamePlate] = useState(true)

  // Detect touch devices - show buttons always on mobile
  // Use state + useEffect to avoid hydration mismatch (SSR vs client)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const touchQuery = useMediaQuery('(hover: none) and (pointer: coarse)')
  const isMobileWidth = useMediaQuery('(max-width: 768px)')

  useEffect(() => {
    // Update touch device state after hydration to avoid SSR mismatch
    setIsTouchDevice(touchQuery === true || isMobileWidth === true)
  }, [touchQuery, isMobileWidth])

  // Merge config
  const config: ImmersiveChatConfig = useMemo(() => ({
    enableExpressions: true,
    enableImages: true,
    enableChoices: true,
    enableStateHighlight: true,
    enableCGUnlock: true,
    expressionPosition: 'bubble',
    imageSize: 'medium',
    choiceStyle: 'cards',
    ...immersiveConfig,
  }), [immersiveConfig])

  // Parse emotion data
  const emotionData = useMemo(() => {
    if (isUser || isSystem) return null

    const transition = parseEmotionTransition(content)
    if (transition) {
      return {
        type: 'transition' as const,
        from: transition.from as EmotionType,
        to: transition.to as EmotionType
      }
    }

    const emotion = parseEmotionTag(content)
    if (emotion) {
      return { type: 'single' as const, emotion: emotion as EmotionType }
    }

    return null
  }, [content, isUser, isSystem])

  // Parse enhanced message
  const parsed = useMemo(() => {
    if (!immersiveEnabled || isUser || isSystem) {
      return null
    }
    return parseEnhancedMessage(content)
  }, [content, immersiveEnabled, isUser, isSystem])

  // Get emotion colors with safe fallback
  const emotionColors = useMemo(() => {
    const defaultColors = EMOTION_COLORS.neutral || {
      bg: 'rgba(156, 163, 175, 0.12)',
      border: 'rgba(156, 163, 175, 0.4)',
      glow: 'rgba(156, 163, 175, 0.25)',
      primary: '#9ca3af',
    }
    if (!parsed) return defaultColors
    return EMOTION_COLORS[parsed.emotion as EmotionType] || defaultColors
  }, [parsed])

  // Format timestamp
  const timeAgo = useMemo(() => {
    if (!timestamp) return ''
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
      return formatDistanceToNow(date, { addSuffix: true, locale: zhCN })
    } catch {
      return ''
    }
  }, [timestamp])

  // Clean and highlight content for display
  const processedContent = useMemo(() => {
    let result = content

    // Remove emotion tags
    result = result.replace(/\[emotion:\s*\w+(?:\s*[→\->]\s*\w+)?\]/gi, '')

    if (!parsed || !config.enableStateHighlight) {
      return result.trim()
    }

    result = parsed.cleanContent

    // Remove CG and image tags for display (they're rendered separately)
    result = result.replace(/\[cg:[^\]]+\]/gi, '')
    result = result.replace(/\[image:[^\]]+\]/gi, '')

    return result.trim()
  }, [content, parsed, config.enableStateHighlight])

  // Render content with highlighting (for after typewriter completes)
  const renderHighlightedContent = useCallback((text: string) => {
    // 🎭 v4.5: Aggressive cleanup of AI-generated HTML-like VN patterns
    // AI sometimes generates malformed HTML patterns that need thorough cleaning
    let result = text
      // Remove complete span tags with vn-* classes (handles multi-line)
      .replace(/<span[^>]*class=["'][^"']*vn-[^"']*["'][^>]*>([^<]*)<\/span>/gi, '$1')
      // Remove opening span tags with vn-* classes
      .replace(/<span[^>]*class=["'][^"']*vn-[^"']*["'][^>]*>/gi, '')
      // Remove patterns like: "vn-action">, "vn-state">, "vn-dialogue">
      .replace(/"vn-(action|state|dialogue)">/gi, '')
      // Remove patterns like: class="vn-action" (standalone)
      .replace(/class=["']vn-[^"']*["']/gi, '')
      // Remove closing </span> tags
      .replace(/<\/span>/gi, '')
      // Remove empty/malformed span tags
      .replace(/<span\s*>/gi, '')
      .replace(/<span\s*\/>/gi, '')
      // Remove patterns like: <span class="<span">
      .replace(/<span[^>]*class=["'][^"']*<[^"']*["'][^>]*>/gi, '')
      // Clean up escaped HTML entities from AI output
      .replace(/&lt;span[^&]*&gt;/gi, '')
      .replace(/&lt;\/span&gt;/gi, '')
      // Remove stray angle brackets that aren't part of valid HTML
      .replace(/<span[^>]*>/gi, '')
      // Clean up any remaining HTML-like patterns
      .replace(/&amp;lt;/gi, '&lt;')
      .replace(/&amp;gt;/gi, '&gt;')
      // Remove orphaned > at the start of lines or after whitespace
      .replace(/^\s*>/gm, '')
      .replace(/\s+>/g, ' ')

    // 🎭 v4.4: Escape remaining HTML special characters for safety
    // But only & < > that aren't part of our intended markup
    result = result
      .replace(/&(?!amp;|lt;|gt;|nbsp;|#)/g, '&amp;')
      .replace(/<(?!br\s*\/?)/gi, '&lt;')
      .replace(/(?<!<br\s*\/?)>/gi, '&gt;')

    // 🎭 v4.1: Enhanced highlighting for VN-style text

    // Highlight 【】 state descriptions with purple background
    result = result.replace(/【([^】]+)】/g,
      '<span class="vn-state">【$1】</span>'
    )

    // Highlight *actions* with amber italic styling
    result = result.replace(/\*([^*]+)\*/g,
      '<span class="vn-action">*$1*</span>'
    )

    // Highlight "dialogue" with golden color
    result = result.replace(/"([^"]+)"/g,
      '<span class="vn-dialogue">"$1"</span>'
    )
    result = result.replace(/「([^」]+)」/g,
      '<span class="vn-dialogue">「$1」</span>'
    )
    result = result.replace(/『([^』]+)』/g,
      '<span class="vn-dialogue">『$1』</span>'
    )

    // Line breaks
    result = result.replace(/\n/g, '<br />')

    return result
  }, [])

  // Word count
  const wordCount = useMemo(() => {
    return processedContent.replace(/<[^>]*>/g, '').length
  }, [processedContent])

  // Action handlers
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content)
    toast.success('已复制')
  }, [content])

  const handleEdit = useCallback(() => {
    // TODO: Open edit modal
    onEdit?.(messageId, content)
  }, [messageId, content, onEdit])

  const handleDelete = useCallback(() => {
    onDelete?.(messageId)
  }, [messageId, onDelete])

  const handleRegenerate = useCallback(() => {
    onRegenerate?.(messageId)
  }, [messageId, onRegenerate])

  const handlePlayTTS = useCallback(() => {
    onPlayTTS?.(messageId)
  }, [messageId, onPlayTTS])

  // System message rendering
  if (isSystem) {
    return (
      <Box className="my-4 text-center">
        <Paper
          p="sm"
          radius="md"
          className="inline-block"
          style={{
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}
        >
          <Text size="sm" c="dimmed" className="italic">
            {content}
          </Text>
        </Paper>
      </Box>
    )
  }

  // Determine if typewriter should be active
  // 🎭 v4.1: Include local completion state to prevent re-animation
  const shouldTypewrite = typewriterEnabled &&
    !isUser &&
    !reduceMotion &&
    isLastAssistantMessage &&
    !isLocalTypewriterComplete &&
    !completedMessageIds?.has(messageId)

  // Handle typewriter completion
  const handleTypewriterComplete = useCallback(() => {
    setIsLocalTypewriterComplete(true)
    onMarkTyped?.(messageId)
  }, [messageId, onMarkTyped])

  return (
    <Box
      ref={containerRef}
      className={`message-bubble-v2 vn-message-bubble relative ${isHovered ? 'is-hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transition: reduceMotion ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* 🎭 v4.2: VN-Style Floating Name Plate - Hidden on mobile to save space */}
      {!isUser && showNamePlate && !isTouchDevice && (
        <Box
          className="vn-name-plate"
          style={{
            position: 'absolute',
            top: '-12px',
            left: '16px',
            zIndex: 10,
            padding: '4px 12px',
            background: `linear-gradient(135deg, ${emotionColors.bg}, rgba(26, 20, 41, 0.95))`,
            border: `1px solid ${emotionColors.border}`,
            borderRadius: '8px 8px 2px 2px',
            boxShadow: `0 2px 8px rgba(0, 0, 0, 0.3), 0 0 12px ${emotionColors.glow}`,
            backdropFilter: 'blur(8px)',
            transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
            transition: reduceMotion ? 'none' : 'transform 0.2s ease',
          }}
        >
          <Text
            size="xs"
            fw={700}
            style={{
              color: emotionColors.primary || 'rgb(244, 114, 182)',
              textShadow: `0 0 8px ${emotionColors.glow}`,
              letterSpacing: '0.02em',
            }}
          >
            {characterName}
          </Text>
        </Box>
      )}

      <Paper
        p={{ base: 'sm', sm: 'md' }}
        radius="xl"
        className={`relative overflow-hidden ${!isUser ? 'vn-bubble-ai' : 'vn-bubble-user'}`}
        style={{
          background: isUser
            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(99, 102, 241, 0.06))'
            : `linear-gradient(135deg, ${emotionColors.bg}, rgba(26, 20, 41, 0.85))`,
          borderLeft: isUser ? 'none' : `3px solid ${emotionColors.border}`,
          borderRight: isUser ? `3px solid ${theaterColors.userBorder}` : 'none',
          boxShadow: isHovered
            ? `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 24px ${isUser ? 'rgba(99, 102, 241, 0.2)' : emotionColors.glow}`
            : `0 4px 16px rgba(0, 0, 0, 0.2), 0 0 12px ${isUser ? 'rgba(99, 102, 241, 0.1)' : emotionColors.glow}`,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: isUser
            ? '1px solid rgba(99, 102, 241, 0.2)'
            : `1px solid ${emotionColors.border}`,
          transform: isHovered && !reduceMotion
            ? (isUser ? 'translateX(-4px)' : 'translateX(4px)')
            : 'translateX(0)',
          transition: reduceMotion ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          marginTop: !isUser && showNamePlate && !isTouchDevice ? '8px' : '0',
        }}
      >
        {/* Glass morphism top highlight */}
        <Box
          className="absolute top-0 left-0 right-0 h-1/4 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
            borderRadius: 'inherit',
          }}
        />

        <Group gap="md" align="flex-start" wrap="nowrap">
          {/* Avatar with expression overlay */}
          <Box className="relative flex-shrink-0">
            <Avatar
              size={56}
              radius="xl"
              color={isUser ? 'indigo' : 'pink'}
              src={isUser ? undefined : characterAvatar}
              style={{
                border: `2px solid ${isUser ? theaterColors.userBorder : emotionColors.border}`,
                boxShadow: !isUser ? `0 0 12px ${emotionColors.glow}` : 'none',
              }}
            >
              {isUser ? <IconUser size={22} /> : <IconRobot size={22} />}
            </Avatar>

            {/* Expression overlay on avatar */}
            {!isUser && expressionImageUrl && config.enableExpressions && config.expressionPosition === 'avatar' && (
              <Tooltip label={`${characterName}的表情`}>
                <Box
                  className="absolute -right-1 -top-1 w-7 h-7 rounded-full overflow-hidden border-2 border-white/20 shadow-lg"
                  style={{
                    animation: reduceMotion ? 'none' : 'fadeIn 0.3s ease',
                  }}
                >
                  <Image
                    src={expressionImageUrl}
                    alt="expression"
                    className="w-full h-full object-cover"
                  />
                </Box>
              </Tooltip>
            )}
          </Box>

          {/* Message content */}
          <Stack gap="xs" className="flex-1 min-w-0">
            {/* Header: Name + Emotion + Time */}
            <Group justify="space-between" wrap="nowrap">
              <Group gap="xs" wrap="nowrap">
                <Text
                  size="sm"
                  fw={600}
                  style={{
                    color: isUser ? 'rgb(165, 180, 252)' : 'rgb(244, 114, 182)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  }}
                >
                  {isUser ? '你' : characterName}
                </Text>

                {/* Emotion Badge */}
                {!isUser && emotionData && (
                  emotionData.type === 'transition' ? (
                    <EmotionTransitionBadge
                      emotion={emotionData.from}
                      toEmotion={emotionData.to}
                      size="xs"
                    />
                  ) : (
                    <EmotionTransitionBadge
                      emotion={emotionData.emotion}
                      size="xs"
                    />
                  )
                )}

                {/* Fallback emotion from parsing */}
                {!isUser && !emotionData && parsed && parsed.emotion !== 'neutral' && (
                  <EmotionTransitionBadge
                    emotion={parsed.emotion as EmotionType}
                    size="xs"
                  />
                )}
              </Group>

              {/* Timestamp */}
              {timeAgo && (
                <Text size="xs" c="dimmed" className="whitespace-nowrap">
                  {timeAgo}
                </Text>
              )}
            </Group>

            {/* Main content with typewriter */}
            <Box className="message-content relative">
              {shouldTypewrite ? (
                <TypewriterText
                  content={processedContent}
                  speed={typewriterSpeed}
                  messageId={messageId}
                  completedIds={completedMessageIds}
                  onComplete={handleTypewriterComplete}
                  onMarkComplete={onMarkTyped}
                  size="sm"
                  color="rgba(255, 255, 255, 0.92)"
                />
              ) : (
                <Text
                  size="sm"
                  className="leading-relaxed"
                  style={{
                    color: 'rgba(255, 255, 255, 0.92)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    letterSpacing: '0.01em',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: renderHighlightedContent(processedContent)
                  }}
                />
              )}
            </Box>

            {/* Embedded CG images */}
            {parsed?.images && parsed.images.length > 0 && config.enableImages && (
              <Box className="mt-2">
                {parsed.images.map((img, idx) => (
                  <Box
                    key={idx}
                    className="rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => onCGClick?.(img.src || '')}
                    style={{ maxWidth: config.imageSize === 'large' ? '100%' : '280px' }}
                  >
                    <Image
                      src={img.src || ''}
                      alt={img.alt || 'CG Image'}
                      radius="md"
                    />
                  </Box>
                ))}
              </Box>
            )}

            {/* Interactive choices */}
            {parsed?.choices && config.enableChoices && (
              <Box className="mt-3">
                <InteractiveChoices
                  choices={parsed.choices}
                  characterName={characterName}
                  selectedId={selectedChoiceId}
                  onSelect={onChoiceSelect}
                  variant={config.choiceStyle}
                  showConsequences
                />
              </Box>
            )}

            {/* Footer: Word count + Actions */}
            <Group justify="space-between" className="mt-1">
              <Text size="xs" c="dimmed" className="tabular-nums">
                {wordCount}字
              </Text>

              {/* Hover action buttons - always visible on touch devices */}
              <Group
                gap={4}
                className="transition-opacity duration-200"
                style={{ opacity: isHovered || isTouchDevice ? 1 : 0 }}
              >
                <Tooltip label="复制">
                  <Box
                    component="button"
                    className="p-1.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={handleCopy}
                    aria-label="复制消息"
                  >
                    <Text size="xs" c="dimmed">复制</Text>
                  </Box>
                </Tooltip>

                {!isUser && onPlayTTS && (
                  <Tooltip label={isTTSPlaying ? '停止' : '朗读'}>
                    <Box
                      component="button"
                      className="p-1.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={handlePlayTTS}
                      aria-label={isTTSPlaying ? '停止朗读' : '朗读消息'}
                    >
                      <Text size="xs" c="dimmed">{isTTSPlaying ? '⏹' : '🔊'}</Text>
                    </Box>
                  </Tooltip>
                )}

                {onEdit && (
                  <Tooltip label="编辑">
                    <Box
                      component="button"
                      className="p-1.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={handleEdit}
                      aria-label="编辑消息"
                    >
                      <Text size="xs" c="dimmed">编辑</Text>
                    </Box>
                  </Tooltip>
                )}

                {!isUser && isLastAssistantMessage && onRegenerate && (
                  <Tooltip label="重新生成">
                    <Box
                      component="button"
                      className="p-1.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={handleRegenerate}
                      aria-label="重新生成消息"
                    >
                      <Text size="xs" c="dimmed">重生成</Text>
                    </Box>
                  </Tooltip>
                )}

                {onDelete && (
                  <Tooltip label="删除">
                    <Box
                      component="button"
                      className="p-1.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer text-red-400/80 hover:text-red-400"
                      onClick={handleDelete}
                      aria-label="删除消息"
                    >
                      <Text size="xs">删除</Text>
                    </Box>
                  </Tooltip>
                )}
              </Group>
            </Group>
          </Stack>
        </Group>
      </Paper>

      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .message-bubble-v2 {
          animation: ${reduceMotion ? 'none' : 'fadeIn 0.3s ease'};
        }

        .message-content a {
          color: rgb(196, 181, 253);
          text-decoration: underline;
        }

        .message-content a:hover {
          color: rgb(245, 197, 66);
        }

        @media (prefers-reduced-motion: reduce) {
          .message-bubble-v2 {
            animation: none !important;
          }
        }
      `}</style>
    </Box>
  )
}

export default memo(ImmersiveMessageBubbleV2)
