/**
 * MessageInput v21.0 - Theater Soul Experience
 *
 * Design: "Soul Theater" immersive input experience
 * - Glass morphism with theater void background
 * - Spotlight-gold accent for send button
 * - Moonlight-purple for voice/attachment actions
 * - Mobile-optimized touch targets and safe areas
 */

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useChatStore } from '@/stores/chatStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useModelGuard } from '@/hooks/useModelGuard'
import { useAIModelStore } from '@/stores/aiModelStore'
import { useVoiceRecognition, useRateLimiter } from '@/hooks'
import toast from 'react-hot-toast'
import { useTranslation } from '@/lib/i18n'
import {
  Box,
  Textarea,
  Button,
  ActionIcon,
  Menu,
  Group,
  Text,
  Tooltip,
  Badge,
  Stack,
  Collapse,
  Drawer,
} from '@mantine/core'
import { IconSend,
  IconPaperclip,
  IconMicrophone,
  IconSparkles,
  IconBolt,
  IconBroadcast,
  IconChevronDown,
  IconCheck,
  IconDotsVertical,
  IconLoader2,
} from '@tabler/icons-react'
import { InsufficientPointsDialog } from '@/components/payment/InsufficientPointsDialog'
import VoiceInputModal from './VoiceInputModal'
import { CreativeDirectivePanel, CreativeDirectiveQuickButton } from './CreativeDirectivePanel'
import AdvancedActionsDrawer from './AdvancedActionsDrawer'

// Theater color palette
const theaterColors = {
  spotlightGold: '#f5c542',
  spotlightGoldDim: 'rgba(245, 197, 66, 0.3)',
  moonlight: 'rgba(196, 181, 253, 0.6)',
  emotionRose: 'rgba(232, 72, 106, 0.6)',
  voidDark: 'rgba(26, 20, 41, 0.95)',
  glassBorder: 'rgba(245, 197, 66, 0.15)',
  glassBackground: 'rgba(26, 20, 41, 0.85)',
}

// ====== Types ======
interface MessageInputProps {
  className?: string
  placeholder?: string
  disabled?: boolean
  value?: string
  onChange?: (value: string) => void
  onSend?: (message: string) => Promise<void>
  onSendMessage?: (message: string) => void
}

// ====== Main Component ======
export default function MessageInput({
  className = '',
  placeholder,
  disabled = false,
  value,
  onChange,
  onSend,
  onSendMessage,
}: MessageInputProps) {
  const { t } = useTranslation()

  // Stores
  const { currentChat, isLoading, character, isStreamingEnabled, isFastModeEnabled, toggleStreaming, toggleFastMode } = useChatStore()
  const { selectedCharacter: activeCharacter } = useCharacterStore()
  const { isModelReady, assertModelReady } = useModelGuard()
  const { activeModel, models } = useAIModelStore()

  // Local state
  const [internalMessage, setInternalMessage] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [insufficientPointsOpen, setInsufficientPointsOpen] = useState(false)
  const [pointsInfo, setPointsInfo] = useState<{
    current: number
    required: number
    nextRegen: string | null
  } | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [directivePanelOpen, setDirectivePanelOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const composingRef = useRef(false)
  const sendingRef = useRef(false)

  // Derived values
  const currentCharacter = character || activeCharacter
  const message = value !== undefined ? value : internalMessage

  // Custom hooks
  const voiceRecognition = useVoiceRecognition({
    language: 'zh-CN',
    onError: (error) => toast.error(error),
  })

  const rateLimiter = useRateLimiter({
    checkInterval: 5000,
    maxConsecutiveErrors: 3,
    defaultCooldown: 20,
  })

  // Quick actions
  const handleSetMessage = useCallback((msg: string) => {
    if (onChange) {
      onChange(msg)
    } else {
      setInternalMessage(msg)
    }
  }, [onChange])

  // Detect mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [message])

  // Model switching
  const handleSwitchModel = async (modelId: string) => {
    try {
      const response = await fetch(`/api/ai-models/${modelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true })
      })

      if (!response.ok) {
        throw new Error('Failed to set active model')
      }

      const updatedModel = await response.json()
      const { setActiveModel, models, setModels } = useAIModelStore.getState()

      const updatedModels = models.map(m => ({
        ...m,
        isActive: m.id === modelId
      }))
      setModels(updatedModels)
      setActiveModel(updatedModel)

      toast.success(t('chat.status.modelSwitched'))
    } catch (error) {
      console.error('Error switching model:', error)
      toast.error(t('chat.error.switchModelFailed'))
    }
  }

  // Send message
  const handleSend = async () => {
    const trimmedMessage = message.trim()

    if (!trimmedMessage) {
      toast.error(t('chat.error.emptyMessage'))
      return
    }

    if (!currentCharacter) {
      toast.error(t('chat.error.selectCharacter'))
      return
    }

    if (!isModelReady) {
      toast.error('请先配置 AI 模型')
      assertModelReady()
      return
    }

    if (voiceRecognition.isRecording) {
      voiceRecognition.stopRecording()
    }

    try {
      if (sendingRef.current) return
      sendingRef.current = true
      handleSetMessage('')

      if (onSend) {
        await onSend(trimmedMessage)
      } else if (onSendMessage) {
        onSendMessage(trimmedMessage)
      } else {
        toast.error(t('chat.error.sendNotConfigured'))
      }

      window.dispatchEvent(new Event('message-sent'))
    } catch (error) {
      console.error('Error sending message:', error)

      if (error instanceof Error && error.message.includes('Rate limit')) {
        const match = error.message.match(/(\d+)/)
        const seconds = match ? parseInt(match[1]) : 20
        const isPremiumUser = rateLimiter?.isPremium
        const limitMsg = isPremiumUser
          ? '付费会员10秒内只能发送1次消息'
          : '非付费会员20秒内只能发送1次消息，升级会员可缩短等待时间'
        toast.error(`${limitMsg}，请等待 ${seconds} 秒`)
        return
      }

      if (error instanceof Error && error.message.includes('Insufficient points')) {
        try {
          const response = await fetch('/api/points/balance')
          if (response.ok) {
            const data = await response.json()
            setPointsInfo({
              current: data.balance,
              required: data.pointsPerMessage,
              nextRegen: data.nextRegenerationTime,
            })
            setInsufficientPointsOpen(true)
          }
        } catch {
          toast.error(t('chat.error.insufficientPoints'))
        }
      } else {
        toast.error(t('chat.error.sendFailed'))
      }

      handleSetMessage(trimmedMessage)
    } finally {
      sendingRef.current = false
    }
  }

  // Keyboard handling
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (composingRef.current) return
    if (e.repeat) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // File upload
  const handleFileUpload = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,.txt,.json,.png,.jpg,.jpeg,.pdf,.doc,.docx'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      if (file.size > 10 * 1024 * 1024) {
        toast.error(t('chat.error.fileTooLarge'))
        return
      }

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', file.type)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error(t('chat.error.uploadFailed'))
        }

        const data = await response.json()
        toast.success(t('chat.file.uploadSuccess'))

        if (file.type.startsWith('image/')) {
          handleSetMessage(message + `\n[${t('chat.file.image')}: ${data.filename}]`)
        } else {
          handleSetMessage(message + `\n[${t('chat.file.file')}: ${data.filename}]`)
        }
      } catch (error) {
        console.error('Error uploading file:', error)
        toast.error(t('chat.error.uploadFailed'))
      }
    }
    input.click()
  }

  // Voice input handlers
  const handleVoiceConfirm = () => {
    const textToUse = voiceRecognition.getFullTranscript()
    if (textToUse.trim()) {
      const newText = message ? `${message} ${textToUse}` : textToUse
      handleSetMessage(newText)
      toast.success(t('chat.voice.convertedToText') || '语音已转换为文字', { icon: '✓' })
    }
    voiceRecognition.closeModal()
  }

  const handleVoiceSend = async () => {
    if (voiceRecognition.isRecording) {
      voiceRecognition.stopRecording()
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    const textToUse = voiceRecognition.getFullTranscript()
    if (!textToUse.trim()) {
      toast.error(t('chat.voice.pleaseRecordFirst') || '请先录入语音')
      return
    }

    if (!currentCharacter) {
      toast.error(t('chat.error.selectCharacter'))
      return
    }

    if (!isModelReady) {
      toast.error(t('chat.error.configureModelFirst') || '请先配置 AI 模型')
      assertModelReady()
      return
    }

    const newText = message ? `${message} ${textToUse}` : textToUse
    const trimmedMessage = newText.trim()

    voiceRecognition.closeModal()

    try {
      if (sendingRef.current) return
      sendingRef.current = true
      handleSetMessage('')

      if (onSend) {
        await onSend(trimmedMessage)
      } else if (onSendMessage) {
        onSendMessage(trimmedMessage)
      } else {
        toast.error(t('chat.error.sendNotConfigured'))
      }

      window.dispatchEvent(new Event('message-sent'))
    } catch (error) {
      console.error('Error sending voice message:', error)

      if (error instanceof Error && error.message.includes('Rate limit')) {
        const match = error.message.match(/(\d+)/)
        const seconds = match ? parseInt(match[1]) : 20
        const isPremiumUser = rateLimiter?.isPremium
        const limitMsg = isPremiumUser
          ? '付费会员10秒内只能发送1次消息'
          : '非付费会员20秒内只能发送1次消息，升级会员可缩短等待时间'
        toast.error(`${limitMsg}，请等待 ${seconds} 秒`)
      } else {
        toast.error(t('chat.error.sendFailed'))
      }

      handleSetMessage(trimmedMessage)
    } finally {
      sendingRef.current = false
    }
  }

  // Toggle handlers
  const handleToggleStreaming = () => {
    toggleStreaming()
    toast.success(
      isStreamingEnabled
        ? t('chat.status.streamingDisabled') || '已切换到完整输出模式'
        : t('chat.status.streamingEnabled') || '已切换到流式输出模式',
      { duration: 2000 }
    )
  }

  const handleToggleFastMode = () => {
    toggleFastMode()
    toast.success(
      isFastModeEnabled
        ? t('chat.status.fastModeDisabled') || '已关闭快速模式'
        : t('chat.status.fastModeEnabled') || '已开启快速模式（Temperature: 0.3）',
      { duration: 2000 }
    )
  }

  const canSend = !disabled && !isLoading && !voiceRecognition.isRecording && message.trim() && currentCharacter && isModelReady && rateLimiter.canSend

  // Render
  return (
    <Box
      className={`${className} mobile-safe-container bottom-nav-safe input-safe-area message-input-theater`}
      style={{
        width: '100%',
        maxWidth: '100%',
        background: theaterColors.glassBackground,
        backdropFilter: 'blur(16px)',
        borderTop: `1px solid ${theaterColors.glassBorder}`,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Mobile Quick Toggle Bar */}
      {isMobile && (
        <Box
          style={{
            borderBottom: `1px solid ${theaterColors.glassBorder}`,
            padding: '0.5rem 0.75rem',
            background: 'rgba(26, 20, 41, 0.6)',
          }}
        >
          <Group justify="space-between" wrap="nowrap" style={{ width: '100%' }}>
            {/* Left: Mode Toggles */}
            <Group gap={6} wrap="nowrap">
              <Badge
                variant={isStreamingEnabled ? 'filled' : 'outline'}
                className="cursor-pointer touch-target"
                onClick={handleToggleStreaming}
                style={{
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  minHeight: '26px',
                  padding: '0 8px',
                  background: isStreamingEnabled ? theaterColors.moonlight : 'transparent',
                  borderColor: theaterColors.moonlight,
                  color: isStreamingEnabled ? '#fff' : 'rgba(196, 181, 253, 0.8)',
                }}
              >
                <Group gap={3}>
                  <IconBroadcast size={12} />
                  <Text size="xs">{isStreamingEnabled ? '流式' : '完整'}</Text>
                </Group>
              </Badge>

              <Badge
                variant={isFastModeEnabled ? 'filled' : 'outline'}
                className="cursor-pointer touch-target"
                onClick={handleToggleFastMode}
                style={{
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  minHeight: '26px',
                  padding: '0 8px',
                  background: isFastModeEnabled ? theaterColors.spotlightGoldDim : 'transparent',
                  borderColor: theaterColors.spotlightGoldDim,
                  color: isFastModeEnabled ? theaterColors.spotlightGold : 'rgba(245, 197, 66, 0.6)',
                }}
              >
                <Group gap={3}>
                  <IconBolt size={12} />
                  <Text size="xs">{isFastModeEnabled ? '快速' : '标准'}</Text>
                </Group>
              </Badge>
            </Group>

            {/* Right: Creative Directive + More */}
            <Group gap={6} wrap="nowrap">
              {currentCharacter && (
                <CreativeDirectiveQuickButton
                  onClick={() => setDirectivePanelOpen(true)}
                />
              )}

              <ActionIcon
                variant="subtle"
                size="sm"
                className="touch-target"
                onClick={() => setMoreOpen(true)}
                title={t('common.more') || '更多'}
                style={{
                  minWidth: '28px',
                  minHeight: '28px',
                  color: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Group>
          </Group>
        </Box>
      )}

      <Stack gap={isMobile ? 'xs' : 'sm'} p={isMobile ? 'xs' : 'sm'} style={{ width: '100%', maxWidth: '100%' }}>
        {/* Compact Header: Model + Mode Toggles (Desktop Only) */}
        {currentCharacter && !isMobile && (
          <Group
            justify="flex-end"
            px="xs"
            py={3}
            style={{ borderBottom: `1px solid ${theaterColors.glassBorder}` }}
          >
            <Group gap={4}>
              {activeModel && models.length > 0 && (
                <Menu position="bottom-end" shadow="md" width={280}>
                  <Menu.Target>
                    <Button
                      variant="subtle"
                      size="xs"
                      px={6}
                      visibleFrom="sm"
                      styles={{
                        root: {
                          height: 'auto',
                          padding: '2px 6px',
                          maxWidth: '180px',
                          fontSize: '0.7rem',
                          color: 'rgba(255, 255, 255, 0.6)',
                        },
                        label: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
                      }}
                      rightSection={<IconChevronDown size={12} />}
                    >
                      {activeModel.provider}/{activeModel.model}
                    </Button>
                  </Menu.Target>
                  <Menu.Dropdown style={{ background: theaterColors.voidDark, border: `1px solid ${theaterColors.glassBorder}` }}>
                    <Menu.Label style={{ color: theaterColors.spotlightGold }}>选择模型</Menu.Label>
                    {models.map((model) => (
                      <Menu.Item
                        key={model.id}
                        onClick={() => handleSwitchModel(model.id)}
                        leftSection={
                          model.id === activeModel.id ? (
                            <IconCheck size={16} style={{ color: theaterColors.spotlightGold }} />
                          ) : (
                            <Box style={{ width: 16, height: 16 }} />
                          )
                        }
                      >
                        <Stack gap={2}>
                          <Text size="sm" fw={model.id === activeModel.id ? 600 : 400}>
                            {model.name || `${model.provider}/${model.model}`}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {model.provider}/{model.model}
                          </Text>
                        </Stack>
                      </Menu.Item>
                    ))}
                  </Menu.Dropdown>
                </Menu>
              )}

              <Tooltip label={isStreamingEnabled ? '流式输出已开启' : '流式输出已关闭'}>
                <ActionIcon
                  variant={isStreamingEnabled ? 'light' : 'subtle'}
                  onClick={handleToggleStreaming}
                  disabled={disabled || isLoading}
                  size="xs"
                  style={{
                    border: isStreamingEnabled ? `1px solid ${theaterColors.moonlight}` : 'none',
                    color: isStreamingEnabled ? theaterColors.moonlight : 'rgba(255, 255, 255, 0.5)',
                    width: '24px',
                    height: '24px',
                  }}
                >
                  <IconBroadcast size={12} className={isStreamingEnabled ? 'animate-pulse' : ''} />
                </ActionIcon>
              </Tooltip>

              <Tooltip label={isFastModeEnabled ? '快速模式已开启' : '快速模式已关闭'}>
                <ActionIcon
                  variant={isFastModeEnabled ? 'light' : 'subtle'}
                  onClick={handleToggleFastMode}
                  disabled={disabled || isLoading}
                  size="xs"
                  style={{
                    border: isFastModeEnabled ? `1px solid ${theaterColors.spotlightGold}` : 'none',
                    color: isFastModeEnabled ? theaterColors.spotlightGold : 'rgba(255, 255, 255, 0.5)',
                    width: '24px',
                    height: '24px',
                  }}
                >
                  <IconBolt size={12} className={isFastModeEnabled ? 'animate-pulse' : ''} />
                </ActionIcon>
              </Tooltip>

              {isLoading && (
                <Box
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: theaterColors.spotlightGold,
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                />
              )}
            </Group>
          </Group>
        )}

        {/* Input Area */}
        <Group gap={6} align="flex-end" style={{ width: '100%' }}>
          <Box style={{ flex: 1, position: 'relative', minWidth: 0, width: '100%' }}>
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => handleSetMessage(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => { composingRef.current = true }}
              onCompositionEnd={() => { composingRef.current = false }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder || (isMobile ? t('chat.message.placeholder') : '输入消息... (Enter发送 · Shift+Enter换行)')}
              disabled={disabled || isLoading || voiceRecognition.isRecording}
              minRows={1}
              maxRows={isMobile ? 4 : 5}
              autosize
              styles={{
                input: {
                  backgroundColor: 'rgba(26, 20, 41, 0.6)',
                  borderColor: isFocused ? theaterColors.spotlightGold : theaterColors.glassBorder,
                  color: 'rgba(255, 255, 255, 0.95)',
                  minHeight: isMobile ? '40px' : '44px',
                  maxHeight: isMobile ? '160px' : '200px',
                  fontSize: isMobile ? '16px' : '0.9375rem',
                  padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 0.875rem',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  boxSizing: 'border-box',
                  borderRadius: '12px',
                  boxShadow: isFocused ? `0 0 16px ${theaterColors.spotlightGoldDim}` : 'none',
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.4)',
                  },
                },
              }}
            />
          </Box>

          {/* Action Buttons - 移动端优化触摸目标至少44px */}
          <Group gap={isMobile ? 6 : 8}>
            <Tooltip label={t('chat.file.upload')}>
              <ActionIcon
                variant="subtle"
                onClick={handleFileUpload}
                disabled={disabled || isLoading || voiceRecognition.isRecording}
                size={isMobile ? 44 : 40}
                style={{
                  color: theaterColors.moonlight,
                  transition: 'all 0.2s ease',
                  minWidth: isMobile ? '44px' : '40px',
                  minHeight: isMobile ? '44px' : '40px',
                }}
              >
                <IconPaperclip size={isMobile ? 20 : 18} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label={t('chat.voice.input')}>
              <ActionIcon
                variant="subtle"
                onClick={voiceRecognition.startRecording}
                disabled={disabled || isLoading || voiceRecognition.isModalOpen}
                size={isMobile ? 44 : 40}
                style={{
                  color: theaterColors.emotionRose,
                  transition: 'all 0.2s ease',
                  minWidth: isMobile ? '44px' : '40px',
                  minHeight: isMobile ? '44px' : '40px',
                }}
              >
                <IconMicrophone size={isMobile ? 20 : 18} />
              </ActionIcon>
            </Tooltip>

            {rateLimiter.cooldownSeconds > 0 && (
              <Tooltip
                label={rateLimiter.isPremium
                  ? `会员用户: 每${rateLimiter.interval}秒可发送一条消息`
                  : `临时用户: 每${rateLimiter.interval}秒可发送一条消息，升级会员可缩短至10秒`
                }
                position="top"
                multiline
                w={220}
              >
                <Badge
                  variant="light"
                  size="sm"
                  style={{
                    fontSize: '0.7rem',
                    cursor: 'help',
                    background: rateLimiter.isPremium ? 'rgba(59, 130, 246, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                    color: rateLimiter.isPremium ? '#60a5fa' : '#fb923c',
                  }}
                >
                  {rateLimiter.isPremium ? '会员' : '临时'}
                </Badge>
              </Tooltip>
            )}

            {/* Send Button - Theater Spotlight Style - 移动端优化触摸目标 */}
            <Tooltip
              label={
                !rateLimiter.canSend
                  ? rateLimiter.isPremium
                    ? `付费会员10秒限1次，请等待 ${rateLimiter.cooldownSeconds} 秒`
                    : `非付费会员20秒限1次，请等待 ${rateLimiter.cooldownSeconds} 秒（升级会员可缩短）`
                  : t('chat.message.sendEnter')
              }
            >
              <ActionIcon
                variant="filled"
                onClick={handleSend}
                disabled={!canSend && rateLimiter.canSend}
                size={isMobile ? 48 : 44}
                style={{
                  background: !rateLimiter.canSend
                    ? 'linear-gradient(135deg, #f97316, #ea580c)'
                    : `linear-gradient(135deg, ${theaterColors.spotlightGold} 0%, #e8d7b0 100%)`,
                  opacity: canSend ? 1 : 0.5,
                  minWidth: isMobile ? '48px' : '44px',
                  minHeight: isMobile ? '48px' : '44px',
                  transition: 'all 0.3s ease',
                  boxShadow: canSend ? `0 0 20px ${theaterColors.spotlightGoldDim}` : 'none',
                  borderRadius: '12px',
                }}
              >
                {!rateLimiter.canSend ? (
                  <Text size="sm" fw={700} c="white">
                    {rateLimiter.cooldownSeconds}
                  </Text>
                ) : isLoading ? (
                  <IconLoader2 size={isMobile ? 20 : 18} style={{ color: '#1a1429' }} className="animate-spin" />
                ) : (
                  <IconSend size={isMobile ? 20 : 18} style={{ color: '#1a1429' }} />
                )}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* 字符计数提示 - 当输入内容较长时显示 */}
        {message.length > 100 && (
          <Text
            size="xs"
            ta="right"
            px="xs"
            style={{
              color: message.length > 3000
                ? 'rgba(239, 68, 68, 0.8)'
                : message.length > 2000
                  ? 'rgba(245, 158, 11, 0.8)'
                  : 'rgba(255, 255, 255, 0.4)',
              transition: 'color 0.2s ease',
            }}
          >
            {message.length.toLocaleString()} 字符
            {message.length > 3000 && ' (内容较长，可能影响响应质量)'}
          </Text>
        )}

        {/* Creative Directive Panel - Desktop (可折叠) */}
        {currentCharacter && !isMobile && (
          <Box>
            <CreativeDirectiveQuickButton
              onClick={() => setDirectivePanelOpen(!directivePanelOpen)}
            />
            <Collapse in={directivePanelOpen}>
              <Box mt="xs">
                <CreativeDirectivePanel compact={false} />
              </Box>
            </Collapse>
          </Box>
        )}
      </Stack>

      {/* Insufficient Points Dialog */}
      {pointsInfo && (
        <InsufficientPointsDialog
          opened={insufficientPointsOpen}
          onClose={() => setInsufficientPointsOpen(false)}
          currentPoints={pointsInfo.current}
          requiredPoints={pointsInfo.required}
          nextRegenerationTime={pointsInfo.nextRegen}
        />
      )}

      {/* Advanced Actions Drawer - Mobile */}
      {isMobile && (
        <AdvancedActionsDrawer
          opened={moreOpen}
          onClose={() => setMoreOpen(false)}
          isStreamingEnabled={isStreamingEnabled}
          onToggleStreaming={handleToggleStreaming}
          isFastModeEnabled={isFastModeEnabled}
          onToggleFastMode={handleToggleFastMode}
          models={models}
          activeModel={activeModel as any}
          onSwitchModel={handleSwitchModel}
          onStartRecording={voiceRecognition.startRecording}
          onUploadFile={handleFileUpload}
        />
      )}

      {/* Voice Input Modal */}
      <VoiceInputModal
        opened={voiceRecognition.isModalOpen}
        onClose={voiceRecognition.closeModal}
        isRecording={voiceRecognition.isRecording}
        recordingTime={voiceRecognition.recordingTime}
        interimTranscript={voiceRecognition.interimTranscript}
        finalTranscript={voiceRecognition.finalTranscript}
        editableTranscript={voiceRecognition.editableTranscript}
        onEditableChange={voiceRecognition.setEditableTranscript}
        onStopRecording={voiceRecognition.stopRecording}
        onRestartRecording={voiceRecognition.restartRecording}
        onConfirm={handleVoiceConfirm}
        onSend={handleVoiceSend}
        formatRecordingTime={voiceRecognition.formatRecordingTime}
      />

      {/* Creative Directive Drawer - Mobile */}
      {isMobile && (
        <Drawer
          opened={directivePanelOpen}
          onClose={() => setDirectivePanelOpen(false)}
          position="bottom"
          size="auto"
          title={
            <Group gap="xs">
              <IconSparkles size={18} style={{ color: theaterColors.spotlightGold }} />
              <Text fw={600} style={{ color: theaterColors.spotlightGold }}>
                {t('chat.creative.directiveTitle') || '创意指令'}
              </Text>
            </Group>
          }
          styles={{
            content: {
              background: theaterColors.voidDark,
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
            },
            header: {
              background: 'transparent',
              borderBottom: `1px solid ${theaterColors.glassBorder}`,
            },
            body: {
              padding: '1rem',
              maxHeight: '60vh',
              overflowY: 'auto',
            },
          }}
        >
          <CreativeDirectivePanel compact={false} />
        </Drawer>
      )}
    </Box>
  )
}
