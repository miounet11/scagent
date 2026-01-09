/**
 * Chat control bar component for streaming, fast mode, and other controls
 */

'use client'

import { useState, useRef } from 'react'
import { useChatStore } from '@/stores/chatStore'
import { useTTSStore, TTS_PLAY_MODES, type TTSPlayMode } from '@/stores/ttsStore'
import { EDGE_VOICES, getVoiceGender } from '@/lib/config/edge-voices'
import { Group, Button, Badge, Tooltip, Loader, Menu, ActionIcon, Switch, Box } from '@mantine/core'
import {
  IconArrowDown,
  IconRefresh,
  IconAlertCircle,
  IconVolume,
  IconVolumeOff,
  IconPlayerPlay,
  IconGenderFemale,
  IconGenderMale,
  IconSettings,
  IconPlayerStop,
  IconSparkles,
  IconWand,
  IconWandOff,
} from '@tabler/icons-react'
import toast from 'react-hot-toast'
import { useTranslation } from '@/lib/i18n'
import { chatService } from '@/services/chatService'
import { ModelDownloadCard } from '@/components/tts/ModelDownloadCard'
import { TTSModelStatus } from '@/components/tts/TTSModelStatus'
import { getTransformersTTSClient } from '@/lib/tts/TransformersTTSClient'

interface ChatControlBarProps {
  onScrollToBottom?: () => void
  onRegenerate?: () => void
  showRegenerate?: boolean
  disabled?: boolean
  onCheckIncomplete?: () => void
}

export default function ChatControlBar({
  onScrollToBottom,
  onRegenerate,
  showRegenerate = true,
  disabled = false,
  onCheckIncomplete
}: ChatControlBarProps) {
  const { t } = useTranslation()
  const { isGenerating, messages, currentChat, setCurrentChat, checkForIncompleteInteraction } = useChatStore()
  const {
    enabled: ttsEnabled,
    autoPlay,
    voiceType,
    playMode,
    aiTTSEnabled,
    aiModelStatus,
    downloadProgress,
    setEnabled: setTTSEnabled,
    toggleEnabled: toggleTTSEnabled,
    setAutoPlay,
    toggleAutoPlay,
    setVoiceType,
    setPlayMode,
    setAITTSEnabled,
    toggleAITTSEnabled,
    setAIModelStatus,
    setDownloadProgress,
    setAIModelSize,
  } = useTTSStore()

  const handleCheckIncomplete = () => {
    const hasIncomplete = checkForIncompleteInteraction()
    if (hasIncomplete) {
      toast.success(t('chat.status.incompleteDetected'), {
        icon: '⚠️',
        duration: 3000
      })
      if (onCheckIncomplete) {
        onCheckIncomplete()
      }
    } else {
      toast(t('chat.status.chatComplete'), {
        icon: '✅',
        duration: 2000
      })
    }
  }

  const handleToggleTTS = () => {
    // v2.6: Use toggleEnabled to get fresh state and avoid stale closure
    const newEnabled = toggleTTSEnabled()
    toast.success(newEnabled ? t('chat.status.ttsEnabled') : t('chat.status.ttsDisabled'), {
      icon: newEnabled ? '🔊' : '🔇'
    })
  }

  const handleToggleAutoPlay = () => {
    // v2.6: Use toggleAutoPlay to get fresh state and avoid stale closure
    const newAutoPlay = toggleAutoPlay()
    toast.success(newAutoPlay ? t('chat.status.autoPlayOn') : t('chat.status.autoPlayOff'), {
      icon: newAutoPlay ? '▶️' : '⏸️'
    })
  }

  const handleVoiceChange = (voice: 'male' | 'female') => {
    setVoiceType(voice)
    toast.success(t('chat.status.voiceSwitched', { voice: voice === 'female' ? t('chat.labels.female') : t('chat.labels.male') }), {
      icon: voice === 'female' ? '♀️' : '♂️'
    })
  }

  const handlePlayModeChange = (mode: TTSPlayMode) => {
    setPlayMode(mode)
    toast.success(`播放模式已切换为：${t(`tts.playMode.${mode}`)}`, {
      icon: TTS_PLAY_MODES[mode].icon
    })
  }

  const handleToggleAITTS = () => {
    // v2.6: Use toggleAITTSEnabled to get fresh state and avoid stale closure
    const newAITTSEnabled = toggleAITTSEnabled()
    toast.success(newAITTSEnabled ? t('tts.aiModel.aiVoiceEnabled') : t('tts.aiModel.aiVoiceDisabled'), {
      icon: newAITTSEnabled ? '✨' : '🔇'
    })
  }

  // Director mode toggle handler
  const handleToggleDirector = async () => {
    if (!currentChat?.id) return

    const newEnabled = !currentChat.directorEnabled
    try {
      const updatedChat = await chatService.toggleDirectorEnabled(currentChat.id, newEnabled)
      setCurrentChat(updatedChat)
      toast.success(newEnabled ? t('chat.status.directorEnabled') : t('chat.status.directorDisabled'), {
        icon: newEnabled ? '🎬' : '🎭'
      })
    } catch (error) {
      console.error('Failed to toggle director mode:', error)
      toast.error(t('chat.error.operationFailed'))
    }
  }

  // 用于取消下载的引用
  const downloadAbortRef = useRef<boolean>(false)

  const handleDownloadModel = async () => {
    try {
      downloadAbortRef.current = false
      setAIModelStatus('downloading')
      setDownloadProgress(0)
      toast.loading(t('tts.aiModel.startingDownload'), { id: 'download-model' })

      // 使用真实的 TransformersTTSClient 初始化
      const client = getTransformersTTSClient()

      await client.init((progress) => {
        // 检查是否被取消
        if (downloadAbortRef.current) {
          throw new Error('Download cancelled')
        }

        setDownloadProgress(progress.percentage)

        // 更新模型大小信息
        if (progress.total) {
          setAIModelSize(progress.total)
        }
      })

      // 检查是否被取消
      if (downloadAbortRef.current) {
        client.dispose()
        return
      }

      setAIModelStatus('ready')
      toast.success(t('tts.aiModel.downloadComplete'), { id: 'download-model' })
    } catch (error) {
      if (error instanceof Error && error.message === 'Download cancelled') {
        setAIModelStatus('not_loaded')
        setDownloadProgress(0)
        return
      }

      console.error('[AI TTS] Download failed:', error)
      setAIModelStatus('error')
      toast.error(t('tts.aiModel.downloadFailed'), { id: 'download-model' })
    }
  }

  const handleCancelDownload = () => {
    downloadAbortRef.current = true

    // 释放客户端资源
    try {
      const client = getTransformersTTSClient()
      client.dispose()
    } catch (e) {
      // 忽略错误
    }

    setAIModelStatus('not_loaded')
    setDownloadProgress(0)
    toast(t('tts.aiModel.downloadCancelled'), { icon: '⏹️' })
  }

  const handleRetryDownload = () => {
    handleDownloadModel()
  }

  // 获取当前选中语音的性别
  const currentVoiceGender = getVoiceGender(voiceType)

  // 判断是否应该显示检测按钮（有消息时显示）
  const shouldShowCheckButton = messages.length > 0

  return (
    <Group
      justify="space-between"
      gap="xs"
      px={{ base: 'xs', sm: 'md' }}
      py="xs"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderBottom: '1px solid rgba(55, 65, 81, 0.3)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Left Side - Info */}
      <Group gap="xs">
        {messages.length > 0 && (
          <Badge
            variant="light"
            color="blue"
            size="md"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            {messages.length} {t('chat.labels.messages')}
          </Badge>
        )}
        {/* TTS Model Status Indicator */}
        <TTSModelStatus compact showLabel={false} />
      </Group>

      {/* Right Side - Action Controls */}
      <Group gap={6}>
        {/* TTS Controls Menu */}
        <Menu position="top-end" shadow="md" withinPortal>
          <Menu.Target>
            <Box>
              {/* Desktop Button */}
              <Tooltip label={t('chat.labels.voicePlaySettings')} position="top">
                <Button
                  variant="subtle"
                  size="compact-sm"
                  color={ttsEnabled ? (currentVoiceGender === 'Female' ? 'pink' : 'blue') : 'gray'}
                  disabled={disabled}
                  leftSection={
                    ttsEnabled ? (
                      currentVoiceGender === 'Female' ? (
                        <IconGenderFemale size={14} />
                      ) : (
                        <IconGenderMale size={14} />
                      )
                    ) : (
                      <IconVolumeOff size={14} />
                    )
                  }
                  styles={{
                    root: {
                      height: '28px',
                      fontSize: '0.75rem',
                    },
                  }}
                  visibleFrom="sm"
                >
                  {t('chat.buttons.voicePlay')}
                </Button>
              </Tooltip>
              {/* Mobile ActionIcon */}
              <Tooltip label={t('chat.labels.voicePlaySettings')} position="top">
                <ActionIcon
                  variant="subtle"
                  size="lg"
                  color={ttsEnabled ? (currentVoiceGender === 'Female' ? 'pink' : 'blue') : 'gray'}
                  disabled={disabled}
                  styles={{
                    root: {
                      height: '28px',
                    },
                  }}
                  hiddenFrom="sm"
                >
                  {ttsEnabled ? (
                    currentVoiceGender === 'Female' ? (
                      <IconGenderFemale size={18} />
                    ) : (
                      <IconGenderMale size={18} />
                    )
                  ) : (
                    <IconVolumeOff size={18} />
                  )}
                </ActionIcon>
              </Tooltip>
            </Box>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>{t('chat.labels.voicePlaySettings')}</Menu.Label>

            <Menu.Item
              leftSection={ttsEnabled ? <IconVolume size={16} /> : <IconVolumeOff size={16} />}
              onClick={handleToggleTTS}
              rightSection={
                <Switch
                  checked={ttsEnabled}
                  onChange={(e) => {
                    // v2.6: Use event value directly to avoid stale closure and double-toggle
                    e.stopPropagation()
                    const newEnabled = e.currentTarget.checked
                    setTTSEnabled(newEnabled)
                    toast.success(newEnabled ? t('chat.status.ttsEnabled') : t('chat.status.ttsDisabled'), {
                      icon: newEnabled ? '🔊' : '🔇'
                    })
                  }}
                  size="sm"
                  onLabel={t('chat.labels.on')}
                  offLabel={t('chat.labels.off')}
                  onClick={(e) => e.stopPropagation()}
                />
              }
            >
              {t('chat.labels.enableTTS')}
            </Menu.Item>

            <Menu.Item
              leftSection={<IconPlayerPlay size={16} />}
              onClick={(e) => {
                e.preventDefault()
                handleToggleAutoPlay()
              }}
              disabled={!ttsEnabled}
              rightSection={
                <Switch
                  checked={autoPlay}
                  onChange={(e) => {
                    // v2.6: Use event value directly to avoid stale closure and double-toggle
                    e.stopPropagation()
                    const newAutoPlay = e.currentTarget.checked
                    setAutoPlay(newAutoPlay)
                    toast.success(newAutoPlay ? t('chat.status.autoPlayOn') : t('chat.status.autoPlayOff'), {
                      icon: newAutoPlay ? '▶️' : '⏸️'
                    })
                  }}
                  disabled={!ttsEnabled}
                  size="sm"
                  onLabel={t('chat.labels.on')}
                  offLabel={t('chat.labels.off')}
                  onClick={(e) => e.stopPropagation()}
                />
              }
            >
              {t('chat.labels.autoPlay')}
            </Menu.Item>

            <Menu.Divider />

            {/* AI TTS Toggle */}
            <Menu.Item
              leftSection={<IconSparkles size={16} />}
              onClick={(e) => {
                e.preventDefault()
                handleToggleAITTS()
              }}
              disabled={!ttsEnabled}
              rightSection={
                <Switch
                  checked={aiTTSEnabled}
                  onChange={(e) => {
                    // v2.6: Use event value directly to avoid stale closure and double-toggle
                    e.stopPropagation()
                    const newAITTSEnabled = e.currentTarget.checked
                    setAITTSEnabled(newAITTSEnabled)
                    toast.success(newAITTSEnabled ? t('tts.aiModel.aiVoiceEnabled') : t('tts.aiModel.aiVoiceDisabled'), {
                      icon: newAITTSEnabled ? '✨' : '🔇'
                    })
                  }}
                  disabled={!ttsEnabled}
                  size="sm"
                  onLabel={t('chat.labels.on')}
                  offLabel={t('chat.labels.off')}
                  onClick={(e) => e.stopPropagation()}
                />
              }
            >
              {t('tts.aiModel.useAIVoice')}
              <Box component="span" style={{ fontSize: '0.7rem', color: 'var(--mantine-color-dimmed)', marginLeft: '6px' }}>
                ({t('tts.aiModel.higherQuality')})
              </Box>
            </Menu.Item>

            {/* Model Download Card (shown when AI TTS is enabled) */}
            {aiTTSEnabled && (
              <Box p="xs">
                <ModelDownloadCard
                  onDownloadStart={handleDownloadModel}
                  onDownloadCancel={handleCancelDownload}
                  onRetry={handleRetryDownload}
                />
              </Box>
            )}

            <Menu.Divider />

            <Menu.Label>{t('chat.labels.voiceType')}</Menu.Label>

            <Box style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {/* 简体中文 */}
              <Menu.Label style={{ fontSize: '0.7rem', color: 'var(--mantine-color-dimmed)', paddingTop: '4px' }}>
                简体中文
              </Menu.Label>
              {EDGE_VOICES.filter(v => v.group === '简体中文').map((voice) => (
                <Menu.Item
                  key={voice.shortName}
                  leftSection={
                    voice.gender === 'Female' ? (
                      <IconGenderFemale size={16} style={{ color: 'rgb(244, 143, 177)' }} />
                    ) : (
                      <IconGenderMale size={16} style={{ color: 'rgba(33, 150, 243, 0.95)' }} />
                    )
                  }
                  onClick={() => setVoiceType(voice.shortName)}
                  disabled={!ttsEnabled}
                  rightSection={voiceType === voice.shortName ? '✓' : ''}
                  style={{
                    backgroundColor: voiceType === voice.shortName ?
                      (voice.gender === 'Female' ? 'rgba(244, 143, 177, 0.1)' : 'rgba(33, 150, 243, 0.1)')
                      : undefined,
                  }}
                >
                  {voice.name}
                </Menu.Item>
              ))}

              {/* 繁体中文/粤语 */}
              <Menu.Label style={{ fontSize: '0.7rem', color: 'var(--mantine-color-dimmed)', paddingTop: '8px' }}>
                繁体中文 / 粤语
              </Menu.Label>
              {EDGE_VOICES.filter(v => v.group === '繁体中文' || v.group === '粤语').map((voice) => (
                <Menu.Item
                  key={voice.shortName}
                  leftSection={
                    voice.gender === 'Female' ? (
                      <IconGenderFemale size={16} style={{ color: 'rgb(244, 143, 177)' }} />
                    ) : (
                      <IconGenderMale size={16} style={{ color: 'rgba(33, 150, 243, 0.95)' }} />
                    )
                  }
                  onClick={() => setVoiceType(voice.shortName)}
                  disabled={!ttsEnabled}
                  rightSection={voiceType === voice.shortName ? '✓' : ''}
                  style={{
                    backgroundColor: voiceType === voice.shortName ?
                      (voice.gender === 'Female' ? 'rgba(244, 143, 177, 0.1)' : 'rgba(33, 150, 243, 0.1)')
                      : undefined,
                  }}
                >
                  {voice.name}
                </Menu.Item>
              ))}

              {/* 英语 */}
              <Menu.Label style={{ fontSize: '0.7rem', color: 'var(--mantine-color-dimmed)', paddingTop: '8px' }}>
                English
              </Menu.Label>
              {EDGE_VOICES.filter(v => v.group === '英语').map((voice) => (
                <Menu.Item
                  key={voice.shortName}
                  leftSection={
                    voice.gender === 'Female' ? (
                      <IconGenderFemale size={16} style={{ color: 'rgb(244, 143, 177)' }} />
                    ) : (
                      <IconGenderMale size={16} style={{ color: 'rgba(33, 150, 243, 0.95)' }} />
                    )
                  }
                  onClick={() => setVoiceType(voice.shortName)}
                  disabled={!ttsEnabled}
                  rightSection={voiceType === voice.shortName ? '✓' : ''}
                  style={{
                    backgroundColor: voiceType === voice.shortName ?
                      (voice.gender === 'Female' ? 'rgba(244, 143, 177, 0.1)' : 'rgba(33, 150, 243, 0.1)')
                      : undefined,
                  }}
                >
                  {voice.name}
                </Menu.Item>
              ))}

              {/* 日语 */}
              <Menu.Label style={{ fontSize: '0.7rem', color: 'var(--mantine-color-dimmed)', paddingTop: '8px' }}>
                日本語
              </Menu.Label>
              {EDGE_VOICES.filter(v => v.group === '日语').map((voice) => (
                <Menu.Item
                  key={voice.shortName}
                  leftSection={
                    voice.gender === 'Female' ? (
                      <IconGenderFemale size={16} style={{ color: 'rgb(244, 143, 177)' }} />
                    ) : (
                      <IconGenderMale size={16} style={{ color: 'rgba(33, 150, 243, 0.95)' }} />
                    )
                  }
                  onClick={() => setVoiceType(voice.shortName)}
                  disabled={!ttsEnabled}
                  rightSection={voiceType === voice.shortName ? '✓' : ''}
                  style={{
                    backgroundColor: voiceType === voice.shortName ?
                      (voice.gender === 'Female' ? 'rgba(244, 143, 177, 0.1)' : 'rgba(33, 150, 243, 0.1)')
                      : undefined,
                  }}
                >
                  {voice.name}
                </Menu.Item>
              ))}
            </Box>

            <Menu.Divider />

            <Menu.Label>{t('chat.labels.playContent')}</Menu.Label>

            {(Object.keys(TTS_PLAY_MODES) as TTSPlayMode[]).map((mode) => (
              <Menu.Item
                key={mode}
                leftSection={<span style={{ fontSize: '14px' }}>{TTS_PLAY_MODES[mode].icon}</span>}
                onClick={() => handlePlayModeChange(mode)}
                disabled={!ttsEnabled}
                rightSection={playMode === mode ? '✓' : ''}
                style={{
                  backgroundColor: playMode === mode ? 'rgba(99, 102, 241, 0.1)' : undefined,
                }}
              >
                <Box>
                  <span style={{ fontWeight: playMode === mode ? 600 : 400 }}>
                    {t(`tts.playMode.${mode}`)}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    color: 'var(--mantine-color-dimmed)',
                    marginLeft: '6px'
                  }}>
                    {t(`tts.playMode.${mode}Desc`)}
                  </span>
                </Box>
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>

        {/* Director Mode Toggle */}
        {currentChat && (
          <>
            {/* Desktop Button */}
            <Tooltip label={currentChat.directorEnabled ? t('chat.labels.directorOn') : t('chat.labels.directorOff')} position="top">
              <Button
                variant="subtle"
                size="compact-sm"
                color={currentChat.directorEnabled ? 'violet' : 'gray'}
                onClick={handleToggleDirector}
                disabled={disabled || isGenerating}
                leftSection={currentChat.directorEnabled ? <IconWand size={14} /> : <IconWandOff size={14} />}
                styles={{
                  root: {
                    height: '28px',
                    fontSize: '0.75rem',
                  },
                }}
                visibleFrom="sm"
              >
                {t('chat.buttons.director')}
              </Button>
            </Tooltip>
            {/* Mobile ActionIcon */}
            <Tooltip label={currentChat.directorEnabled ? t('chat.labels.directorOn') : t('chat.labels.directorOff')} position="top" hiddenFrom="sm">
              <ActionIcon
                variant="subtle"
                size="lg"
                color={currentChat.directorEnabled ? 'violet' : 'gray'}
                onClick={handleToggleDirector}
                disabled={disabled || isGenerating}
                styles={{
                  root: {
                    height: '28px',
                  },
                }}
              >
                {currentChat.directorEnabled ? <IconWand size={18} /> : <IconWandOff size={18} />}
              </ActionIcon>
            </Tooltip>
          </>
        )}

        {/* Check Incomplete Button */}
        {shouldShowCheckButton && (
          <Tooltip label={t('chat.buttons.checkIncomplete')} position="top">
            <Button
              variant="subtle"
              size="compact-sm"
              color="yellow"
              onClick={handleCheckIncomplete}
              disabled={disabled || isGenerating}
              leftSection={<IconAlertCircle size={14} />}
              styles={{
                root: {
                  height: '28px',
                  fontSize: '0.75rem',
                },
              }}
              visibleFrom="sm"
            >
              {t('chat.buttons.checkIncomplete')}
            </Button>
          </Tooltip>
        )}
        {shouldShowCheckButton && (
          <Tooltip label={t('chat.buttons.checkIncomplete')} position="top" hiddenFrom="sm">
            <Button
              variant="subtle"
              size="compact-sm"
              color="yellow"
              onClick={handleCheckIncomplete}
              disabled={disabled || isGenerating}
              styles={{
                root: {
                  height: '28px',
                  padding: '0 8px',
                },
              }}
              hiddenFrom="sm"
            >
              <IconAlertCircle size={14} />
            </Button>
          </Tooltip>
        )}

        {/* Regenerate Button */}
        {showRegenerate && (
          <Tooltip label={t('chat.buttons.regenerate')} position="top">
            <Button
              variant="subtle"
              size="compact-sm"
              onClick={onRegenerate}
              disabled={disabled || isGenerating}
              leftSection={
                isGenerating ? (
                  <Loader size={14} />
                ) : (
                  <IconRefresh size={14} />
                )
              }
              styles={{
                root: {
                  height: '28px',
                  fontSize: '0.75rem',
                },
              }}
              visibleFrom="sm"
            >
              {t('chat.buttons.regenerate')}
            </Button>
          </Tooltip>
        )}
        {showRegenerate && (
          <Tooltip label={t('chat.buttons.regenerate')} position="top" hiddenFrom="sm">
            <Button
              variant="subtle"
              size="compact-sm"
              onClick={onRegenerate}
              disabled={disabled || isGenerating}
              styles={{
                root: {
                  height: '28px',
                  padding: '0 8px',
                },
              }}
              hiddenFrom="sm"
            >
              {isGenerating ? (
                <Loader size={14} />
              ) : (
                <IconRefresh size={14} />
              )}
            </Button>
          </Tooltip>
        )}

        {/* Scroll to Bottom Button */}
        <Tooltip label={t('chat.buttons.scrollToBottom')} position="top">
          <Button
            variant="subtle"
            size="compact-sm"
            color="cyan"
            onClick={onScrollToBottom}
            disabled={disabled}
            leftSection={<IconArrowDown size={14} />}
            styles={{
              root: {
                height: '28px',
                fontSize: '0.75rem',
              },
            }}
            visibleFrom="sm"
          >
            {t('chat.buttons.scrollToBottom')}
          </Button>
        </Tooltip>
        <Tooltip label={t('chat.buttons.scrollToBottom')} position="top" hiddenFrom="sm">
          <Button
            variant="subtle"
            size="compact-sm"
            color="cyan"
            onClick={onScrollToBottom}
            disabled={disabled}
            styles={{
              root: {
                height: '28px',
                padding: '0 8px',
              },
            }}
            hiddenFrom="sm"
          >
            <IconArrowDown size={14} />
          </Button>
        </Tooltip>
      </Group>
    </Group>
  )
}

