/**
 * Message list component for displaying chat messages
 * 性能优化：useMemo 缓存格式化内容
 */

import { useState, useEffect, useRef, useMemo, memo, useCallback } from 'react'
import { Message } from '@sillytavern-clone/shared'
import { useChatStore } from '@/stores/chatStore'
import { useTTSStore, TTS_PLAY_MODES } from '@/stores/ttsStore'
import { getVoiceGender, EDGE_VOICES } from '@/lib/config/edge-voices'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { useTranslation } from '@/lib/i18n'
import { applyRegexScripts, getRegexScripts } from '@/lib/regexScriptStorage'
import { getActiveRegexScripts } from '@/lib/characterRegexStorage'
import { extractDialogueFromHTML, cleanTextForTTS } from '@/lib/tts/extractDialogue'
import { parseCGTags, getCGLayerStyles } from '@/lib/cgParser'
import { AudioVisualizer } from '@/components/tts/AudioVisualizer'
import IncompleteInteractionPrompt from './IncompleteInteractionPrompt'
import { stripReasoningBlocks, isStripReasoningEnabled } from '@/lib/stripReasoningBlocks'
import { replaceMessageVariables } from '@/lib/preset-application'
import { RichContentRenderer } from '@/components/greeting/RichContentRenderer'
import type { GreetingMessage } from '@/types/greeting'
import { migrateTTSRule } from '@/lib/migrations/migrate-tts-rule'
import { applyNarrativeStyles } from '@/lib/chat/narrativeStyler'
import { applyCustomTagStyles } from '@/lib/chat/customTagRenderer'
import ImmersiveMessageEnhancements from './ImmersiveMessageEnhancements'
import TypingIndicator, { TypingIndicatorWithProgress } from './TypingIndicator'
import MessageSkeleton, { GeneratingStatus } from './MessageSkeleton'
import ChatEmptyState from './ChatEmptyState'
import ChatErrorState, { type ErrorType } from './ChatErrorState'
import ChatOfflineState from './ChatOfflineState'
import type { ChoiceOption } from '@/lib/immersiveChat/types'
import type { SurpriseTrigger } from '@/lib/immersiveChat/intimacyConfig'
import type { SuggestedChoice, SceneContext } from '@/lib/storyProgression'
import { DEFAULT_SCENE_CONTEXT } from '@/lib/storyProgression'
// 🎬 v17.2 Director 系统
import DirectorPanel from './DirectorPanel'
import type { DirectorResult, DirectorChoice } from '@/lib/chat/directorTypes'
// 🎭 v16 NPC 生态系统
import NPCMessageBubble, { isNPCMessage, extractNPCInfo } from './NPCMessageBubble'
import type { NPCCategory, NPCAppearanceInfo } from '@/lib/npc/types'
// 🎭 v28 群聊消息渲染
import GroupMessageRenderer, { isGroupMessage } from './GroupMessageRenderer'
// 🎭 v22.0 Soul Theater 效果组件
import { EmotionAura, detectEmotionFromContent, getEmotionColors } from '@/components/effects'
import type { EmotionType } from '@/components/effects'
import {
  Box,
  Stack,
  Group,
  Avatar,
  Text,
  Menu,
  ActionIcon,
  Textarea,
  Button,
  Tooltip,
  Badge,
  Loader,
  Portal,
  Paper,
  Slider,
  SegmentedControl,
} from '@mantine/core'
import {
  IconCopy,
  IconRefresh,
  IconTrash,
  IconUser,
  IconRobot,
  IconEdit,
  IconDotsVertical,
  IconArrowDown,
  IconCheck,
  IconX,
  IconSquare,
  IconAlertCircle,
  IconPlayerPlay,
  IconPlayerPause,
  IconGenderFemale,
  IconGenderMale,
  IconBookmark,
  IconChevronDown,
  IconSettings,
} from '@tabler/icons-react'

// 🔧 TTS 规则自动迁移 (v11.1.1)
// 为现有用户自动添加 TTS 标签正则规则，仅执行一次
if (typeof window !== 'undefined') {
  try {
    migrateTTSRule()
  } catch (error) {
    console.error('[MessageList] TTS migration failed:', error)
  }
}

interface MessageListProps {
  className?: string
  messages?: Message[]
  isLoading?: boolean
  onEditMessage?: (messageId: string, newContent: string) => void
  onDeleteMessage?: (messageId: string) => void
  onRegenerateMessage?: (messageId: string) => void
  onRegenerateMessageAsBranch?: (messageId: string) => void
  onScrollToBottom?: () => void
  showIncompletePrompt?: boolean
  onContinueIncomplete?: () => void
  onDismissIncomplete?: () => void
  branchMode?: boolean
  onCancelBranchMode?: () => void
  onLoadMore?: () => void
  // 🎭 沉浸式对话功能
  immersiveModeEnabled?: boolean
  onChoiceSelect?: (choice: ChoiceOption, messageId: string) => void
  selectedChoices?: Record<string, string> // messageId -> choiceId
  // 📖 回忆录功能
  onBookmarkMessage?: (messageId: string, messageContent: string) => void
  // 🎉 羁绊事件持久化
  userId?: string | null
  onSurpriseTriggered?: (trigger: SurpriseTrigger, messageId: string, messageContent: string) => void
  intimacyLevel?: number // 亲密度等级
  // 🎬 剧情推进系统
  sceneContext?: SceneContext
  onStoryChoiceSelect?: (choice: SuggestedChoice, messageId: string) => void
  selectedStoryChoices?: Record<string, string> // messageId -> choiceId
  // 🎬 v17.2 Director 系统
  onDirectorChoiceSelect?: (choice: DirectorChoice, messageId: string) => void
  // 🎬 v20.5: Director 加载状态
  isDirectorLoading?: boolean
  // 🎭 v29: 群聊模式支持 - 只需要 activeNPCs 用于渲染群聊消息
  activeNPCs?: NPCAppearanceInfo[]
}

export default function MessageList({
  className = '',
  messages: propMessages,
  isLoading = false,
  onEditMessage,
  onDeleteMessage,
  onRegenerateMessage,
  onRegenerateMessageAsBranch,
  onScrollToBottom,
  showIncompletePrompt = false,
  onContinueIncomplete,
  onDismissIncomplete,
  branchMode = false,
  onCancelBranchMode,
  onLoadMore,
  // 🎭 沉浸式对话功能
  immersiveModeEnabled = false,
  onChoiceSelect,
  selectedChoices = {},
  // 📖 回忆录功能
  onBookmarkMessage,
  // 🎉 羁绊事件持久化
  userId,
  onSurpriseTriggered,
  intimacyLevel = 1,
  // 🎬 剧情推进系统
  sceneContext = DEFAULT_SCENE_CONTEXT,
  onStoryChoiceSelect,
  selectedStoryChoices = {},
  // 🎬 v17.2 Director 系统
  onDirectorChoiceSelect,
  // 🎬 v20.5: Director 加载状态
  isDirectorLoading = false,
  // 🎭 v29: 群聊模式支持 - 只需要 activeNPCs 用于渲染群聊消息
  activeNPCs = [],
}: MessageListProps) {
  const { currentChat, character, generationProgress, cancelGeneration, messages: storeMessages } = useChatStore()
  const { enabled: ttsEnabled, isPlaying, currentMessageId, play: playTTS, stop: stopTTS, voiceType, playMode, speed, setSpeed, setPlayMode, autoPlay, setAutoPlay } = useTTSStore()
  const { t } = useTranslation()

  // 获取当前语音的性别
  const currentVoiceGender = getVoiceGender(voiceType)

  // 🔧 修复: 添加 ref 追踪正在处理的 TTS 消息,防止重入
  const playingRef = useRef<string | null>(null)

  // Always prefer propMessages if provided, otherwise use store messages, then currentChat messages
  const rawMessages = propMessages !== undefined ? propMessages : (storeMessages || currentChat?.messages || [])

  // 去重消息数组 - 防止重复渲染（优化版：高性能去重）
  const messages = useMemo(() => {
    const seen = new Set<string>()
    const unique: Message[] = []

    rawMessages.forEach((msg: Message) => {
      if (!seen.has(msg.id)) {
        seen.add(msg.id)
        unique.push(msg)
      }
    })

    return unique
  }, [rawMessages])

  // 懒加载状态管理 - 修改: 初始显示更多消息 (50 条)
  const [visibleMessageCount, setVisibleMessageCount] = useState(50)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // 计算要显示的消息
  const displayedMessages = useMemo(() => {
    if (messages.length <= 50) {
      return messages
    }
    return messages.slice(-visibleMessageCount)
  }, [messages, visibleMessageCount])

  // 计算隐藏的消息数量
  const hiddenMessageCount = messages.length - displayedMessages.length

  // 重置可见消息数量当消息总数变化时
  useEffect(() => {
    if (messages.length <= 50) {
      setVisibleMessageCount(50)
    }
  }, [messages.length])

  // 性能优化：使用 useMemo 缓存临时AI消息检测
  const hasTempAI = useMemo(() =>
    Array.isArray(messages) && messages.some((m: Message) => typeof m.id === 'string' && m.id.startsWith('temp-ai-')),
    [messages]
  )

  // 🎭 v29: 准备所有NPC成员信息用于 GroupMessageRenderer
  // 重要：使用所有 activeNPCs，而不是当前选择的 groupMembers
  // 这样历史群聊消息可以正确渲染，不受当前选择状态影响
  const allNPCInfos = useMemo(() => {
    return activeNPCs
      .filter(appearance => appearance.npc && appearance.npc.id && appearance.npc.name)
      .map(appearance => ({
        id: appearance.npc!.id,
        name: appearance.npc!.name,
        avatar: appearance.npc!.avatar || null,
        isMainCharacter: false,
      }))
  }, [activeNPCs])

  // 🎭 v28: 主角色信息
  const mainCharacterInfo = useMemo(() => {
    if (!character) return null
    return {
      id: character.id,
      name: character.name,
      avatar: (character as any).coverUrl || character.avatar || null,
      isMainCharacter: true,
    }
  }, [character])

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  // 🎭 沉浸模式：折叠用户消息状态
  const [expandedUserMessages, setExpandedUserMessages] = useState<Set<string>>(new Set())

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false)
  // Reduced motion preference detection
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    const handleMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handleMotionChange)

    return () => {
      window.removeEventListener('resize', checkMobile)
      mediaQuery.removeEventListener('change', handleMotionChange)
    }
  }, [])

  // TTS cleanup on unmount
  useEffect(() => {
    return () => {
      // 组件卸载时停止播放，防止内存泄漏
      stopTTS()
    }
  }, [stopTTS])

  // Mobile action sheet state
  const [mobileActionMessage, setMobileActionMessage] = useState<Message | null>(null)
  const [showMobileActions, setShowMobileActions] = useState(false)

  // Long press detection
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pressStartPos = useRef<{ x: number, y: number } | null>(null)
  const [pressingMessageId, setPressingMessageId] = useState<string | null>(null)

  // Smart timestamp display - only show if role changes or >5 minutes passed
  const shouldShowTimestamp = (currentMsg: Message, prevMsg?: Message) => {
    if (!prevMsg) return true
    if (currentMsg.role !== prevMsg.role) return true

    const timeDiff = new Date(currentMsg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime()
    return timeDiff > 5 * 60 * 1000 // 5 minutes
  }

  // 性能优化：使用 useCallback 缓存事件处理器
  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content)
    toast.success(t('chat.message.copied'), { duration: 1000 })
  }, [t])

  // Double click to copy
  const handleDoubleClick = useCallback((message: Message) => {
    handleCopyMessage(message.content)
  }, [handleCopyMessage])

  // Long press handlers for mobile
  const handleTouchStart = (e: React.TouchEvent, message: Message) => {
    if (!isMobile) return

    const touch = e.touches[0]
    pressStartPos.current = { x: touch.clientX, y: touch.clientY }

    // 立即显示视觉反馈
    setPressingMessageId(message.id)

    pressTimerRef.current = setTimeout(() => {
      setMobileActionMessage(message)
      setShowMobileActions(true)
      setPressingMessageId(null)
      // Haptic feedback if supported
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pressStartPos.current) return

    const touch = e.touches[0]
    const deltaX = Math.abs(touch.clientX - pressStartPos.current.x)
    const deltaY = Math.abs(touch.clientY - pressStartPos.current.y)

    // Cancel long press if moved too much
    if (deltaX > 10 || deltaY > 10) {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current)
        pressTimerRef.current = null
      }
      setPressingMessageId(null)
    }
  }

  const handleTouchEnd = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
    pressStartPos.current = null
    setPressingMessageId(null)
  }

  const closeMobileActions = () => {
    setShowMobileActions(false)
    setMobileActionMessage(null)
  }

  const handleStartEdit = useCallback((message: Message) => {
    setEditingMessageId(message.id)
    setEditContent(message.content)
    closeMobileActions()
  }, [])

  const handleSaveEdit = useCallback(() => {
    if (editingMessageId && editContent.trim()) {
      if (onEditMessage) {
        onEditMessage(editingMessageId, editContent)
      }
      setEditingMessageId(null)
      setEditContent('')
    }
  }, [editingMessageId, editContent, onEditMessage])

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null)
    setEditContent('')
  }, [])

  // 🎭 沉浸模式：切换用户消息展开/折叠状态
  const toggleUserMessage = useCallback((messageId: string) => {
    setExpandedUserMessages(prev => {
      const next = new Set(prev)
      if (next.has(messageId)) {
        next.delete(messageId)
      } else {
        next.add(messageId)
      }
      return next
    })
  }, [])

  const handleDeleteMessage = useCallback((messageId: string) => {
    closeMobileActions()
    if (confirm(t('chat.message.deleteConfirm'))) {
      if (onDeleteMessage) {
        onDeleteMessage(messageId)
      } else {
        toast(t('chat.message.deleteInDev'))
      }
    }
  }, [onDeleteMessage, t])

  const handleRegenerateMessage = useCallback(async (messageId: string) => {
    closeMobileActions()
    if (onRegenerateMessage) {
      onRegenerateMessage(messageId)
    } else {
      toast(t('chat.message.regenerateInDev'))
    }
  }, [onRegenerateMessage, t])

  const handleRegenerateMessageAsBranch = useCallback(async (messageId: string) => {
    closeMobileActions()
    if (onRegenerateMessageAsBranch) {
      onRegenerateMessageAsBranch(messageId)
    } else {
      toast('分支重生成功能开发中')
    }
  }, [onRegenerateMessageAsBranch])

  // 📖 收藏消息到回忆录
  const handleBookmarkMessage = useCallback((message: Message) => {
    closeMobileActions()
    if (onBookmarkMessage) {
      onBookmarkMessage(message.id, message.content)
      toast.success('已收藏到回忆录', { duration: 2000 })
    } else {
      toast('回忆录功能未启用')
    }
  }, [onBookmarkMessage])

  // 🔧 修复: 计算 activeScripts 并作为依赖
  const activeScripts = useMemo(() => {
    const globalScripts = getRegexScripts()
    return getActiveRegexScripts(character?.id, globalScripts)
  }, [character?.id])

  // 性能优化：缓存消息格式化内容的函数
  const createFormatMessageContent = useMemo(() => {
    // 创建一个缓存 Map
    const cache = new Map<string, string>()
    const enableDisplayDedupe = process.env.NEXT_PUBLIC_ENABLE_DISPLAY_DEDUPLICATION === 'true'

    // 简单相似度：基于词集合的 Jaccard（用于相邻段落折叠）
    const similarity = (a: string, b: string): number => {
      const tokenize = (s: string) => Array.from(new Set(s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean)))
      const ta = tokenize(a)
      const tb = tokenize(b)
      if (ta.length === 0 && tb.length === 0) return 1
      const sa = new Set(ta)
      const sb = new Set(tb)
      let inter = 0
      for (const w of sa) if (sb.has(w)) inter++
      const union = sa.size + sb.size - inter
      return union === 0 ? 0 : inter / union
    }

    const foldAdjacentRepeats = (text: string): string => {
      const paragraphs = text.split(/\n{2,}/)
      const kept: string[] = []
      const TH = 0.95
      for (const p of paragraphs) {
        const last = kept.length > 0 ? kept[kept.length - 1] : ''
        if (last && similarity(last, p) >= TH) {
          // 跳过高度相似的相邻段落
          continue
        }
        kept.push(p)
      }
      return kept.join('\n\n')
    }

    return (content: string, isUser: boolean = false) => {
      // Create cache key that includes character ID for character-specific regex
      const cacheKey = `${content}:${character?.id || 'none'}:${isUser}`

      // 检查缓存
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey)!
      }

      // Parse CG tags if GAL mode is enabled (only for assistant messages)
      let contentToFormat = content
      let cgLayersHTML = ''

      // 0️⃣ 首先替换模板变量 {{user}}, {{char}} 等
      contentToFormat = replaceMessageVariables(contentToFormat, character?.name)

      // 先进行推理块清洗（仅助手消息，且受设置控制）
      try {
        if (!isUser && isStripReasoningEnabled() && typeof contentToFormat === 'string') {
          contentToFormat = stripReasoningBlocks(contentToFormat)
        }
      } catch { }

      if (!isUser && character?.galModeEnabled) {
        const { cleanedContent, layers } = parseCGTags(contentToFormat)
        contentToFormat = cleanedContent

        // Generate CG layers HTML
        if (layers.length > 0) {
          cgLayersHTML = '<div class="cg-layers-container" style="position: absolute; inset: 0; pointer-events: none; z-index: 0;">'
          layers.forEach((layer, index) => {
            const styles = getCGLayerStyles(layer)
            const styleString = Object.entries(styles)
              .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
              .join('; ')
            cgLayersHTML += `<div class="cg-layer cg-layer-${layer.layer}" style="${styleString}"></div>`
          })
          cgLayersHTML += '</div>'
        }
      }

      // 可选：显示层相邻重复段落折叠（仅助手消息）
      if (!isUser && enableDisplayDedupe) {
        contentToFormat = foldAdjacentRepeats(contentToFormat)
      }

      // ✅ 第一步：先应用 regex scripts（处理原始文本，包括特殊标签）
      // 🔧 修复: 使用外部 useMemo 计算的 activeScripts
      let formatted = applyRegexScripts(contentToFormat, activeScripts)

      // ✅ 第 1.5 步：应用叙事样式化（识别对话/动作/心理等）
      // 🎨 v14.1.0: 自动为引号、星号、括号等格式添加颜色
      if (!isUser) {
        formatted = applyNarrativeStyles(formatted)
      }

      // ✅ 第二步：再替换换行符为 <br />
      // 🔧 v20.3: 折叠连续的多个换行为 1 个，段落间无空行，更紧凑
      formatted = formatted
        .replace(/\n{2,}/g, '\n')  // 2个及以上换行折叠为1个
        .replace(/\n/g, '<br />')

      // ✅ 第三步：最后应用标题格式化（Markdown 风格）
      formatted = formatted
        .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold text-blue-300 mt-4 mb-2">$1</h3>')
        .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-purple-300 mt-4 mb-2">$1</h2>')
        .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-purple-400 mt-4 mb-2">$1</h1>')

      // ✅ 第四步：内容类型标签样式化（对话/心理/场景）
      // 使用柔和的颜色，不添加字体样式变化，保持自然阅读体验
      // 💬 对话 - 柔和暖白，自然突出
      formatted = formatted.replace(
        /<dialogue>([\s\S]*?)<\/dialogue>/gi,
        '<span class="content-dialogue" style="color: #e8dcc8;">$1</span>'
      )
      // 兼容旧版 tts 标签
      formatted = formatted.replace(
        /<tts>([\s\S]*?)<\/tts>/gi,
        '<span class="content-dialogue" style="color: #e8dcc8;">$1</span>'
      )
      // 💭 心理活动 - 柔和灰紫，内敛感
      formatted = formatted.replace(
        /<thought>([\s\S]*?)<\/thought>/gi,
        '<span class="content-thought" style="color: #cdc4d8;">$1</span>'
      )
      // 🎬 场景描写 - 柔和灰青，氛围感
      formatted = formatted.replace(
        /<scene>([\s\S]*?)<\/scene>/gi,
        '<span class="content-scene" style="color: #b8ccd4;">$1</span>'
      )

      // ✅ 第 4.5 步：应用自定义标签样式（角色卡专用标签）
      // 🎮 v20.3: 支持 <mainbody>, <statusbar>, <faction>, <quests>, <map> 等标签
      if (!isUser) {
        formatted = applyCustomTagStyles(formatted)
      }

      // ✅ 第 4.6 步：处理 TTS 相关的 span 标签（角色卡常用格式）
      // 🎭 v17.1: 支持 <span class="tts-scene">, <span class="tts-thought">, <span class="tts-dialogue"> 等
      if (!isUser) {
        // tts-scene -> 场景描写样式
        formatted = formatted.replace(
          /<span\s+class\s*=\s*["']tts-scene["']\s*>/gi,
          '<span class="content-scene" style="color: #b8ccd4; font-style: italic;">'
        )
        // tts-thought -> 心理活动样式
        formatted = formatted.replace(
          /<span\s+class\s*=\s*["']tts-thought["']\s*>/gi,
          '<span class="content-thought" style="color: #cdc4d8;">'
        )
        // tts-dialogue -> 对话样式
        formatted = formatted.replace(
          /<span\s+class\s*=\s*["']tts-dialogue["']\s*>/gi,
          '<span class="content-dialogue" style="color: #e8dcc8;">'
        )
        // text-sfx -> 音效/动作样式
        formatted = formatted.replace(
          /<span\s+class\s*=\s*["']text-sfx["']\s*>/gi,
          '<span class="content-action" style="color: #a8c8d8; font-style: italic;">'
        )
      }

      // ✅ 第五步：如果有CG图层，包裹在容器中
      if (cgLayersHTML) {
        formatted = cgLayersHTML + '<div style="position: relative; z-index: 4;">' + formatted + '</div>'
      }

      // 存入缓存
      cache.set(cacheKey, formatted)

      // 限制缓存大小（最多 100 条）
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value
        if (firstKey !== undefined) {
          cache.delete(firstKey)
        }
      }

      return formatted
    }
  }, [character?.id, character?.galModeEnabled, activeScripts])  // 🔧 修复: 添加 activeScripts 依赖

  const formatMessageContent = createFormatMessageContent

  // TTS 播放处理
  const handlePlayTTS = useCallback(async (message: Message) => {
    if (!ttsEnabled) {
      toast.error('TTS 功能未启用')
      return
    }

    // 只播放 AI 助手的消息
    if (message.role !== 'assistant') {
      toast.error('只能播放角色卡的对话内容')
      return
    }

    // 🔧 修复: 防止重入,如果正在处理同一条消息,直接返回
    if (playingRef.current === message.id) {
      console.log('[TTS] 已在处理此消息,忽略重复点击')
      return
    }

    try {
      playingRef.current = message.id

      // 🔧 修复: 使用 getState() 获取最新状态，避免闭包陷阱
      const { isPlaying: currentlyPlaying, currentMessageId: currentId } = useTTSStore.getState()

      // 如果正在播放同一条消息，则停止
      if (currentlyPlaying && currentId === message.id) {
        stopTTS()
        playingRef.current = null
        return
      }

      // 🔍 调试日志1: 原始消息内容
      console.log('[TTS Debug] 原始消息内容:', message.content.substring(0, 200))

      // 提取对话文本
      // 🔧 v11.1.1: 传入原始内容作为降级方案，即使正则规则缺失也能提取 <tts> 标签
      const formattedHTML = formatMessageContent(message.content, false)

      // 🔍 调试日志2: 格式化后的HTML
      console.log('[TTS Debug] 格式化HTML:', formattedHTML.substring(0, 200))

      const textContent = extractDialogueFromHTML(formattedHTML, message.content, playMode)

      // 🔍 调试日志3: 提取的对话文本
      console.log('[TTS Debug] 提取的对话文本:', textContent, '播放模式:', playMode)

      if (!textContent) {
        toast.error('消息中没有可播放的对话内容')
        playingRef.current = null
        return
      }

      // 🔍 调试日志4: 准备调用playTTS
      console.log('[TTS Debug] 准备调用 playTTS:', { messageId: message.id, textLength: textContent.length, voiceType })

      // 🔧 v2.5: 移除自动性别检测覆盖逻辑
      // 用户在向导中已选择语音（自动匹配或手动选择），应该尊重用户的选择
      // 不再根据角色 orientation/tags 覆盖用户设置

      await playTTS(textContent, message.id)
    } catch (error) {
      console.error('TTS播放失败:', error)
      // 🔧 修复: 过滤 interrupted 错误，不显示错误提示
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (!errorMessage.includes('interrupted')) {
        toast.error('语音播放失败，请检查TTS服务配置')
      }
    } finally {
      playingRef.current = null
    }
  }, [ttsEnabled, stopTTS, playTTS, formatMessageContent, playMode])

  // 加载更多消息 - 修改: 每次加载 50 条
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || hiddenMessageCount === 0) return

    setIsLoadingMore(true)

    // 模拟加载延迟
    setTimeout(() => {
      setVisibleMessageCount(prev => Math.min(prev + 50, messages.length))
      setIsLoadingMore(false)

      // 通知父组件
      if (onLoadMore) {
        onLoadMore()
      }
    }, 300)
  }, [isLoadingMore, hiddenMessageCount, messages.length, onLoadMore])

  if (messages.length === 0 && !isLoading) {
    return (
      <Stack
        className={className}
        justify="flex-end"
        style={{
          flex: 1,
          overflow: 'visible !important' as any,
          overflowY: 'visible !important' as any,
          overflowX: 'hidden',
          minHeight: 0,
          maxHeight: 'none',
        }}
      >
        <Box style={{ flex: 1 }} />
        <ChatEmptyState
          hasCharacter={!!character}
          characterName={character?.name}
          characterAvatar={character?.avatar}
          characterDescription={character?.description}
          suggestedStarters={character?.firstMessage ? [character.firstMessage] : undefined}
          onSuggestionClick={(suggestion) => {
            // 可以通过 props 传递发送消息的回调
            console.log('Suggestion clicked:', suggestion)
          }}
          onSelectCharacter={() => {
            // 导航到角色选择页面
            if (typeof window !== 'undefined') {
              window.location.href = '/characters'
            }
          }}
        />
      </Stack>
    )
  }

  return (
    <Stack
      className={`${className} mobile-safe-container`}
      gap={0}
      style={{
        flex: 1,
        width: '100%',
        maxWidth: '100%',
        overflow: 'visible !important' as any,
        overflowY: 'visible !important' as any,
        overflowX: 'hidden',
        minHeight: 0,
        maxHeight: 'none',
      }}
    >
      {/* Spacer to push messages to bottom */}
      <Box style={{ flex: 1 }} />

      {/* Branch Mode Banner */}
      {branchMode && (
        <Box
          px={{ base: 'sm', sm: 'md' }}
          py="xs"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderBottom: '2px solid rgba(59, 130, 246, 0.5)',
          }}
        >
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <IconAlertCircle size={20} color="rgb(59, 130, 246)" />
              <Text size="sm" fw={500} c="blue">
                分支模式：将鼠标悬停在AI消息上，点击右上角的刷新按钮 🔄 创建分支
              </Text>
            </Group>
            <Button
              size="xs"
              variant="light"
              color="gray"
              onClick={onCancelBranchMode}
            >
              取消
            </Button>
          </Group>
        </Box>
      )}

      {/* Hidden Messages Indicator - 改进: 更明显的提示 */}
      {hiddenMessageCount > 0 && (
        <Box px={{ base: 'sm', sm: 'md' }} py="sm">
          <Button
            variant="light"
            color="blue"
            size="md"
            fullWidth
            onClick={handleLoadMore}
            loading={isLoadingMore}
            leftSection={isLoadingMore ? null : <IconAlertCircle size={18} />}
            styles={{
              root: {
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                border: '2px solid rgba(59, 130, 246, 0.4)',
                '&:hover': {
                  backgroundColor: 'rgba(59, 130, 246, 0.25)',
                  borderColor: 'rgba(59, 130, 246, 0.6)',
                },
                transition: 'all 0.2s ease',
              },
            }}
          >
            {isLoadingMore ? '加载中...' : `📜 加载更早的 ${hiddenMessageCount} 条消息`}
          </Button>
        </Box>
      )}

      <Stack
        gap="md"
        px={{ base: '8px', sm: 'md' }}
        py="xs"
        role="log"
        aria-live="polite"
        aria-label="聊天消息列表"
        style={{
          width: '100%',
          maxWidth: '100%',
          overflow: 'visible !important' as any,
          overflowY: 'visible !important' as any,
          overflowX: 'hidden',
        }}
      >
        {displayedMessages.map((message: Message, index: number) => {
          const isUser = message.role === 'user'
          const isEditing = editingMessageId === message.id
          const previousMessage = displayedMessages[index - 1]
          const showAvatar = index === 0 || previousMessage?.role !== message.role
          const showTimestamp = shouldShowTimestamp(message, previousMessage)

          // 🎭 v22.0: Emotion detection for Soul Theater effects
          const emotion: EmotionType = !isUser ? detectEmotionFromContent(message.content) : 'neutral'
          const emotionColors = getEmotionColors(emotion)

          // Message status
          const messageStatus = message.metadata?.status
          const isSending = messageStatus === 'sending'
          const isFailed = messageStatus === 'failed'
          const isGenerating = messageStatus === 'generating' || message.id.startsWith('temp-ai-')
          const avatarSize = isMobile ? 32 : 40
          const messagePadding = isMobile ? 'sm' : 'lg'

          // 🎭 v16: NPC 消息检测
          const isNPC = !isUser && isNPCMessage(message as any)
          const npcInfo = isNPC ? extractNPCInfo(message as any) : null

          // 如果是 NPC 消息，使用专门的 NPC 气泡渲染
          if (isNPC && npcInfo) {
            return (
              <Box key={message.id} style={{ width: '100%' }}>
                {showTimestamp && (
                  <Text size="xs" c="dimmed" ta="center" py="xs">
                    {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                  </Text>
                )}
                <NPCMessageBubble
                  content={message.content}
                  npcName={npcInfo.npcName || undefined}
                  npcCategory={(npcInfo.npcCategory as NPCCategory) || 'ordinary'}
                  timestamp={message.timestamp}
                />
              </Box>
            )
          }

          // 🎭 v29: 群聊消息检测 - 仅基于消息内容判断，不依赖当前UI状态
          // 这样历史群聊消息始终能正确显示，不受当前选择状态影响
          const isGroupChatMessage = !isUser && mainCharacterInfo && allNPCInfos.length > 0 && isGroupMessage(message.content)

          // 如果是群聊消息，使用 GroupMessageRenderer 渲染
          if (isGroupChatMessage && mainCharacterInfo) {
            return (
              <Box key={message.id} style={{ width: '100%' }}>
                {showTimestamp && (
                  <Text size="xs" c="dimmed" ta="center" py="xs">
                    {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                  </Text>
                )}
                <GroupMessageRenderer
                  content={message.content}
                  mainCharacter={mainCharacterInfo}
                  groupMembers={allNPCInfos}
                  immersiveMode={immersiveModeEnabled}
                  isMobile={isMobile}
                  formatContent={(content) => formatMessageContent(content, false)}
                />
              </Box>
            )
          }

          return (
            <Group
              key={message.id}
              justify={isUser ? 'flex-end' : 'flex-start'}
              align="flex-start"
              wrap="nowrap"
              className={`group message-enter ${isSending ? 'message-sending' : ''}`}
              style={{ width: '100%', maxWidth: '100%' }}
            >
              <Group
                align="flex-start"
                gap={isMobile ? 'xs' : 'sm'}
                maw={{ base: '90%', sm: '85%', md: '80%' }}
                style={{
                  flexDirection: isUser ? 'row-reverse' : 'row',
                  maxWidth: '100%',
                }}
              >
                {/* Avatar with EmotionAura for AI messages */}
                {showAvatar && (
                  isUser ? (
                    <Avatar
                      size={avatarSize}
                      radius="xl"
                      color="blue"
                      style={{
                        flexShrink: 0,
                        marginLeft: isMobile ? '0.5rem' : '0.75rem',
                      }}
                    >
                      <IconUser size={16} />
                    </Avatar>
                  ) : (
                    <EmotionAura
                      emotion={emotion}
                      size={avatarSize}
                      intensity={emotion === 'neutral' ? 'subtle' : 'medium'}
                      animated={!isGenerating}
                    >
                      <Avatar
                        size={avatarSize}
                        radius="xl"
                        color="gray"
                        style={{
                          flexShrink: 0,
                          marginRight: isMobile ? '0.5rem' : '0.75rem',
                          border: `2px solid ${emotionColors.primary}`,
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {(character as any)?.coverUrl || character?.avatar ? (
                          <img
                            src={(character as any)?.coverUrl || character?.avatar}
                            alt={character?.name || 'Character'}
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                            loading="lazy"
                          />
                        ) : (
                          <IconRobot size={16} />
                        )}
                      </Avatar>
                    </EmotionAura>
                  )
                )}

                {/* Message Content */}
                <Stack
                  gap="xs"
                  style={{
                    flex: 1,
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    overflow: 'visible !important' as any,
                    overflowY: 'visible !important' as any,
                    minWidth: 0,
                  }}
                >
                  {/* Message Header with Emotion Indicator */}
                  {showTimestamp && (
                    <Group
                      gap="xs"
                      style={{
                        flexDirection: isUser ? 'row-reverse' : 'row',
                      }}
                    >
                      <Text
                        size={isMobile ? 'xs' : 'sm'}
                        fw={600}
                        style={{
                          color: isUser ? 'var(--accent-gold-hex)' : emotionColors.primary.replace('0.6', '1'),
                          textShadow: !isUser && emotion !== 'neutral' ? `0 0 12px ${emotionColors.glow}` : 'none',
                          letterSpacing: '0.02em',
                        }}
                      >
                        {isUser ? t('chat.you') || '你' : character?.name || t('chat.status.character')}
                      </Text>
                      {/* Emotion Icon for AI messages */}
                      {!isUser && emotion !== 'neutral' && (() => {
                        const emotionConfig: Record<string, { icon: string; label: string }> = {
                          happy: { icon: '✨', label: '开心' },
                          joy: { icon: '✨', label: '愉悦' },
                          love: { icon: '💗', label: '爱意' },
                          affection: { icon: '💗', label: '深情' },
                          shy: { icon: '///', label: '害羞' },
                          embarrassed: { icon: '///', label: '尴尬' },
                          angry: { icon: '💢', label: '生气' },
                          sad: { icon: '💧', label: '难过' },
                          melancholy: { icon: '💧', label: '忧郁' },
                          surprised: { icon: '❗', label: '惊讶' },
                          shocked: { icon: '❗', label: '震惊' },
                          excited: { icon: '⚡', label: '兴奋' },
                          energetic: { icon: '⚡', label: '充满活力' },
                          smug: { icon: '😏', label: '得意' },
                          confident: { icon: '😏', label: '自信' },
                          thinking: { icon: '🤔', label: '思考中' },
                          curious: { icon: '🤔', label: '好奇' },
                        }
                        const config = emotionConfig[emotion]
                        if (!config) return null
                        return (
                          <span
                            role="img"
                            aria-label={`角色情绪: ${config.label}`}
                            style={{
                              fontSize: '0.75rem',
                              animation: prefersReducedMotion ? 'none' : 'pulse 2s ease-in-out infinite',
                            }}
                          >
                            {config.icon}
                          </span>
                        )
                      })()}
                      <Text size="xs" c="dimmed">
                        {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                      </Text>
                    </Group>
                  )}

                  {/* Message Bubble with Theater Styling */}
                  <Box
                    style={{
                      position: 'relative',
                      transform: pressingMessageId === message.id ? 'scale(0.98)' : 'scale(1)',
                      transition: prefersReducedMotion ? 'none' : 'transform 0.15s ease-out',
                    }}
                    className={`message-appear message-hover group message-bubble perf-will-change-opacity perf-gpu-accelerated ${isUser ? 'message-bubble-user' : 'message-bubble-ai'} ${prefersReducedMotion ? 'reduced-motion' : ''}`}
                    onDoubleClick={() => !isMobile && handleDoubleClick(message)}
                    onTouchStart={(e) => handleTouchStart(e, message)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <Box
                      p={messagePadding}
                      style={{
                        position: 'relative',
                        borderRadius: isUser
                          ? (isMobile ? '16px 6px 16px 16px' : '20px 6px 20px 20px')
                          : (isMobile ? '6px 16px 16px 16px' : '6px 20px 20px 20px'),
                        background: isUser
                          ? 'linear-gradient(135deg, rgba(245, 197, 66, 0.12) 0%, rgba(245, 197, 66, 0.04) 100%)'
                          : `linear-gradient(135deg, rgba(26, 20, 41, 0.85) 0%, rgba(20, 15, 32, 0.9) 100%)`,
                        color: isUser ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        border: pressingMessageId === message.id
                          ? (isUser ? '2px solid rgba(245, 197, 66, 0.8)' : '2px solid rgba(139, 92, 246, 0.6)')
                          : (isUser ? '1px solid rgba(245, 197, 66, 0.4)' : `1px solid ${emotionColors.secondary}`),
                        borderLeft: !isUser ? `3px solid ${emotionColors.primary}` : undefined,
                        borderRight: isUser ? '3px solid rgba(245, 197, 66, 0.4)' : undefined,
                        backdropFilter: 'blur(16px)',
                        boxShadow: pressingMessageId === message.id
                          ? (isUser
                              ? '0 6px 24px rgba(245, 197, 66, 0.3), 0 0 0 2px rgba(245, 197, 66, 0.2)'
                              : '0 6px 24px rgba(139, 92, 246, 0.3), 0 0 0 2px rgba(139, 92, 246, 0.2)')
                          : (isUser
                              ? '0 4px 20px rgba(245, 197, 66, 0.15)'
                              : `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 24px ${emotionColors.glow}`),
                        transition: prefersReducedMotion ? 'none' : 'all 0.15s ease-out',
                        opacity: isSending ? 0.6 : 1,
                      }}
                    >
                      {isEditing ? (
                        <Stack gap="sm">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.currentTarget.value)}
                            minRows={4}
                            autosize
                            placeholder={t('chat.message.editPlaceholder')}
                            autoFocus
                            styles={{
                              input: {
                                backgroundColor: 'hsl(var(--bg-card))',
                                borderColor: 'var(--border-muted)',
                                color: 'hsl(var(--text-primary))',
                                '&:focus': {
                                  borderColor: 'var(--accent-gold-hex)',
                                  boxShadow: 'var(--shadow-rose-gold)',
                                },
                              },
                            }}
                          />
                          <Group gap="xs">
                            <Button
                              size="sm"
                              leftSection={<IconCheck size={14} />}
                              onClick={handleSaveEdit}
                              variant="gradient"
                              gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                            >
                              {t('chat.message.save')}
                            </Button>
                            <Button
                              size="sm"
                              variant="light"
                              color="gray"
                              leftSection={<IconX size={14} />}
                              onClick={handleCancelEdit}
                            >
                              {t('chat.message.cancel')}
                            </Button>
                          </Group>
                        </Stack>
                      ) : (
                        <>
                          {/* 🎭 沉浸模式：用户消息折叠气泡 */}
                          {immersiveModeEnabled && isUser ? (
                            <Box
                              onClick={() => toggleUserMessage(message.id)}
                              style={{
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                maxWidth: expandedUserMessages.has(message.id) ? '100%' : '200px',
                              }}
                            >
                              <Group gap="xs" wrap="nowrap">
                                <IconUser size={14} style={{ flexShrink: 0, color: 'rgba(245, 197, 66, 0.8)' }} />
                                <Text
                                  size="sm"
                                  style={{
                                    flex: 1,
                                    whiteSpace: expandedUserMessages.has(message.id) ? 'pre-wrap' : 'nowrap',
                                    overflow: expandedUserMessages.has(message.id) ? 'visible' : 'hidden',
                                    textOverflow: expandedUserMessages.has(message.id) ? 'clip' : 'ellipsis',
                                    wordBreak: expandedUserMessages.has(message.id) ? 'break-word' : 'normal',
                                    transition: 'all 0.3s ease',
                                    color: 'rgba(255, 255, 255, 0.9)',
                                  }}
                                >
                                  {message.content}
                                </Text>
                                <IconChevronDown
                                  size={14}
                                  style={{
                                    flexShrink: 0,
                                    transform: expandedUserMessages.has(message.id) ? 'rotate(180deg)' : 'rotate(0)',
                                    transition: 'transform 0.2s ease',
                                    color: 'rgba(245, 197, 66, 0.6)',
                                  }}
                                />
                              </Group>
                            </Box>
                          ) : (
                            <>
                              {/* 富媒体开场白渲染 - 仅第一条助手消息且角色启用了富媒体开场白 */}
                              {index === 0 && !isUser && character?.greetingStyleEnabled ? (
                                <Box style={{ width: '100%' }}>
                                  <RichContentRenderer
                                    greeting={{
                                      id: `greeting-${message.id}`,
                                      characterId: character.id,
                                      content: message.content,
                                      // ✅ v17.1: 增强 HTML 检测，支持更多标签类型
                                      contentType: /^<(?:div|style|span|p|h[1-6]|ul|ol|li|br|strong|em|button|a)\b/i.test(message.content.trim()) ||
                                        message.content.includes('<div') ||
                                        message.content.includes('<style') ||
                                        message.content.includes('<span class=') ? 'html' : 'text',
                                      stylePreset: character.greetingStylePreset || 'classic',
                                      metadata: {},
                                      isDefault: true,
                                      usageCount: 0,
                                      createdAt: new Date(message.timestamp),
                                      updatedAt: new Date(message.timestamp)
                                    } as GreetingMessage}
                                    enableInteractions={false}
                                  />
                                </Box>
                              ) : (
                                /* 普通消息渲染 */
                                <div
                                  className="text-safe"
                                  style={{
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                    maxWidth: '100%',
                                    fontSize: '1rem',
                                    lineHeight: '1.75',
                                    position: 'relative',
                                  }}
                                  dangerouslySetInnerHTML={{
                                    __html: formatMessageContent(message.content, isUser)
                                  }}
                                />
                              )}
                            </>
                          )}
                        </>
                      )}

                      {/* 🎭 沉浸式对话增强 - 交互选项、情绪标签等 */}
                      {immersiveModeEnabled && !isUser && !isEditing && (
                        <ImmersiveMessageEnhancements
                          content={message.content}
                          messageId={message.id}
                          isAssistant={!isUser}
                          enabled={immersiveModeEnabled}
                          characterId={character?.id}
                          characterName={character?.name}
                          selectedChoiceId={selectedChoices[message.id]}
                          intimacyLevel={intimacyLevel}
                          messageCount={index}
                          onChoiceSelect={onChoiceSelect}
                          onSurpriseTriggered={(trigger) => {
                            onSurpriseTriggered?.(trigger, message.id, message.content)
                          }}
                          sceneContext={sceneContext}
                          onStoryChoiceSelect={onStoryChoiceSelect ? (choice) => onStoryChoiceSelect(choice, message.id) : undefined}
                          selectedStoryChoiceId={selectedStoryChoices[message.id]}
                          isLatestMessage={index === displayedMessages.length - 1}
                        />
                      )}

                      {/* 🎬 v17.2 Director 面板 - 剧情建议（从 metadata 读取） */}
                      {!isUser && !isEditing && (() => {
                        const isLatestMessage = index === displayedMessages.length - 1
                        // 解析 metadata 中的 director 数据
                        const metadata = message.metadata
                          ? (typeof message.metadata === 'string'
                              ? JSON.parse(message.metadata)
                              : message.metadata)
                          : null
                        const directorData = metadata?.director as DirectorResult | undefined

                        // 🎬 v20.5: 如果是最新消息且正在加载 Director，显示加载骨架屏
                        if (isLatestMessage && isDirectorLoading && !directorData) {
                          return (
                            <Paper
                              p="sm"
                              radius="md"
                              mt="sm"
                              style={{
                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)',
                                border: '1px solid rgba(139, 92, 246, 0.2)',
                                backdropFilter: 'blur(8px)',
                              }}
                            >
                              <Group gap="xs" wrap="nowrap">
                                <Box
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Loader size={14} color="white" />
                                </Box>
                                <Text size="sm" fw={600} style={{ color: '#e9d5ff' }}>
                                  剧情导演正在构思...
                                </Text>
                              </Group>
                            </Paper>
                          )
                        }

                        if (!directorData) return null

                        return (
                          <DirectorPanel
                            data={directorData}
                            isLatest={isLatestMessage}
                            characterName={character?.name}
                            onChoiceSelect={onDirectorChoiceSelect
                              ? (choice) => onDirectorChoiceSelect(choice, message.id)
                              : undefined
                            }
                            disabled={!!directorData.selectedChoiceId}
                          />
                        )
                      })()}

                      {/* Sending Status */}
                      {isSending && (
                        <Group gap={4} mt="xs" justify={isUser ? 'flex-end' : 'flex-start'}>
                          <Loader size="xs" color="gray" />
                          <Text size="xs" c="dimmed">发送中...</Text>
                        </Group>
                      )}

                      {/* Failed Status */}
                      {isFailed && (
                        <Group gap="xs" mt="xs" justify={isUser ? 'flex-end' : 'flex-start'}>
                          <Badge
                            color="red"
                            variant="light"
                            size="sm"
                            leftSection={<IconAlertCircle size={12} />}
                          >
                            发送失败
                          </Badge>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            color="red"
                            onClick={() => {
                              // Retry logic would go here
                              toast('重试功能开发中...')
                            }}
                          >
                            <IconRefresh size={14} />
                          </ActionIcon>
                        </Group>
                      )}

                      {/* TTS 播放按钮 - 仅显示在AI助手消息上 */}
                      {message.role === 'assistant' && !isEditing && ttsEnabled && !isSending && !isFailed && !isGenerating && (
                        <Group gap="xs" mt="sm" justify="flex-start">
                          <Tooltip label={isPlaying && currentMessageId === message.id ? '停止播放' : '播放语音'}>
                            <ActionIcon
                              variant="light"
                              size="lg"
                              color={isPlaying && currentMessageId === message.id ? 'red' : 'blue'}
                              onClick={() => handlePlayTTS(message)}
                              style={{
                                transition: 'all 0.2s',
                              }}
                            >
                              {isPlaying && currentMessageId === message.id ? (
                                <IconPlayerPause size={20} />
                              ) : (
                                <IconPlayerPlay size={20} />
                              )}
                            </ActionIcon>
                          </Tooltip>

                          {/* 性别图标指示器 */}
                          <Tooltip label={currentVoiceGender === 'Female' ? '女声' : '男声'}>
                            <Box
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                background: currentVoiceGender === 'Female'
                                  ? 'rgba(244, 143, 177, 0.15)'
                                  : 'rgba(33, 150, 243, 0.15)',
                                border: currentVoiceGender === 'Female'
                                  ? '1px solid rgba(244, 143, 177, 0.3)'
                                  : '1px solid rgba(33, 150, 243, 0.3)',
                              }}
                            >
                              {currentVoiceGender === 'Female' ? (
                                <IconGenderFemale
                                  size={16}
                                  style={{ color: 'rgb(244, 143, 177)' }}
                                />
                              ) : (
                                <IconGenderMale
                                  size={16}
                                  style={{ color: 'rgba(33, 150, 243, 0.95)' }}
                                />
                              )}
                            </Box>
                          </Tooltip>

                          {/* TTS 快捷设置按钮 */}
                          <Menu position="top" withArrow shadow="lg">
                            <Menu.Target>
                              <Tooltip label="语音设置">
                                <ActionIcon variant="light" size="lg" color="gray">
                                  <IconSettings size={18} />
                                </ActionIcon>
                              </Tooltip>
                            </Menu.Target>
                            <Menu.Dropdown style={{ minWidth: 220 }}>
                              <Menu.Label>播放模式</Menu.Label>
                              <Box px="sm" py="xs">
                                <SegmentedControl
                                  fullWidth
                                  size="xs"
                                  value={playMode}
                                  onChange={(value) => setPlayMode(value as any)}
                                  data={[
                                    {
                                      label: TTS_PLAY_MODES.dialogue.icon,
                                      value: 'dialogue',
                                    },
                                    {
                                      label: TTS_PLAY_MODES.thought.icon,
                                      value: 'thought',
                                    },
                                    {
                                      label: TTS_PLAY_MODES.scene.icon,
                                      value: 'scene',
                                    },
                                    {
                                      label: TTS_PLAY_MODES.all.icon,
                                      value: 'all',
                                    },
                                  ]}
                                />
                                <Text size="xs" c="dimmed" mt="xs" ta="center">
                                  {playMode === 'dialogue' && '对话'}
                                  {playMode === 'thought' && '心理'}
                                  {playMode === 'scene' && '场景'}
                                  {playMode === 'all' && '全部'}
                                </Text>
                              </Box>

                              <Menu.Divider />

                              <Menu.Label>语速调节</Menu.Label>
                              <Box px="sm" py="xs">
                                <Slider
                                  value={speed}
                                  onChange={setSpeed}
                                  min={0.5}
                                  max={2.0}
                                  step={0.1}
                                  marks={[
                                    { value: 0.5, label: '0.5x' },
                                    { value: 1.0, label: '1x' },
                                    { value: 1.5, label: '1.5x' },
                                    { value: 2.0, label: '2x' },
                                  ]}
                                  label={(value) => `${value.toFixed(1)}x`}
                                />
                              </Box>

                              <Menu.Divider />

                              <Menu.Item
                                leftSection={autoPlay ? <IconCheck size={14} /> : null}
                                onClick={() => setAutoPlay(!autoPlay)}
                              >
                                自动播放新消息
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>

                          {/* 播放进度指示 + 音频可视化 */}
                          {isPlaying && currentMessageId === message.id && (
                            <>
                              {/* 音频可视化 */}
                              <Box style={{ width: '120px', height: '40px' }}>
                                <AudioVisualizer
                                  isPlaying={true}
                                  variant="bars"
                                  color="var(--accent-gold-hex)"
                                  height={40}
                                />
                              </Box>

                              {/* 播放状态文本 */}
                              <Badge
                                variant="light"
                                color="blue"
                                size="sm"
                                leftSection={
                                  <Box
                                    style={{
                                      width: '6px',
                                      height: '6px',
                                      borderRadius: '50%',
                                      backgroundColor: 'var(--accent-gold-hex)',
                                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                                    }}
                                  />
                                }
                              >
                                播放中...
                              </Badge>
                            </>
                          )}
                        </Group>
                      )}


                      {/* Message Actions - Desktop */}
                      {!isEditing && !isMobile && (
                        <Box
                          style={{
                            position: 'absolute',
                            top: 0,
                            [isUser ? 'left' : 'right']: '-5rem',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                          }}
                          className="group-hover:opacity-100"
                        >
                          <Menu position={isUser ? 'left-start' : 'right-start'} shadow="md" withinPortal>
                            <Menu.Target>
                              <ActionIcon variant="subtle" size="sm">
                                <IconDotsVertical size={14} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item
                                leftSection={<IconCopy size={14} />}
                                onClick={() => handleCopyMessage(message.content)}
                              >
                                {t('chat.message.copy')}
                              </Menu.Item>

                              {isUser && (
                                <Menu.Item
                                  leftSection={<IconEdit size={14} />}
                                  onClick={() => handleStartEdit(message)}
                                >
                                  {t('chat.message.edit')}
                                </Menu.Item>
                              )}

                              {!isUser && (
                                <Menu
                                  trigger="hover"
                                  position="right-start"
                                  withinPortal
                                >
                                  <Menu.Target>
                                    <Menu.Item leftSection={<IconRefresh size={14} />}>
                                      {t('chat.message.regenerate') || '重新生成'} →
                                    </Menu.Item>
                                  </Menu.Target>
                                  <Menu.Dropdown>
                                    <Menu.Item
                                      onClick={() => handleRegenerateMessage(message.id)}
                                    >
                                      就地重生成 (清理后续)
                                    </Menu.Item>
                                    <Menu.Item
                                      onClick={() => handleRegenerateMessageAsBranch(message.id)}
                                    >
                                      新分支重生成
                                    </Menu.Item>
                                  </Menu.Dropdown>
                                </Menu>
                              )}

                              {/* 📖 收藏到回忆录 - 仅助手消息 */}
                              {!isUser && onBookmarkMessage && (
                                <Menu.Item
                                  leftSection={<IconBookmark size={14} />}
                                  onClick={() => handleBookmarkMessage(message)}
                                >
                                  收藏到回忆录
                                </Menu.Item>
                              )}

                              <Menu.Divider />

                              <Menu.Item
                                leftSection={<IconTrash size={14} />}
                                color="red"
                                onClick={() => handleDeleteMessage(message.id)}
                              >
                                {t('chat.message.delete')}
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Box>
                      )}
                    </Box>

                    {/* Quick inline actions for assistant messages - MOVED OUTSIDE MESSAGE BUBBLE */}
                    {!isUser && !isEditing && (
                      <div
                        className="group-hover:opacity-100"
                        style={{
                          position: 'absolute',
                          top: '-0.75rem',
                          right: '-0.75rem',
                          opacity: isMobile ? 1 : 0.6,
                          transition: 'opacity 0.2s',
                          display: 'flex',
                          gap: '0.5rem',
                          zIndex: 5,
                        }}
                      >
                        <Menu position="bottom-end" withinPortal>
                          <Menu.Target>
                            <Tooltip label={t('chat.message.regenerate')}>
                              <ActionIcon
                                variant="filled"
                                size="md"
                                style={{
                                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                                  border: '2px solid rgba(59, 130, 246, 0.3)',
                                }}
                              >
                                <IconRefresh size={18} />
                              </ActionIcon>
                            </Tooltip>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              onClick={() => handleRegenerateMessage(message.id)}
                            >
                              就地重生成 (清理后续)
                            </Menu.Item>
                            <Menu.Item
                              onClick={() => handleRegenerateMessageAsBranch(message.id)}
                            >
                              新分支重生成
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                        <Tooltip label={t('chat.controls.scrollToBottom') || '跳转底部'}>
                          <ActionIcon
                            variant="light"
                            size="md"
                            color="gray"
                            onClick={onScrollToBottom}
                          >
                            <IconArrowDown size={18} />
                          </ActionIcon>
                        </Tooltip>
                      </div>
                    )}

                    {/* Message Status */}
                    {message.metadata?.isRegenerated && (
                      <Group
                        justify={isUser ? 'flex-end' : 'flex-start'}
                        mt="xs"
                      >
                        <Badge
                          variant="light"
                          color="blue"
                          leftSection={
                            <Box
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--accent-gold-hex)',
                                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                              }}
                            />
                          }
                          size="sm"
                        >
                          {t('chat.message.isRegenerating')}
                        </Badge>
                      </Group>
                    )}

                    {/* Streaming Indicator with Progress and Cancel Button */}
                    {!isUser && message.id.startsWith('temp-ai-') && message.content !== '[已取消生成]' && message.content !== '[生成失败]' && (
                      <Group
                        justify={isUser ? 'flex-end' : 'flex-start'}
                        gap="xs"
                        mt="sm"
                        wrap="wrap"
                      >
                        {/* Enhanced Typing Indicator */}
                        <Group gap={6} className="streaming-message">
                          <Group gap={4}>
                            <Box className="typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-gold-hex)' }} />
                            <Box className="typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-gold-hex)' }} />
                            <Box className="typing-dot" style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--accent-gold-hex)' }} />
                          </Group>
                          <Text size="xs" fw={500} style={{ color: 'var(--accent-gold-hex)' }}>
                            {character?.name || 'AI'} 正在输入
                          </Text>
                          {generationProgress > 0 && (
                            <Text size="xs" c="dimmed">
                              ({generationProgress}s)
                            </Text>
                          )}
                        </Group>

                        {/* Cancel Button */}
                        {!isMobile && (
                          <Button
                            variant="light"
                            color="red"
                            size="xs"
                            onClick={cancelGeneration}
                            leftSection={<IconSquare size={12} />}
                          >
                            停止
                          </Button>
                        )}

                        {isMobile && (
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="md"
                            onClick={cancelGeneration}
                          >
                            <IconSquare size={16} />
                          </ActionIcon>
                        )}
                      </Group>
                    )}

                    {/* Long Wait Warning - 只在真正生成时显示 */}
                    {!isUser && message.id.startsWith('temp-ai-') && message.content !== '[已取消生成]' && message.content !== '[生成失败]' && generationProgress > 30 && (
                      <Badge
                        variant="light"
                        color="yellow"
                        size="sm"
                        styles={{
                          root: {
                            backgroundColor: 'rgba(245, 158, 11, 0.2)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            backdropFilter: 'blur(8px)',
                          },
                        }}
                      >
                        {generationProgress > 60 ? '请耐心等待，即将完成' : '响应时间较长'}
                      </Badge>
                    )}
                  </Box>
                </Stack>
              </Group>
            </Group>
          )
        })}

        {/* Incomplete Interaction Prompt */}
        {showIncompletePrompt && !isLoading && onContinueIncomplete && onDismissIncomplete && messages.length > 0 && (
          <IncompleteInteractionPrompt
            onContinue={onContinueIncomplete}
            onDismiss={onDismissIncomplete}
            isLastMessageUser={messages[messages.length - 1]?.role === 'user'}
          />
        )}

        {/* Enhanced Loading Indicator with Typing Animation */}
        {isLoading && !hasTempAI && (
          <Box className="animate-fade-in">
            <TypingIndicatorWithProgress
              characterName={character?.name}
              characterAvatar={(character as any)?.coverUrl || character?.avatar}
              elapsedSeconds={generationProgress}
              onCancel={generationProgress > 5 ? cancelGeneration : undefined}
              animationStyle="bounce"
              size={isMobile ? 'sm' : 'md'}
              isMobile={isMobile}
            />
          </Box>
        )}

      </Stack>

      {/* Mobile Action Sheet */}
      {isMobile && showMobileActions && mobileActionMessage && (
        <Portal>
          <Box
            onClick={closeMobileActions}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
            }}
          />
          <Box
            className="mobile-message-actions"
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'rgba(17, 24, 39, 0.95)',
              backdropFilter: 'blur(16px)',
              padding: '1.5rem 1rem calc(1.5rem + env(safe-area-inset-bottom))',
              borderTop: '1px solid rgba(55, 65, 81, 0.5)',
              zIndex: 1000,
              boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Group justify="space-around" gap="xl">
              <Stack align="center" gap={4} style={{ cursor: 'pointer' }} onClick={() => {
                handleCopyMessage(mobileActionMessage.content)
                closeMobileActions()
              }}>
                <ActionIcon size="xl" variant="light" color="blue">
                  <IconCopy size={24} />
                </ActionIcon>
                <Text size="xs" c="dimmed">复制</Text>
              </Stack>

              {mobileActionMessage.role === 'user' && (
                <Stack align="center" gap={4} style={{ cursor: 'pointer' }} onClick={() => handleStartEdit(mobileActionMessage)}>
                  <ActionIcon size="xl" variant="light" color="blue">
                    <IconEdit size={24} />
                  </ActionIcon>
                  <Text size="xs" c="dimmed">编辑</Text>
                </Stack>
              )}

              {mobileActionMessage.role === 'assistant' && (
                <Stack align="center" gap={4} style={{ cursor: 'pointer' }} onClick={() => handleRegenerateMessage(mobileActionMessage.id)}>
                  <ActionIcon size="xl" variant="light" color="blue">
                    <IconRefresh size={24} />
                  </ActionIcon>
                  <Text size="xs" c="dimmed">重新生成</Text>
                </Stack>
              )}

              {/* 📖 收藏到回忆录 - 仅助手消息 */}
              {mobileActionMessage.role === 'assistant' && onBookmarkMessage && (
                <Stack align="center" gap={4} style={{ cursor: 'pointer' }} onClick={() => handleBookmarkMessage(mobileActionMessage)}>
                  <ActionIcon size="xl" variant="light" color="grape">
                    <IconBookmark size={24} />
                  </ActionIcon>
                  <Text size="xs" c="dimmed">收藏</Text>
                </Stack>
              )}

              <Stack align="center" gap={4} style={{ cursor: 'pointer' }} onClick={() => handleDeleteMessage(mobileActionMessage.id)}>
                <ActionIcon size="xl" variant="light" color="red">
                  <IconTrash size={24} />
                </ActionIcon>
                <Text size="xs" c="dimmed">删除</Text>
              </Stack>
            </Group>
          </Box>
        </Portal>
      )}
    </Stack>
  )
}
