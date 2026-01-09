'use client'
/**
 * ImmersiveChatV2Container - Theater Soul Experience v4.0
 *
 * v4.0 Updates:
 * - Enhanced CharacterPortraitPanel v4 with asset integration
 * - Scene/Background switching with AI suggestions
 * - Expression quick-switch support
 * - CG reveal system for story moments
 * - Integrated asset gallery access
 *
 * v3.1 Updates:
 * - Integrated EmotionAtmosphere system for enhanced visual feedback
 * - Emotion-responsive particles and background effects
 * - Improved portrait glow with EmotionGlow component
 *
 * Major Layout:
 * - Portrait-Centric: Character portrait on LEFT side (more natural for reading)
 * - Integrated Bond: Bond info merged into portrait panel
 * - Collapsible: Portrait panel can be collapsed for focused reading
 * - Background Assets: Uses character background images with switching
 * - EmotionAtmosphere: Dynamic visual effects based on detected emotions
 */

import { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Box, Stack, Tooltip, Text } from '@mantine/core'
import { AnimatePresence } from 'framer-motion'

// V2/V3/V4 Components
import { DynamicBackground } from './DynamicBackground'
import CharacterPortraitPanelV4 from './CharacterPortraitPanel.v4'
import ImmersiveMessageBubbleV2 from './ImmersiveMessageBubble.v2'
import ContextAwareQuickActions from './ContextAwareQuickActions'
import MessageInputV2 from './MessageInput.v2'
import RadialMenu from './RadialMenu'
import CGReveal from './CGReveal'
import MiniInputBar from './MiniInputBar'
import ImmersiveStatusBar, { type StatusType } from './ImmersiveStatusBar'
import { FloatingActionDrawer, PortraitOverlay, useSwipeGesture, SwipeIndicator, GestureHintToast } from './MobileGestures'
import TTSSettingsPopover from './TTSSettingsPopover'
// 🎭 v28: 群聊消息渲染
import GroupMessageRenderer, { isGroupMessage, type GroupMemberInfo } from '../GroupMessageRenderer'

// 🎭 v31: EmotionAtmosphere 情绪氛围系统
import {
  EMOTION_THEME_MAP,
  type EmotionType as AtmosphereEmotionType,
} from '../EmotionAtmosphere'

// Utils
import { theaterColors } from '../utils/theaterColors'
import type { EmotionType } from '../utils/emotionColors'
import type { CharacterAsset } from '@/hooks/useCharacterAssets'

// ==================== Types ====================

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt?: Date | string
  emotion?: string
  previousEmotion?: string
}

interface Character {
  id: string
  name: string
  avatar?: string
  coverUrl?: string
  generatedAvatar?: string
}

interface QuickAction {
  id: string
  emoji: string
  label: string
  category: string
}

interface CreativeDirective {
  id: string
  emoji: string
  label: string
  category: string
}

interface ImmersiveChatV2ContainerProps {
  /** Message list */
  messages: Message[]
  /** Current character */
  character?: Character | null
  /** Character portrait URL (800×1200) */
  portraitUrl?: string
  /** Character background URL (1920×1080) */
  backgroundUrl?: string
  /** Is generating response */
  isGenerating?: boolean
  /** Send message callback */
  onSendMessage?: (message: string) => void
  /** Input value (controlled) */
  inputValue?: string
  /** Input change callback */
  onInputChange?: (value: string) => void
  /** Rate limit cooldown */
  cooldownSeconds?: number
  /** Can send message */
  canSend?: boolean
  /** Is premium user */
  isPremium?: boolean
  /** Input disabled */
  inputDisabled?: boolean
  /** TTS callback */
  onPlayTTS?: (content: string, messageId?: string) => void
  /** TTS playing state */
  isTTSPlaying?: boolean
  /** Current TTS message ID */
  ttsCurrentMessageId?: string | null
  /** TTS enabled state */
  ttsEnabled?: boolean
  /** Toggle TTS settings callback */
  onToggleTTS?: () => void
  /** User ID for asset loading */
  userId?: string
  /** Quick action select callback */
  onQuickActionSelect?: (action: QuickAction) => void
  /** Available quick actions */
  quickActions?: QuickAction[]
  /** Active creative directives */
  activeDirectives?: CreativeDirective[]
  /** Toggle directive callback */
  onToggleDirective?: (directive: CreativeDirective) => void
  /** Open directive panel callback */
  onOpenDirectivePanel?: () => void
  /** Custom className */
  className?: string
  /** Bond experience points for relationship card */
  bondExp?: number
  /** Recent interaction summary for relationship card */
  recentInteraction?: string
  /** Callback when relationship card is clicked */
  onRelationCardClick?: () => void
  /** Portrait panel collapsed state (controlled) */
  isPortraitCollapsed?: boolean
  /** Portrait panel collapse toggle callback */
  onTogglePortraitCollapse?: () => void
  /** Portrait click callback */
  onPortraitClick?: () => void
  // 🎭 v29: 群聊模式支持 - 只需要 groupMembers 用于渲染群聊消息
  groupMembers?: GroupMemberInfo[]
  // 🎭 v31: 情绪氛围系统
  enableEmotionAtmosphere?: boolean
  // 🎭 v4.0: 素材系统增强
  /** 场景素材列表 */
  sceneAssets?: CharacterAsset[]
  /** 当前选中的场景 */
  currentScene?: CharacterAsset | null
  /** 场景切换回调 */
  onSceneChange?: (scene: CharacterAsset) => void
  /** AI 推荐的场景 */
  suggestedScene?: CharacterAsset | null
  /** 表情差分素材 */
  expressionAssets?: CharacterAsset[]
  /** 表情切换回调 */
  onExpressionChange?: (expression: CharacterAsset) => void
  /** CG 素材列表 */
  cgAssets?: CharacterAsset[]
  /** 新解锁的 CG 数量 */
  newCGCount?: number
  /** 打开素材库回调 */
  onOpenAssetGallery?: (tab?: 'all' | 'expression' | 'scene' | 'cg') => void
  /** 素材统计 */
  assetStats?: {
    expressions: number
    scenes: number
    cgs: number
    total: number
  }
  /** CG 解锁触发 */
  revealCG?: CharacterAsset | null
  /** CG 解锁关闭回调 */
  onCloseCGReveal?: () => void
  // 🎭 v13: 沉浸模式增强
  /** 使用迷你输入条 (v13 沉浸模式) */
  useMiniInputBar?: boolean
  /** 显示手势提示 (首次进入沉浸模式) */
  showGestureHint?: boolean
  /** 手势提示关闭回调 */
  onDismissGestureHint?: () => void
  /** 打开导演面板回调 */
  onOpenDirectorPanel?: () => void
  /** 停止生成回调 */
  onStopGeneration?: () => void
  /** 退出沉浸模式回调 */
  onExitImmersive?: () => void
  /** 错误状态 */
  error?: { message: string; canRetry?: boolean } | null
  /** 重试回调 */
  onRetry?: () => void
}

// ==================== Quick Actions Data ====================

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { id: 'hug', emoji: '🤗', label: '拥抱', category: 'physical' },
  { id: 'pat', emoji: '✋', label: '摸头', category: 'physical' },
  { id: 'smile', emoji: '😊', label: '微笑', category: 'emotion' },
  { id: 'gaze', emoji: '👀', label: '凝视', category: 'emotion' },
  { id: 'kiss', emoji: '💋', label: '亲吻', category: 'intimate' },
  { id: 'hold', emoji: '🤝', label: '牵手', category: 'physical' },
  { id: 'blush', emoji: '😳', label: '脸红', category: 'emotion' },
  { id: 'sigh', emoji: '😔', label: '叹息', category: 'emotion' },
]

const EMOTION_OPTIONS: Array<{ id: EmotionType; emoji: string; label: string }> = [
  { id: 'happy', emoji: '😊', label: '开心' },
  { id: 'love', emoji: '❤️', label: '爱意' },
  { id: 'shy', emoji: '😳', label: '害羞' },
  { id: 'sad', emoji: '😢', label: '伤心' },
  { id: 'angry', emoji: '😠', label: '生气' },
  { id: 'surprised', emoji: '😲', label: '惊讶' },
  { id: 'neutral', emoji: '😐', label: '平静' },
  { id: 'excited', emoji: '🤩', label: '兴奋' },
]

// ==================== Main Component ====================

// 🎭 v31: EmotionAtmosphere Particle Layer - renders particles based on current emotion
function EmotionAtmosphereParticleLayer({ emotion }: { emotion: AtmosphereEmotionType }) {
  const theme = EMOTION_THEME_MAP[emotion] || EMOTION_THEME_MAP.neutral

  if (!theme.particle) return null

  return (
    <Box
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 2,
        overflow: 'hidden',
      }}
    >
      {/* Render particles directly without context dependency */}
      <EmotionParticlesStandalone type={theme.particle} count={12} />
    </Box>
  )
}

// Standalone particles component that doesn't require EmotionAtmosphereProvider
function EmotionParticlesStandalone({
  type,
  count = 15,
}: {
  type: 'sparkle' | 'rain' | 'heart' | 'fire' | 'star' | 'ghost'
  count?: number
}) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  const getParticleSymbol = (particleType: string): string => {
    switch (particleType) {
      case 'sparkle': return '✨'
      case 'rain': return '💧'
      case 'heart': return '💗'
      case 'fire': return '🔥'
      case 'star': return '⭐'
      case 'ghost': return '👻'
      default: return '✨'
    }
  }

  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${5 + Math.random() * 5}s`,
    size: 0.8 + Math.random() * 0.4,
  }))

  return (
    <>
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            top: '-20px',
            left: particle.left,
            fontSize: `${particle.size}rem`,
            opacity: 0.5,
            animation: `emotion-particle-fall ${particle.animationDuration} linear infinite`,
            animationDelay: particle.animationDelay,
            willChange: 'transform',
          }}
        >
          {getParticleSymbol(type)}
        </div>
      ))}
      <style jsx global>{`
        @keyframes emotion-particle-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.5;
          }
          90% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </>
  )
}

function ImmersiveChatV2Container({
  messages,
  character,
  portraitUrl,
  backgroundUrl,
  isGenerating = false,
  onSendMessage,
  inputValue = '',
  onInputChange,
  cooldownSeconds = 0,
  canSend = true,
  isPremium = false,
  inputDisabled = false,
  onPlayTTS,
  isTTSPlaying,
  ttsCurrentMessageId,
  ttsEnabled = false,
  onToggleTTS,
  userId,
  onQuickActionSelect,
  quickActions = DEFAULT_QUICK_ACTIONS,
  activeDirectives = [],
  onToggleDirective,
  onOpenDirectivePanel,
  className = '',
  bondExp = 0,
  recentInteraction,
  onRelationCardClick,
  isPortraitCollapsed: controlledCollapsed,
  onTogglePortraitCollapse,
  onPortraitClick,
  // 🎭 v29: 群聊模式支持
  groupMembers = [],
  // 🎭 v31: 情绪氛围系统
  enableEmotionAtmosphere = true,
  // 🎭 v4.0: 素材系统增强
  sceneAssets = [],
  currentScene,
  onSceneChange,
  suggestedScene,
  expressionAssets = [],
  onExpressionChange,
  cgAssets = [],
  newCGCount = 0,
  onOpenAssetGallery,
  assetStats,
  revealCG,
  onCloseCGReveal,
  // 🎭 v13: 沉浸模式增强
  useMiniInputBar = false,
  showGestureHint = false,
  onDismissGestureHint,
  onOpenDirectorPanel,
  onStopGeneration,
  onExitImmersive,
  error,
  onRetry,
}: ImmersiveChatV2ContainerProps) {
  // State
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('neutral')
  const [radialMenuOpen, setRadialMenuOpen] = useState(false)
  const [actionDrawerOpen, setActionDrawerOpen] = useState(false)
  const [portraitExpanded, setPortraitExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  // 🎭 v13: 新增状态
  const [inputExpanded, setInputExpanded] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null)
  const [swipeProgress, setSwipeProgress] = useState(0)

  // 🎭 v4.1: Auto-scroll refs and state
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const userHasScrolledRef = useRef(false)
  const lastMessageCountRef = useRef(0)

  // Controlled or uncontrolled portrait collapse
  const isPortraitCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed
  const togglePortraitCollapse = useCallback(() => {
    if (onTogglePortraitCollapse) {
      onTogglePortraitCollapse()
    } else {
      setInternalCollapsed(prev => !prev)
    }
  }, [onTogglePortraitCollapse])

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Get latest emotion from messages
  const latestEmotion = useMemo(() => {
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant')
    return (lastAssistantMsg?.emotion as EmotionType) || 'neutral'
  }, [messages])

  // Update current emotion when messages change
  useEffect(() => {
    setCurrentEmotion(latestEmotion)
  }, [latestEmotion])

  // Get only assistant messages for display
  const assistantMessages = useMemo(() => {
    return messages.filter(m => m.role === 'assistant')
  }, [messages])

  // 🎭 v4.5: Memoized messages for QuickActions to prevent excessive re-renders
  // Only pass minimal data needed for action recommendations
  const quickActionsMessages = useMemo(() => {
    return messages.slice(-3).map(m => ({ role: m.role, content: m.content }))
  }, [messages])

  // 🎭 v4.3: Track last message content for streaming scroll detection
  const lastMessageContent = useMemo(() => {
    const lastMsg = assistantMessages[assistantMessages.length - 1]
    return lastMsg?.content || ''
  }, [assistantMessages])

  // 🎭 v28: 主角色信息用于群聊渲染
  const mainCharacterInfo = useMemo((): GroupMemberInfo | null => {
    if (!character) return null
    return {
      id: character.id,
      name: character.name,
      avatar: character.coverUrl || character.avatar || character.generatedAvatar || null,
      isMainCharacter: true,
    }
  }, [character])

  // Mobile swipe gesture
  const swipeHandlers = useSwipeGesture({
    onSwipeUp: () => {
      setSwipeDirection(null)
      setSwipeProgress(0)
      setActionDrawerOpen(true)
    },
    onSwipeRight: () => {
      setSwipeDirection(null)
      setSwipeProgress(0)
      setPortraitExpanded(true)
    },
    threshold: 50,
  })

  // 🎭 v13: 计算当前状态
  const currentStatus = useMemo((): StatusType => {
    if (error) return 'error'
    if (isGenerating) return 'generating'
    if (cooldownSeconds > 0) return 'cooldown'
    return 'idle'
  }, [error, isGenerating, cooldownSeconds])

  // 🎭 v13: 展开/收起输入框
  const handleExpandInput = useCallback(() => {
    setInputExpanded(prev => !prev)
  }, [])

  // 🎭 v4.1: Auto-scroll functions
  // 🎭 v4.3: Improved for more responsive streaming scroll
  const scrollToBottom = useCallback((smooth = true) => {
    const container = scrollContainerRef.current
    if (!container) return

    // Don't auto-scroll if user has manually scrolled up
    if (userHasScrolledRef.current) return

    // For non-smooth scroll (streaming), scroll immediately without RAF
    if (!smooth) {
      container.scrollTop = container.scrollHeight
      return
    }

    // For smooth scroll (new message), use RAF
    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    })
  }, [])

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Check if user is near bottom (within 100px)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100

    // If user scrolls away from bottom, mark as manually scrolled
    if (!isNearBottom) {
      userHasScrolledRef.current = true
    } else {
      // If user scrolls back to bottom, reset the flag
      userHasScrolledRef.current = false
    }
  }, [])

  // Auto-scroll when new messages arrive or during streaming
  useEffect(() => {
    const messageCount = assistantMessages.length

    // New message arrived - reset scroll flag and scroll to bottom
    if (messageCount > lastMessageCountRef.current) {
      userHasScrolledRef.current = false
      scrollToBottom(true)
    }

    lastMessageCountRef.current = messageCount
  }, [assistantMessages.length, scrollToBottom])

  // Auto-scroll during streaming generation
  // 🎭 v4.3: Also track content length changes for more responsive scrolling
  useEffect(() => {
    if (isGenerating && !userHasScrolledRef.current) {
      // Scroll immediately when content changes
      scrollToBottom(false)

      // Also keep the interval for safety
      const interval = setInterval(() => {
        scrollToBottom(false)
      }, 50) // Scroll every 50ms during streaming (was 100ms)

      return () => clearInterval(interval)
    }
  }, [isGenerating, scrollToBottom, lastMessageContent])

  // Handle quick action
  const handleQuickAction = useCallback((action: QuickAction) => {
    if (onQuickActionSelect) {
      onQuickActionSelect(action)
    } else if (onInputChange) {
      // Default: append action to input
      const newValue = inputValue ? `${inputValue} *${action.label}*` : `*${action.label}*`
      onInputChange(newValue)
    }
  }, [onQuickActionSelect, onInputChange, inputValue])

  // Handle send
  const handleSend = useCallback(async (message: string) => {
    if (onSendMessage) {
      await onSendMessage(message)
    }
  }, [onSendMessage])

  // Handle long press on send
  const handleLongPressSend = useCallback(() => {
    setRadialMenuOpen(true)
  }, [])

  // 🎭 v4.6: Memoized callback for opening radial menu
  const handleOpenRadialMenu = useCallback(() => {
    setRadialMenuOpen(true)
  }, [])

  // Radial menu actions
  const radialActions = useMemo(() => {
    return quickActions.map(action => ({
      id: action.id,
      label: action.label,
      icon: action.emoji,
      onClick: () => {
        handleQuickAction(action)
        setRadialMenuOpen(false)
      },
    }))
  }, [quickActions, handleQuickAction])

  const radialEmotions = useMemo(() => {
    return EMOTION_OPTIONS.map(emotion => ({
      id: emotion.id,
      label: emotion.label,
      icon: emotion.emoji,
      color: undefined,
      onClick: () => {
        setCurrentEmotion(emotion.id)
        setRadialMenuOpen(false)
      },
    }))
  }, [])

  // Convert actions for FloatingActionDrawer
  const drawerActions = useMemo(() => {
    return quickActions.map(action => ({
      id: action.id,
      emoji: action.emoji,
      label: action.label,
      onClick: () => handleQuickAction(action),
    }))
  }, [quickActions, handleQuickAction])

  const drawerEmotions = useMemo(() => {
    return EMOTION_OPTIONS.map(emotion => ({
      id: emotion.id,
      emoji: emotion.emoji,
      label: emotion.label,
      color: '#f5c542',
      onClick: () => setCurrentEmotion(emotion.id),
    }))
  }, [])

  return (
    <Box
      className={`immersive-chat-v2 ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      {...(isMobile ? swipeHandlers : {})}
    >
      {/* Dynamic Background - supports background assets with scene switching */}
      <DynamicBackground
        emotion={currentEmotion}
        intensity="medium"
        enableParticles={!isMobile}
        backgroundUrl={currentScene?.url || backgroundUrl}
      />

      {/* 🎭 v31: EmotionAtmosphere Particles - Enhanced visual feedback */}
      {enableEmotionAtmosphere && !isMobile && (
        <EmotionAtmosphereParticleLayer emotion={currentEmotion as AtmosphereEmotionType} />
      )}

      {/* Main Content Area - New Layout: Portrait LEFT, Messages RIGHT */}
      <Box
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          position: 'relative',
          zIndex: 1,
          overflow: 'hidden',
          minHeight: 0, // 关键：允许在flex容器中正确收缩
        }}
      >
        {/* LEFT: Character Portrait Panel (Desktop Only) - v4 with asset integration */}
        {!isMobile && character && (
          <CharacterPortraitPanelV4
            characterName={character.name}
            portraitUrl={portraitUrl}
            avatarUrl={character.avatar || character.generatedAvatar}
            currentEmotion={currentEmotion}
            bondExp={bondExp}
            isCollapsed={isPortraitCollapsed}
            onToggleCollapse={togglePortraitCollapse}
            onPortraitClick={onPortraitClick}
            isMobile={false}
            // v4.0: 素材系统
            sceneAssets={sceneAssets}
            currentScene={currentScene}
            onSceneChange={onSceneChange}
            suggestedScene={suggestedScene}
            expressionAssets={expressionAssets}
            onExpressionChange={onExpressionChange}
            cgAssets={cgAssets}
            newCGCount={newCGCount}
            onOpenAssetGallery={onOpenAssetGallery}
            assetStats={assetStats}
          />
        )}

        {/* RIGHT: Messages + Input Area */}
        <Box
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0, // Prevent flex item from overflowing
            minHeight: 0, // 关键：允许在flex容器中正确收缩
          }}
        >
          {/* Message List - Native scrolling with auto-scroll support */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="immersive-scroll"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: isMobile ? '1rem' : '1.5rem',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <Stack gap="md">
              <AnimatePresence mode="popLayout">
                {assistantMessages.map((message, index) => {
                  const isLastMessage = index === assistantMessages.length - 1
                  const isCurrentlyPlaying = isTTSPlaying && ttsCurrentMessageId === message.id

                  // 🎭 v29: 检测群聊消息格式 - 仅基于消息内容判断，不依赖当前UI状态
                  const isGroupChatMessage = mainCharacterInfo && groupMembers.length > 0 && isGroupMessage(message.content)

                  // 如果是群聊消息，使用 GroupMessageRenderer 渲染
                  if (isGroupChatMessage && mainCharacterInfo) {
                    return (
                      <Box key={message.id}>
                        <GroupMessageRenderer
                          content={message.content}
                          mainCharacter={mainCharacterInfo}
                          groupMembers={groupMembers}
                          immersiveMode={true}
                          isMobile={isMobile}
                        />
                      </Box>
                    )
                  }

                  return (
                    <ImmersiveMessageBubbleV2
                      key={message.id}
                      messageId={message.id}
                      role={message.role}
                      content={message.content}
                      characterName={character?.name || '角色'}
                      characterAvatar={character?.avatar || character?.generatedAvatar}
                      timestamp={message.createdAt}
                      isLastAssistantMessage={isLastMessage}
                      typewriterEnabled={isLastMessage}
                      immersiveEnabled={true}
                      onPlayTTS={onPlayTTS ? (msgId) => onPlayTTS(message.content, msgId) : undefined}
                      isTTSPlaying={isCurrentlyPlaying}
                    />
                  )
                })}
              </AnimatePresence>

              {/* Loading indicator */}
              {isGenerating && (
                <Box
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  <span className="animate-pulse">正在生成回复...</span>
                </Box>
              )}
            </Stack>
            {/* Scroll anchor for auto-scroll */}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions Bar */}
          <Box
            style={{
              padding: isMobile ? '0.5rem' : '0.75rem',
              background: theaterColors.glassBackground,
              borderTop: `1px solid ${theaterColors.glassBorder}`,
              flexShrink: 0, // 防止被压缩
            }}
          >
            {/* TTS Toggle + Quick Actions Row */}
            <Box style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* TTS Settings Popover - v4.4 */}
              <TTSSettingsPopover ttsEnabled={ttsEnabled} />

              {/* Quick Actions */}
              <Box style={{ flex: 1, minWidth: 0 }}>
                <ContextAwareQuickActions
                  messages={quickActionsMessages}
                  onActionSelect={handleQuickAction}
                  onOpenRadialMenu={handleOpenRadialMenu}
                  maxActions={isMobile ? 3 : 5}
                  isStreaming={isGenerating}
                />
              </Box>
            </Box>
          </Box>

          {/* Input Area - v13: 支持迷你输入条模式 */}
          {useMiniInputBar && !inputExpanded ? (
            <Box
              style={{
                padding: isMobile ? '8px 12px' : '12px 16px',
                paddingBottom: isMobile ? 'max(8px, env(safe-area-inset-bottom))' : '12px',
                flexShrink: 0, // 防止输入框被压缩
              }}
            >
              {/* v13 Status Bar */}
              <ImmersiveStatusBar
                status={currentStatus}
                message={error?.message}
                errorMessage={error?.message}
                cooldownSeconds={cooldownSeconds}
                onStopGeneration={onStopGeneration}
                onRetry={error?.canRetry ? onRetry : undefined}
                onExitImmersive={onExitImmersive}
                isVisible={currentStatus !== 'idle'}
                isMobile={isMobile}
                characterName={character?.name}
              />

              {/* v13 Mini Input Bar */}
              <MiniInputBar
                value={inputValue}
                onChange={onInputChange}
                onSend={handleSend}
                onExpand={handleExpandInput}
                onOpenDirector={onOpenDirectorPanel}
                onStopGeneration={onStopGeneration}
                isGenerating={isGenerating}
                isExpanded={inputExpanded}
                currentEmotion={currentEmotion}
                cooldownSeconds={cooldownSeconds}
                canSend={canSend}
                disabled={inputDisabled}
                characterName={character?.name}
                showDirectorButton={!!onOpenDirectorPanel}
                isMobile={isMobile}
              />
            </Box>
          ) : (
            <Box style={{ flexShrink: 0 }}>
              <MessageInputV2
                value={inputValue}
                onChange={onInputChange}
                onSend={handleSend}
                isLoading={isGenerating}
                disabled={inputDisabled}
                characterName={character?.name}
                currentEmotion={currentEmotion}
                onEmotionChange={setCurrentEmotion}
                activeDirectives={activeDirectives}
                onToggleDirective={onToggleDirective}
                onOpenDirectivePanel={onOpenDirectivePanel}
                onLongPressSend={handleLongPressSend}
                cooldownSeconds={cooldownSeconds}
                canSend={canSend}
                isPremium={isPremium}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* Radial Menu (Desktop) */}
      {!isMobile && (
        <RadialMenu
          isOpen={radialMenuOpen}
          onClose={() => setRadialMenuOpen(false)}
          onSelectAction={(action) => {
            // Convert RPG QuickAction to local QuickAction format
            handleQuickAction({
              id: action.id,
              emoji: action.emoji,
              label: action.text, // RPG uses 'text', we use 'label'
              category: action.category,
            })
          }}
          onSelectEmotion={(emotionId) => setCurrentEmotion(emotionId as EmotionType)}
        />
      )}

      {/* Mobile: Floating Action Drawer & Portrait Overlay */}
      {isMobile && (
        <>
          <FloatingActionDrawer
            isOpen={actionDrawerOpen}
            onClose={() => setActionDrawerOpen(false)}
            actions={drawerActions}
            emotions={drawerEmotions}
          />

          <PortraitOverlay
            characterName={character?.name || '角色'}
            avatarUrl={portraitUrl || character?.avatar || character?.generatedAvatar}
            isExpanded={portraitExpanded}
            onToggle={() => setPortraitExpanded(!portraitExpanded)}
            currentEmotion={currentEmotion}
          />

          {/* 🎭 v13: 手势提示 */}
          {showGestureHint && (
            <GestureHintToast
              isVisible={showGestureHint}
              message="上滑打开动作面板，右滑查看角色"
              onDismiss={onDismissGestureHint}
              autoDismiss={4000}
            />
          )}

          {/* 🎭 v13: 滑动方向指示器 */}
          {swipeDirection && (
            <SwipeIndicator
              direction={swipeDirection}
              progress={swipeProgress}
              isVisible={!!swipeDirection}
            />
          )}
        </>
      )}

      {/* 🎭 v4.0: CG Reveal - Full screen CG display for story moments */}
      <CGReveal
        cg={revealCG || null}
        isOpen={!!revealCG}
        onClose={() => onCloseCGReveal?.()}
        onOpenGallery={() => onOpenAssetGallery?.('cg')}
        isNewUnlock={true}
        characterName={character?.name}
      />
    </Box>
  )
}

export default memo(ImmersiveChatV2Container)
