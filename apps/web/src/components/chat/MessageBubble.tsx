'use client'

/**
 * MessageBubble v22.0 - Soul Theater Cinematic Experience
 *
 * Design: Elite-level theatrical chat interface
 * - Dynamic emotion detection with glowing auras
 * - Character expression overlays
 * - Rich content highlighting (状态描写, 动作, 心理)
 * - Cinematic glass morphism effects
 * - Smooth entrance animations with staggered reveals
 * - Inline CG/image support
 */

import { useMemo, useCallback, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Box, Text, Avatar, Group, ActionIcon, Tooltip, CopyButton, Image } from '@mantine/core'
import {
  IconCopy,
  IconCheck,
  IconRefresh,
  IconPlayerPlay,
  IconPlayerStop,
  IconHeart,
  IconSparkles,
  IconVolume,
  IconDotsVertical,
  IconClock,
} from '@tabler/icons-react'
import { Message } from '@sillytavern-clone/shared'
import { EmotionAura, detectEmotionFromContent, getEmotionColors, ExpressionOverlay, TypewriterText } from '@/components/effects'
import type { EmotionType } from '@/components/effects'
import { replaceMessageVariables } from '@/lib/preset-application'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface MessageBubbleProps {
  message: Message
  characterName?: string
  characterAvatar?: string
  /** Character expression image URL based on emotion */
  expressionUrl?: string
  /** Inline CG/scene images */
  inlineImages?: Array<{ url: string; alt?: string; isUnlocked?: boolean }>
  isStreaming?: boolean
  showAvatar?: boolean
  isLatest?: boolean
  /** Enable typewriter effect for new messages */
  typewriterEnabled?: boolean
  /** TTS is currently playing */
  isTTSPlaying?: boolean
  onRegenerate?: () => void
  onCopy?: () => void
  onPlayTTS?: () => void
  onStopTTS?: () => void
  onImageClick?: (imageUrl: string) => void
  isMobile?: boolean
}

// Theater color palette
const theaterColors = {
  spotlightGold: '#f5c542',
  spotlightGoldDim: 'rgba(245, 197, 66, 0.3)',
  spotlightGoldBorder: 'rgba(245, 197, 66, 0.4)',
  moonlight: 'rgba(196, 181, 253, 0.8)',
  moonlightDim: 'rgba(196, 181, 253, 0.3)',
  emotionRose: 'rgba(232, 72, 106, 0.8)',
  voidDark: 'rgba(26, 20, 41, 0.95)',
  voidDarker: 'rgba(13, 10, 20, 0.98)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBackground: 'rgba(26, 20, 41, 0.85)',
  textPrimary: 'rgba(255, 255, 255, 0.95)',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
}

// Emotion icon mapping
const EMOTION_ICONS: Record<EmotionType, string> = {
  happy: '✨',
  joy: '✨',
  love: '💗',
  affection: '💗',
  shy: '///',
  embarrassed: '///',
  angry: '💢',
  frustrated: '😤',
  sad: '💧',
  melancholy: '🌧',
  surprised: '❗',
  shocked: '⚡',
  scared: '😰',
  anxious: '💭',
  thinking: '🤔',
  curious: '❓',
  smug: '😏',
  confident: '💫',
  excited: '🎉',
  energetic: '⚡',
  neutral: '',
}

export default function MessageBubble({
  message,
  characterName,
  characterAvatar,
  expressionUrl,
  inlineImages,
  isStreaming = false,
  showAvatar = true,
  isLatest = false,
  typewriterEnabled = false,
  isTTSPlaying = false,
  onRegenerate,
  onCopy,
  onPlayTTS,
  onStopTTS,
  onImageClick,
  isMobile = false,
}: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [isHovered, setIsHovered] = useState(false)
  const [typewriterComplete, setTypewriterComplete] = useState(!typewriterEnabled)

  // Detect emotion for AI messages
  const emotion = useMemo<EmotionType>(() =>
    !isUser ? detectEmotionFromContent(message.content) : 'neutral',
    [message.content, isUser]
  )

  const emotionColors = useMemo(() => getEmotionColors(emotion), [emotion])
  const emotionIcon = EMOTION_ICONS[emotion]

  // 🎭 v22.1: Process content to replace {{user}} and {{char}} template variables
  const processedContent = useMemo(() => {
    return replaceMessageVariables(message.content, characterName)
  }, [message.content, characterName])

  // Handle typewriter completion
  const handleTypewriterComplete = useCallback(() => {
    setTypewriterComplete(true)
  }, [])

  // Format timestamp
  const formattedTime = useMemo(() => {
    if (!message.timestamp) return ''
    try {
      const date = typeof message.timestamp === 'string'
        ? new Date(message.timestamp)
        : message.timestamp
      return formatDistanceToNow(date, { addSuffix: true, locale: zhCN })
    } catch {
      return ''
    }
  }, [message.timestamp])

  // Reset typewriter state when message changes
  useEffect(() => {
    if (typewriterEnabled && isLatest) {
      setTypewriterComplete(false)
    }
  }, [message.id, typewriterEnabled, isLatest])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`message-bubble-theater ${isUser ? 'message-user' : 'message-ai'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: isMobile ? '0.625rem' : '0.875rem',
        marginBottom: '1.25rem',
        width: '100%',
        padding: isMobile ? '0 0.5rem' : '0',
      }}
    >
      {/* Character avatar with emotion aura */}
      {!isUser && showAvatar && (
        <Box style={{ position: 'relative', flexShrink: 0 }}>
          <EmotionAura
            emotion={emotion}
            size={isMobile ? 40 : 48}
            intensity={emotion === 'neutral' ? 'subtle' : 'medium'}
            animated={!isStreaming}
          >
            <Avatar
              src={characterAvatar}
              alt={characterName}
              size={isMobile ? 40 : 48}
              radius="xl"
              style={{
                border: `2px solid ${emotionColors.primary}`,
                transition: 'all 0.3s ease',
              }}
            >
              {characterName?.charAt(0)}
            </Avatar>
          </EmotionAura>

          {/* Expression overlay */}
          {expressionUrl && (
            <ExpressionOverlay
              imageUrl={expressionUrl}
              emotion={emotion}
              size="small"
              position="top-right"
              animated={!isStreaming}
            />
          )}
        </Box>
      )}

      {/* Message content container */}
      <Box
        style={{
          maxWidth: isMobile ? '85%' : '72%',
          position: 'relative',
          flex: 1,
          minWidth: 0,
        }}
      >
        {/* Character name with emotion indicator and timestamp */}
        {!isUser && characterName && (
          <Group gap={6} mb={6} pl={4} justify="space-between">
            <Group gap={6}>
              <Text
                size="sm"
                fw={600}
                style={{
                  color: emotionColors.primary.replace('0.6', '1'),
                  textShadow: `0 0 12px ${emotionColors.glow}`,
                  letterSpacing: '0.02em',
                }}
              >
                {characterName}
              </Text>
              {emotionIcon && emotion !== 'neutral' && (
                <motion.span
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  style={{ fontSize: '0.75rem' }}
                >
                  {emotionIcon}
                </motion.span>
              )}
            </Group>
            {/* Timestamp - elegant hover reveal */}
            {formattedTime && (
              <Tooltip label={formattedTime} position="top" withArrow>
                <Text
                  size="xs"
                  className="message-timestamp"
                  style={{
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: '0.7rem',
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                    cursor: 'default',
                  }}
                >
                  <IconClock size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                  {formattedTime}
                </Text>
              </Tooltip>
            )}
          </Group>
        )}

        {/* User message header with timestamp */}
        {isUser && (
          <Group gap={6} mb={6} pr={4} justify="flex-end">
            {formattedTime && (
              <Text
                size="xs"
                style={{
                  color: 'rgba(245, 197, 66, 0.5)',
                  fontSize: '0.7rem',
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {formattedTime}
              </Text>
            )}
            <Text
              size="sm"
              fw={600}
              style={{
                color: theaterColors.spotlightGold,
                textShadow: `0 0 12px ${theaterColors.spotlightGoldDim}`,
                letterSpacing: '0.02em',
              }}
            >
              You
            </Text>
          </Group>
        )}

        {/* Message bubble with cinematic styling */}
        <motion.div
          animate={{
            y: isHovered && !isMobile ? -2 : 0,
            boxShadow: isHovered && !isMobile
              ? isUser
                ? `0 8px 32px rgba(245, 197, 66, 0.25), 0 0 0 1px ${theaterColors.spotlightGoldBorder}`
                : `0 8px 32px ${emotionColors.glow}, 0 0 0 1px ${emotionColors.secondary}`
              : isUser
                ? `0 4px 20px rgba(245, 197, 66, 0.15)`
                : `0 4px 20px rgba(0, 0, 0, 0.3)`,
          }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'relative',
            padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
            borderRadius: isUser
              ? '20px 6px 20px 20px'
              : '6px 20px 20px 20px',

            // Solid background (removed backdrop-filter for performance)
            background: isUser
              ? 'linear-gradient(135deg, rgba(245, 197, 66, 0.15) 0%, rgba(30, 25, 40, 0.95) 100%)'
              : `linear-gradient(135deg, rgba(26, 20, 41, 0.98) 0%, rgba(20, 15, 32, 0.98) 100%)`,

            // Border styling with emotion accent
            border: isUser
              ? `1px solid ${theaterColors.spotlightGoldBorder}`
              : `1px solid ${emotionColors.secondary}`,
            borderLeft: !isUser ? `3px solid ${emotionColors.primary}` : undefined,
            borderRight: isUser ? `3px solid ${theaterColors.spotlightGoldBorder}` : undefined,
          }}
        >
          {/* Inline images/CGs */}
          {inlineImages && inlineImages.length > 0 && (
            <Box mb="sm">
              {inlineImages.map((img, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  style={{
                    marginBottom: idx < inlineImages.length - 1 ? 8 : 0,
                    cursor: img.isUnlocked !== false ? 'pointer' : 'default',
                  }}
                  onClick={() => img.isUnlocked !== false && onImageClick?.(img.url)}
                >
                  <Image
                    src={img.url}
                    alt={img.alt || 'Scene image'}
                    radius="md"
                    fit="cover"
                    style={{
                      maxHeight: 200,
                      border: `1px solid ${emotionColors.secondary}`,
                      filter: img.isUnlocked === false ? 'blur(8px)' : 'none',
                    }}
                  />
                </motion.div>
              ))}
            </Box>
          )}

          {/* Message text with typewriter or static rendering */}
          {typewriterEnabled && isLatest && !typewriterComplete ? (
            <TypewriterText
              content={processedContent}
              speed={isStreaming ? 80 : 50}
              enabled={!typewriterComplete}
              onComplete={handleTypewriterComplete}
              showCursor={true}
              cursorColor={isUser ? theaterColors.spotlightGold : emotionColors.primary.replace('0.6', '1')}
              size={isMobile ? 'sm' : 'md'}
              highlightRichContent={!isUser}
            />
          ) : (
            <Box
              style={{
                color: theaterColors.textPrimary,
                lineHeight: 1.75,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: isMobile ? '0.9375rem' : '1rem',
              }}
            >
              {renderRichContent(processedContent, !isUser)}
            </Box>
          )}

          {/* Streaming indicator */}
          {isStreaming && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              style={{
                display: 'inline-block',
                width: 2,
                height: '1.1em',
                marginLeft: 4,
                backgroundColor: emotionColors.primary.replace('0.6', '1'),
                verticalAlign: 'text-bottom',
                boxShadow: `0 0 8px ${emotionColors.glow}`,
              }}
            />
          )}

          {/* Quick actions - floating pill on hover with enhanced effects */}
          <AnimatePresence>
            {!isUser && isHovered && !isStreaming && !isMobile && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute',
                  top: -12,
                  right: 8,
                  zIndex: 10,
                }}
              >
                <Group
                  gap={2}
                  className="action-buttons-group"
                  style={{
                    background: 'rgba(13, 10, 20, 0.98)',
                    borderRadius: 20,
                    padding: '4px 8px',
                    border: `1px solid ${emotionColors.secondary}`,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <CopyButton value={processedContent} timeout={2000}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? '已复制' : '复制'} position="top">
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          onClick={copy}
                          className="action-btn-copy"
                          style={{
                            color: copied ? '#22c55e' : theaterColors.textSecondary,
                            transition: 'all 0.2s ease',
                            transform: copied ? 'scale(1.1)' : 'scale(1)',
                          }}
                          onMouseEnter={(e) => {
                            if (!copied) {
                              e.currentTarget.style.color = theaterColors.spotlightGold
                              e.currentTarget.style.transform = 'scale(1.15)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!copied) {
                              e.currentTarget.style.color = theaterColors.textSecondary
                              e.currentTarget.style.transform = 'scale(1)'
                            }
                          }}
                        >
                          {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>

                  {onPlayTTS && (
                    <Tooltip label={isTTSPlaying ? '停止播放' : '播放语音'} position="top">
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={isTTSPlaying ? onStopTTS : onPlayTTS}
                        className="action-btn-tts"
                        style={{
                          color: isTTSPlaying ? theaterColors.spotlightGold : theaterColors.textSecondary,
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = theaterColors.spotlightGold
                          e.currentTarget.style.transform = 'scale(1.15)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = isTTSPlaying ? theaterColors.spotlightGold : theaterColors.textSecondary
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        {isTTSPlaying ? <IconPlayerStop size={14} /> : <IconVolume size={14} />}
                      </ActionIcon>
                    </Tooltip>
                  )}

                  {onRegenerate && isLatest && (
                    <Tooltip label="重新生成" position="top">
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={onRegenerate}
                        className="action-btn-regenerate"
                        style={{
                          color: theaterColors.textSecondary,
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = theaterColors.spotlightGold
                          e.currentTarget.style.transform = 'scale(1.15) rotate(180deg)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = theaterColors.textSecondary
                          e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
                        }}
                      >
                        <IconRefresh size={14} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Emotion indicator (static - removed infinite animation for performance) */}
        {!isUser && emotion !== 'neutral' && !isStreaming && (
          <div
            style={{
              position: 'absolute',
              bottom: -6,
              left: 16,
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: emotionColors.primary.replace('0.6', '0.9'),
            }}
          />
        )}
      </Box>
    </motion.div>
  )
}

/**
 * Render rich content with highlighting for:
 * - 【状态描写】 - purple italic
 * - *动作* - gold italic
 * - "对话" - emphasized
 * - （心理） - pink italic
 * - ```code``` - styled code blocks
 * - `inline code` - inline code styling
 */
function renderRichContent(content: string, enableHighlight: boolean): React.ReactNode {
  if (!enableHighlight) {
    return content
  }

  // First, handle code blocks (```...```) - replace with placeholders
  const codeBlocks: string[] = []
  let processedContent = content.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const index = codeBlocks.length
    codeBlocks.push(`__CODE_BLOCK_${index}__${lang}__${code}`)
    return `__CODE_BLOCK_PLACEHOLDER_${index}__`
  })

  // Handle inline code (`...`)
  const inlineCodes: string[] = []
  processedContent = processedContent.replace(/`([^`]+)`/g, (_, code) => {
    const index = inlineCodes.length
    inlineCodes.push(code)
    return `__INLINE_CODE_PLACEHOLDER_${index}__`
  })

  // Split content by patterns while keeping delimiters
  const parts = processedContent.split(/(【[^】]+】|\*[^*]+\*|"[^"]+"|（[^）]+）|__CODE_BLOCK_PLACEHOLDER_\d+__|__INLINE_CODE_PLACEHOLDER_\d+__)/g)

  return parts.map((part, index) => {
    // Code block placeholder
    if (/^__CODE_BLOCK_PLACEHOLDER_(\d+)__$/.test(part)) {
      const blockIndex = parseInt(part.match(/\d+/)?.[0] || '0')
      const blockData = codeBlocks[blockIndex]
      if (blockData) {
        const [, lang, code] = blockData.match(/__CODE_BLOCK_\d+__(\w*)__(.*)/) || []
        return (
          <div
            key={index}
            className="code-block-container"
            style={{
              margin: '0.75rem 0',
              borderRadius: '8px',
              overflow: 'hidden',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {/* Code block header */}
            {lang && (
              <div
                style={{
                  padding: '0.375rem 0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '0.7rem',
                  color: 'rgba(196, 181, 253, 0.8)',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {lang}
              </div>
            )}
            {/* Code content */}
            <pre
              style={{
                margin: 0,
                padding: '0.75rem',
                overflow: 'auto',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                color: 'rgba(226, 232, 240, 0.95)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              <code>{code?.trim()}</code>
            </pre>
          </div>
        )
      }
    }

    // Inline code placeholder
    if (/^__INLINE_CODE_PLACEHOLDER_(\d+)__$/.test(part)) {
      const codeIndex = parseInt(part.match(/\d+/)?.[0] || '0')
      const code = inlineCodes[codeIndex]
      return (
        <code
          key={index}
          style={{
            padding: '0.125rem 0.375rem',
            borderRadius: '4px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '0.875em',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            color: 'rgba(251, 191, 36, 0.9)',
          }}
        >
          {code}
        </code>
      )
    }

    // State description 【】
    if (/^【[^】]+】$/.test(part)) {
      return (
        <span
          key={index}
          style={{
            color: 'rgba(196, 181, 253, 0.9)',
            fontStyle: 'italic',
            fontSize: '0.95em',
          }}
        >
          {part}
        </span>
      )
    }

    // Action *text*
    if (/^\*[^*]+\*$/.test(part)) {
      return (
        <span
          key={index}
          style={{
            color: 'rgba(245, 197, 66, 0.9)',
            fontStyle: 'italic',
          }}
        >
          {part}
        </span>
      )
    }

    // Dialogue "text"
    if (/^"[^"]+"$/.test(part)) {
      return (
        <span
          key={index}
          style={{
            color: 'rgba(255, 255, 255, 0.98)',
            fontWeight: 500,
          }}
        >
          {part}
        </span>
      )
    }

    // Thoughts （text）
    if (/^（[^）]+）$/.test(part)) {
      return (
        <span
          key={index}
          style={{
            color: 'rgba(244, 114, 182, 0.85)',
            fontStyle: 'italic',
            fontSize: '0.95em',
          }}
        >
          {part}
        </span>
      )
    }

    // Regular text
    return <span key={index}>{part}</span>
  })
}

// Typing indicator component with theatrical styling
export function TypingIndicator({
  characterName,
  characterAvatar,
  emotion = 'neutral',
  isMobile = false
}: {
  characterName?: string
  characterAvatar?: string
  emotion?: EmotionType
  isMobile?: boolean
}) {
  const emotionColors = getEmotionColors(emotion)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="typing-indicator-theater"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.625rem' : '0.875rem',
        marginBottom: '1.25rem',
        padding: isMobile ? '0 0.5rem' : '0',
      }}
    >
      <EmotionAura
        emotion={emotion}
        size={isMobile ? 40 : 48}
        intensity="medium"
        animated
      >
        <Avatar
          src={characterAvatar}
          alt={characterName}
          size={isMobile ? 40 : 48}
          radius="xl"
          style={{
            border: `2px solid ${emotionColors.primary}`,
          }}
        >
          {characterName?.charAt(0)}
        </Avatar>
      </EmotionAura>

      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
          borderRadius: '6px 20px 20px 20px',
          background: 'rgba(26, 20, 41, 0.98)',
          border: `1px solid ${emotionColors.secondary}`,
          borderLeft: `3px solid ${emotionColors.primary}`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Animated dots with emotion color */}
        <Group gap={5}>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -6, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: emotionColors.primary.replace('0.6', '0.9'),
                boxShadow: `0 0 8px ${emotionColors.glow}`,
              }}
            />
          ))}
        </Group>

        <Text
          size="sm"
          style={{
            color: emotionColors.primary.replace('0.6', '0.9'),
            fontWeight: 500,
          }}
        >
          {characterName || 'AI'} 正在输入
        </Text>
      </Box>
    </motion.div>
  )
}
