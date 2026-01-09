/**
 * Main chat interface component
 */

'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { MessageCircle, Send, Settings, User, Plus, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Box, Button, Drawer, Group, Loader, Paper, Text } from '@mantine/core'
import { useChatStore } from '@/stores/chatStore'
import { useTTSStore } from '@/stores/ttsStore'
import { chatService } from '@/services/chatService'
import { directorService } from '@/lib/chat/directorService'
import type { DirectorChoice } from '@/lib/chat/directorTypes'
import { metaGameplayService } from '@/lib/chat/metaGameplayService'
import { useCharacterStore } from '@/stores/characterStore'
import { useCreativeStore } from '@/stores/creativeStore'
import { useAIModelStore } from '@/stores/aiModelStore'
import { Message, CreateMessageParams, Character } from '@sillytavern-clone/shared'
import MessageList from './MessageList'
import NewMessageIndicator from './NewMessageIndicator'
import MessageInput from './MessageInput'
import ChatHeader from './ChatHeader'
import ChatControlBar from './ChatControlBar'
import CreativePresetBar from './CreativePresetBar'
import DirectorPanel from './DirectorPanel'
import CharacterModal from '../character/CharacterModal'
import RetryDialog from './RetryDialog'
import GreetingSelector from '../greeting/GreetingSelector'
import ChatEntryWizard, { type ChatEntryConfig } from './ChatEntryWizard'
import toast from 'react-hot-toast'
import { useTranslation, getLocale } from '@/lib/i18n'
import { useModelGuard } from '@/hooks/useModelGuard'
import { useSettingsUIStore } from '@/stores/settingsUIStore'
import RoleSetupWizard from '@/components/role/RoleSetupWizard'
import { useRoleSettings } from '@/hooks/useRoleSettings'
import { requireRoleSettingsOnEnter } from '@/lib/config/roleSettings'
import FirstChatSettingsDialog from './FirstChatSettingsDialog'
import {
  getCharacterTuneSettingsWithGlobal,
  hasPersonaChoice,
  hasGlobalPersona,
  setCharacterPersonaChoice,
  syncGlobalPersonaFromDB,
  getGlobalPersonaSettings,
  isUsingGlobalPersona
} from '@/stores/characterTuneStore'
import { stripReasoningBlocks, isStripReasoningEnabled } from '@/lib/stripReasoningBlocks'
import { applyRegexScripts, getRegexScripts } from '@/lib/regexScriptStorage'
import { getActiveRegexScripts } from '@/lib/characterRegexStorage'
import { extractDialogueFromHTML } from '@/lib/tts/extractDialogue'
import { TTSFloatingPlayer } from '@/components/tts/TTSFloatingPlayer'
import ChatDynamicImageSystem from './ChatDynamicImageSystem'
import MobilePortraitFloat from './MobilePortraitFloat'
import CharacterGalleryModal from './CharacterGalleryModal'
import { useUserId } from '@/hooks/useCurrentUser'
import { useDynamicImageSettings } from '@/components/settings/DynamicImageSettings'
import { useIntimacy, INTIMACY_MILESTONES, getMilestoneDescription } from '@/lib/dynamicImage/useIntimacy'
// 🎭 v15 沉浸式功能 & 羁绊系统
import { useChatBond } from '@/hooks/chat/useChatBond'
import { BondNotificationContainer } from './BondNotification'
import type { ChoiceOption } from '@/lib/immersiveChat/types'
// 🎭 v16 NPC 生态系统
import NPCPanel from './NPCPanel'
import NPCActivationNotification from './NPCActivationNotification'
import { useNPCActivation } from '@/hooks/chat/useNPCActivation'
// 🎭 v28 群聊模式
import SpeakerSwitcher from './SpeakerSwitcher'
import GroupMemberSelector from './GroupMemberSelector'
import MobileRelationDrawer from './MobileRelationDrawer'
// 🌍 v17 剧情追踪系统
import StoryTrackingPanel from './StoryTrackingPanel'
// 🎮 v21 沉浸式RPG模式
import { useRPGModeStore, useIsTheaterSoulMode } from '@/stores/rpgModeStore'
import RPGModeContainer from '@/components/rpg/RPGModeContainer'
import type { RPGChoice } from '@/lib/rpg/types'
// 🎭 v27 Theater Soul v2 体验
import ImmersiveChatV2Container from '@/components/chat/v2/ImmersiveChatV2Container'
// 🎭 v33 素材系统增强 - 背景图和场景切换
import useCharacterAssets, { type CharacterAsset } from '@/hooks/useCharacterAssets'
// 🎭 v22 沉浸模式侧边栏折叠
import { useImmersiveSidebarStore } from '@/stores/immersiveSidebarStore'
import RPGSidebarToggle from '@/components/rpg/RPGSidebarToggle'
import { IconSparkles } from '@tabler/icons-react'
// 🎭 v22.1 Theater Side Panel for enhanced immersive experience
import { type UserPersona } from './TheaterSidePanel'
// 🌍 v4.0 活世界系统
import SceneStatusBar from './SceneStatusBar'
import { useWorldState } from '@/hooks/chat/useWorldState'

// ✨ v13 Architecture: New chat hooks are available for future migration
// These hooks extract logic from this component for better maintainability:
// - useGeneration: AI response generation, streaming, retry logic
// - useMessages: Message sending, editing, deletion
// - useBranches: Branching, regeneration, incomplete interaction handling
// - useChatScroll: Scroll management, mobile gestures
// Import when ready to migrate: import { useGeneration, useMessages, useBranches, useChatScroll } from '@/hooks/chat'

interface ChatInterfaceProps {
  characterId?: string | null
  onViewCharacter?: () => void
  // 侧边栏控制 props
  isLeftSidebarOpen?: boolean
  isRightSidebarOpen?: boolean
  onToggleLeftSidebar?: () => void
  onToggleRightSidebar?: () => void
}

export default function ChatInterface({
  characterId,
  onViewCharacter,
  isLeftSidebarOpen,
  isRightSidebarOpen,
  onToggleLeftSidebar,
  onToggleRightSidebar,
}: ChatInterfaceProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const {
    currentChat,
    messages,
    character,
    isLoading,
    isGenerating,
    error,
    isStreamingEnabled,
    isFastModeEnabled,
    generationProgress,
    streamingUnsupported,
    incompleteInteractionDetected,
    dismissedIncompleteInteraction,
    setCurrentChat,
    setCharacter,
    setLoading,
    setGenerating,
    setError,
    clearError,
    addMessage,
    updateMessage,
    deleteMessage,
    clearMessages,
  refreshMessages,
    setGenerationProgress,
    setAbortController,
    cancelGeneration,
    resetGenerationState,
    setStreamingUnsupported,
    checkForIncompleteInteraction,
    dismissIncompleteInteraction,
    resetIncompleteInteraction,
  activeBranchId,
  setActiveBranchId,
    reset,
    // 🎭 v28 群聊模式状态
    chatMode,
    activeSpeakerId,
    groupMembers,
    setChatMode,
    setActiveSpeaker,
    setGroupMembers,
    toggleGroupMember,
  } = useChatStore()

  // Calculate canGenerate directly in component to ensure proper reactivity
  const canGenerate = !isGenerating && currentChat !== null && character !== null

  const { characters, createCharacter } = useCharacterStore()
  const {
    storyAdvance,
    povMode,
    sceneTransitionOnce,
    consumeOneShots,
    hydrateFromLocalStorage: hydrateCreativeIntent,
    getActiveDirectives,
  } = useCreativeStore()
  const { activeModel, fetchModels, hydrated } = useAIModelStore()
  const { enabled: ttsEnabled, autoPlay, play: playTTS, playMode, isPlaying: isTTSPlaying, currentMessageId: ttsCurrentMessageId, stop: stopTTS } = useTTSStore()
  const currentUserId = useUserId()

  // 🎮 v21 RPG模式状态
  const { isRPGMode } = useRPGModeStore()
  // 🎭 v27 Theater Soul v2 体验
  const isTheaterSoulMode = useIsTheaterSoulMode()

  // 🎭 v33 素材系统增强 - 背景图和场景切换
  const {
    assets: characterAssets,
    getAssetsByType,
    stats: assetStats,
    getScene,
    getExpression,
    isLoading: isAssetsLoading,
  } = useCharacterAssets({
    characterId: character?.id,
    userId: currentUserId,
    charType: (character as any)?.charType || 'community',
    enabled: isTheaterSoulMode && !!character,
  })

  // 场景状态管理
  const [currentScene, setCurrentScene] = useState<CharacterAsset | null>(null)
  const sceneAssets = useMemo(() =>
    getAssetsByType('scene').filter(a => a.isUnlocked),
    [getAssetsByType]
  )
  const expressionAssets = useMemo(() =>
    getAssetsByType('expression').filter(a => a.isUnlocked),
    [getAssetsByType]
  )
  const cgAssets = useMemo(() =>
    getAssetsByType('cg').filter(a => a.isUnlocked),
    [getAssetsByType]
  )

  // 🎭 v22 沉浸模式侧边栏折叠
  const {
    leftCollapsed: immersiveLeftCollapsed,
    rightCollapsed: immersiveRightCollapsed,
    autoCollapseOnRPG,
    setLeftCollapsed: setImmersiveLeftCollapsed,
    setRightCollapsed: setImmersiveRightCollapsed,
    collapseAll: collapseAllSidebars,
    restorePrevious: restoreSidebars,
    savePreviousState: saveSidebarState,
  } = useImmersiveSidebarStore()

  // 计算最新的助手消息（用于动态图片系统情绪检测）
  const latestAssistantMessage = useMemo(() => {
    const assistantMessages = messages.filter(m => m.role === 'assistant')
    return assistantMessages[assistantMessages.length - 1]?.content || ''
  }, [messages])

  // 🎬 Director -> RPG: 从最新的助手消息 metadata 提取选项，供沉浸模式展示
  const rpgDirector = useMemo(() => {
    const safeParse = (val: string) => {
      try {
        return JSON.parse(val)
      } catch {
        return null
      }
    }

    for (let i = messages.length - 1; i >= 0; i--) {
      const msg: any = messages[i]
      if (!msg || msg.role !== 'assistant') continue

      const metadata = msg.metadata
        ? (typeof msg.metadata === 'string' ? safeParse(msg.metadata) : msg.metadata)
        : null

      const director = metadata?.director
      if (director?.choices?.length) {
        return { messageId: msg.id as string, director }
      }
    }
    return null
  }, [messages])

  const rpgDirectorChoices = useMemo(() => {
    const choices = rpgDirector?.director?.choices
    if (!choices || !Array.isArray(choices) || choices.length === 0) return undefined
    return choices.map((c: any) => ({
      id: String(c.id),
      text: String(c.text || ''),
      emoji: c.emoji ? String(c.emoji) : undefined,
      type: c.type,
      consequence: c.consequence ? String(c.consequence) : undefined,
    })) as RPGChoice[]
  }, [rpgDirector])

  // 动态图片系统设置
  const dynamicImageSettings = useDynamicImageSettings()

  // 亲密度管理
  const {
    level: intimacyLevel,
    trackMessage: trackIntimacyMessage,
    trackNewChat: trackIntimacyNewChat,
  } = useIntimacy({
    userId: currentUserId,
    characterId: character?.id || '',
    charType: (character as any)?.charType || 'community',
    enabled: !!character && dynamicImageSettings.enableCGUnlock,
    autoTrackMessages: true,
  })

  const hasActiveModel = activeModel !== null
  const isModelConfigured = Boolean(
    hydrated &&
    activeModel &&
    (activeModel as any).provider &&
    (activeModel as any).model &&
    (
      // 官方模型和系统模型不需要检查 apiKey（服务端已配置）
      (activeModel as any).isOfficial ||
      (activeModel as any).isSystemModel ||
      // 本地模型不需要 apiKey
      (activeModel as any).provider === 'local' ||
      // 其他模型需要 apiKey
      Boolean((activeModel as any).apiKey)
    )
  )

  const { isModelReady, assertModelReady } = useModelGuard()
  const { openSettings: openSettingsDrawer } = useSettingsUIStore()
  const { ensureRoleSettings, saveRoleSettings, getEffectiveRoleSettings } = useRoleSettings()

  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [modelsInitialized, setModelsInitialized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const sendingRef = useRef(false)
  const autoOpenModelDrawerRef = useRef(false)
  const loadedCharacterIdRef = useRef<string | null>(null) // 追踪已加载的角色，防止重复加载
  const sendingGreetingRef = useRef<Set<string>>(new Set()) // 追踪正在发送或已发送欢迎消息的聊天ID，防止重复发送
  const [appSettings, setAppSettings] = useState<{ userName?: string; autoSendGreeting?: boolean; openerTemplate?: string }>({})
  const [isMobile, setIsMobile] = useState(false)
  const shouldAutoScrollRef = useRef(true)
  const [newMessageCount, setNewMessageCount] = useState(0)
  const prevMessageCountRef = useRef(messages.length)
  const lastAssistantContentLengthRef = useRef(0)

  // 🎭 羁绊系统集成 (放在 appSettings 之后，因为需要用到 userName)
  const {
    isReady: bondReady,
    bondLevel,
    bondExp,
    progress: bondProgress,
    title: bondTitle,
    color: bondColor,
    currentEmotion,
    canCheckIn,
    checkIn: bondCheckIn,
    processUserMessage: processBondUserMessage,
    processAIResponse: processBondAIResponse,
    getPromptContext: getBondPromptContext,
    displayData: bondDisplayData,
  } = useChatBond({
    userId: currentUserId,
    characterId: character?.id || null,
    characterName: character?.name,
    userName: appSettings.userName || 'User',
    enabled: !!character,
    language: (getLocale() as string) === 'zh' ? 'zh' : 'en',
  })

  // Retry dialog state
  const [showRetryDialog, setShowRetryDialog] = useState(false)
  const [retryError, setRetryError] = useState<{ message: string; type: 'timeout' | 'network' | 'server' | 'cancelled' }>({ message: '', type: 'timeout' })
  const [retryCount, setRetryCount] = useState(0)
  const [branchMode, setBranchMode] = useState(false)
  const [showRoleWizard, setShowRoleWizard] = useState(false)

  // 🎬 v20.5: Director 加载状态
  const [isDirectorLoading, setIsDirectorLoading] = useState(false)
  
  // First chat settings dialog state
  const [showFirstChatDialog, setShowFirstChatDialog] = useState(false)
  const checkingPersonaChoice = useRef(false)

  // Greeting selector state
  const [showGreetingSelector, setShowGreetingSelector] = useState(false)
  const [pendingChatCharacter, setPendingChatCharacter] = useState<Character | null>(null)
  const [selectedGreetingId, setSelectedGreetingId] = useState<string | null>(null)
  const [pendingNewChatMode, setPendingNewChatMode] = useState<'preserve' | 'reset' | null>(null)

  // Chat Entry Wizard state (新的聊天进入向导)
  const [showChatEntryWizard, setShowChatEntryWizard] = useState(false)
  const [wizardCharacter, setWizardCharacter] = useState<Character | null>(null)
  const wizardConfirmedRef = useRef(false) // 追踪向导是否成功确认，防止 onClose 触发跳转

  // 角色相册弹窗状态
  const [showGalleryModal, setShowGalleryModal] = useState(false)

  // 🎭 沉浸式功能状态
  const [immersiveModeEnabled, setImmersiveModeEnabled] = useState(true) // 默认启用
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({}) // messageId -> choiceId

  // 🎭 v16 NPC 生态系统状态
  const [showNPCPanel, setShowNPCPanel] = useState(false)
  // 🌍 v17 剧情追踪系统状态
  const [showStoryTrackingPanel, setShowStoryTrackingPanel] = useState(false)
  // 🎬 v13: 导演面板（沉浸模式 overlay，不挤压阅读层）
  const [showDirectorOverlay, setShowDirectorOverlay] = useState(false)
  // 🎭 v28: 群聊成员选择器
  const [showGroupMemberSelector, setShowGroupMemberSelector] = useState(false)
  // 🎭 v28: 移动端关系抽屉
  const [showMobileRelationDrawer, setShowMobileRelationDrawer] = useState(false)

  // 🎭 v22.1: Theater Side Panel - User Persona state for {{user}} handling
  const [userPersona, setUserPersona] = useState<UserPersona>(() => {
    // Initialize from localStorage or use default
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('user_persona')
        if (saved) {
          return JSON.parse(saved)
        }
      } catch {}
    }
    return { name: appSettings.userName || '你' }
  })

  // 🎭 v16 NPC 激活检测
  const {
    hasPendingActivations,
    pendingActivations,
    activeNPCs,
    checkActivation: checkNPCActivation,
    confirmActivation: confirmNPCActivation,
    dismissActivation: dismissNPCActivation,
    refreshActiveNPCs,
  } = useNPCActivation({
    enabled: true,
    chatId: currentChat?.id || null,
    mainCharacterName: character?.name,
  })

  // 🌍 v4.0 活世界系统 - 世界状态管理
  const {
    worldState,
    isLoading: isWorldStateLoading,
    refresh: refreshWorldState,
    transitionScene,
  } = useWorldState({
    chatId: currentChat?.id || null,
    characterId: character?.id || null,
    enabled: currentChat?.directorEnabled ?? false,
  })

  // Swipe back gesture state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [swipeProgress, setSwipeProgress] = useState(0)
  const [pendingRetryAction, setPendingRetryAction] = useState<(() => Promise<void>) | null>(null)
  const maxRetries = 3

  // RAF 批量更新优化：减少渲染频率从 60+ FPS 到 ~16 FPS
  const rafBatchUpdate = useRef<{
    rafId: number | null
    pendingContent: string
    tempMessageId: string | null
  }>({
    rafId: null,
    pendingContent: '',
    tempMessageId: null
  })

  // 批量更新函数：使用 RAF 合并多次更新
  const batchUpdateMessage = (messageId: string, content: string) => {
    rafBatchUpdate.current.pendingContent = content
    rafBatchUpdate.current.tempMessageId = messageId

    if (!rafBatchUpdate.current.rafId) {
      rafBatchUpdate.current.rafId = requestAnimationFrame(() => {
        if (rafBatchUpdate.current.tempMessageId) {
          updateMessage(rafBatchUpdate.current.tempMessageId, { 
            content: rafBatchUpdate.current.pendingContent 
          })
        }
        rafBatchUpdate.current.rafId = null
      })
    }
  }

  const regenerateDirectorForLatest = useCallback(async () => {
    if (!currentChat || !character || !activeModel) return

    const targetMessageId =
      rpgDirector?.messageId ||
      [...messages].reverse().find((m) => m.role === 'assistant')?.id

    if (!targetMessageId) return

    const targetMessage = messages.find((m) => m.id === targetMessageId)
    if (!targetMessage) return

    try {
      setIsDirectorLoading(true)

      const contextMessages = messages.filter((m: any) => typeof m?.id !== 'string' || !m.id.startsWith('temp-'))
      const tuneSettingsForDirector = character?.id
        ? await getCharacterTuneSettingsWithGlobal(character.id)
        : undefined

      const directorResult = await directorService.generateSuggestions(
        currentChat,
        contextMessages as any,
        character,
        activeModel,
        {
          userPersona: tuneSettingsForDirector?.userPersona,
          intimacyLevel,
          tuneSettings: tuneSettingsForDirector,
        }
      )

      if (directorResult) {
        const existingMetadata = targetMessage.metadata
          ? (typeof targetMessage.metadata === 'string'
              ? JSON.parse(targetMessage.metadata)
              : targetMessage.metadata)
          : {}

        const newMetadata = {
          ...existingMetadata,
          director: directorResult,
        }

        updateMessage(targetMessageId, {
          ...(targetMessage as any),
          metadata: JSON.stringify(newMetadata),
        } as any)

        await chatService.updateMessageMetadata(
          currentChat.id,
          targetMessageId,
          newMetadata
        )
      }
    } catch (error) {
      console.error('[Director] Failed to regenerate suggestions:', error)
      toast.error('导演规划生成失败')
    } finally {
      setIsDirectorLoading(false)
    }
  }, [activeModel, character, currentChat, intimacyLevel, messages, rpgDirector?.messageId, updateMessage])

  // 清理 RAF 回调
  useEffect(() => {
    return () => {
      if (rafBatchUpdate.current.rafId) {
        cancelAnimationFrame(rafBatchUpdate.current.rafId)
      }
    }
  }, [])

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 🎭 v22 RPG模式侧边栏自动折叠
  const prevIsRPGModeRef = useRef(isRPGMode)
  useEffect(() => {
    // 只在 RPG 模式状态变化时触发
    if (prevIsRPGModeRef.current !== isRPGMode) {
      prevIsRPGModeRef.current = isRPGMode

      if (autoCollapseOnRPG) {
        if (isRPGMode) {
          // 进入 RPG 模式：保存当前状态并折叠
          saveSidebarState()
          collapseAllSidebars()
          toast(t('chat.rpg.sidebarCollapsed') || '已进入沉浸模式，侧边栏已折叠', { icon: '🎮', duration: 2000 })
        } else {
          // 退出 RPG 模式：恢复之前的状态
          restoreSidebars()
        }
      }
    }
  }, [isRPGMode, autoCollapseOnRPG, saveSidebarState, collapseAllSidebars, restoreSidebars, t])

  // 🎯 Interactive Choice Handler - 使用事件委托处理消息中的可点击选项
  useEffect(() => {
    const handleChoiceClick = (event: MouseEvent) => {
      // 查找点击的按钮（支持点击按钮内的子元素）
      const button = (event.target as HTMLElement).closest('.interactive-choice') as HTMLButtonElement | null
      if (!button) return

      // 获取选项数据
      const id = button.getAttribute('data-choice-id') || ''
      const content = button.getAttribute('data-choice-content') || ''

      console.log('[ChatInterface] Choice clicked:', { id, content })

      // 视觉反馈 - 添加选中样式
      button.classList.add('choice-selected')

      // 设置输入框内容：「已选择: 内容 」格式，末尾有空格方便继续输入
      const choiceMessage = content ? `已选择: ${content} ` : `已选择选项${id} `
      setInputValue(choiceMessage)

      // 聚焦输入框并将光标移到末尾
      if (inputRef.current) {
        inputRef.current.focus()
        // 确保光标在末尾
        const len = choiceMessage.length
        inputRef.current.setSelectionRange(len, len)
      }

      // Toast 提示
      toast.success(`已选择选项 ${id}，可继续补充说明`, { duration: 2000 })
    }

    // 使用事件委托监听 document 上的点击
    document.addEventListener('click', handleChoiceClick)
    return () => {
      document.removeEventListener('click', handleChoiceClick)
    }
  }, [])

  // Greeting de-dup helpers (persist across reloads for the same chat)
  const hasSentGreeting = useCallback((chatId: string, greetingText: string) => {
    if (typeof window === 'undefined') return false

    // 首先检查内存标记（防止当前会话中的重复）
    if (sendingGreetingRef.current.has(chatId)) {
      return true
    }

    // 然后检查 localStorage（防止跨会话的重复）
    try {
      const key = `greeted_${chatId}`
      const val = localStorage.getItem(key)
      return val === (greetingText || '')
    } catch {
      return false
    }
  }, [])

  const markGreetingSent = useCallback((chatId: string, greetingText: string) => {
    if (typeof window === 'undefined') return

    // 立即标记到内存中（防止竞态条件）
    sendingGreetingRef.current.add(chatId)

    // 同时持久化到 localStorage
    try {
      localStorage.setItem(`greeted_${chatId}`, greetingText || '')
    } catch {}
  }, [])

  // State changes monitoring (removed debug logs for performance)

  // Auto-scroll helpers
  const scrollContainerToBottom = (smooth = true) => {
    const el = messagesContainerRef.current
    if (el) {
      try {
        el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
        return
      } catch {}
      // Fallback
      el.scrollTop = el.scrollHeight
      return
    }
    // Fallback to sentinel
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
    }
  }

  const scrollToBottom = (smooth = true) => {
    scrollContainerToBottom(smooth)
  }

  // Manual scroll to bottom handler
  const handleScrollToBottom = () => {
    scrollToBottom(true)
    toast.success(t('chat.controls.scrolledToBottom'), { duration: 1000 })
    setNewMessageCount(0)
  }

  // Swipe back gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return
    
    const touch = e.touches[0]
    setTouchStart({
      x: touch.clientX,
      y: touch.clientY
    })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobile || !touchStart) return
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStart.x
    const deltaY = Math.abs(touch.clientY - touchStart.y)
    
    // Only trigger if swipe starts from left edge and moves horizontally
    if (touchStart.x < 50 && deltaX > 0 && deltaY < 30) {
      const progress = Math.min(deltaX / 100, 1) // Normalize to 0-1
      setSwipeProgress(progress)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile || !touchStart) return
    
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStart.x
    const deltaY = Math.abs(touch.clientY - touchStart.y)
    
    // Trigger navigation if swipe is sufficient
    if (touchStart.x < 50 && deltaX > 100 && deltaY < 30) {
      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(10)
      }
      router.back()
    }
    
    // Reset state
    setTouchStart(null)
    setSwipeProgress(0)
  }

  // 用于跟踪滚动位置，以便在加载更多消息后保持位置
  const previousScrollHeightRef = useRef<number>(0)
  const isLoadingMoreRef = useRef<boolean>(false)
  
  // 监听滚动容器的滚动，判断用户是否仍贴近底部，并检测滚动到顶部
  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current
    if (!el) return
    
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    shouldAutoScrollRef.current = nearBottom
    
    // 检测是否滚动到顶部（用于自动加载更多）
    const nearTop = el.scrollTop < 100
    
    // 如果接近顶部且没有正在加载，触发懒加载
    if (nearTop && !isLoadingMoreRef.current) {
      // MessageList 组件内部会处理加载更多的逻辑
      // 这里记录当前滚动高度以便加载后保持位置
      previousScrollHeightRef.current = el.scrollHeight
    }
  }
  
  // 处理加载更多消息的回调
  const handleLoadMore = useCallback(() => {
    isLoadingMoreRef.current = true
    
    // 使用 setTimeout 等待 DOM 更新
    setTimeout(() => {
      const el = messagesContainerRef.current
      if (el && previousScrollHeightRef.current > 0) {
        // 计算新增的内容高度，并调整滚动位置
        const newScrollHeight = el.scrollHeight
        const heightDiff = newScrollHeight - previousScrollHeightRef.current
        
        // 保持滚动位置：向下移动新增内容的高度
        el.scrollTop = el.scrollTop + heightDiff
        
        previousScrollHeightRef.current = 0
      }
      
      isLoadingMoreRef.current = false
    }, 100)
  }, [])

  // 流式生成期间：当最后一条assistant消息内容增长时，持续将视图锚定到底部（强制跟随）
  useEffect(() => {
    if (!isGenerating) {
      lastAssistantContentLengthRef.current = 0
      return
    }

    const last = messages[messages.length - 1]
    if (!last || last.role !== 'assistant') return

    const currentLength = typeof (last as any).content === 'string' ? (last as any).content.length : 0
    if (currentLength !== lastAssistantContentLengthRef.current) {
      lastAssistantContentLengthRef.current = currentLength
      // 等待布局更新后再滚动，避免抖动
      requestAnimationFrame(() => {
        scrollContainerToBottom(false)
      })
    }
  }, [messages, isGenerating])

  // Auto-scroll when messages change
  useEffect(() => {
    // Use setTimeout to ensure DOM has updated
    const timer = setTimeout(() => {
      scrollToBottom(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [messages.length]) // Only depend on length to avoid content-only changes

  // Initial scroll when chat is loaded or switched
  useEffect(() => {
    if (currentChat && messages.length > 0) {
      // Longer delay for initial load to ensure layout is complete
      const timer = setTimeout(() => {
        scrollToBottom(false) // No animation for initial scroll
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [currentChat?.id]) // Only trigger on chat switch

  // Load AI models on mount to ensure we have the active model
  useEffect(() => {
    // hydrate creative intent from localStorage once
    try { hydrateCreativeIntent() } catch {}
    const loadModels = async () => {
      await fetchModels()
      setModelsInitialized(true)
    }
    loadModels()
  }, [])

  // Auto-create chat if none exists and we have a model
  useEffect(() => {
    const autoCreateChat = async () => {
      // Only auto-create if:
      // 1. Models are initialized
      // 2. We have an active model
      // 3. We don't have a current chat
      // 4. Store is hydrated
      if (modelsInitialized && hydrated && isModelConfigured && !currentChat && !characterId) {
        console.log('[ChatInterface] Auto-creating initial chat...')
        await handleNewChat()
      }
    }

    // Add a small delay to ensure everything is loaded
    const timer = setTimeout(autoCreateChat, 500)
    return () => clearTimeout(timer)
  }, [modelsInitialized, hydrated, isModelConfigured, currentChat, characterId])

  // Listen for new chat event from sidebar
  useEffect(() => {
    const handleCreateNewChat = () => {
      handleNewChat()
    }

    window.addEventListener('create-new-chat', handleCreateNewChat)
    return () => {
      window.removeEventListener('create-new-chat', handleCreateNewChat)
    }
  }, [hasActiveModel, characters, activeModel])

  // Load app settings from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('app_settings')
      if (raw) {
        const parsed = JSON.parse(raw)
        setAppSettings(parsed)

        // 🎭 v22.1: Sync userPersona with appSettings if not already set
        const savedPersona = localStorage.getItem('user_persona')
        if (!savedPersona && parsed.userName) {
          setUserPersona(prev => ({ ...prev, name: parsed.userName }))
        }
      }
    } catch {}

    // Also load user persona separately
    try {
      const personaRaw = localStorage.getItem('user_persona')
      if (personaRaw) {
        setUserPersona(JSON.parse(personaRaw))
      }
    } catch {}
  }, [])

  // v17: 监听登录状态变化，重新加载聊天数据
  useEffect(() => {
    const handleAuthStateChanged = (event: CustomEvent<{ type: string }>) => {
      console.log('[ChatInterface] 🔔 收到 auth-state-changed 事件:', event.detail)

      if (event.detail.type === 'login') {
        // 登录成功后，重置已加载的角色标记，强制重新加载
        console.log('[ChatInterface] 用户登录，重置聊天状态并重新加载数据')
        loadedCharacterIdRef.current = null

        // 重置 chatStore 状态
        reset()

        // 如果当前有 characterId，延迟触发重新加载
        if (characterId) {
          // 使用 setTimeout 确保状态已重置
          setTimeout(() => {
            console.log('[ChatInterface] 触发聊天数据重新加载')
            // 通过修改 loadedCharacterIdRef 为 null，下一次 useEffect 会重新加载
            window.location.reload() // 最可靠的方式是刷新页面
          }, 100)
        }
      } else if (event.detail.type === 'logout') {
        // 登出后清空聊天状态
        console.log('[ChatInterface] 用户登出，清空聊天状态')
        loadedCharacterIdRef.current = null
        reset()
      }
    }

    window.addEventListener('auth-state-changed', handleAuthStateChanged as EventListener)
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChanged as EventListener)
    }
  }, [characterId, reset])

  // Handle character selection from URL parameter
  useEffect(() => {
    // Skip if characterId is not present - prevent re-triggering after URL cleanup
    if (!characterId) {
      return
    }

    // 🔧 防止重复加载：如果已经加载了这个角色，跳过
    if (loadedCharacterIdRef.current === characterId) {
      console.log('[ChatInterface] Character already loaded, skipping:', characterId)
      return
    }

    const loadCharacterAndCreateChat = async () => {
      console.log('[ChatInterface] Loading character - State:', {
        characterId,
        modelsInitialized,
        hydrated,
        hasActiveModel,
        activeModel: activeModel ? { id: activeModel.id, name: activeModel.name, provider: activeModel.provider } : null
      })

      // 🚀 v17 优化：不再等待 models 初始化，立即开始加载角色数据
      // 模型检查推迟到需要创建聊天时再进行
      console.log('[ChatInterface] Loading character data immediately...')

      try {
        setLoading(true)

        // 🚀 v17 优化：并行获取角色数据和聊天列表
        const [characterResponse, chatsResponse] = await Promise.all([
          fetch(`/api/characters/${characterId}`),
          fetch(`/api/chats?characterId=${characterId}&limit=1`)
        ])

        if (!characterResponse.ok) {
          throw new Error('Failed to load character')
        }

        const characterData = await characterResponse.json()
        console.log('[ChatInterface] Character data loaded:', characterData.name)

        // 立即设置角色，让 UI 可以显示
        setCharacter(characterData)

        // 检查是否有现有聊天
        if (chatsResponse.ok) {
          const chatsData = await chatsResponse.json()
          if (chatsData.chats && Array.isArray(chatsData.chats) && chatsData.chats.length > 0) {
            // Load the most recent chat for this character
            const existingChat = chatsData.chats[0]

            // Load messages for this chat
            const messagesResponse = await fetch(`/api/chats/${existingChat.id}/messages`)
            let loadedMessages: Message[] = []
            if (messagesResponse.ok) {
              const messagesData = await messagesResponse.json()
              if (messagesData.messages && Array.isArray(messagesData.messages)) {
                loadedMessages = messagesData.messages
              }
            }

            // Update state in correct order: setCurrentChat clears messages and character
            // So we must call it first, then set character and messages
            setCurrentChat(existingChat)
            setCharacter(characterData)
            loadedMessages.forEach((msg: Message) => addMessage(msg))

            // If chat exists but has no messages yet, inject a one-time greeting from character
            try {
              const flagsEnabled = (process.env.NEXT_PUBLIC_ST_PARITY_GREETING_ENABLED ?? 'true') !== 'false'
              const greeting = (characterData.firstMessage || '').toString().trim()
              if (flagsEnabled && greeting && loadedMessages.length === 0 && !hasSentGreeting(existingChat.id, greeting)) {
                // ✅ 立即标记为已发送（在异步操作之前），防止竞态条件
                markGreetingSent(existingChat.id, greeting)

                const greetMsg = await chatService.addMessage(existingChat.id, {
                  role: 'assistant',
                  content: greeting
                })
                addMessage(greetMsg)
              }
            } catch (e) {
              console.warn('[ChatInterface] Failed to add greeting to empty existing chat:', e)
            }

            console.log('[ChatInterface] Loaded existing chat with', loadedMessages.length, 'messages')
            console.log('[ChatInterface] State after loading:', {
              hasChat: !!existingChat,
              hasCharacter: !!characterData,
              characterName: characterData.name,
              messageCount: loadedMessages.length
            })
            toast.success(t('chat.chatInterface.chatLoaded', { name: characterData.name }))

            // ✅ 标记这个角色已加载，防止重复
            loadedCharacterIdRef.current = characterId
            setLoading(false)
            return
          }
        }

        // 🚀 v17 优化：创建新聊天时才检查模型状态
        // Check if we have an active model (from localStorage)
        const hasModel = hasActiveModel && activeModel
        if (!hasModel) {
          console.warn('[ChatInterface] No active model configured. Loading character without creating chat.')

          // Show a helpful message to the user
          toast.error(t('chat.chatInterface.noModel'), { duration: 5000 })

          // ✅ 标记这个角色已加载
          loadedCharacterIdRef.current = characterId
          setLoading(false)
          return
        }

        // Create new chat if no existing chat found
        // 🆕 显示聊天进入向导，让用户选择开场白、设定模式、预设和TTS设置
        console.log('[ChatInterface] No existing chat found, showing Chat Entry Wizard')
        setWizardCharacter(characterData)
        setShowChatEntryWizard(true)
        setLoading(false)
        // Mark character as loaded to prevent re-triggering
        loadedCharacterIdRef.current = characterId
        return

      } catch (error) {
        console.error('Error loading character and creating chat:', error)
        toast.error(t('chat.chatInterface.loadCharacterFailed'))
        setTimeout(() => router.replace('/characters'), 100)
      } finally {
        setLoading(false)
      }
    }

    loadCharacterAndCreateChat()
  }, [characterId, hasActiveModel, activeModel])

  // 会话进入时校验角色/用户设定，缺失则弹出向导
  useEffect(() => {
    if (!character?.id) return
    // 🔧 v16.5 修复：等待 currentChat 加载完成再检查
    if (!currentChat) return
    try {
      if (!requireRoleSettingsOnEnter) return
      // 🔧 v16.1 修复：如果正在显示 ChatEntryWizard，跳过检查
      if (showChatEntryWizard || wizardCharacter) return
      // 如果用户已经对该角色做过人设选择（全局/专属），不再强制弹出完善向导
      if (hasPersonaChoice(character.id)) return
      // ⚠️ 如果用户选择了"遵循角色卡设定"，跳过严格检查
      if (isUsingGlobalPersona(character.id)) return
      // 如果用户已有全局设定，且这是首聊场景，则交由"首次选择全局/专属"弹窗处理
      const isFirstChat = !messages || messages.length === 0 || (messages.length === 1 && messages[0].role === 'assistant')
      if (hasGlobalPersona() && isFirstChat) return
      const check = ensureRoleSettings(character.id)
      if (!check.ok) {
        setShowRoleWizard(true)
      }
    } catch {}
  }, [character?.id, messages, showChatEntryWizard, wizardCharacter, currentChat])

  // 首次对话时检查是否需要弹出人设选择

  // 首次使用引导提示
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onboardKey = 'chat_onboarded_v2'
    if (!localStorage.getItem(onboardKey) && currentChat && character) {
      // 延迟显示，等待页面加载完成
      const timer = setTimeout(() => {
        toast('💡 小提示：长按消息可以复制、编辑或重新生成', { 
          duration: 5000,
          icon: '👆',
          style: {
            background: 'rgba(26, 20, 41, 0.95)',
            color: '#fff',
            border: '1px solid rgba(245, 197, 66, 0.3)',
          }
        })
        localStorage.setItem(onboardKey, 'true')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [currentChat, character])

  // 检测新消息到达
  useEffect(() => {
    const currentCount = messages.length
    const prevCount = prevMessageCountRef.current
    
    // 如果有新消息且用户不在底部
    if (currentCount > prevCount && !shouldAutoScrollRef.current) {
      setNewMessageCount(prev => prev + (currentCount - prevCount))
    }
    
    // 如果用户在底部，清除新消息计数
    if (shouldAutoScrollRef.current) {
      setNewMessageCount(0)
    }
    
    prevMessageCountRef.current = currentCount
  }, [messages.length])
  useEffect(() => {
    if (!character?.id || !messages || checkingPersonaChoice.current) return

    // 🔧 v16.4 修复：如果仍在加载，跳过检查（避免误判为新对话）
    if (isLoading) return

    // 🔧 v16.5 修复：必须等待 currentChat 加载完成才能判断是新对话还是已有对话
    // 如果 currentChat 为空，说明聊天数据还未加载，跳过检查
    if (!currentChat) {
      console.log('[ChatInterface] Waiting for chat to load before persona check')
      return
    }

    // ⚠️ 如果正在显示开场白选择器，跳过人设检查（避免两个Modal冲突）
    if (showGreetingSelector || pendingChatCharacter) {
      return
    }

    // 🔧 v16.1 修复：如果正在显示或刚关闭 ChatEntryWizard，跳过人设检查
    // ChatEntryWizard 已经处理了人设选择（遵循角色卡设定 vs 自定义设定）
    if (showChatEntryWizard || wizardCharacter) {
      console.log('[ChatInterface] Chat Entry Wizard is active, skipping persona check')
      return
    }

    // 如果已经做过选择，跳过
    if (hasPersonaChoice(character.id)) {
      console.log('[ChatInterface] Character already has persona choice, skipping wizard')
      syncGlobalPersonaFromDB() // 同步全局设定
      return
    }

    // 🔧 v16.4 修复：如果已有对话历史（超过1条消息），自动跳过并设置为使用全局人设
    // 这解决了localStorage被清除后，返回用户仍需重新设置的问题
    if (messages.length > 1) {
      console.log('[ChatInterface] Existing chat history detected, auto-setting global persona')
      setCharacterPersonaChoice(character.id, 'global')
      return
    }

    console.log('[ChatInterface] No persona choice found for character:', character.id)

    // 如果是新对话（没有消息），检查人设设置
    if (messages.length === 0 || (messages.length === 1 && messages[0].role === 'assistant')) {
      console.log('[ChatInterface] First chat detected, checking persona settings')
      checkingPersonaChoice.current = true
      syncGlobalPersonaFromDB().then(() => {
        // 检查是否有全局设定
        if (hasGlobalPersona()) {
          console.log('[ChatInterface] Has global persona, showing first chat dialog')
          // 有全局设定，弹出选择对话框让用户选择使用全局还是创建新的
          setShowFirstChatDialog(true)
        } else {
          console.log('[ChatInterface] No global persona, showing role wizard')
          // 没有全局设定，弹出设置向导让用户先创建全局设定
          setShowRoleWizard(true)
        }
      })
    }
  }, [character?.id, messages, showGreetingSelector, pendingChatCharacter, showChatEntryWizard, wizardCharacter, isLoading, currentChat])

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!isModelConfigured || !isModelReady) {
      toast.error(t('chat.chatInterface.noModel'))
      assertModelReady()
      return
    }
    if (sendingRef.current) {
      return
    }
    if (!content.trim() || !currentChat || !character || isGenerating) {
      return
    }

    // 发送前兜底：确保角色/用户设定完整
    // ⚠️ 如果用户选择了"遵循角色卡设定"，跳过严格检查
    try {
      if (!isUsingGlobalPersona(character.id)) {
        const check = ensureRoleSettings(character.id)
        if (!check.ok) {
          setShowRoleWizard(true)
          return
        }
      }
    } catch {}

    // 强限制拦截：阻止发送包含 hardLimits 的输入
    try {
      const eff = getEffectiveRoleSettings(character.id)
      const limits = eff.boundaries?.hardLimits || []
      const hit = limits.find((k) => k && content.includes(k))
      if (hit) {
        toast.error(t('chat.error.forbiddenContent', { content: hit }))
        return
      }
    } catch {}

    try {
      sendingRef.current = true
      clearError()
      setInputValue('')
      setIsTyping(true)
      setGenerating(true)

      // Create user message
      const userMessage: CreateMessageParams = {
        content: content.trim(),
        role: 'user'
      }

      // Add user message to UI immediately
      const tempUserMessage: Message = {
        id: `temp-${Date.now()}`,
        chatId: currentChat.id,
        role: 'user',
        content: content.trim(),
        timestamp: new Date()
      }
      addMessage(tempUserMessage)

      // Send message to API
      // 将消息归属到当前活跃分支（若有）
      const createdMessage = await chatService.addMessage(currentChat.id, {
        ...userMessage,
        branchId: activeBranchId || undefined,
      } as any)

      // Replace temp message with real one
      updateMessage(tempUserMessage.id, createdMessage)

      // Generate AI response
      // Note: generateAIResponse reads from useCreativeStore directly
      await generateAIResponse()

    } catch (error) {
      console.error('Error sending message:', error)
      setError(t('chat.error.sendFailed'))
      toast.error(t('chat.error.sendFailed'))
    } finally {
      setIsTyping(false)
      setGenerating(false)
      sendingRef.current = false
    }
  }

  // Insert system message (for creative templates)
  const insertSystemMessage = async (template: { title: string; content: string }) => {
    if (!currentChat || !character) {
      toast.error(t('chat.error.selectCharacterAndChat'))
      return
    }

    try {
      // Create system message
      const systemMessage: CreateMessageParams = {
        content: template.content,
        role: 'system'
      }

      // Add system message to UI immediately
      const tempSystemMessage: Message = {
        id: `temp-system-${Date.now()}`,
        chatId: currentChat.id,
        role: 'system',
        content: template.content,
        timestamp: new Date()
      }
      addMessage(tempSystemMessage)

      // Send message to API
      const createdMessage = await chatService.addMessage(currentChat.id, {
        ...systemMessage,
        branchId: activeBranchId || undefined,
      } as any)

      // Replace temp message with real one
      updateMessage(tempSystemMessage.id, createdMessage)

      toast.success(t('chat.message.templateInserted', { title: template.title }))
    } catch (error) {
      console.error('Error inserting system message:', error)
      toast.error(t('chat.error.insertSystemMessageFailed'))
    }
  }

  // Generate AI response with retry support
  const generateAIResponse = async (currentRetryCount: number = 0) => {
    try {
      // Merge character model overrides with active model settings
      let modelSettings = activeModel?.settings || {}
      
      if (character?.modelOverrides) {
        try {
          const overrides = typeof character.modelOverrides === 'string'
            ? JSON.parse(character.modelOverrides)
            : character.modelOverrides
          modelSettings = { ...modelSettings, ...overrides }
        } catch (error) {
          console.error('[ChatInterface] Failed to parse character model overrides:', error)
        }
      }
      
      const clientModel = activeModel
        ? {
            provider: activeModel.provider,
            model: activeModel.model,
            apiKey: activeModel.apiKey,
            baseUrl: activeModel.baseUrl,
            settings: modelSettings,
          }
        : undefined

      // 关键修复：添加配置验证
      if (!clientModel?.model) {
        console.error('[ChatInterface] Invalid model config - missing model:', clientModel)
        toast.error(t('chat.error.incompleteModelConfig'))
        resetGenerationState()
        return
      }

      // 检查 API Key（官方模型、系统模型和本地模型除外）
      const isOfficialOrSystem = (activeModel as any)?.isOfficial || (activeModel as any)?.isSystemModel
      if (!clientModel?.apiKey && clientModel?.provider !== 'local' && !isOfficialOrSystem) {
        console.error('[ChatInterface] Invalid model config - missing API key:', clientModel)
        toast.error(t('chat.error.missingAPIKey'))
        resetGenerationState()
        // 尝试重新加载模型
        try {
          await fetchModels()
        } catch (e) {
          console.error('[ChatInterface] Failed to refresh models:', e)
        }
        return
      }

      // Decide streaming based on user setting and capability detection
      const shouldStream = isStreamingEnabled && !streamingUnsupported
      // v15.0: 使用 getActiveDirectives() 获取所有启用的创意指令
      const creativeDirectives = getActiveDirectives()

      // 获取角色的微调设置（包含全局设定）
      const baseTuneSettings = character?.id ? await getCharacterTuneSettingsWithGlobal(character.id) : undefined
      
      // 🎭 v16: Inject NPC Context into Tune Settings
      // This allows the main character to be aware of active NPCs
      let tuneSettings = baseTuneSettings;
      if (activeNPCs.length > 0) {
         const npcSummary = activeNPCs.map(a => {
            const npc = a.npc as any;
            return `${npc.name} (${a.relationToMain || npc.defaultRelation || 'Neutral'})`;
         }).join(', ');
         
         const npcContext = `\n\n[Current Scene Context: Active NPCs present: ${npcSummary}. You should acknowledge their presence if relevant.]`;
         
         tuneSettings = {
            ...baseTuneSettings,
            customInstructions: (baseTuneSettings?.customInstructions || '') + npcContext
         } as any;
      }
      
      if (shouldStream) {
        // Create a temporary message for streaming updates
        const tempMessageId = `temp-ai-${Date.now()}`
        const tempMessage: Message = {
          id: tempMessageId,
          chatId: currentChat!.id,
          role: 'assistant',
          content: '',
          timestamp: new Date()
        }
        addMessage(tempMessage)

        // Create abort controller (keep it in store so cancel button can abort)
        const abortController = new AbortController()
        setAbortController(abortController)

        // Reset only progress at start; do NOT clear abortController here
        setGenerationProgress(0)

      await chatService.generateResponseStreaming(currentChat!.id, {
          modelId: activeModel?.id,
          clientModel,
          fastMode: isFastModeEnabled,
        branchId: activeBranchId || undefined,
          creativeDirectives,
          tuneSettings,
          // v28: 群聊模式
          chatMode,
          activeSpeakerId: activeSpeakerId || undefined,
          groupMembers: groupMembers.length > 0 ? groupMembers : undefined,
          timeout: 120000, // 120秒超时
          abortSignal: abortController.signal,
          onProgress: (elapsedSeconds: number) => {
            setGenerationProgress(elapsedSeconds)
            
            // 30秒后显示提醒
            if (elapsedSeconds === 30) {
              toast(t('chat.status.processingLong'), {
                duration: 3000,
                icon: '⏳'
              })
            }

            // 60秒后再次提醒
            if (elapsedSeconds === 60) {
              toast(t('chat.status.processingVeryLong'), {
                duration: 3000,
                icon: '🤖'
              })
            }
          },
          onChunk: (chunk: string, fullContent: string) => {
            const enabled = isStripReasoningEnabled()
            const cleaned = enabled ? stripReasoningBlocks(fullContent) : fullContent
            // 使用 RAF 批量更新，减少渲染频率（性能优化）
            batchUpdateMessage(tempMessageId, cleaned)
            // 强制跟随到底部，确保流式文本可见
            try {
              requestAnimationFrame(() => {
                scrollContainerToBottom(false)
              })
            } catch {}
          },
          onComplete: async (finalMessage: Message) => {
            // 刷新任何待处理的 RAF 更新
            if (rafBatchUpdate.current.rafId) {
              cancelAnimationFrame(rafBatchUpdate.current.rafId)
              rafBatchUpdate.current.rafId = null
            }

            // Ensure final content is set and state is reset
            const enabled = isStripReasoningEnabled()
            const cleaned = enabled ? stripReasoningBlocks(finalMessage.content) : finalMessage.content
            const displayMessage = { ...finalMessage, content: cleaned }
            
            updateMessage(tempMessageId, displayMessage)
            setIsTyping(false)
            setGenerating(false)
            setAbortController(null)

            // 消费一次性指令
            try { consumeOneShots() } catch {}
            // Trigger points update after successful generation (with retry to ensure DB sync)
            setTimeout(() => window.dispatchEvent(new Event('points-updated')), 100)
            setTimeout(() => window.dispatchEvent(new Event('points-updated')), 500)
            setTimeout(() => window.dispatchEvent(new Event('points-updated')), 1000)

            // 追踪亲密度 (使用 .then() 因为我们在非异步回调中)
            trackIntimacyMessage().then(result => {
              if (result?.levelUp) {
                const milestone = INTIMACY_MILESTONES.find(m => m.level === result.newLevel)
                if (milestone) {
                  toast.success(`🎉 亲密度提升到 ${result.newLevel}！${milestone.reward}`, {
                    duration: 4000,
                  })
                }
              }
            }).catch(e => {
              console.warn('[ChatInterface] Failed to track intimacy:', e)
            })

            // 自动播放新生成的消息（只播放 AI 助手的消息）
            if (ttsEnabled && autoPlay && finalMessage?.content && finalMessage?.role === 'assistant') {
              try {
                // 应用regex scripts格式化内容，然后提取对话部分
                const globalScripts = getRegexScripts()
                const activeScripts = getActiveRegexScripts(character?.id, globalScripts)
                const formattedHTML = applyRegexScripts(finalMessage.content, activeScripts)

                // 提取对话文本（优先提取.text-dialogue，排除.text-action和.text-thought）
                const dialogueText = extractDialogueFromHTML(formattedHTML, finalMessage.content, playMode)

                if (dialogueText) {
                  // 延迟一小段时间再播放，确保UI已更新
                  setTimeout(() => {
                    playTTS(dialogueText, finalMessage.id).catch(err => {
                      console.error('自动播放失败:', err)
                    })
                  }, 500)
                }
              } catch (err) {
                console.error('自动播放处理失败:', err)
              }
            }

            // 🌍 v17: Meta Gameplay - 每 5 轮对话更新一次世界状态 (羁绊、NPC)
            // 使用 message count 模 5 检测
            const currentMessageCount = messages.length + 1
            if (currentMessageCount % 5 === 0 && !abortController?.signal.aborted) {
              try {
                // 异步执行，不阻塞后续逻辑
                metaGameplayService.analyzeGameState(
                  currentChat!,
                  [...messages.filter(m => m.id !== tempMessageId), finalMessage],
                  intimacyLevel,
                  activeNPCs,
                  activeModel
                ).then(metaUpdates => {
                  if (metaUpdates) {
                    if (metaUpdates.bond?.change) {
                      toast(`羁绊变化: ${metaUpdates.bond.change > 0 ? '+' : ''}${metaUpdates.bond.change} (${metaUpdates.bond.reason})`, { icon: '❤️' })
                    }
                    if (metaUpdates.npcs?.activate?.length) {
                      toast(`NPC 进入视野: ${metaUpdates.npcs.activate.join(', ')}`, { icon: '👋' })
                      // 尝试自动激活 (如果有 ID)
                      // 这里需要 resolve name to ID
                    }
                  }
                }).catch(err => {
                   console.error('[MetaGameplay] Failed:', err)
                })
              } catch (e) {}
            }

            // 🎭 v16: NPC 激活检测
            // 在主角色回复完成后，检测是否需要激活 NPC
            if (finalMessage?.content && finalMessage?.role === 'assistant') {
              checkNPCActivation(finalMessage.content).catch(err => {
                console.warn('[ChatInterface] NPC activation check failed:', err)
              })
            }

            // 🎬 v17.2: Director Mode - 生成剧情建议（存储到 metadata，不污染 content）
            // 如果消息中没有选项，且不是取消状态，且是助手消息
            if (finalMessage?.content && finalMessage?.role === 'assistant' && !finalMessage.content.includes('[choice:') && !abortController?.signal.aborted) {
              try {
                // 🎬 v20.5: 立即显示加载状态
                setIsDirectorLoading(true)

                // 获取当前上下文（排除旧的临时消息，加入最新的 AI 回复）
                const contextMessages = [...messages.filter(m => m.id !== tempMessageId), finalMessage]

                // 🎬 v20.5: 获取用户人设
                const tuneSettingsForDirector = character?.id
                  ? await getCharacterTuneSettingsWithGlobal(character.id)
                  : undefined

                // 调用导演服务 - 获取结构化数据
                const directorResult = await directorService.generateSuggestions(
                  currentChat!,
                  contextMessages,
                  character,
                  activeModel,
                  // 🎬 v20.5: 传递用户人设和亲密度
                  {
                    userPersona: tuneSettingsForDirector?.userPersona,
                    intimacyLevel,
                    tuneSettings: tuneSettingsForDirector,
                  }
                )

                if (directorResult) {
                  // v17.2: 存储到 metadata，不修改 content
                  const existingMetadata = finalMessage.metadata
                    ? (typeof finalMessage.metadata === 'string'
                        ? JSON.parse(finalMessage.metadata)
                        : finalMessage.metadata)
                    : {}

                  const newMetadata = {
                    ...existingMetadata,
                    director: directorResult,
                  }

                  // UI Update: 只更新 metadata，保持 content 不变
                  updateMessage(finalMessage.id, {
                    ...finalMessage,
                    metadata: newMetadata as any
                  })

                  // Server Update: 更新 metadata
                  await chatService.updateMessageMetadata(
                    currentChat!.id,
                    finalMessage.id,
                    newMetadata
                  )

                  toast.success('剧情建议已生成', { duration: 2000 })
                }
              } catch (error) {
                console.error('[Director] Failed to generate suggestions:', error)
              } finally {
                // 🎬 v20.5: 关闭加载状态
                setIsDirectorLoading(false)
              }
            }
          },
          onError: (error: string, errorType?: 'timeout' | 'cancelled' | 'network' | 'server') => {
            // 刷新任何待处理的 RAF 更新
            if (rafBatchUpdate.current.rafId) {
              cancelAnimationFrame(rafBatchUpdate.current.rafId)
              rafBatchUpdate.current.rafId = null
            }
            resetGenerationState()
            
            // 处理取消操作
            if (errorType === 'cancelled') {
              updateMessage(tempMessageId, { content: '[已取消生成]' })
              toast(t('chat.status.generationCancelled'), { icon: '⏹️' })
              return
            }
            
            // 处理其他错误 - 默认为 server 错误
            const finalErrorType = errorType as 'timeout' | 'network' | 'server' | 'cancelled' || 'server'
            setRetryError({ message: error, type: finalErrorType })
            
            // 自动重试一次：对常见 5xx 错误（如 502/503/504），首次失败时静默重试
            const isServer5xx = /\b(5\d{2})\b/.test(error)
            if (finalErrorType === 'server' && currentRetryCount === 0 && isServer5xx) {
              try {
                // 移除上一次的临时消息，避免出现两个“正在输入”
                deleteMessage(tempMessageId)
              } catch {}
              // 静默发起一次重试（不弹窗）
              void generateAIResponse(currentRetryCount + 1)
              return
            }

            // 如果还能重试，显示重试对话框（cancelled 已在上面return了）
            if (currentRetryCount < maxRetries) {
              setRetryCount(currentRetryCount)
              setShowRetryDialog(true)
              setPendingRetryAction(() => async () => {
                setShowRetryDialog(false)
                // 移除失败的临时消息，防止产生多个临时气泡
                try { deleteMessage(tempMessageId) } catch {}
                await generateAIResponse(currentRetryCount + 1)
              })
            } else {
              // 已达到最大重试次数
              setError(error)
              toast.error(currentRetryCount >= maxRetries ? '已达到最大重试次数' : error)
              updateMessage(tempMessageId, { content: '[生成失败]' })
            }
          },
          onFallback: () => {
            // 一次会话内记住不支持流式
            setStreamingUnsupported(true)
          }
        })
      } else {
        // Non-streaming with unified UI and cancel support
        const tempMessageId = `temp-ai-${Date.now()}`
        const tempMessage: Message = {
          id: tempMessageId,
          chatId: currentChat!.id,
          role: 'assistant',
          content: '',
          timestamp: new Date()
        }
        addMessage(tempMessage)

        const abortController = new AbortController()
        setAbortController(abortController)
        // Reset only progress at start; do NOT clear abortController here
        setGenerationProgress(0)

        const startedAt = Date.now()
        const progressInterval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startedAt) / 1000)
          setGenerationProgress(elapsed)
        }, 1000)

        try {
          const response = await chatService.generateResponse(currentChat!.id, {
            modelId: activeModel?.id,
            clientModel,
            fastMode: isFastModeEnabled,
            tuneSettings,
            branchId: activeBranchId || undefined,
            creativeDirectives,
            abortSignal: abortController.signal,
          })

          const enabled = isStripReasoningEnabled()
          const finalMessage = enabled && (response as any)?.message?.content
            ? { ...(response as any).message, content: stripReasoningBlocks((response as any).message.content) }
            : (response as any).message

          updateMessage(tempMessageId, finalMessage)
          resetGenerationState()
          setRetryCount(0)
          // 消费一次性指令
          try { consumeOneShots() } catch {}
          // Trigger points update after successful generation (with retry to ensure DB sync)
          setTimeout(() => window.dispatchEvent(new Event('points-updated')), 100)
          setTimeout(() => window.dispatchEvent(new Event('points-updated')), 500)
          setTimeout(() => window.dispatchEvent(new Event('points-updated')), 1000)

          // 追踪亲密度 (使用 .then() 因为我们在非异步回调中)
          trackIntimacyMessage().then(result => {
            if (result?.levelUp) {
              const milestone = INTIMACY_MILESTONES.find(m => m.level === result.newLevel)
              if (milestone) {
                toast.success(`🎉 亲密度提升到 ${result.newLevel}！${milestone.reward}`, {
                  duration: 4000,
                })
              }
            }
          }).catch(e => {
            console.warn('[ChatInterface] Failed to track intimacy:', e)
          })
        } catch (e: any) {
          resetGenerationState()
          if (e?.message === 'CANCELLED_GENERATION') {
            updateMessage(tempMessageId, { content: '[已取消生成]' })
            toast('已取消生成', { icon: '⏹️' })
          } else {
            setError(e?.message || t('chat.error.generationFailed'))
            toast.error(e?.message || t('chat.error.generationFailed'))
            updateMessage(tempMessageId, { content: '[生成失败]' })
          }
        } finally {
          clearInterval(progressInterval)
        }
      }

    } catch (error) {
      console.error('Error generating response:', error)
      resetGenerationState()

      // 不自动重试 catch 的错误，因为通常是代码层面的问题
      setError(t('chat.error.generationFailed'))
      toast.error(t('chat.error.generationFailed'))
    }
  }

  // Handle retry action
  const handleRetry = async () => {
    if (pendingRetryAction) {
      setShowRetryDialog(false)
      await pendingRetryAction()
      setPendingRetryAction(null)
    }
  }

  // Handle cancel retry
  const handleCancelRetry = () => {
    setShowRetryDialog(false)
    setPendingRetryAction(null)
    setRetryCount(0)
    setGenerating(false)
    toast(t('chat.status.retryCancelled'), { icon: '❌' })
  }

  // Handle continuing incomplete interaction
  const handleContinueIncomplete = async () => {
    if (!currentChat || !character || isGenerating) {
      return
    }

    try {
      clearError()
      setGenerating(true)
      resetIncompleteInteraction()

      // 检查最后一条消息
      const lastMessage = messages[messages.length - 1]

      if (lastMessage?.role === 'user') {
        // 场景A: 最后一条是用户消息，直接生成AI回复
        await generateAIResponse()
      } else if (lastMessage?.role === 'assistant') {
        // 场景B: 最后一条是AI消息但未完成
        const isEmpty = !lastMessage.content || lastMessage.content.trim() === ''
        const isTempMessage = lastMessage.id.startsWith('temp-ai-')
        const isFailedMessage = lastMessage.content === '[生成失败]' || lastMessage.content === '[已取消生成]'

        // 如果是空的、临时的或失败的消息，先删除再重新生成
        if (isEmpty || isTempMessage || isFailedMessage) {
          deleteMessage(lastMessage.id)
        }

        const previousUserMessages = messages.filter(m => m.role === 'user')
        if (previousUserMessages.length > 0) {
          // 重新生成
          await generateAIResponse()
        }
      }

      toast.success(t('chat.status.continuingGeneration'))
    } catch (error) {
      console.error('Error continuing incomplete interaction:', error)
      setError(t('chat.error.continueFailed'))
      toast.error(t('chat.error.continueFailed'))
    } finally {
      // 确保结束继续生成流程时关闭 Loading 状态
      setGenerating(false)
    }
  }

  // Handle dismissing incomplete interaction prompt
  const handleDismissIncomplete = () => {
    dismissIncompleteInteraction()
    toast(t('chat.status.incompleteDismissed'), { icon: '👌' })
  }

  // Handle regenerating the last response
  const handleRegenerate = async () => {
    if (!isModelConfigured || !isModelReady) {
      toast.error(t('chat.chatInterface.noModel'))
      assertModelReady()
      return
    }
    if (!currentChat || !character || isGenerating) return

    // 判断最后一条消息类型，智能处理不同场景
    const lastMessage = messages[messages.length - 1]

    // 场景1：最后一条是用户消息 → 直接生成AI回复（用户发送消息但AI未回复）
    if (lastMessage?.role === 'user') {
      await generateAIResponse()
      return
    }

    // 场景2：最后一条是assistant消息 → 重新生成（AI已回复，用户不满意）
    if (lastMessage?.role === 'assistant') {
      try {
        clearError()
        setGenerating(true)

        // 检查是否是空的、临时的或失败的消息
        const isEmpty = !lastMessage.content || lastMessage.content.trim() === ''
        const isTempMessage = lastMessage.id.startsWith('temp-ai-')
        const isFailedMessage = lastMessage.content === '[生成失败]' || lastMessage.content === '[已取消生成]'

        // 如果是空的、临时的或失败的消息，删除后重新生成
        if (isEmpty || isTempMessage || isFailedMessage) {
          deleteMessage(lastMessage.id)
          await generateAIResponse()
          return
        }

        // Prepare model options (keep parity with generate flow)
        const clientModel = activeModel
          ? {
              provider: activeModel.provider,
              model: activeModel.model,
              apiKey: activeModel.apiKey,
              baseUrl: activeModel.baseUrl,
              settings: activeModel.settings || {},
            }
          : undefined

        // Optimistically clear last assistant content while waiting
        const assistantMessages = messages.filter((msg) => msg.role === 'assistant')
        const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]
        if (lastAssistantMessage) {
          updateMessage(lastAssistantMessage.id, {
            content: '',
            metadata: { ...lastAssistantMessage.metadata, isRegenerated: true }
          })
        }

        // Non-streaming regenerate with extended timeout (server also supports streaming if later needed)
        const response = await chatService.regenerateResponse(
          currentChat.id,
          {
            modelId: activeModel?.id,
            clientModel,
            fastMode: isFastModeEnabled,
            creativeDirectives: getActiveDirectives(),
          },
          300000 // 5min timeout for long generations
        )

        // Update or add the regenerated message
        const enabled = isStripReasoningEnabled()
        const finalMessage = enabled && (response as any)?.message?.content
          ? { ...(response as any).message, content: stripReasoningBlocks((response as any).message.content) }
          : (response as any).message

        if (lastAssistantMessage) {
          updateMessage(lastAssistantMessage.id, finalMessage)
        } else {
          addMessage(finalMessage)
        }

        // 消费一次性指令
        try { consumeOneShots() } catch {}

      } catch (error) {
        console.error('Error regenerating response:', error)
        setError(t('chat.error.regenerateFailed'))
        toast.error(t('chat.error.regenerateFailed'))
      } finally {
        setGenerating(false)
      }
    }
  }

  // Regenerate starting from a specific assistant message (in-place)
  const handleRegenerateFromMessage = async (messageId: string) => {
    if (!currentChat || !character || isGenerating) return

    try {
      const idx = messages.findIndex(m => m.id === messageId)
      if (idx === -1) return
      const target = messages[idx]
      if (target.role !== 'assistant') return

      // 检查是否是空的、临时的或失败的消息
      const isEmpty = !target.content || target.content.trim() === ''
      const isTempMessage = target.id.startsWith('temp-ai-')
      const isFailedMessage = target.content === '[生成失败]' || target.content === '[已取消生成]'

      // 如果是空的、临时的或失败的消息，删除后重新生成
      if (isEmpty || isTempMessage || isFailedMessage) {
        deleteMessage(target.id)
        toast.success('已清理卡住的消息，正在重新生成')
        await generateAIResponse()
        return
      }

      // In-place rewrite: remove所有该消息之后的内容，然后从该处重新生成
      // 1) 后端删除
      await chatService.deleteMessagesAfter(currentChat.id, messageId)

      // 2) 前端本地同步删除
      const cutoffIndex = messages.findIndex(m => m.id === messageId)
      if (cutoffIndex >= 0) {
        const idsToRemove = messages.slice(cutoffIndex + 1).map(m => m.id)
        for (const id of idsToRemove) {
          deleteMessage(id)
        }
      }

      toast.success('已清理后续内容，正在该处重新生成')
      // 3) 重新生成
      await generateAIResponse()
    } catch (error) {
      console.error('Error in-place regenerate:', error)
      toast.error(t('chat.error.regenerateFailed'))
    }
  }

  // Regenerate as new branch from a specific assistant message
  const handleRegenerateFromMessageAsBranch = async (messageId: string) => {
    if (!currentChat || !character || isGenerating) return

    try {
      const idx = messages.findIndex(m => m.id === messageId)
      if (idx === -1) return
      const target = messages[idx]
      if (target.role !== 'assistant') return

      // 创建真实分支（服务器端自动摘要+保留最近4条）
      const branchTitle = `${currentChat.title} · 分支 @ ${new Date().toLocaleString(getLocale(), { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`
      const res = await chatService.createBranch(currentChat.id, {
        branchPointMessageId: messageId,
        title: branchTitle,
      })

      // 切换到该分支
      setActiveBranchId(res.branch.id)
      clearMessages()
      toast(t('chat.status.creatingBranch'), { icon: '⏳' })

      // 轮询分支状态（最长5分钟）
      const start = Date.now()
      const timeoutMs = 5 * 60 * 1000
      let ready = false
      while (Date.now() - start < timeoutMs) {
        try {
          const statusRes = await fetch(`/api/chats/${currentChat.id}/branches/status?branchId=${res.branch.id}`)
          const data = await statusRes.json()
          if (data.status === 'ready' || data.status === 'completed') {
            ready = true
            break
          }
        } catch {}
        await new Promise(r => setTimeout(r, 2000))
      }

      if (!ready) {
        toast(t('chat.status.branchPrepareTimeout'), { icon: '⌛' })
      } else {
        await refreshMessages()
        toast.success(t('chat.status.branchReady'))
        // 在分支内生成新的 AI 回复
        await generateAIResponse()
      }
    } catch (error) {
      console.error('Error creating branch and regenerating:', error)
      toast.error(t('chat.error.branchRegenerateFailed'))
    }
  }

  // Helper: Get or create default character
  const getOrCreateDefaultCharacter = async () => {
    let characterToUse = character || characters[0]
    
    if (!characterToUse) {
      // First, try to find existing AI Assistant character to avoid 409 conflict
      console.log('[ChatInterface] No characters found, searching for existing AI Assistant...')
      try {
        const response = await fetch('/api/characters?search=AI Assistant&limit=1')
        if (response.ok) {
          const data = await response.json()
          if (data.characters && data.characters.length > 0) {
            characterToUse = data.characters[0]
            console.log('[ChatInterface] Using existing AI Assistant character:', characterToUse.id)
          }
        }
      } catch (err) {
        console.error('[ChatInterface] Failed to fetch existing character:', err)
      }
      
      // Only create if not found
      if (!characterToUse) {
        console.log('[ChatInterface] Creating new AI Assistant character...')
        const newCharacter = await createCharacter({
          name: 'AI Assistant',
          description: 'A helpful AI assistant',
          personality: 'Helpful, friendly, and knowledgeable',
          firstMessage: 'Hello! How can I help you today?',
          background: 'An AI assistant designed to help with various tasks and questions.',
          exampleMessages: [
            "I can help you with a wide range of topics. What would you like to know?",
            "Feel free to ask me anything! I'm here to assist you.",
            "What's on your mind today? I'm ready to help!"
          ],
          tags: ['assistant', 'helpful', 'ai'],
        })

        if (newCharacter) {
          characterToUse = newCharacter
        } else {
          throw new Error('Failed to create default character')
        }
      }
    }
    
    return characterToUse
  }

  // Send greeting and opener template
  const sendGreetingAndOpener = async (newChat: any, characterToUse: Character) => {
    // ST parity: auto-send greeting and prefill opener
    const flagsEnabled = (process.env.NEXT_PUBLIC_ST_PARITY_GREETING_ENABLED ?? 'true') !== 'false'
    const shouldAutoSend = flagsEnabled && appSettings.autoSendGreeting !== false
    const greeting = (characterToUse.firstMessage || '').toString().trim()
    if (shouldAutoSend && greeting && !hasSentGreeting(newChat.id, greeting)) {
      // ✅ 立即标记为已发送（在异步操作之前），防止竞态条件
      markGreetingSent(newChat.id, greeting)

      const greetMsg = await chatService.addMessage(newChat.id, {
        role: 'assistant',
        content: greeting,
      })
      addMessage(greetMsg)
    }

    const template = (appSettings.openerTemplate || '').trim()
    if (template) {
      const substituted = template
        .replace(/\{\{user\}\}/g, appSettings.userName || 'User')
        .replace(/\{\{char\}\}/g, characterToUse.name)
        .replace(/\{\{scenario\}\}/g, characterToUse.background || characterToUse.scenario || '')
      setInputValue(substituted)
      inputRef.current?.focus()
    }
  }

  // Handle greeting selection from GreetingSelector
  const handleGreetingSelected = async (greetingId: string | null) => {
    setShowGreetingSelector(false)

    if (!pendingChatCharacter) {
      console.error('[ChatInterface] No pending character for greeting selection')
      return
    }

    try {
      setLoading(true)
      setSelectedGreetingId(greetingId)

      // 🔧 处理不同的操作模式
      if (pendingNewChatMode === 'preserve') {
        // 保留主线模式：创建新对话并复制消息
        const newChat = await chatService.createChat({
          title: currentChat ? `${currentChat.title} · 副本` : `与 ${pendingChatCharacter.name} 的对话`,
          characterId: pendingChatCharacter.id,
          greetingId: greetingId || undefined,
          settings: { modelId: activeModel?.id }
        })

        // 复制所有消息
        if (currentChat && messages.length > 0) {
          for (const msg of messages) {
            await chatService.addMessage(newChat.id, {
              content: msg.content,
              role: msg.role,
              metadata: msg.metadata || {}
            })
          }
        }

        setCurrentChat(newChat)
        setCharacter(pendingChatCharacter)

        // Load messages for new chat
        const loadedMessages = await chatService.getMessages(newChat.id)
        clearMessages()
        loadedMessages.messages.forEach(msg => addMessage(msg))

        toast.success(t('chat.status.linePreservedNewChat'))
        setPendingNewChatMode(null)
      } else if (pendingNewChatMode === 'reset') {
        // 重置模式：清空当前对话并发送新开场白
        if (!currentChat) {
          console.error('[ChatInterface] No current chat for reset mode')
          return
        }

        // 删除所有消息
        for (const msg of messages) {
          await chatService.deleteMessage(currentChat.id, msg.id)
        }

        clearMessages()

        // 发送选中的开场白
        if (pendingChatCharacter) {
          await sendGreetingAndOpener(currentChat, pendingChatCharacter)
        }

        toast.success(t('chat.status.chatReset'))
        setPendingNewChatMode(null)
      } else {
        // 默认模式：首次创建对话
        const newChat = await chatService.createChat({
          title: `与 ${pendingChatCharacter.name} 的对话 - ${new Date().toLocaleString(getLocale(), {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}`,
          characterId: pendingChatCharacter.id,
          greetingId: greetingId || undefined,
          settings: {
            modelId: activeModel?.id
          }
        })

        console.log('[ChatInterface] Created new chat with greeting:', newChat.id, greetingId)

        // Set chat and character
        setCurrentChat(newChat)
        setCharacter(pendingChatCharacter)

        // Load messages (greeting should be automatically created by backend)
        const loadedMessages = await chatService.getMessages(newChat.id)
        clearMessages()
        loadedMessages.messages.forEach(msg => addMessage(msg))

        // Apply opener template if configured
        const template = (appSettings.openerTemplate || '').trim()
        if (template) {
          const substituted = template
            .replace(/\{\{user\}\}/g, appSettings.userName || 'User')
            .replace(/\{\{char\}\}/g, pendingChatCharacter.name)
            .replace(/\{\{scenario\}\}/g, pendingChatCharacter.background || pendingChatCharacter.scenario || '')
          setInputValue(substituted)
          inputRef.current?.focus()
        }

        toast.success(t('chat.chatInterface.chatCreated', { name: pendingChatCharacter.name }))
      }

      // Clean up
      setPendingChatCharacter(null)
      setSelectedGreetingId(null)

    } catch (error) {
      console.error('[ChatInterface] Error creating chat with greeting:', error)
      toast.error(t('chat.error.createChatFailed'))
      setPendingChatCharacter(null)
    } finally {
      setLoading(false)
    }
  }

  // Handle Chat Entry Wizard confirmation (新的聊天进入向导确认)
  const handleChatEntryWizardConfirm = async (config: ChatEntryConfig) => {
    if (!wizardCharacter) {
      console.error('[ChatInterface] No wizard character for chat entry')
      return
    }

    try {
      setLoading(true)

      console.log('[ChatInterface] Creating chat with wizard config:', config)

      // 1. 创建新对话
      const newChat = await chatService.createChat({
        title: `与 ${wizardCharacter.name} 的对话 - ${new Date().toLocaleString(getLocale(), {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })}`,
        characterId: wizardCharacter.id,
        greetingId: config.greetingId || undefined,
        settings: {
          modelId: activeModel?.id
        }
      })

      console.log('[ChatInterface] Created new chat:', newChat.id)

      // 2. 设置聊天和角色
      setCurrentChat(newChat)
      setCharacter(wizardCharacter)

      // 3. ⚠️ 重要：在加载消息之前先设置 persona choice，避免 useEffect 误判
      if (!config.useDefaultSettings) {
        // 用户选择自定义设定
        if (wizardCharacter.id) {
          console.log('[ChatInterface] Setting persona choice: custom for character:', wizardCharacter.id)
          setCharacterPersonaChoice(wizardCharacter.id, 'custom')
        }
      } else {
        // 用户选择遵循角色卡设定
        if (wizardCharacter.id) {
          console.log('[ChatInterface] Setting persona choice: global for character:', wizardCharacter.id)
          setCharacterPersonaChoice(wizardCharacter.id, 'global')
        }
      }

      // 4. 加载消息（开场白应该由后端自动创建）
      const loadedMessages = await chatService.getMessages(newChat.id)
      clearMessages()
      loadedMessages.messages.forEach(msg => addMessage(msg))

      // 4. 应用 TTS 设置
      if (config.ttsSettings) {
        const { useTTSStore } = await import('@/stores/ttsStore')
        const ttsStore = useTTSStore.getState()
        ttsStore.setEnabled(config.ttsSettings.enabled)
        ttsStore.setAutoPlay(config.ttsSettings.autoPlay)
        ttsStore.setVoiceType(config.ttsSettings.voiceType)
      }

      // 5. 如果选择了预设，应用预设
      if (config.presetId) {
        try {
          // 应用预设到聊天（使用 PUT 方法）
          const presetRes = await fetch(`/api/chats/${newChat.id}/preset`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ presetId: config.presetId })
          })
          if (presetRes.ok) {
            console.log('[ChatInterface] Applied preset:', config.presetId)
          } else {
            console.warn('[ChatInterface] Failed to apply preset:', await presetRes.text())
          }
        } catch (err) {
          console.warn('[ChatInterface] Failed to apply preset:', err)
        }
      }

      // 6. 如果用户选择"自定义设定"，延迟打开设置向导
      if (!config.useDefaultSettings) {
        setTimeout(() => {
          setShowRoleWizard(true)
        }, 500)
      }

      // 6.5 🎭 v22 如果用户选择沉浸模式，启用 RPG 模式
      if (config.enableImmersiveMode) {
        const { useRPGModeStore } = await import('@/stores/rpgModeStore')
        const rpgStore = useRPGModeStore.getState()
        rpgStore.setRPGMode(true)
        console.log('[ChatInterface] Enabled immersive RPG mode')
      }

      // 7. 应用 opener 模板（如果配置了）
      const template = (appSettings.openerTemplate || '').trim()
      if (template) {
        const substituted = template
          .replace(/\{\{user\}\}/g, appSettings.userName || 'User')
          .replace(/\{\{char\}\}/g, wizardCharacter.name)
          .replace(/\{\{scenario\}\}/g, wizardCharacter.background || wizardCharacter.scenario || '')
        setInputValue(substituted)
        inputRef.current?.focus()
      }

      toast.success(t('chat.chatInterface.chatCreated', { name: wizardCharacter.name }))

      // 🔧 重要修复：成功创建对话后，标记已确认并关闭向导
      // 设置 ref 防止 onClose 触发跳转
      wizardConfirmedRef.current = true
      setShowChatEntryWizard(false)
      setWizardCharacter(null)

    } catch (error) {
      console.error('[ChatInterface] Error creating chat from wizard:', error)
      toast.error(t('chat.error.createChatFailed'))
      // 失败时也关闭向导和清理状态，但不设置 confirmed ref，让用户返回角色列表
      setShowChatEntryWizard(false)
      setWizardCharacter(null)
    } finally {
      setLoading(false)
    }
  }

  // Mode 1: Preserve and create new (保留主线) - 复制所有消息到新对话
  const handlePreserveAndNew = async () => {
    try {
      setLoading(true)
      const characterToUse = await getOrCreateDefaultCharacter()

      // 🔧 检查是否有多个开场白，如有则显示选择器
      try {
        const greetingsResponse = await fetch(`/api/characters/${characterToUse.id}/greetings`)
        if (greetingsResponse.ok) {
          const greetingsData = await greetingsResponse.json()
          const greetings = greetingsData.greetings || []

          // 如果有多个开场白，显示选择器
          if (greetings.length > 1) {
            console.log('[ChatInterface] Character has multiple greetings for new chat, showing selector')
            setPendingChatCharacter(characterToUse)
            setPendingNewChatMode('preserve')
            setShowGreetingSelector(true)
            setLoading(false)
            return
          }
        }
      } catch (err) {
        console.warn('[ChatInterface] Failed to check greetings for new chat, continuing with default:', err)
      }

      const newChat = await chatService.createChat({
        title: currentChat ? `${currentChat.title} · 副本` : `与 ${characterToUse.name} 的对话`,
        characterId: characterToUse.id,
        greetingId: selectedGreetingId || undefined,
        settings: { modelId: activeModel?.id }
      })
      
      // 复制所有消息
      if (currentChat && messages.length > 0) {
        for (const msg of messages) {
          await chatService.addMessage(newChat.id, {
            content: msg.content,
            role: msg.role,
            metadata: msg.metadata || {}
          })
        }
      }
      
      setCurrentChat(newChat)
      setCharacter(characterToUse)
      
      // Load messages for new chat
      const loadedMessages = await chatService.getMessages(newChat.id)
      clearMessages()
      loadedMessages.messages.forEach(msg => addMessage(msg))

      toast.success(t('chat.status.linePreserved'))
    } catch (error) {
      console.error('Error preserving chat:', error)
      toast.error(t('chat.error.duplicateCreationFailed'))
    } finally {
      setLoading(false)
    }
  }

  // Mode 2: Reset current (重制主线) - 清空当前对话
  const handleResetCurrent = async () => {
    if (!currentChat) {
      // 如果没有当前对话，降级为保留主线
      await handlePreserveAndNew()
      return
    }

    if (!confirm('确定要清空当前对话的所有消息吗？此操作不可恢复。')) {
      return
    }

    try {
      setLoading(true)

      // 🔧 检查是否有多个开场白，如有则显示选择器
      if (character) {
        try {
          const greetingsResponse = await fetch(`/api/characters/${character.id}/greetings`)
          if (greetingsResponse.ok) {
            const greetingsData = await greetingsResponse.json()
            const greetings = greetingsData.greetings || []

            // 如果有多个开场白，显示选择器
            if (greetings.length > 1) {
              console.log('[ChatInterface] Character has multiple greetings for reset, showing selector')
              setPendingChatCharacter(character)
              setPendingNewChatMode('reset')
              setShowGreetingSelector(true)
              setLoading(false)
              return
            }
          }
        } catch (err) {
          console.warn('[ChatInterface] Failed to check greetings for reset, continuing with default:', err)
        }
      }

      // 删除所有消息
      for (const msg of messages) {
        await chatService.deleteMessage(currentChat.id, msg.id)
      }

      clearMessages()
      toast.success(t('chat.status.chatReset'))

      // 如果有角色，发送欢迎消息（使用选中的开场白）
      if (character) {
        await sendGreetingAndOpener(currentChat, character)
      }
    } catch (error) {
      console.error('Error resetting chat:', error)
      toast.error(t('chat.error.resetFailed'))
    } finally {
      setLoading(false)
    }
  }

  // Mode 3: Branch from message (开启新分支) - 让用户选择分支点
  const handleBranchFromMessage = async () => {
    if (!currentChat || messages.length === 0) {
      toast.error(t('chat.error.emptyChat'))
      return
    }

    // 设置分支模式，让用户点击消息选择分支点
    setBranchMode(true)
    toast(t('chat.status.branchModeActive'), { icon: 'ℹ️' })
  }

  // Cancel branch mode
  const handleCancelBranchMode = () => {
    setBranchMode(false)
    toast.success(t('chat.status.branchModeCancelled'))
  }

  // Create new chat - dispatcher
  const handleNewChat = async (mode: 'preserve' | 'reset' | 'branch' = 'preserve') => {
    // Check if we have an active model configured (from localStorage)
    if (!isModelConfigured || !isModelReady) {
      toast.error(t('chat.chatInterface.noModel'))
      assertModelReady()
      return
    }

    switch (mode) {
      case 'preserve':
        await handlePreserveAndNew()
        break
      case 'reset':
        await handleResetCurrent()
        break
      case 'branch':
        await handleBranchFromMessage()
        break
    }
  }

  // Handle character selection
  const handleCharacterSelect = (character: any) => {
    setCharacter(character)
    toast.success(t('chat.status.characterSwitched', { name: character.name }))
  }

  // Edit and delete message handlers wired for MessageList
  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!currentChat) return
    try {
      const updated = await chatService.updateMessage(currentChat.id, messageId, newContent)
      updateMessage(messageId, { content: updated.content })
      toast.success(t('chat.message.updated'))
    } catch (e) {
      toast.error(t('chat.error.updateMessageFailed'))
    }
  }

  const handleDeleteMessageSingle = async (messageId: string) => {
    if (!currentChat) return
    try {
      await chatService.deleteMessage(currentChat.id, messageId)
      deleteMessage(messageId)
      toast.success(t('chat.message.deleted'))
    } catch (e) {
      toast.error(t('chat.error.deleteMessageFailed'))
    }
  }

  // 🎭 沉浸式交互选项处理 - 点击选项直接发送消息触发下一轮对话
  const handleChoiceSelect = useCallback(async (choice: ChoiceOption, messageId: string) => {
    // 标记选项已被选择
    setSelectedChoices(prev => ({
      ...prev,
      [messageId]: choice.id
    }))

    // 🚀 核心改进：直接发送选项文本触发下一轮对话
    if (choice.text && !isGenerating && currentChat && character) {
      // 清空输入框并发送选项内容
      const choiceMessage = choice.text.trim()
      if (choiceMessage) {
        // 直接调用发送消息，不需要用户手动确认
        await handleSendMessage(choiceMessage)
      }
    }
  }, [isGenerating, currentChat, character, handleSendMessage])

  // 🎬 v17.2 Director 选项处理 - 点击选项发送消息并更新 metadata
  const handleDirectorChoiceSelect = useCallback(async (choice: DirectorChoice, messageId: string) => {
    if (!currentChat || isGenerating) return

    try {
      // 1. 更新消息的 metadata，标记选项已被选择
      const message = messages.find(m => m.id === messageId)
      if (message) {
        const existingMetadata = message.metadata
          ? (typeof message.metadata === 'string'
              ? JSON.parse(message.metadata)
              : message.metadata)
          : {}

        if (existingMetadata.director) {
          existingMetadata.director.selectedChoiceId = choice.id
          existingMetadata.director.interacted = true

          // 更新本地状态
          updateMessage(messageId, {
            ...message,
            metadata: existingMetadata as any
          })

          // 更新服务器
          await chatService.updateMessageMetadata(currentChat.id, messageId, existingMetadata)
        }
      }

      // 2. 发送选项文本作为用户消息
      const choiceMessage = choice.text.trim()
      if (choiceMessage) {
        await handleSendMessage(choiceMessage)
      }
    } catch (error) {
      console.error('[Director] Failed to handle choice select:', error)
      toast.error('选择失败，请重试')
    }
  }, [currentChat, isGenerating, messages, updateMessage, handleSendMessage])

  // 🎭 v22.1: Handle user persona changes from TheaterSidePanel
  const handleUserPersonaChange = useCallback((persona: UserPersona) => {
    setUserPersona(persona)
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('user_persona', JSON.stringify(persona))
        // Also update appSettings userName if persona name changed
        if (persona.name && persona.name !== appSettings.userName) {
          const newSettings = { ...appSettings, userName: persona.name }
          setAppSettings(newSettings)
          localStorage.setItem('app_settings', JSON.stringify(newSettings))
        }
        toast.success('人设已保存', { duration: 1500 })
      } catch (err) {
        console.error('[ChatInterface] Failed to save user persona:', err)
      }
    }
  }, [appSettings])

  return (
    <div 
      className={`flex flex-col ${isMobile ? 'h-[100dvh]' : 'h-full'} w-full max-w-full mobile-safe-container`}
      style={{ position: 'relative' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Plugin Overlay Container - 降低 z-index 避免与 Modal/Menu 冲突 */}
      <div
        id="chat-plugin-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 50  // 降低 z-index，Modal 默认是 200，Menu 是 300
        }}
      />
      
      {/* Swipe Back Indicator */}
      {isMobile && swipeProgress > 0 && (
        <div className={`swipe-back-indicator ${swipeProgress > 0.5 ? 'active' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </div>
      )}

      {/* 🎯 侧边栏快捷控制按钮 - 仅桌面端显示 */}
      {!isMobile && (
        <>
          {/* 左侧边栏控制按钮 - RPG模式使用增强版 */}
          {isRPGMode ? (
            <RPGSidebarToggle
              position="left"
              collapsed={immersiveLeftCollapsed}
              onToggle={() => {
                setImmersiveLeftCollapsed(!immersiveLeftCollapsed)
                onToggleLeftSidebar?.()
              }}
              visible={true}
            />
          ) : onToggleLeftSidebar && (
            <button
              onClick={onToggleLeftSidebar}
              className="sidebar-toggle-btn sidebar-toggle-left"
              title={isLeftSidebarOpen ? '收起对话设置' : '展开对话设置'}
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 100,
                width: '24px',
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(90deg, rgba(30, 30, 35, 0.95) 0%, rgba(30, 30, 35, 0.8) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderLeft: 'none',
                borderRadius: '0 8px 8px 0',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(90deg, rgba(45, 45, 50, 0.98) 0%, rgba(45, 45, 50, 0.9) 100%)'
                e.currentTarget.style.color = 'var(--accent-gold-hex)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(90deg, rgba(30, 30, 35, 0.95) 0%, rgba(30, 30, 35, 0.8) 100%)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: isLeftSidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}

          {/* 右侧边栏控制按钮 - RPG模式使用增强版 */}
          {isRPGMode ? (
            <RPGSidebarToggle
              position="right"
              collapsed={immersiveRightCollapsed}
              onToggle={() => {
                setImmersiveRightCollapsed(!immersiveRightCollapsed)
                onToggleRightSidebar?.()
              }}
              visible={true}
            />
          ) : onToggleRightSidebar && (
            <button
              onClick={onToggleRightSidebar}
              className="sidebar-toggle-btn sidebar-toggle-right"
              title="设置中心"
              style={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 100,
                width: '24px',
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(270deg, rgba(30, 30, 35, 0.95) 0%, rgba(30, 30, 35, 0.8) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRight: 'none',
                borderRadius: '8px 0 0 8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                color: 'rgba(255, 255, 255, 0.6)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(270deg, rgba(45, 45, 50, 0.98) 0%, rgba(45, 45, 50, 0.9) 100%)'
                e.currentTarget.style.color = 'var(--accent-gold-hex)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(270deg, rgba(30, 30, 35, 0.95) 0%, rgba(30, 30, 35, 0.8) 100%)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          )}
        </>
      )}

      {/* Header - v13: 统一使用最小顶栏（不提供站点级导航） */}
      <div className="flex-shrink-0">
        <ChatHeader
          chat={currentChat}
          character={character}
          onNewChat={handleNewChat}
          onViewCharacter={onViewCharacter}
          onOpenNPCPanel={() => setShowNPCPanel(true)}
          onOpenStoryTracking={() => setShowStoryTrackingPanel(true)}
          onOpenDirectorPanel={() => setShowDirectorOverlay(true)}
          isLeftSidebarOpen={isLeftSidebarOpen}
          isRightSidebarOpen={isRightSidebarOpen}
          onToggleLeftSidebar={onToggleLeftSidebar}
          onToggleRightSidebar={onToggleRightSidebar}
        />
      </div>

      {/* 🌍 v4.0 活世界系统 - 场景状态栏 */}
      {worldState && currentChat?.directorEnabled && (
        <div className="flex-shrink-0 px-3 py-1">
          <SceneStatusBar
            sceneName={worldState.currentScene?.name || null}
            sceneDescription={worldState.currentScene?.description || null}
            timeOfDay={worldState.timeOfDay || worldState.currentTime}
            weather={worldState.weather}
            season={worldState.season}
            daysPassed={worldState.daysPassed}
            enabled={true}
            compact={isMobile}
          />
        </div>
      )}

      {/* 🎭 v29 说话者切换条 - 多选模式，当有NPC且有对话时显示 */}
      {character && currentChat && activeNPCs.length > 0 && (
        <div className="flex-shrink-0 px-3 pb-2">
          <SpeakerSwitcher
            mainCharacter={{
              id: character.id,
              name: character.name,
              avatar: character.avatar,
              isMainCharacter: true,
            }}
            npcs={activeNPCs
              .filter(appearance => appearance?.npc && appearance.npc.id && appearance.npc.name?.trim())
              .map(appearance => ({
              id: appearance.npc!.id,
              name: appearance.npc!.name,
              avatar: appearance.npc!.avatar || undefined,
              isLocked: false,
            }))}
            selectedSpeakerIds={
              // v29: 从现有状态派生选中列表
              chatMode === 'group'
                ? [character.id, ...groupMembers]
                : [activeSpeakerId || character.id]
            }
            onSelectionChange={(speakerIds) => {
              // v29: 根据选中数量自动切换模式
              if (speakerIds.length > 1) {
                // 群聊模式：主角色 + NPCs
                setChatMode('group')
                setGroupMembers(speakerIds.filter(id => id !== character.id))
                setActiveSpeaker(character.id) // 群聊时主角色作为主说话者
              } else if (speakerIds.length === 1) {
                // 单人模式：可以是主角色或NPC
                setChatMode('single')
                setActiveSpeaker(speakerIds[0])
                setGroupMembers([])
              }
              // 不允许空选择（组件已处理）
            }}
            compact={isMobile}
          />
        </div>
      )}

      {/* Main Content Area (Messages + Portrait) */}
      <div className="flex-1 flex flex-row overflow-hidden w-full min-h-0 relative">
        {/* Left Portrait Panel */}
        {!isMobile && character && currentChat && dynamicImageSettings.enablePortraitPanel && dynamicImageSettings.panelPosition === 'left' && (
          <ChatDynamicImageSystem
            characterId={character.id}
            characterName={character.name}
            userId={currentUserId}
            charType={(character as any).charType || 'community'}
            enabled={true}
            position="left"
            defaultCollapsed={dynamicImageSettings.defaultCollapsed}
            latestAssistantMessage={latestAssistantMessage}
            onViewGallery={() => setShowGalleryModal(true)}
            chatId={currentChat.id}
            onIntimacyLevelUp={(level, milestone) => {
              console.log('[ChatInterface] Intimacy level up:', level, milestone)
            }}
            onCGUnlock={(cgId, milestone) => {
              console.log('[ChatInterface] CG unlocked:', cgId, 'at milestone', milestone)
            }}
          />
        )}

        {/* Messages Column */}
        <div className="flex-1 overflow-hidden flex flex-col w-full min-h-0 relative z-0">
          {!currentChat ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 p-4">
              <div className="max-w-md w-full">
                {/* 首次使用引导 - 未配置 AI 模型（等到 store hydration 完成再判断） */}
                {hydrated && !isModelConfigured && (
                  <div className="mb-6 bg-amber-900/20 border-2 border-amber-600/50 rounded-lg p-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-amber-400 mb-2">欢迎使用 SillyTavern！</h3>
                        <p className="text-gray-300 text-sm mb-4">
                          在开始对话前，您需要先配置一个 AI 模型。我们支持 OpenAI、Anthropic、Google 以及本地模型（如 Ollama）。
                        </p>
                        <button
                          onClick={() => openSettingsDrawer('models')}
                          className="tavern-button inline-flex items-center gap-2"
                        >
                          <Settings className="w-4 h-4" />
                          前往配置 AI 模型
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 常规欢迎界面 */}
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-medium mb-2">{t('chat.chatInterface.selectOrCreate')}</h3>
                  <p className="text-sm mb-4">
                    {!hasActiveModel
                      ? t('chat.chatInterface.configureModelFirst')
                      : t('chat.chatInterface.selectOrCreateChat')}
                  </p>
                  <button
                    onClick={() => handleNewChat()}
                    disabled={isLoading || !isModelConfigured}
                    className="tavern-button inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!isModelConfigured ? t('chat.chatInterface.noModel') : ''}
                  >
                    <Plus className="w-4 h-4" />
                    {t('chat.buttons.newChat')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* 未配置提示（在已有对话时也进行提示） */}
              {hydrated && !isModelConfigured && (
                <div className="mx-3 sm:mx-4 mt-3 mb-0 bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-700/60 text-amber-200 rounded-xl px-3 sm:px-4 py-3 text-xs flex items-start gap-2 backdrop-blur-sm shadow-lg shadow-amber-900/20">
                  <AlertCircle className="w-4 h-4 mt-0.5 text-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold mb-1 text-amber-300">未检测到有效的 AI 模型配置</div>
                    <div className="opacity-90 text-xs leading-relaxed">请先完成 AI 模型配置（API 地址、Key、模型ID），完成后再开始对话。</div>
                  </div>
                  <button
                    onClick={() => openSettingsDrawer('models')}
                    className="tavern-button-secondary text-xs px-2.5 py-1.5 whitespace-nowrap flex-shrink-0 rounded-lg hover:bg-amber-700/30 transition-all duration-300"
                  >
                    打开配置
                  </button>
                </div>
              )}

              {/* 创意模式快捷栏 - 让用户一眼看到并快速设置 */}
              {hydrated && character && currentChat && (
                <div className="flex-shrink-0 px-3 sm:px-4 pt-2 pb-1">
                  <CreativePresetBar
                    disabled={!canGenerate || isLoading || !isModelConfigured}
                  />
                </div>
              )}

              {/* 🎮 v21 RPG模式 - 全屏沉浸式体验 */}
              {/* 🎭 v27 Theater Soul v2 体验 */}
              {isTheaterSoulMode ? (
                <div className="flex-1 relative overflow-hidden min-h-0">
                  <ImmersiveChatV2Container
                    messages={messages as any}
                    character={character as any}
                    portraitUrl={(character as any)?.coverUrl || character?.avatar}
                    isGenerating={isGenerating}
                    onSendMessage={handleSendMessage}
                    inputValue={inputValue}
                    onInputChange={setInputValue}
                    canSend={canGenerate}
                    inputDisabled={!canGenerate || isLoading || !isModelConfigured}
                    userId={currentUserId}
                    onPlayTTS={ttsEnabled ? (content: string, messageId?: string) => {
                      // 如果正在播放同一条消息，则停止
                      if (isTTSPlaying && ttsCurrentMessageId === messageId) {
                        stopTTS()
                      } else {
                        // 提取对话文本后再播放
                        const globalScripts = getRegexScripts()
                        const activeScripts = getActiveRegexScripts(character?.id, globalScripts)
                        const formattedHTML = applyRegexScripts(content, activeScripts)
                        const dialogueText = extractDialogueFromHTML(formattedHTML, content, playMode)
                        if (dialogueText) {
                          playTTS(dialogueText, messageId || '')
                        }
                      }
                    } : undefined}
                    isTTSPlaying={isTTSPlaying}
                    ttsCurrentMessageId={ttsCurrentMessageId}
                    ttsEnabled={ttsEnabled}
                    onToggleTTS={() => {
                      // 打开设置面板的TTS选项卡
                      openSettingsDrawer('tts')
                    }}
                    className="h-full"
                    // 🎭 v33: 素材系统增强 - 背景图和场景切换
                    backgroundUrl={currentScene?.url || (character as any)?.coverUrl}
                    sceneAssets={sceneAssets}
                    currentScene={currentScene}
                    onSceneChange={setCurrentScene}
                    expressionAssets={expressionAssets}
                    cgAssets={cgAssets}
                    assetStats={{
                      expressions: expressionAssets.length,
                      scenes: sceneAssets.length,
                      cgs: cgAssets.length,
                      ...assetStats
                    }}
                    // 🎭 v29: 群聊模式支持 - 使用所有NPC，让渲染基于消息内容自动判断
                    groupMembers={activeNPCs
                      .filter(a => a.npc && a.npc.id && a.npc.name)
                      .map(a => ({
                        id: a.npc!.id,
                        name: a.npc!.name,
                        avatar: a.npc!.avatar || null,
                        isMainCharacter: false,
                      }))}
                  />
                </div>
              ) : isRPGMode ? (
                <div className="flex-1 relative overflow-hidden min-h-0">
                  <RPGModeContainer
                    messages={messages as any}
                    character={character as any}
                    portraitUrl={(character as any)?.coverUrl || character?.avatar}
                    expressionUrl={(character as any)?.generatedAvatar}
                    directorChoices={rpgDirectorChoices}
                    onOpenDirectorPanel={() => setShowDirectorOverlay(true)}
                    onStopGenerating={cancelGeneration}
                    inputValue={inputValue}
                    onInputChange={setInputValue}
                    onSendMessage={handleSendMessage}
                    inputDisabled={!canGenerate || isLoading || !isModelConfigured}
                    onChoiceSelect={(choice: RPGChoice) => {
                      if (!rpgDirector?.messageId) return
                      // 转换为 DirectorChoice 格式
                      handleDirectorChoiceSelect(
                        {
                          id: choice.id,
                          text: choice.text,
                          emoji: choice.emoji,
                          type: choice.type as any,
                          consequence: choice.consequence,
                        },
                        rpgDirector.messageId
                      )
                    }}
                    onContinue={() => {
                      // 滚动到底部或触发下一条消息
                      handleScrollToBottom()
                    }}
                    onPlayTTS={(content: string, messageId?: string) => {
                      if (ttsEnabled) {
                        // 如果正在播放同一条消息，则停止
                        if (isTTSPlaying && ttsCurrentMessageId === messageId) {
                          stopTTS()
                        } else {
                          // 提取对话文本后再播放
                          const globalScripts = getRegexScripts()
                          const activeScripts = getActiveRegexScripts(character?.id, globalScripts)
                          const formattedHTML = applyRegexScripts(content, activeScripts)
                          const dialogueText = extractDialogueFromHTML(formattedHTML, content, playMode)
                          if (dialogueText) {
                            playTTS(dialogueText, messageId || '')
                          }
                        }
                      }
                    }}
                    isTTSPlaying={isTTSPlaying}
                    ttsCurrentMessageId={ttsCurrentMessageId}
                    isGenerating={isGenerating}
                    userId={currentUserId}
                    intimacyLevel={intimacyLevel}
                    className="h-full"
                  />
                </div>
              ) : (
                <>
                  {/* Message List - Independent Scroll Container */}
                  <div
                    ref={messagesContainerRef}
                    onScroll={handleMessagesScroll}
                    className={`flex-1 overflow-y-auto overflow-x-hidden tavern-scrollbar-overlay ${isMobile ? 'message-scroll-area' : ''}`}
                  >
                    <MessageList
                      messages={messages}
                      isLoading={isGenerating}
                      showIncompletePrompt={incompleteInteractionDetected && !dismissedIncompleteInteraction}
                      onContinueIncomplete={handleContinueIncomplete}
                      onDismissIncomplete={handleDismissIncomplete}
                      onRegenerateMessage={handleRegenerateFromMessage}
                      onRegenerateMessageAsBranch={handleRegenerateFromMessageAsBranch}
                      onEditMessage={handleEditMessage}
                      onDeleteMessage={handleDeleteMessageSingle}
                      onScrollToBottom={handleScrollToBottom}
                      branchMode={branchMode}
                      onCancelBranchMode={handleCancelBranchMode}
                      onLoadMore={handleLoadMore}
                      // 🎭 沉浸式功能
                      immersiveModeEnabled={immersiveModeEnabled}
                      onChoiceSelect={handleChoiceSelect}
                      selectedChoices={selectedChoices}
                      // 🎬 v17.2 Director 系统
                      onDirectorChoiceSelect={handleDirectorChoiceSelect}
                      // 🎬 v20.5: Director 加载状态
                      isDirectorLoading={isDirectorLoading}
                      // 🎉 羁绊/亲密度系统
                      userId={currentUserId}
                      intimacyLevel={intimacyLevel}
                      // 🎭 v29: 群聊模式支持 - 只传递 activeNPCs，渲染基于消息内容自动判断
                      activeNPCs={activeNPCs}
                    />

                {/* 🎭 v16: NPC 激活通知 */}
                {hasPendingActivations && (
                  <div className="px-3 sm:px-4 py-2">
                    <NPCActivationNotification
                      activations={pendingActivations}
                      onConfirm={confirmNPCActivation}
                      onDismiss={dismissNPCActivation}
                      onConfirmAll={() => {
                        pendingActivations.forEach(a => confirmNPCActivation(a))
                      }}
                      onDismissAll={() => {
                        pendingActivations.forEach(a => dismissNPCActivation(a.npc.id))
                      }}
                    />
                  </div>
                )}


                {/* 新消息浮动提示 */}
                <NewMessageIndicator
                  visible={newMessageCount > 0 && !shouldAutoScrollRef.current}
                  newMessageCount={newMessageCount}
                  onClick={() => {
                    handleScrollToBottom()
                    setNewMessageCount(0)
                  }}
                  isMobile={isMobile}
                />
                    <div ref={messagesEndRef} className="h-px" />
                  </div>

                  {/* Control Bar - Compact and Integrated */}
                  <div className="flex-shrink-0">
                    <ChatControlBar
                      onScrollToBottom={handleScrollToBottom}
                      onRegenerate={handleRegenerate}
                      showRegenerate={messages.length > 0 && messages.some(m => m.role === 'user')}
                      disabled={!canGenerate || isLoading || !isModelConfigured}
                      onCheckIncomplete={() => {
                        // 检测后自动滚动到底部，以便看到提示
                        setTimeout(handleScrollToBottom, 100)
                      }}
                    />
                  </div>

                  {/* Message Input - Fixed Bottom */}
                  <div className="flex-shrink-0">
                    <MessageInput
                      value={inputValue}
                      onChange={setInputValue}
                      onSend={handleSendMessage}
                      disabled={!canGenerate || isLoading || !isModelConfigured}
                      placeholder={
                        !character
                          ? 'Select a character to start chatting'
                          : !isModelConfigured
                          ? 'Select an AI model to start chatting'
                          : 'Type your message...'
                      }
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-200 px-4 py-2 text-sm flex-shrink-0">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={clearError}
                  className="text-red-400 hover:text-red-200"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side Panel - Unified portrait panel for all modes */}
        {!isMobile && character && currentChat &&
          dynamicImageSettings.enablePortraitPanel && (dynamicImageSettings.panelPosition === 'right' || !dynamicImageSettings.panelPosition) && (
            <ChatDynamicImageSystem
              characterId={character.id}
              characterName={character.name}
              userId={currentUserId}
              charType={(character as any).charType || 'community'}
              enabled={true}
              position="right"
              defaultCollapsed={dynamicImageSettings.defaultCollapsed}
              latestAssistantMessage={latestAssistantMessage}
              onViewGallery={() => setShowGalleryModal(true)}
              chatId={currentChat.id}
              onIntimacyLevelUp={(level, milestone) => {
                console.log('[ChatInterface] Intimacy level up:', level, milestone)
              }}
              onCGUnlock={(cgId, milestone) => {
                console.log('[ChatInterface] CG unlocked:', cgId, 'at milestone', milestone)
              }}
            />
          )
        }
      </div>

      {/* Retry Dialog */}
      <RetryDialog
        isOpen={showRetryDialog}
        errorType={retryError.type}
        errorMessage={retryError.message}
        retryCount={retryCount}
        maxRetries={maxRetries}
        onRetry={handleRetry}
        onCancel={handleCancelRetry}
      />

      {/* Role/User Setup Wizard */}
      <RoleSetupWizard
        opened={showRoleWizard}
        onClose={() => {
          setShowRoleWizard(false)
          checkingPersonaChoice.current = false
        }}
        initialValues={character ? getEffectiveRoleSettings(character.id) : undefined}
        allowSaveAsBase
        onSave={async (vals, opts) => {
          try {
            if (opts.saveAsUserBase) {
              await saveRoleSettings('base', vals)
              
              // 同时将用户设定保存到CharacterTuneStore作为全局设定
              const { saveGlobalPersonaToDB } = await import('@/stores/characterTuneStore')
              const userPersonaText = vals.relationship?.summary || ''
              const customInstructionsText = [
                vals.profile?.preferredName ? `称呼: ${vals.profile.preferredName}` : '',
                vals.profile?.pronouns ? `人称: ${vals.profile.pronouns}` : '',
                vals.profile?.honorifics ? `敬称: ${vals.profile.honorifics}` : '',
                vals.style?.tone ? `语气: ${vals.style.tone}` : '',
              ].filter(Boolean).join('\n')
              
              await saveGlobalPersonaToDB({
                userPersona: userPersonaText,
                customInstructions: customInstructionsText
              })
            }
            
            if (character?.id) {
              await saveRoleSettings('override', vals, character.id)
              
              // 如果保存为全局设定，标记当前角色使用全局设定
              if (opts.saveAsUserBase) {
                setCharacterPersonaChoice(character.id, 'global')
                
                // 同时应用到CharacterTuneSettings
                const globalPersona = getGlobalPersonaSettings()
                const { useCharacterTuneStore } = await import('@/stores/characterTuneStore')
                const store = useCharacterTuneStore.getState()
                store.setCurrentCharacter(character.id)
                store.updateSettings({
                  userPersona: globalPersona.userPersona,
                  customInstructions: globalPersona.customInstructions
                })
              }
            }
            
            setShowRoleWizard(false)
            checkingPersonaChoice.current = false
            
            // 插入系统消息，说明设定已完成
            if (currentChat && character) {
              try {
                const settingsSummary = [
                  vals.profile?.preferredName ? `称呼：${vals.profile.preferredName}` : '',
                  vals.profile?.pronouns ? `人称：${vals.profile.pronouns}` : '',
                  vals.relationship?.summary ? `关系定位：${vals.relationship.summary}` : '',
                ].filter(Boolean).join(' | ')
                
                const systemMessageContent = `[系统消息] 角色/用户设定已完成并生效！\n\n✓ ${settingsSummary}\n\n现在可以开始对话了。`
                
                const systemMessage = await chatService.addMessage(currentChat.id, {
                  role: 'system',
                  content: systemMessageContent,
                  branchId: activeBranchId || undefined,
                } as any)
                
                addMessage(systemMessage)

                // 等待系统消息显示后，再发送欢迎词
                setTimeout(async () => {
                  const greeting = (character.firstMessage || '').toString().trim()
                  const flagsEnabled = process.env.ST_PARITY_GREETING_ENABLED !== 'false'

                  if (flagsEnabled && greeting && !hasSentGreeting(currentChat.id, greeting)) {
                    try {
                      // ✅ 立即标记为已发送（在异步操作之前），防止竞态条件
                      markGreetingSent(currentChat.id, greeting)

                      const greetMsg = await chatService.addMessage(currentChat.id, {
                        role: 'assistant',
                        content: greeting,
                        branchId: activeBranchId || undefined,
                      } as any)
                      addMessage(greetMsg)
                    } catch (e) {
                      console.warn('Failed to send greeting after role setup:', e)
                    }
                  }
                }, 500)
              } catch (e) {
                console.error('Failed to insert system message:', e)
              }
            }
            
            toast.success(opts.saveAsUserBase ? '已保存为全局设定' : '已保存角色设定')
          } catch (e) {
            console.error('Failed to save role settings:', e)
            toast.error('保存失败，请重试')
          }
        }}
      />

      {/* Greeting Selector - v2 Character Card Feature */}
      {pendingChatCharacter && (
        <GreetingSelector
          isOpen={showGreetingSelector}
          onClose={() => {
            setShowGreetingSelector(false)
            setPendingChatCharacter(null)
            setPendingNewChatMode(null)
          }}
          characterId={pendingChatCharacter.id}
          characterName={pendingChatCharacter.name}
          characterAvatar={pendingChatCharacter.avatar}
          onSelectGreeting={handleGreetingSelected}
        />
      )}

      {/* First Chat Settings Dialog */}
      <FirstChatSettingsDialog
        opened={showFirstChatDialog}
        onClose={() => {
          setShowFirstChatDialog(false)
          checkingPersonaChoice.current = false
        }}
        characterName={character?.name || ''}
        onConfirm={async (useGlobal) => {
          if (character?.id) {
            setCharacterPersonaChoice(character.id, useGlobal ? 'global' : 'custom')

            if (useGlobal) {
              // 如果选择使用全局设定，自动应用全局设定到角色的CharacterTuneSettings
              const globalPersona = getGlobalPersonaSettings()
              const { useCharacterTuneStore } = await import('@/stores/characterTuneStore')
              const store = useCharacterTuneStore.getState()
              store.setCurrentCharacter(character.id)
              store.updateSettings({
                userPersona: globalPersona.userPersona,
                customInstructions: globalPersona.customInstructions
              })
              toast.success('已应用全局设定到当前角色')
            } else {
              toast.success('已选择创建角色专属设定，您可以在"角色微调"中配置')
            }
          }
          setShowFirstChatDialog(false)
          checkingPersonaChoice.current = false
        }}
      />

      {/* Chat Entry Wizard - 新的聊天进入向导 */}
      <ChatEntryWizard
        isOpen={showChatEntryWizard}
        onClose={() => {
          // 🔧 重要修复：检查是否是成功确认后的关闭
          // 如果是成功确认（wizardConfirmedRef.current = true），不跳转
          // 如果是用户取消（点击X或背景），且没有当前聊天，则跳转回角色列表
          if (wizardConfirmedRef.current) {
            // 成功确认后的关闭，重置 ref，不跳转
            wizardConfirmedRef.current = false
          } else {
            // 用户主动取消
            setShowChatEntryWizard(false)
            setWizardCharacter(null)
            // 只有在没有当前聊天时才返回角色列表
            if (!currentChat) {
              router.push('/characters')
            }
          }
        }}
        character={wizardCharacter}
        onConfirm={handleChatEntryWizardConfirm}
      />


      {/* 动态图片系统 - 移动端悬浮头像 */}
      {isMobile && character && currentChat && dynamicImageSettings.enableMobileFloat && (
        <MobilePortraitFloat
          characterId={character.id}
          characterName={character.name}
          charType={(character as any).charType || 'community'}
          userId={currentUserId}
          latestMessage={latestAssistantMessage}
          intimacyLevel={intimacyLevel}
          onViewGallery={() => setShowGalleryModal(true)}
        />
      )}

      {/* 🎭 v28: 移动端关系抽屉 */}
      {isMobile && character && currentChat && (
        <MobileRelationDrawer
          isOpen={showMobileRelationDrawer}
          onToggle={() => setShowMobileRelationDrawer(!showMobileRelationDrawer)}
          onClose={() => setShowMobileRelationDrawer(false)}
          characterName={character.name}
          bondExp={bondExp}
          currentEmotion={currentEmotion}
          onOpenSettings={() => {
            setShowMobileRelationDrawer(false)
            openSettingsDrawer('chat')
          }}
        />
      )}

      {/* 角色相册弹窗 */}
      {character && (
        <CharacterGalleryModal
          opened={showGalleryModal}
          onClose={() => setShowGalleryModal(false)}
          characterId={character.id}
          characterName={character.name}
          charType={(character as any).charType || 'community'}
          userId={currentUserId}
          intimacyLevel={intimacyLevel}
        />
      )}

      {/* TTS Floating Player */}
      <TTSFloatingPlayer />

      {/* 🎭 v16 NPC 生态系统面板 */}
      {currentChat && character && (
        <NPCPanel
          isOpen={showNPCPanel}
          onClose={() => setShowNPCPanel(false)}
          chatId={currentChat.id}
          mainCharacterName={character.name}
          onNPCActivated={() => {
            // 刷新 ChatInterface 的 activeNPCs 状态，同步群聊模式
            refreshActiveNPCs()
          }}
          onNPCDismissed={() => {
            // NPC 退场时也要刷新
            refreshActiveNPCs()
          }}
        />
      )}

      {/* 🎭 v28 群聊成员选择器 */}
      {currentChat && character && showGroupMemberSelector && (
        <GroupMemberSelector
          isOpen={showGroupMemberSelector}
          mainCharacter={{
            id: character.id,
            name: character.name,
            avatar: character.avatar,
            isMainCharacter: true,
          }}
          npcs={activeNPCs
            .filter(appearance => appearance?.npc && appearance.npc.id && appearance.npc.name && appearance.npc.name.trim())
            .map(appearance => ({
            id: appearance.npc!.id,
            name: appearance.npc!.name,
            avatar: appearance.npc!.avatar || undefined,
            isLocked: false,
          }))}
          selectedMembers={groupMembers}
          onToggleMember={(memberId) => {
            toggleGroupMember(memberId)
          }}
          onSelectAll={() => {
            setGroupMembers(activeNPCs.filter(npc => npc && npc.id && npc.name && npc.name.trim()).map(npc => npc.id))
          }}
          onDeselectAll={() => {
            setGroupMembers([])
          }}
          onConfirm={() => {
            setShowGroupMemberSelector(false)
          }}
          onClose={() => setShowGroupMemberSelector(false)}
        />
      )}

      {/* 🌍 v17 剧情追踪面板 */}
      {currentChat && character && (
        <StoryTrackingPanel
          isOpen={showStoryTrackingPanel}
          onClose={() => setShowStoryTrackingPanel(false)}
          chatId={currentChat.id}
          characterId={character.id}
          characterName={character.name}
        />
      )}

      {/* 🎬 v13 导演面板（沉浸模式 overlay，不挤压阅读层） */}
      {currentChat && character && (
        <Drawer
          opened={showDirectorOverlay}
          onClose={() => setShowDirectorOverlay(false)}
          position="right"
          size={460}
          overlayProps={{ opacity: 0.35, blur: 2 }}
          title={
            <Group gap="xs" wrap="nowrap">
              <IconSparkles size={18} />
              <Text fw={700}>剧情导演</Text>
            </Group>
          }
          styles={{
            header: { borderBottom: '1px solid rgba(255,255,255,0.08)' },
            content: { background: 'rgba(20, 20, 24, 0.98)' },
            body: { paddingTop: 12 },
          }}
        >
          <Group justify="space-between" align="center" mb="sm">
            <Text size="xs" c="dimmed" lineClamp={2} style={{ maxWidth: 320 }}>
              {(() => {
                const mid = rpgDirector?.messageId
                if (!mid) return '未找到焦点消息'
                const m: any = messages.find((x: any) => x.id === mid)
                const content = (m?.content || '').toString().trim()
                if (!content) return '焦点消息为空'
                return `焦点消息：${content.slice(0, 80)}${content.length > 80 ? '…' : ''}`
              })()}
            </Text>
            <Group gap="xs">
              <Button
                size="xs"
                variant="light"
                onClick={regenerateDirectorForLatest}
                loading={isDirectorLoading}
              >
                重新生成
              </Button>
            </Group>
          </Group>

          {(() => {
            const directorData = rpgDirector?.director
            if (!directorData) {
              if (isDirectorLoading) {
                return (
                  <Paper
                    p="sm"
                    radius="md"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(236, 72, 153, 0.12) 100%)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
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

              return (
                <Paper p="sm" radius="md" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Text size="sm" c="dimmed">
                    暂无导演建议。你可以在生成回复后打开此面板，或点击“重新生成”。
                  </Text>
                </Paper>
              )
            }

            return (
              <DirectorPanel
                data={directorData as any}
                isLatest={true}
                characterName={character.name}
                onChoiceSelect={(choice: any) => {
                  const mid = rpgDirector?.messageId
                  if (!mid) return
                  handleDirectorChoiceSelect(choice, mid)
                }}
                disabled={!!(directorData as any)?.selectedChoiceId}
              />
            )
          })()}
        </Drawer>
      )}

      {/* 🎭 羁绊通知容器 - 显示升级、成就、惊喜等通知 */}
      <BondNotificationContainer />
    </div>
  )
}
