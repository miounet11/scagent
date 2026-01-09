'use client'

/**
 * TheaterSidePanel v3.0 - Soul Theater Elite Experience
 *
 * Cinematic sidebar with:
 * - Theatrical glass morphism with gold accents
 * - Dynamic emotion-reactive styling
 * - Animated intimacy progress with particle effects
 * - Rich tab system with smooth transitions
 * - User persona ({{user}}) settings integration
 */

import { memo, useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Box,
  Text,
  Avatar,
  Group,
  Stack,
  Progress,
  Badge,
  ActionIcon,
  Tooltip,
  Tabs,
  ScrollArea,
  Button,
  TextInput,
  Textarea,
  Modal,
  Divider,
} from '@mantine/core'
import {
  IconHeart,
  IconHistory,
  IconUsers,
  IconPhoto,
  IconChevronLeft,
  IconChevronRight,
  IconSparkles,
  IconRefresh,
  IconSettings,
  IconUser,
  IconPalette,
  IconPlayerPlay,
  IconMoodSmile,
  IconFlame,
  IconSnowflake,
  IconStar,
} from '@tabler/icons-react'
import { detectEmotionFromContent, getEmotionColors } from '@/components/effects'
import type { EmotionType } from '@/components/effects'

// ==================== Types ====================

interface TheaterSidePanelProps {
  characterId: string
  characterName: string
  characterAvatar?: string
  charType?: 'character' | 'community'
  userId?: string
  latestMessage?: string
  intimacyLevel?: number
  maxIntimacy?: number
  chatId?: string
  messageCount?: number
  userPersona?: UserPersona
  onUserPersonaChange?: (persona: UserPersona) => void
  onViewGallery?: () => void
  defaultCollapsed?: boolean
  position?: 'left' | 'right'
}

export interface UserPersona {
  name: string
  nickname?: string
  gender?: 'male' | 'female' | 'other' | 'unspecified'
  description?: string
  avatar?: string
}

// ==================== Emotion Icon Mapping ====================

const EMOTION_ICONS: Record<EmotionType, { icon: React.ReactNode; label: string }> = {
  happy: { icon: '✨', label: '开心' },
  joy: { icon: '🌟', label: '喜悦' },
  love: { icon: '💗', label: '心动' },
  affection: { icon: '💕', label: '爱恋' },
  shy: { icon: '😊', label: '害羞' },
  embarrassed: { icon: '////', label: '羞涩' },
  angry: { icon: '💢', label: '生气' },
  frustrated: { icon: '😤', label: '烦躁' },
  sad: { icon: '💧', label: '难过' },
  melancholy: { icon: '🌧', label: '忧郁' },
  surprised: { icon: '❗', label: '惊讶' },
  shocked: { icon: '⚡', label: '震惊' },
  scared: { icon: '😰', label: '害怕' },
  anxious: { icon: '💭', label: '焦虑' },
  thinking: { icon: '🤔', label: '思考' },
  curious: { icon: '❓', label: '好奇' },
  smug: { icon: '😏', label: '得意' },
  confident: { icon: '💫', label: '自信' },
  excited: { icon: '🎉', label: '兴奋' },
  energetic: { icon: '⚡', label: '活力' },
  neutral: { icon: '😌', label: '平静' },
}

// ==================== Theater Color Palette ====================

const theaterColors = {
  voidDeep: 'rgba(12, 10, 26, 0.98)',
  stageGlow: 'rgba(26, 20, 41, 0.85)',
  spotlightGold: '#f5c542',
  spotlightGoldDim: 'rgba(245, 197, 66, 0.3)',
  emotionRose: '#e8486a',
  emotionRoseDim: 'rgba(232, 72, 106, 0.3)',
  moonlight: '#c4b5fd',
  moonlightDim: 'rgba(196, 181, 253, 0.3)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassGold: 'rgba(245, 197, 66, 0.15)',
}

// ==================== Animated Progress Ring ====================

function IntimacyRing({
  value,
  max = 100,
  size = 80,
  emotion
}: {
  value: number
  max?: number
  size?: number
  emotion: EmotionType
}) {
  const percentage = Math.min((value / max) * 100, 100)
  const circumference = 2 * Math.PI * 35
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  const emotionColors = getEmotionColors(emotion)

  return (
    <Box style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={35}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="6"
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={35}
          fill="none"
          stroke={`url(#intimacyGradient-${emotion})`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 8px ${emotionColors.glow})` }}
        />
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`intimacyGradient-${emotion}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theaterColors.emotionRose} />
            <stop offset="100%" stopColor={theaterColors.spotlightGold} />
          </linearGradient>
        </defs>
      </svg>
      {/* Center content */}
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconHeart size={16} style={{ color: theaterColors.emotionRose }} />
        <Text size="xs" fw={700} style={{ color: theaterColors.spotlightGold }}>
          {value}
        </Text>
      </Box>
    </Box>
  )
}

// ==================== Floating Particles ====================

function FloatingParticles({ emotion }: { emotion: EmotionType }) {
  const particles = useMemo(() => {
    const count = emotion === 'neutral' ? 5 : 12
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 4,
    }))
  }, [emotion])

  const emotionColors = getEmotionColors(emotion)

  return (
    <Box
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: emotionColors.primary.replace('0.6', '0.4'),
            boxShadow: `0 0 ${p.size * 2}px ${emotionColors.glow}`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </Box>
  )
}

// ==================== User Persona Modal ====================

function UserPersonaModal({
  opened,
  onClose,
  persona,
  onSave,
}: {
  opened: boolean
  onClose: () => void
  persona: UserPersona
  onSave: (persona: UserPersona) => void
}) {
  const [localPersona, setLocalPersona] = useState<UserPersona>(persona)

  useEffect(() => {
    setLocalPersona(persona)
  }, [persona])

  const handleSave = () => {
    onSave(localPersona)
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconUser size={20} style={{ color: theaterColors.spotlightGold }} />
          <Text fw={600}>你的人设 {'{{user}}'}</Text>
        </Group>
      }
      centered
      size="md"
      styles={{
        header: {
          background: theaterColors.voidDeep,
          borderBottom: `1px solid ${theaterColors.glassBorder}`,
        },
        body: {
          background: theaterColors.voidDeep,
        },
        content: {
          background: theaterColors.voidDeep,
          border: `1px solid ${theaterColors.glassGold}`,
          boxShadow: `0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px ${theaterColors.spotlightGoldDim}`,
        },
      }}
    >
      <Stack gap="md">
        <TextInput
          label="你的名字"
          description="角色会用这个名字称呼你 (替换 {{user}})"
          placeholder="输入你的名字..."
          value={localPersona.name}
          onChange={(e) => setLocalPersona({ ...localPersona, name: e.target.value })}
          styles={{
            input: {
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: theaterColors.glassBorder,
              color: 'white',
              '&:focus': {
                borderColor: theaterColors.spotlightGold,
              },
            },
            label: { color: theaterColors.moonlight },
            description: { color: 'rgba(255, 255, 255, 0.5)' },
          }}
        />

        <TextInput
          label="昵称 (可选)"
          description="亲密后角色可能使用的称呼"
          placeholder="例如：小宝、亲爱的..."
          value={localPersona.nickname || ''}
          onChange={(e) => setLocalPersona({ ...localPersona, nickname: e.target.value })}
          styles={{
            input: {
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: theaterColors.glassBorder,
              color: 'white',
            },
            label: { color: theaterColors.moonlight },
            description: { color: 'rgba(255, 255, 255, 0.5)' },
          }}
        />

        <Box>
          <Text size="sm" mb="xs" style={{ color: theaterColors.moonlight }}>
            性别
          </Text>
          <Group gap="xs">
            {[
              { value: 'male', label: '男', icon: '♂' },
              { value: 'female', label: '女', icon: '♀' },
              { value: 'other', label: '其他', icon: '⚧' },
              { value: 'unspecified', label: '不指定', icon: '?' },
            ].map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={localPersona.gender === opt.value ? 'filled' : 'light'}
                onClick={() => setLocalPersona({ ...localPersona, gender: opt.value as UserPersona['gender'] })}
                styles={{
                  root: {
                    background: localPersona.gender === opt.value
                      ? `linear-gradient(135deg, ${theaterColors.emotionRose} 0%, ${theaterColors.spotlightGold} 100%)`
                      : 'rgba(255, 255, 255, 0.05)',
                    borderColor: localPersona.gender === opt.value
                      ? 'transparent'
                      : theaterColors.glassBorder,
                    color: 'white',
                  },
                }}
              >
                {opt.icon} {opt.label}
              </Button>
            ))}
          </Group>
        </Box>

        <Textarea
          label="人设描述 (可选)"
          description="简短描述你的角色背景、性格等"
          placeholder="例如：一个温柔的大学生，喜欢读书和喝咖啡..."
          minRows={3}
          value={localPersona.description || ''}
          onChange={(e) => setLocalPersona({ ...localPersona, description: e.target.value })}
          styles={{
            input: {
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: theaterColors.glassBorder,
              color: 'white',
            },
            label: { color: theaterColors.moonlight },
            description: { color: 'rgba(255, 255, 255, 0.5)' },
          }}
        />

        <Divider color={theaterColors.glassBorder} />

        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" color="gray" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={handleSave}
            styles={{
              root: {
                background: `linear-gradient(135deg, ${theaterColors.spotlightGold} 0%, ${theaterColors.emotionRose} 100%)`,
                color: '#0c0a1a',
                fontWeight: 600,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 20px ${theaterColors.spotlightGoldDim}`,
                },
              },
            }}
          >
            保存人设
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

// ==================== Main Component ====================

function TheaterSidePanel({
  characterId,
  characterName,
  characterAvatar,
  charType = 'community',
  userId,
  latestMessage = '',
  intimacyLevel = 0,
  maxIntimacy = 100,
  chatId,
  messageCount = 0,
  userPersona = { name: '你' },
  onUserPersonaChange,
  onViewGallery,
  defaultCollapsed = false,
  position = 'right',
}: TheaterSidePanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [activeTab, setActiveTab] = useState<string | null>('progress')
  const [personaModalOpen, setPersonaModalOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect emotion from latest message
  const emotion = useMemo<EmotionType>(() => {
    return detectEmotionFromContent(latestMessage)
  }, [latestMessage])

  const emotionColors = getEmotionColors(emotion)
  const emotionInfo = EMOTION_ICONS[emotion]

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Get next intimacy milestone
  const nextMilestone = useMemo(() => {
    const milestones = [20, 40, 60, 80, 100]
    return milestones.find((m) => m > intimacyLevel) || 100
  }, [intimacyLevel])

  const handlePersonaSave = useCallback((persona: UserPersona) => {
    onUserPersonaChange?.(persona)
  }, [onUserPersonaChange])

  if (isMobile) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: position === 'right' ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          position: 'relative',
          width: isCollapsed ? 50 : 320,
          height: '100%',
          background: `linear-gradient(180deg, ${theaterColors.voidDeep} 0%, ${theaterColors.stageGlow} 100%)`,
          borderLeft: position === 'right' ? `1px solid ${theaterColors.glassGold}` : undefined,
          borderRight: position === 'left' ? `1px solid ${theaterColors.glassGold}` : undefined,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Floating particles background */}
        <FloatingParticles emotion={emotion} />

        {/* Collapse toggle */}
        <Tooltip label={isCollapsed ? '展开面板' : '收起面板'} position={position === 'right' ? 'left' : 'right'}>
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              position: 'absolute',
              top: 12,
              [position === 'right' ? 'left' : 'right']: 8,
              zIndex: 20,
              color: theaterColors.spotlightGold,
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {position === 'right' ? (
              isCollapsed ? <IconChevronLeft size={16} /> : <IconChevronRight size={16} />
            ) : (
              isCollapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />
            )}
          </ActionIcon>
        </Tooltip>

        {/* Collapsed state */}
        <AnimatePresence>
          {isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ padding: '48px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
            >
              {/* Mini avatar with emotion glow */}
              <Box style={{ position: 'relative' }}>
                <Avatar
                  size={36}
                  radius="xl"
                  src={characterAvatar}
                  style={{
                    border: `2px solid ${emotionColors.primary}`,
                    boxShadow: `0 0 12px ${emotionColors.glow}`,
                  }}
                >
                  {characterName?.[0]}
                </Avatar>
                <Box
                  style={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    fontSize: 12,
                  }}
                >
                  {emotionInfo.icon}
                </Box>
              </Box>

              {/* Vertical intimacy bar */}
              <Box
                style={{
                  width: 6,
                  height: 80,
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${intimacyLevel}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{
                    width: '100%',
                    background: `linear-gradient(180deg, ${theaterColors.emotionRose} 0%, ${theaterColors.spotlightGold} 100%)`,
                    borderRadius: 3,
                    position: 'absolute',
                    bottom: 0,
                  }}
                />
              </Box>

              {/* User persona button */}
              <Tooltip label="编辑人设">
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={() => setPersonaModalOpen(true)}
                  style={{ color: theaterColors.moonlight }}
                >
                  <IconUser size={16} />
                </ActionIcon>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expanded state */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}
            >
              {/* Header with character info */}
              <Box
                style={{
                  padding: '16px',
                  borderBottom: `1px solid ${theaterColors.glassBorder}`,
                  background: 'rgba(0, 0, 0, 0.2)',
                }}
              >
                {/* Character name with emotion */}
                <Group justify="space-between" mb="sm">
                  <Group gap="xs">
                    <Text
                      size="lg"
                      fw={700}
                      style={{
                        color: theaterColors.spotlightGold,
                        textShadow: `0 0 20px ${theaterColors.spotlightGoldDim}`,
                      }}
                    >
                      {characterName}
                    </Text>
                    {emotion !== 'neutral' && (
                      <Badge
                        size="sm"
                        variant="light"
                        leftSection={<span style={{ fontSize: 10 }}>{emotionInfo.icon}</span>}
                        styles={{
                          root: {
                            background: emotionColors.secondary,
                            color: emotionColors.primary.replace('0.6', '1'),
                            border: `1px solid ${emotionColors.primary}`,
                          },
                        }}
                      >
                        {emotionInfo.label}
                      </Badge>
                    )}
                  </Group>
                </Group>

                {/* Character card with intimacy */}
                <Group gap="md" align="flex-start">
                  {/* Intimacy Ring + Avatar */}
                  <Box style={{ position: 'relative' }}>
                    <IntimacyRing value={intimacyLevel} max={maxIntimacy} emotion={emotion} />
                    <Avatar
                      size={50}
                      radius="xl"
                      src={characterAvatar}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        border: `2px solid ${emotionColors.primary}`,
                      }}
                    >
                      {characterName?.[0]}
                    </Avatar>
                  </Box>

                  {/* Stats */}
                  <Stack gap={6} style={{ flex: 1 }}>
                    <Group justify="space-between">
                      <Text size="xs" style={{ color: theaterColors.moonlight }}>
                        <IconHeart size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        亲密度
                      </Text>
                      <Text size="xs" fw={600} style={{ color: theaterColors.emotionRose }}>
                        {intimacyLevel} / {maxIntimacy}
                      </Text>
                    </Group>

                    <Progress
                      value={(intimacyLevel / maxIntimacy) * 100}
                      size="sm"
                      styles={{
                        root: { background: 'rgba(255, 255, 255, 0.1)' },
                        section: {
                          background: `linear-gradient(90deg, ${theaterColors.emotionRose} 0%, ${theaterColors.spotlightGold} 100%)`,
                          boxShadow: `0 0 10px ${theaterColors.emotionRoseDim}`,
                        },
                      }}
                    />

                    <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      <IconSparkles size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      再提升 {nextMilestone - intimacyLevel} 点解锁新内容
                    </Text>

                    {/* Action buttons */}
                    <Group gap="xs" mt={4}>
                      <Tooltip label="查看相册">
                        <ActionIcon
                          variant="light"
                          size="sm"
                          onClick={onViewGallery}
                          style={{
                            background: theaterColors.glassGold,
                            color: theaterColors.spotlightGold,
                          }}
                        >
                          <IconPhoto size={14} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="编辑你的人设">
                        <ActionIcon
                          variant="light"
                          size="sm"
                          onClick={() => setPersonaModalOpen(true)}
                          style={{
                            background: 'rgba(196, 181, 253, 0.15)',
                            color: theaterColors.moonlight,
                          }}
                        >
                          <IconUser size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Stack>
                </Group>
              </Box>

              {/* Tabs */}
              <Tabs
                value={activeTab}
                onChange={setActiveTab}
                variant="pills"
                style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
              >
                <Box px="md" py="xs" style={{ borderBottom: `1px solid ${theaterColors.glassBorder}` }}>
                  <Tabs.List grow>
                    <Tabs.Tab
                      value="progress"
                      leftSection={<IconHeart size={14} />}
                      styles={{
                        tab: {
                          color: activeTab === 'progress' ? theaterColors.spotlightGold : 'rgba(255, 255, 255, 0.6)',
                          background: activeTab === 'progress' ? theaterColors.glassGold : 'transparent',
                          borderRadius: 8,
                          '&:hover': {
                            background: 'rgba(255, 255, 255, 0.05)',
                          },
                        },
                      }}
                    >
                      进展
                    </Tabs.Tab>
                    <Tabs.Tab
                      value="story"
                      leftSection={<IconHistory size={14} />}
                      styles={{
                        tab: {
                          color: activeTab === 'story' ? theaterColors.spotlightGold : 'rgba(255, 255, 255, 0.6)',
                          background: activeTab === 'story' ? theaterColors.glassGold : 'transparent',
                          borderRadius: 8,
                        },
                      }}
                    >
                      剧情
                    </Tabs.Tab>
                    <Tabs.Tab
                      value="people"
                      leftSection={<IconUsers size={14} />}
                      styles={{
                        tab: {
                          color: activeTab === 'people' ? theaterColors.spotlightGold : 'rgba(255, 255, 255, 0.6)',
                          background: activeTab === 'people' ? theaterColors.glassGold : 'transparent',
                          borderRadius: 8,
                        },
                      }}
                    >
                      人物
                    </Tabs.Tab>
                  </Tabs.List>
                </Box>

                <ScrollArea style={{ flex: 1 }} offsetScrollbars>
                  <Tabs.Panel value="progress" p="md">
                    <Stack gap="md">
                      {/* User Persona Card */}
                      <Box
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          background: 'rgba(196, 181, 253, 0.08)',
                          border: `1px solid rgba(196, 181, 253, 0.2)`,
                        }}
                      >
                        <Group justify="space-between" mb="xs">
                          <Group gap="xs">
                            <IconUser size={14} style={{ color: theaterColors.moonlight }} />
                            <Text size="sm" fw={600} style={{ color: theaterColors.moonlight }}>
                              你的人设
                            </Text>
                          </Group>
                          <ActionIcon
                            variant="subtle"
                            size="xs"
                            onClick={() => setPersonaModalOpen(true)}
                            style={{ color: theaterColors.moonlight }}
                          >
                            <IconSettings size={12} />
                          </ActionIcon>
                        </Group>
                        <Text size="sm" style={{ color: 'white' }}>
                          {userPersona.name || '未设置'}
                          {userPersona.nickname && (
                            <Text span size="xs" style={{ color: 'rgba(255, 255, 255, 0.5)', marginLeft: 8 }}>
                              ({userPersona.nickname})
                            </Text>
                          )}
                        </Text>
                        {userPersona.description && (
                          <Text size="xs" mt={4} style={{ color: 'rgba(255, 255, 255, 0.5)' }} lineClamp={2}>
                            {userPersona.description}
                          </Text>
                        )}
                      </Box>

                      {/* Relationship milestones */}
                      <Box>
                        <Text size="sm" fw={600} mb="xs" style={{ color: theaterColors.spotlightGold }}>
                          <IconStar size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                          关系里程碑
                        </Text>
                        <Stack gap="xs">
                          {[
                            { level: 20, label: '初识', icon: <IconMoodSmile size={14} /> },
                            { level: 40, label: '熟悉', icon: <IconSparkles size={14} /> },
                            { level: 60, label: '亲近', icon: <IconHeart size={14} /> },
                            { level: 80, label: '深爱', icon: <IconFlame size={14} /> },
                            { level: 100, label: '灵魂伴侣', icon: <IconStar size={14} /> },
                          ].map((milestone) => (
                            <Group key={milestone.level} justify="space-between">
                              <Group gap="xs">
                                <Box style={{ color: intimacyLevel >= milestone.level ? theaterColors.spotlightGold : 'rgba(255, 255, 255, 0.3)' }}>
                                  {milestone.icon}
                                </Box>
                                <Text
                                  size="xs"
                                  style={{
                                    color: intimacyLevel >= milestone.level ? 'white' : 'rgba(255, 255, 255, 0.4)',
                                  }}
                                >
                                  {milestone.label}
                                </Text>
                              </Group>
                              <Badge
                                size="xs"
                                variant={intimacyLevel >= milestone.level ? 'filled' : 'light'}
                                styles={{
                                  root: {
                                    background: intimacyLevel >= milestone.level
                                      ? `linear-gradient(135deg, ${theaterColors.emotionRose} 0%, ${theaterColors.spotlightGold} 100%)`
                                      : 'rgba(255, 255, 255, 0.05)',
                                    color: intimacyLevel >= milestone.level ? '#0c0a1a' : 'rgba(255, 255, 255, 0.4)',
                                  },
                                }}
                              >
                                Lv.{milestone.level}
                              </Badge>
                            </Group>
                          ))}
                        </Stack>
                      </Box>
                    </Stack>
                  </Tabs.Panel>

                  <Tabs.Panel value="story" p="md">
                    <Box style={{ textAlign: 'center', padding: '24px 0' }}>
                      <IconHistory size={32} style={{ color: 'rgba(255, 255, 255, 0.2)', marginBottom: 8 }} />
                      <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                        继续对话以解锁剧情回顾
                      </Text>
                    </Box>
                  </Tabs.Panel>

                  <Tabs.Panel value="people" p="md">
                    <Box style={{ textAlign: 'center', padding: '24px 0' }}>
                      <IconUsers size={32} style={{ color: 'rgba(255, 255, 255, 0.2)', marginBottom: 8 }} />
                      <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                        暂无在场角色
                      </Text>
                      <Text size="xs" mt={4} style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                        继续推进剧情将解锁登场人物
                      </Text>
                    </Box>
                  </Tabs.Panel>
                </ScrollArea>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* User Persona Modal */}
      <UserPersonaModal
        opened={personaModalOpen}
        onClose={() => setPersonaModalOpen(false)}
        persona={userPersona}
        onSave={handlePersonaSave}
      />
    </>
  )
}

export default memo(TheaterSidePanel)
