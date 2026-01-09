/**
 * ChatEntryWizard - 聊天进入向导组件
 *
 * 用户进入对话时的设置向导，包含：
 * 1. 开场白选择
 * 2. 角色设定选择（遵循角色卡设定 / 自定义角色设定）
 * 3. 预设选择（可选）
 * 4. TTS 语音设置（根据角色语言自动匹配）
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Modal,
  Stepper,
  Stack,
  Group,
  Button,
  Text,
  Badge,
  Box,
  Card,
  Loader,
  ActionIcon,
  ScrollArea,
  Select,
  Switch,
  Slider,
  Divider,
  Avatar,
  ThemeIcon,
  Paper,
  SimpleGrid,
  Tooltip,
  Radio,
  Collapse,
} from '@mantine/core'
import {
  IconSparkles,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconUser,
  IconAdjustments,
  IconVolume,
  IconPlayerPlay,
  IconLanguage,
  IconSettings,
  IconWand,
  IconArrowRight,
  IconX,
  IconPencil,
  IconBrain,
  IconMessageCircle,
  IconBolt,
  IconEye,
  IconMovie,
  IconTheater,
  IconDeviceGamepad2,
} from '@tabler/icons-react'
import { useSwipeable } from 'react-swipeable'
import { useTranslation } from '@/lib/i18n'
import { useTTSStore, getRecommendedVoiceForLocale, type TTSPlayMode } from '@/stores/ttsStore'
import { Character } from '@sillytavern-clone/shared'
import GreetingRenderer from '../greeting/GreetingRenderer'
import { useCreativeStore, DIRECTIVE_METADATA } from '@/stores/creativeStore'

// ====== Types ======
interface GreetingMessage {
  id: string
  content: string
  contentType: 'text' | 'html' | 'markdown'
  scenario?: string
  tags?: string[]
  isDefault?: boolean
  usageCount?: number
  styleConfig?: any
  interactiveOptions?: any
}

interface Preset {
  id: string
  name: string
  description?: string
  author?: string
  sourceFormat: string
  category?: string
  version?: string
  promptCount?: number
  regexCount?: number
  tags?: string[]
}

interface ChatEntryWizardProps {
  isOpen: boolean
  onClose: () => void
  character: Character | null
  onConfirm: (config: ChatEntryConfig) => void
}

export interface ChatEntryConfig {
  greetingId: string | null
  useDefaultSettings: boolean  // true = 遵循角色卡设定, false = 自定义
  presetId: string | null
  ttsSettings: {
    enabled: boolean
    autoPlay: boolean
    voiceType: string
    languageMode: 'auto' | 'manual'  // auto = 根据角色自动选择语言
  }
  // 🎭 v22 沉浸模式
  enableImmersiveMode: boolean  // 是否启用沉浸式 RPG 模式
}

// ====== Voice Options ======
// 使用 EDGE_VOICES 配置，保持与 ChatControlBar 一致
import { EDGE_VOICES } from '@/lib/config/edge-voices'

const VOICE_OPTIONS = EDGE_VOICES.map(v => ({
  value: v.shortName,
  label: v.name,
  locale: v.locale,
  gender: v.gender,
  group: v.group,
}))

// ====== Detect Character Language ======
function detectCharacterLanguage(character: Character | null): string {
  if (!character) return 'zh-CN'

  // 检查角色卡标签
  const tags = character.tags || []
  const tagString = tags.join(' ').toLowerCase()

  // 检查角色名和描述
  const textToCheck = [
    character.name || '',
    character.description || '',
    character.firstMessage || '',
    character.scenario || '',
  ].join(' ')

  // 日语检测 - 检查假名
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(textToCheck) ||
      tagString.includes('japanese') || tagString.includes('日语') || tagString.includes('日本')) {
    return 'ja'
  }

  // 英语检测 - 主要是英文字符且标签包含english
  if ((tagString.includes('english') || tagString.includes('英语') || tagString.includes('英文')) &&
      /^[\x00-\x7F\s]*$/.test(character.name || '')) {
    return 'en'
  }

  // 繁体中文检测
  if (tagString.includes('繁体') || tagString.includes('traditional') || tagString.includes('台湾') || tagString.includes('香港')) {
    return 'zh-TW'
  }

  // 默认简体中文
  return 'zh-CN'
}

// ====== Main Component ======
export default function ChatEntryWizard({
  isOpen,
  onClose,
  character,
  onConfirm,
}: ChatEntryWizardProps) {
  const { t } = useTranslation()
  const ttsStore = useTTSStore()

  // Stepper state
  const [activeStep, setActiveStep] = useState(0)
  
  // Mobile detection for fullScreen modal
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Step 1: Greetings
  const [greetings, setGreetings] = useState<GreetingMessage[]>([])
  const [selectedGreetingIndex, setSelectedGreetingIndex] = useState(0)
  const [loadingGreetings, setLoadingGreetings] = useState(false)

  // Step 2: Settings mode
  const [useDefaultSettings, setUseDefaultSettings] = useState(true)

  // Step 3: Presets
  const [presets, setPresets] = useState<Preset[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [loadingPresets, setLoadingPresets] = useState(false)

  // Step 4: TTS Settings
  const [ttsEnabled, setTtsEnabled] = useState(ttsStore.enabled)
  const [ttsAutoPlay, setTtsAutoPlay] = useState(ttsStore.autoPlay)
  const [ttsVoice, setTtsVoice] = useState(ttsStore.voiceType)
  const [ttsLanguageMode, setTtsLanguageMode] = useState<'auto' | 'manual'>('auto')
  const [detectedLanguage, setDetectedLanguage] = useState('zh-CN')

  // 🎭 v22 Step 5: Immersive Mode
  const [enableImmersiveMode, setEnableImmersiveMode] = useState(false)

  // Step 2.5: Creative Directives (between Settings mode and Presets)
  const creativeStore = useCreativeStore()

  // ====== Load Greetings ======
  useEffect(() => {
    if (!isOpen || !character?.id) return

    const fetchGreetings = async () => {
      try {
        setLoadingGreetings(true)
        const response = await fetch(`/api/characters/${character.id}/greetings`)
        if (!response.ok) throw new Error('Failed to fetch greetings')

        const data = await response.json()
        const greetingList = data.greetings || []
        setGreetings(greetingList)

        // 默认选中 isDefault 或第一个
        const defaultIndex = greetingList.findIndex((g: GreetingMessage) => g.isDefault)
        setSelectedGreetingIndex(defaultIndex >= 0 ? defaultIndex : 0)
      } catch (err) {
        console.error('Error fetching greetings:', err)
        setGreetings([])
      } finally {
        setLoadingGreetings(false)
      }
    }

    fetchGreetings()
  }, [isOpen, character?.id])

  // ====== Load Presets ======
  useEffect(() => {
    if (!isOpen) return

    const fetchPresets = async () => {
      try {
        setLoadingPresets(true)
        const res = await fetch('/api/presets?limit=50')
        const data = await res.json()
        if (res.ok) {
          setPresets(data.presets || [])
        }
      } catch (error) {
        console.error('获取预设列表失败:', error)
      } finally {
        setLoadingPresets(false)
      }
    }

    fetchPresets()
  }, [isOpen])

  // ====== Detect Language ======
  useEffect(() => {
    if (character) {
      const lang = detectCharacterLanguage(character)
      setDetectedLanguage(lang)

      // 如果是自动模式，根据检测到的语言设置语音
      if (ttsLanguageMode === 'auto') {
        const recommendedVoice = getRecommendedVoiceForLocale(lang)
        setTtsVoice(recommendedVoice)
      }
    }
  }, [character, ttsLanguageMode])

  // ====== Reset on open ======
  useEffect(() => {
    if (isOpen) {
      setActiveStep(0)
      setUseDefaultSettings(true)
      setSelectedPresetId(null)
      setTtsEnabled(ttsStore.enabled)
      setTtsAutoPlay(ttsStore.autoPlay)
      setTtsLanguageMode('auto')
    }
  }, [isOpen])

  // ====== Swipe handlers ======
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (selectedGreetingIndex < greetings.length - 1) {
        setSelectedGreetingIndex(prev => prev + 1)
      }
    },
    onSwipedRight: () => {
      if (selectedGreetingIndex > 0) {
        setSelectedGreetingIndex(prev => prev - 1)
      }
    },
    trackMouse: true
  })

  // ====== Navigation ======
  const handleNext = () => {
    if (activeStep < 5) {
      setActiveStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1)
    }
  }

  // ====== Confirm ======
  const handleConfirm = async () => {
    const config: ChatEntryConfig = {
      greetingId: greetings[selectedGreetingIndex]?.id || null,
      useDefaultSettings,
      presetId: selectedPresetId,
      ttsSettings: {
        enabled: ttsEnabled,
        autoPlay: ttsAutoPlay,
        voiceType: ttsVoice,
        languageMode: ttsLanguageMode,
      },
      enableImmersiveMode,
    }

    // 更新 TTS store
    ttsStore.setEnabled(ttsEnabled)
    ttsStore.setAutoPlay(ttsAutoPlay)
    ttsStore.setVoiceType(ttsVoice)

    // 🔧 重要修复：不在这里调用 onClose()
    // 让父组件 ChatInterface 在 handleChatEntryWizardConfirm 成功后控制关闭
    // 这样可以确保 currentChat 已经设置完成，避免 onClose 中的 !currentChat 检查导致错误跳转
    await onConfirm(config)
    // 注意：onClose() 由父组件在确认成功后调用
  }

  // ====== Quick Start (跳过向导) ======
  const handleQuickStart = async () => {
    const config: ChatEntryConfig = {
      greetingId: greetings[selectedGreetingIndex]?.id || null,
      useDefaultSettings: true,
      presetId: null,
      ttsSettings: {
        enabled: ttsStore.enabled,
        autoPlay: ttsStore.autoPlay,
        voiceType: ttsStore.voiceType,
        languageMode: 'auto',
      },
      enableImmersiveMode: false,
    }
    // 🔧 重要修复：不在这里调用 onClose()
    // 让父组件 ChatInterface 在 handleChatEntryWizardConfirm 成功后控制关闭
    await onConfirm(config)
    // 注意：onClose() 由父组件在确认成功后调用
  }

  const currentGreeting = greetings[selectedGreetingIndex]
  const detectedLanguageLabel =
    detectedLanguage === 'ja'
      ? t('chat.entryWizard.tts.detected.ja')
      : detectedLanguage === 'en'
        ? t('chat.entryWizard.tts.detected.en')
        : detectedLanguage === 'zh-TW'
          ? t('chat.entryWizard.tts.detected.zhTW')
          : t('chat.entryWizard.tts.detected.zhCN')

  // ====== Render Steps ======
  const renderGreetingStep = () => (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        {t('chat.entryWizard.greeting.help')}
      </Text>

      {loadingGreetings ? (
        <Box style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader size="lg" color="yellow" />
        </Box>
      ) : greetings.length === 0 ? (
        <Paper p="xl" ta="center" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <Text c="dimmed">{t('chat.entryWizard.greeting.defaultOnly')}</Text>
        </Paper>
      ) : (
        <>
          {/* 开场白计数和标签 */}
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Text size="sm" c="dimmed">
                {selectedGreetingIndex + 1} / {greetings.length}
              </Text>
              {currentGreeting?.isDefault && (
                <Badge size="sm" color="yellow" variant="light">
                  {t('chat.entryWizard.greeting.defaultBadge')}
                </Badge>
              )}
            </Group>
            <Text size="xs" c="dimmed">
              {t('chat.entryWizard.greeting.usage', { count: currentGreeting?.usageCount || 0 })}
            </Text>
          </Group>

          {/* 开场白预览 */}
          <Box
            {...swipeHandlers}
            style={{
              position: 'relative',
              minHeight: isMobile ? '150px' : '200px',
              maxHeight: isMobile ? '200px' : '300px',
              overflow: 'auto',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              padding: isMobile ? '0.75rem' : '1rem',
              backgroundColor: 'rgba(0,0,0,0.2)'
            }}
          >
            {currentGreeting && (
              <GreetingRenderer
                greeting={{
                  id: currentGreeting.id,
                  content: currentGreeting.content,
                  contentType: currentGreeting.contentType,
                  interactiveOptions: currentGreeting.interactiveOptions,
                  styleConfig: currentGreeting.styleConfig
                }}
                characterName={character?.name || 'AI'}
                characterAvatar={character?.avatar}
                onButtonClick={() => {}}
              />
            )}

            {/* 左右切换按钮 */}
            {greetings.length > 1 && (
              <>
                <ActionIcon
                  onClick={() => setSelectedGreetingIndex(prev => Math.max(0, prev - 1))}
                  disabled={selectedGreetingIndex === 0}
                  size="lg"
                  radius="xl"
                  variant="filled"
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: selectedGreetingIndex === 0 ? '#333' : 'var(--accent-gold-hex)',
                    color: selectedGreetingIndex === 0 ? '#666' : '#1c1c1c'
                  }}
                >
                  <IconChevronLeft size={20} />
                </ActionIcon>

                <ActionIcon
                  onClick={() => setSelectedGreetingIndex(prev => Math.min(greetings.length - 1, prev + 1))}
                  disabled={selectedGreetingIndex === greetings.length - 1}
                  size="lg"
                  radius="xl"
                  variant="filled"
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: selectedGreetingIndex === greetings.length - 1 ? '#333' : 'var(--accent-gold-hex)',
                    color: selectedGreetingIndex === greetings.length - 1 ? '#666' : '#1c1c1c'
                  }}
                >
                  <IconChevronRight size={20} />
                </ActionIcon>
              </>
            )}
          </Box>

          {/* 场景描述 */}
          {currentGreeting?.scenario && (
            <Box p="sm" style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
              <Text size="xs" c="dimmed" mb={4}>
                {t('chat.entryWizard.greeting.scenarioLabel')}
              </Text>
              <Text size="sm">{currentGreeting.scenario}</Text>
            </Box>
          )}
        </>
      )}
    </Stack>
  )

  const renderSettingsModeStep = () => (
    <Stack gap="lg">
      <Text size="sm" c="dimmed">
        {t('chat.entryWizard.settings.help')}
      </Text>

      <SimpleGrid cols={1} spacing="md">
        {/* 遵循角色卡设定 */}
        <Card
          withBorder
          p="lg"
          radius="md"
          style={{
            cursor: 'pointer',
            borderColor: useDefaultSettings ? 'var(--accent-gold-hex)' : 'var(--glass-border)',
            backgroundColor: useDefaultSettings ? 'rgba(249, 200, 109, 0.1)' : 'transparent',
            transition: 'all 0.2s'
          }}
          onClick={() => setUseDefaultSettings(true)}
        >
          <Group>
            <ThemeIcon
              size="xl"
              radius="md"
              variant={useDefaultSettings ? 'filled' : 'light'}
              color="yellow"
            >
              <IconWand size={24} />
            </ThemeIcon>
            <div style={{ flex: 1 }}>
              <Text fw={600} size="md">{t('chat.entryWizard.settings.followCard.title')}</Text>
              <Text size="sm" c="dimmed">
                {t('chat.entryWizard.settings.followCard.desc')}
              </Text>
            </div>
            {useDefaultSettings && (
              <ThemeIcon color="green" variant="light" radius="xl">
                <IconCheck size={18} />
              </ThemeIcon>
            )}
          </Group>
        </Card>

        {/* 自定义设定 */}
        <Card
          withBorder
          p="lg"
          radius="md"
          style={{
            cursor: 'pointer',
            borderColor: !useDefaultSettings ? 'var(--accent-gold-hex)' : 'var(--glass-border)',
            backgroundColor: !useDefaultSettings ? 'rgba(249, 200, 109, 0.1)' : 'transparent',
            transition: 'all 0.2s'
          }}
          onClick={() => setUseDefaultSettings(false)}
        >
          <Group>
            <ThemeIcon
              size="xl"
              radius="md"
              variant={!useDefaultSettings ? 'filled' : 'light'}
              color="blue"
            >
              <IconUser size={24} />
            </ThemeIcon>
            <div style={{ flex: 1 }}>
              <Text fw={600} size="md">{t('chat.entryWizard.settings.custom.title')}</Text>
              <Text size="sm" c="dimmed">
                {t('chat.entryWizard.settings.custom.desc')}
              </Text>
            </div>
            {!useDefaultSettings && (
              <ThemeIcon color="green" variant="light" radius="xl">
                <IconCheck size={18} />
              </ThemeIcon>
            )}
          </Group>
        </Card>
      </SimpleGrid>

      {!useDefaultSettings && (
        <Paper p="md" withBorder style={{ borderColor: 'rgba(59, 130, 246, 0.3)', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
          <Group gap="xs" mb="xs">
            <IconSettings size={16} />
            <Text size="sm" fw={500}>{t('chat.entryWizard.settings.tip.title')}</Text>
          </Group>
          <Text size="xs" c="dimmed">
            {t('chat.entryWizard.settings.tip.desc')}
          </Text>
        </Paper>
      )}
    </Stack>
  )

  const renderPresetStep = () => (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        {t('chat.entryWizard.preset.help')}
      </Text>

      {loadingPresets ? (
        <Box style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Loader size="md" />
        </Box>
      ) : presets.length === 0 ? (
        <Paper p="xl" ta="center" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
          <Text c="dimmed" mb="sm">{t('chat.entryWizard.preset.emptyTitle')}</Text>
          <Text size="xs" c="dimmed">{t('chat.entryWizard.preset.emptyDesc')}</Text>
        </Paper>
      ) : (
        <ScrollArea h={300}>
          <Stack gap="sm">
            {/* 不使用预设选项 */}
            <Card
              withBorder
              p="md"
              radius="md"
              style={{
                cursor: 'pointer',
                borderColor: selectedPresetId === null ? 'var(--accent-gold-hex)' : 'var(--glass-border)',
                backgroundColor: selectedPresetId === null ? 'rgba(249, 200, 109, 0.1)' : 'transparent',
              }}
              onClick={() => setSelectedPresetId(null)}
            >
              <Group justify="space-between">
                <div>
                  <Text fw={500}>{t('chat.entryWizard.preset.none.title')}</Text>
                  <Text size="xs" c="dimmed">{t('chat.entryWizard.preset.none.desc')}</Text>
                </div>
                {selectedPresetId === null && (
                  <IconCheck size={18} color="var(--accent-gold-hex)" />
                )}
              </Group>
            </Card>

            {/* 预设列表 */}
            {presets.map(preset => (
              <Card
                key={preset.id}
                withBorder
                p="md"
                radius="md"
                style={{
                  cursor: 'pointer',
                  borderColor: selectedPresetId === preset.id ? 'var(--accent-gold-hex)' : 'var(--glass-border)',
                  backgroundColor: selectedPresetId === preset.id ? 'rgba(249, 200, 109, 0.1)' : 'transparent',
                }}
                onClick={() => setSelectedPresetId(preset.id)}
              >
                <Group justify="space-between" wrap="nowrap">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Group gap="xs" mb={4}>
                      <Text fw={500} truncate>{preset.name}</Text>
                      {preset.promptCount !== undefined && (
                        <Badge size="xs" variant="light" color="blue">
                          {t('chat.entryWizard.preset.promptCount', { count: preset.promptCount })}
                        </Badge>
                      )}
                      {preset.regexCount && preset.regexCount > 0 && (
                        <Badge size="xs" variant="light" color="teal">
                          {t('chat.entryWizard.preset.regexCount', { count: preset.regexCount })}
                        </Badge>
                      )}
                    </Group>
                    {preset.description && (
                      <Text size="xs" c="dimmed" lineClamp={2}>{preset.description}</Text>
                    )}
                  </div>
                  {selectedPresetId === preset.id && (
                    <IconCheck size={18} color="var(--accent-gold-hex)" style={{ flexShrink: 0 }} />
                  )}
                </Group>
              </Card>
            ))}
          </Stack>
        </ScrollArea>
      )}
    </Stack>
  )

  const renderTTSStep = () => (
    <Stack gap="lg">
      <Text size="sm" c="dimmed">
        {t('chat.entryWizard.tts.help')}
      </Text>

      {/* TTS 开关 */}
      <Group justify="space-between">
        <div>
          <Text fw={500}>{t('chat.entryWizard.tts.enable.title')}</Text>
          <Text size="xs" c="dimmed">{t('chat.entryWizard.tts.enable.desc')}</Text>
        </div>
        <Switch
          checked={ttsEnabled}
          onChange={(e) => setTtsEnabled(e.currentTarget.checked)}
          color="yellow"
          size="md"
        />
      </Group>

      <Collapse in={ttsEnabled}>
        <Stack gap="md">
          <Divider />

          {/* 自动播放 */}
          <Group justify="space-between">
            <div>
              <Text fw={500}>{t('chat.entryWizard.tts.autoPlay.title')}</Text>
              <Text size="xs" c="dimmed">{t('chat.entryWizard.tts.autoPlay.desc')}</Text>
            </div>
            <Switch
              checked={ttsAutoPlay}
              onChange={(e) => setTtsAutoPlay(e.currentTarget.checked)}
              color="yellow"
              size="md"
            />
          </Group>

          <Divider />

          {/* 语言模式 */}
          <div>
            <Text fw={500} mb="xs">{t('chat.entryWizard.tts.language.title')}</Text>
            <Radio.Group
              value={ttsLanguageMode}
              onChange={(value) => setTtsLanguageMode(value as 'auto' | 'manual')}
            >
              <Stack gap="sm">
                <Radio
                  value="auto"
                  label={
                    <div>
                      <Text size="sm">{t('chat.entryWizard.tts.language.auto.title')}</Text>
                      <Text size="xs" c="dimmed">
                        {t('chat.entryWizard.tts.language.auto.desc', { language: detectedLanguageLabel })}
                      </Text>
                    </div>
                  }
                />
                <Radio
                  value="manual"
                  label={
                    <div>
                      <Text size="sm">{t('chat.entryWizard.tts.language.manual.title')}</Text>
                      <Text size="xs" c="dimmed">{t('chat.entryWizard.tts.language.manual.desc')}</Text>
                    </div>
                  }
                />
              </Stack>
            </Radio.Group>
          </div>

          {/* 语音选择 */}
          <Collapse in={ttsLanguageMode === 'manual'}>
            <Select
              label={t('chat.entryWizard.tts.voiceSelect.label')}
              placeholder={t('chat.entryWizard.tts.voiceSelect.placeholder')}
              value={ttsVoice}
              onChange={(value) => value && setTtsVoice(value)}
              data={VOICE_OPTIONS.map(v => ({ value: v.value, label: v.label }))}
            />
          </Collapse>

          {/* 当前语音预览 */}
          <Paper p="sm" withBorder style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <Group gap="xs">
              <IconVolume size={16} />
              <Text size="sm">
                {t('chat.entryWizard.tts.currentVoice', {
                  voice: VOICE_OPTIONS.find(v => v.value === ttsVoice)?.label || ttsVoice
                })}
              </Text>
            </Group>
          </Paper>
        </Stack>
      </Collapse>
    </Stack>
  )

  // ====== Creative Directives Step (插入在设定模式和预设之间) ======
  const renderCreativeDirectivesStep = () => {
    // 分组配置
    const directiveGroups = [
      {
        key: 'richness',
        label: t('chat.entryWizard.creative.groups.richness.label'),
        description: t('chat.entryWizard.creative.groups.richness.desc'),
        directives: [
          { key: 'detailedDescription', label: t('chat.entryWizard.creative.directives.detailedDescription.label'), desc: t('chat.entryWizard.creative.directives.detailedDescription.desc') },
          { key: 'psychologyFocus', label: t('chat.entryWizard.creative.directives.psychologyFocus.label'), desc: t('chat.entryWizard.creative.directives.psychologyFocus.desc') },
          { key: 'actionFocus', label: t('chat.entryWizard.creative.directives.actionFocus.label'), desc: t('chat.entryWizard.creative.directives.actionFocus.desc') },
          { key: 'environmentFocus', label: t('chat.entryWizard.creative.directives.environmentFocus.label'), desc: t('chat.entryWizard.creative.directives.environmentFocus.desc') },
          { key: 'appearanceFocus', label: t('chat.entryWizard.creative.directives.appearanceFocus.label'), desc: t('chat.entryWizard.creative.directives.appearanceFocus.desc') },
        ],
      },
      {
        key: 'interaction',
        label: t('chat.entryWizard.creative.groups.interaction.label'),
        description: t('chat.entryWizard.creative.groups.interaction.desc'),
        directives: [
          { key: 'interactiveChoices', label: t('chat.entryWizard.creative.directives.interactiveChoices.label'), desc: t('chat.entryWizard.creative.directives.interactiveChoices.desc') },
          { key: 'emotionTagging', label: t('chat.entryWizard.creative.directives.emotionTagging.label'), desc: t('chat.entryWizard.creative.directives.emotionTagging.desc') },
        ],
      },
      {
        key: 'pacing',
        label: t('chat.entryWizard.creative.groups.pacing.label'),
        description: t('chat.entryWizard.creative.groups.pacing.desc'),
        directives: [
          { key: 'slowPacing', label: t('chat.entryWizard.creative.directives.slowPacing.label'), desc: t('chat.entryWizard.creative.directives.slowPacing.desc') },
          { key: 'fastPacing', label: t('chat.entryWizard.creative.directives.fastPacing.label'), desc: t('chat.entryWizard.creative.directives.fastPacing.desc') },
        ],
      },
    ]

    const getDirectiveValue = (key: string): boolean => {
      return (creativeStore as any)[key] || false
    }

    const setDirectiveValue = (key: string, value: boolean) => {
      const setterName = `set${key.charAt(0).toUpperCase() + key.slice(1)}`
      const setter = (creativeStore as any)[setterName]
      if (setter) setter(value)
    }

    return (
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {t('chat.entryWizard.creative.help')}
        </Text>

        {/* 推荐配置卡片 */}
        <Paper
          p="md"
          radius="md"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          <Group gap="sm" mb="xs">
            <IconSparkles size={18} style={{ color: 'rgb(147, 197, 253)' }} />
            <Text size="sm" fw={600} style={{ color: 'rgb(219, 234, 254)' }}>
              {t('chat.entryWizard.creative.recommended.title')}
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            {t('chat.entryWizard.creative.recommended.desc')}
          </Text>
        </Paper>

        <ScrollArea h={isMobile ? 200 : 260}>
          <Stack gap="md">
            {directiveGroups.map((group) => (
              <Card key={group.key} withBorder p="sm" radius="md">
                <Text size="sm" fw={600} mb="xs">
                  {group.label}
                </Text>
                <Text size="xs" c="dimmed" mb="sm">
                  {group.description}
                </Text>
                <Stack gap="xs">
                  {group.directives.map((directive) => (
                    <Group key={directive.key} justify="space-between" wrap="nowrap">
                      <div>
                        <Text size="sm">{directive.label}</Text>
                        <Text size="xs" c="dimmed">{directive.desc}</Text>
                      </div>
                      <Switch
                        size="sm"
                        checked={getDirectiveValue(directive.key)}
                        onChange={(e) => setDirectiveValue(directive.key, e.currentTarget.checked)}
                        color="blue"
                      />
                    </Group>
                  ))}
                </Stack>
              </Card>
            ))}

            {/* 特殊效果说明 */}
            <Paper p="sm" withBorder style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <Group gap="xs" mb="xs">
                <IconWand size={16} style={{ color: 'var(--mantine-color-violet-5)' }} />
                <Text size="sm" fw={500}>{t('chat.entryWizard.creative.special.title')}</Text>
              </Group>
              <Text size="xs" c="dimmed">
                {t('chat.entryWizard.creative.special.desc')}
              </Text>
            </Paper>
          </Stack>
        </ScrollArea>
      </Stack>
    )
  }

  // 🎭 v22 Immersive Mode Step
  const renderImmersiveModeStep = () => (
    <Stack gap="lg">
      <Text size="sm" c="dimmed">
        {t('chat.entryWizard.immersive.help')}
      </Text>

      <SimpleGrid cols={1} spacing="md">
        {/* 普通模式 */}
        <Card
          withBorder
          p="lg"
          radius="md"
          style={{
            cursor: 'pointer',
            borderColor: !enableImmersiveMode ? 'var(--accent-gold-hex)' : 'var(--glass-border)',
            backgroundColor: !enableImmersiveMode ? 'rgba(249, 200, 109, 0.1)' : 'transparent',
            transition: 'all 0.2s'
          }}
          onClick={() => setEnableImmersiveMode(false)}
        >
          <Group>
            <ThemeIcon
              size="xl"
              radius="md"
              variant={!enableImmersiveMode ? 'filled' : 'light'}
              color="gray"
            >
              <IconMessageCircle size={24} />
            </ThemeIcon>
            <div style={{ flex: 1 }}>
              <Text fw={600} size="md">{t('chat.entryWizard.immersive.normal.title')}</Text>
              <Text size="sm" c="dimmed">
                {t('chat.entryWizard.immersive.normal.desc')}
              </Text>
            </div>
            {!enableImmersiveMode && (
              <ThemeIcon color="green" variant="light" radius="xl">
                <IconCheck size={18} />
              </ThemeIcon>
            )}
          </Group>
        </Card>

        {/* 沉浸式 RPG 模式 */}
        <Card
          withBorder
          p="lg"
          radius="md"
          style={{
            cursor: 'pointer',
            borderColor: enableImmersiveMode ? 'var(--accent-gold-hex)' : 'var(--glass-border)',
            backgroundColor: enableImmersiveMode ? 'rgba(249, 200, 109, 0.1)' : 'transparent',
            transition: 'all 0.2s'
          }}
          onClick={() => setEnableImmersiveMode(true)}
        >
          <Group>
            <ThemeIcon
              size="xl"
              radius="md"
              variant={enableImmersiveMode ? 'filled' : 'light'}
              color="violet"
              style={{
                background: enableImmersiveMode
                  ? 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)'
                  : undefined
              }}
            >
              <IconTheater size={24} />
            </ThemeIcon>
            <div style={{ flex: 1 }}>
              <Group gap="xs" mb={4}>
                <Text fw={600} size="md">{t('chat.entryWizard.immersive.rpg.title')}</Text>
                <Badge size="xs" color="violet" variant="light">{t('chat.entryWizard.immersive.rpg.recommended')}</Badge>
              </Group>
              <Text size="sm" c="dimmed">
                {t('chat.entryWizard.immersive.rpg.desc')}
              </Text>
            </div>
            {enableImmersiveMode && (
              <ThemeIcon color="green" variant="light" radius="xl">
                <IconCheck size={18} />
              </ThemeIcon>
            )}
          </Group>
        </Card>
      </SimpleGrid>

      {/* 沉浸模式特性说明 */}
      {enableImmersiveMode && (
        <Paper
          p="md"
          radius="md"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          <Group gap="sm" mb="sm">
            <IconDeviceGamepad2 size={18} style={{ color: 'rgb(196, 181, 253)' }} />
            <Text size="sm" fw={600} style={{ color: 'rgb(233, 213, 255)' }}>
              {t('chat.entryWizard.immersive.features.title')}
            </Text>
          </Group>
          <Stack gap="xs">
            <Group gap="xs">
              <Text size="xs" c="dimmed">🎭</Text>
              <Text size="xs" c="dimmed">{t('chat.entryWizard.immersive.features.items.sidebar')}</Text>
            </Group>
            <Group gap="xs">
              <Text size="xs" c="dimmed">🖼️</Text>
              <Text size="xs" c="dimmed">{t('chat.entryWizard.immersive.features.items.visuals')}</Text>
            </Group>
            <Group gap="xs">
              <Text size="xs" c="dimmed">🎮</Text>
              <Text size="xs" c="dimmed">{t('chat.entryWizard.immersive.features.items.choices')}</Text>
            </Group>
            <Group gap="xs">
              <Text size="xs" c="dimmed">🎤</Text>
              <Text size="xs" c="dimmed">{t('chat.entryWizard.immersive.features.items.voice')}</Text>
            </Group>
          </Stack>
        </Paper>
      )}
    </Stack>
  )

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size="lg"
      centered
      fullScreen={isMobile}
      title={
        <Group gap="sm">
          <Avatar src={character?.avatar} size="md" radius="xl">
            {character?.name?.slice(0, 1) || 'AI'}
          </Avatar>
          <div>
            <Text size="lg" fw={700}>{t('chat.entryWizard.title')}</Text>
            <Text size="xs" c="dimmed">{character?.name || t('chat.entryWizard.subtitleFallback')}</Text>
          </div>
        </Group>
      }
      styles={{
        content: {
          backgroundColor: '#1c1c1c',
          border: '1px solid var(--glass-border)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        },
        header: {
          backgroundColor: 'transparent',
          borderBottom: '1px solid var(--glass-border)',
          flexShrink: 0,
        },
        body: {
          padding: '1rem',
          flex: 1,
          overflow: 'auto',
          minHeight: 0,
        }
      }}
    >
      <Stack gap={isMobile ? 'md' : 'xl'} style={{ height: '100%', minHeight: 0 }}>
        {/* Stepper */}
        <Stepper
          active={activeStep}
          onStepClick={setActiveStep}
          color="yellow"
          size={isMobile ? 'xs' : 'sm'}
          styles={{
            stepIcon: {
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderColor: 'var(--glass-border)',
            },
            stepCompletedIcon: {
              backgroundColor: 'var(--accent-gold-hex)',
            },
            stepLabel: {
              display: isMobile ? 'none' : 'block',
            },
            stepBody: {
              display: isMobile ? 'none' : 'block',
            }
          }}
        >
          <Stepper.Step label={t('chat.entryWizard.steps.greeting')} icon={<IconSparkles size={isMobile ? 16 : 18} />} />
          <Stepper.Step label={t('chat.entryWizard.steps.immersive')} icon={<IconTheater size={isMobile ? 16 : 18} />} />
          <Stepper.Step label={t('chat.entryWizard.steps.settings')} icon={<IconUser size={isMobile ? 16 : 18} />} />
          <Stepper.Step label={t('chat.entryWizard.steps.creative')} icon={<IconPencil size={isMobile ? 16 : 18} />} />
          <Stepper.Step label={t('chat.entryWizard.steps.preset')} icon={<IconAdjustments size={isMobile ? 16 : 18} />} />
          <Stepper.Step label={t('chat.entryWizard.steps.voice')} icon={<IconVolume size={isMobile ? 16 : 18} />} />
        </Stepper>

        {/* Step Content */}
        <Box style={{ minHeight: isMobile ? '200px' : '280px', flex: 1, overflow: 'auto' }}>
          {activeStep === 0 && renderGreetingStep()}
          {activeStep === 1 && renderImmersiveModeStep()}
          {activeStep === 2 && renderSettingsModeStep()}
          {activeStep === 3 && renderCreativeDirectivesStep()}
          {activeStep === 4 && renderPresetStep()}
          {activeStep === 5 && renderTTSStep()}
        </Box>

        {/* Navigation */}
        <Group justify="space-between" wrap="wrap" gap="sm" style={{ flexShrink: 0 }}>
          <Button
            variant="subtle"
            onClick={handleQuickStart}
            leftSection={!isMobile && <IconArrowRight size={16} />}
            size={isMobile ? 'xs' : 'sm'}
          >
            {isMobile ? t('chat.entryWizard.nav.skipShort') : t('chat.entryWizard.nav.skipFull')}
          </Button>

          <Group gap="xs">
            {activeStep > 0 && (
              <Button
                variant="light"
                onClick={handleBack}
                leftSection={<IconChevronLeft size={16} />}
                size={isMobile ? 'xs' : 'sm'}
              >
                {isMobile ? '' : t('chat.entryWizard.nav.back')}
              </Button>
            )}

            {activeStep < 5 ? (
              <Button
                onClick={handleNext}
                rightSection={<IconChevronRight size={16} />}
                size={isMobile ? 'sm' : 'md'}
                style={{ backgroundColor: 'var(--accent-gold-hex)', color: '#1c1c1c' }}
              >
                {t('chat.entryWizard.nav.next')}
              </Button>
            ) : (
              <Button
                onClick={handleConfirm}
                leftSection={<IconCheck size={16} />}
                size={isMobile ? 'sm' : 'md'}
                style={{ backgroundColor: 'var(--accent-gold-hex)', color: '#1c1c1c' }}
              >
                {t('chat.entryWizard.nav.start')}
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Modal>
  )
}
