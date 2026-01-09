'use client'

/**
 * 角色立绘展示面板 v22.0 - Theater Elite Edition
 *
 * 显示在聊天界面侧边，根据对话情绪动态切换表情
 * v21: 添加视频展示支持
 * v22: 剧场级玻璃态设计 + 情绪光环 + 动态粒子
 */

import { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react'
import {
  Box,
  Text,
  Progress,
  ActionIcon,
  Tooltip,
  Badge,
  Group,
  Stack,
  Transition,
  ScrollArea,
  Avatar,
  Loader,
  Tabs,
  Button,
} from '@mantine/core'
import { IconChevronLeft, IconChevronRight, IconHeart, IconPhoto, IconSparkles, IconHistory, IconUsers, IconRefresh, IconVideo, IconPlayerPlay, IconMoodHeart, IconFlame, IconStar, IconMessageCircle, IconCalendar } from '@tabler/icons-react'
import { useDynamicImage } from '@/lib/dynamicImage/useDynamicImage'
import { useEmotionDetection } from '@/lib/dynamicImage/useEmotionDetection'
import { DYNAMIC_IMAGE_CONFIG, type EmotionType } from '@/lib/dynamicImage/config'
import CharacterEventTimeline from './CharacterEventTimeline'
import RelationshipStatsPanel from './RelationshipStatsPanel'
import NPCPanel from './NPCPanel'
import type { NPCAppearanceInfo } from '@/lib/npc/types'
import { resolveUploadsPublicUrl } from '@/lib/images/resolveUploadsPublicUrl'
import { encodeImageUrl } from '@/lib/images/encodeImageUrl'

// ==================== Theater Color Palette ====================
const theaterColors = {
  voidDeep: 'rgba(12, 10, 26, 0.98)',
  stageGlow: 'rgba(26, 20, 41, 0.85)',
  spotlightGold: '#f5c542',
  spotlightGoldDim: 'rgba(245, 197, 66, 0.3)',
  emotionRose: '#ec4899',
  emotionRoseDim: 'rgba(236, 72, 153, 0.3)',
  moonlight: '#c4b5fd',
  moonlightDim: 'rgba(196, 181, 253, 0.3)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassGold: 'rgba(245, 197, 66, 0.15)',
  glassRose: 'rgba(236, 72, 153, 0.15)',
  glassViolet: 'rgba(139, 92, 246, 0.15)',
}

interface CharacterPortraitPanelProps {
  characterId: string
  characterName: string
  charType?: 'character' | 'community'
  userId?: string
  latestMessage?: string
  intimacyLevel?: number
  onCGClick?: (cgId: string) => void
  onViewGallery?: () => void
  defaultCollapsed?: boolean
  position?: 'left' | 'right'
  className?: string
  /** 消息数量变化时用于触发刷新 */
  messageCount?: number
  /** 🎭 v20.5: 聊天 ID，用于获取 NPC 列表 */
  chatId?: string
}

// 表情标签映射
const EMOTION_LABELS: Record<EmotionType, string> = {
  happy: '开心',
  shy: '害羞',
  angry: '傲娇',
  surprised: '惊讶',
  sad: '难过',
  love: '心动',
  scared: '紧张',
  neutral: '平静',
}

// 表情颜色映射 - 剧场版增强
const EMOTION_COLORS: Record<EmotionType, string> = {
  happy: 'yellow',
  shy: 'pink',
  angry: 'red',
  surprised: 'orange',
  sad: 'blue',
  love: 'pink',
  scared: 'grape',
  neutral: 'gray',
}

// 🎭 v22: 情绪光环效果
const EMOTION_GLOW: Record<EmotionType, { primary: string; glow: string; bg: string }> = {
  happy: { primary: '#fbbf24', glow: 'rgba(251, 191, 36, 0.5)', bg: 'rgba(251, 191, 36, 0.1)' },
  shy: { primary: '#f472b6', glow: 'rgba(244, 114, 182, 0.5)', bg: 'rgba(244, 114, 182, 0.1)' },
  angry: { primary: '#f87171', glow: 'rgba(248, 113, 113, 0.5)', bg: 'rgba(248, 113, 113, 0.1)' },
  surprised: { primary: '#fb923c', glow: 'rgba(251, 146, 60, 0.5)', bg: 'rgba(251, 146, 60, 0.1)' },
  sad: { primary: '#60a5fa', glow: 'rgba(96, 165, 250, 0.5)', bg: 'rgba(96, 165, 250, 0.1)' },
  love: { primary: '#ec4899', glow: 'rgba(236, 72, 153, 0.6)', bg: 'rgba(236, 72, 153, 0.15)' },
  scared: { primary: '#a78bfa', glow: 'rgba(167, 139, 250, 0.5)', bg: 'rgba(167, 139, 250, 0.1)' },
  neutral: { primary: '#9ca3af', glow: 'rgba(156, 163, 175, 0.3)', bg: 'rgba(156, 163, 175, 0.05)' },
}

// 🎭 v22: 情绪表情图标
const EMOTION_EMOJI: Record<EmotionType, string> = {
  happy: '✨',
  shy: '😊',
  angry: '💢',
  surprised: '❗',
  sad: '💧',
  love: '💗',
  scared: '😰',
  neutral: '😌',
}

function CharacterPortraitPanel({
  characterId,
  characterName,
  charType = 'community',
  userId,
  latestMessage,
  intimacyLevel = 0,
  onCGClick,
  onViewGallery,
  defaultCollapsed = false,
  position = 'right',
  className = '',
  messageCount = 0,
  chatId,
}: CharacterPortraitPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<string | null>('progress')
  const [npcPanelOpen, setNpcPanelOpen] = useState(false)

  // 用于触发子组件刷新的 key
  const [refreshKey, setRefreshKey] = useState(0)

  // 🎭 v20.5: NPC 列表状态
  const [activeNPCs, setActiveNPCs] = useState<NPCAppearanceInfo[]>([])
  const [isLoadingNPCs, setIsLoadingNPCs] = useState(false)

  // 获取活跃 NPC 列表
  const fetchActiveNPCs = useCallback(async () => {
    if (!chatId) return

    setIsLoadingNPCs(true)
    try {
      const response = await fetch(`/api/npcs/chat/${chatId}?activeOnly=true`)
      if (response.ok) {
        const data = await response.json()
        setActiveNPCs(data.npcs || [])
      }
    } catch (error) {
      console.error('[CharacterPortraitPanel] Failed to fetch active NPCs:', error)
    } finally {
      setIsLoadingNPCs(false)
    }
  }, [chatId])

  // 初始加载和消息变化时刷新 NPC 列表
  useEffect(() => {
    if (chatId) {
      fetchActiveNPCs()
    }
  }, [chatId, messageCount, fetchActiveNPCs])

  // 监听消息数量变化，触发刷新
  useEffect(() => {
    if (messageCount > 0) {
      // 延迟刷新，给后端时间处理数据
      const timer = setTimeout(() => {
        setRefreshKey(prev => prev + 1)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [messageCount])

  // 手动触发刷新的回调
  const handleRefreshRequest = useCallback(() => {
    setRefreshKey(prev => prev + 1)
  }, [])

  // 响应式检测
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < DYNAMIC_IMAGE_CONFIG.tabletBreakpoint)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 情绪检测
  const { emotion, isTransitioning: emotionTransitioning } = useEmotionDetection(latestMessage)

  // 动态图片管理
  const {
    currentExpression,
    isLoading,
    isTransitioning: imageTransitioning,
    hasAssets,
    availableCGs,
    defaultVideo,
    setExpressionByEmotion,
  } = useDynamicImage({
    characterId,
    charType,
    userId,
    enabled: !isCollapsed,
  })

  // 视频展示状态
  const [showVideo, setShowVideo] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // 解析视频 URL
  const videoUrl = defaultVideo?.url
    ? resolveUploadsPublicUrl(encodeImageUrl(defaultVideo.url)) || defaultVideo.url
    : null

  // 当情绪变化时切换表情
  useEffect(() => {
    if (emotion && hasAssets) {
      setExpressionByEmotion(emotion)
    }
  }, [emotion, hasAssets, setExpressionByEmotion])

  // 移动端只显示小头像
  if (isMobile) {
    return null // 移动端不显示侧边栏，表情通过消息区域展示
  }

  const isTransitioning = emotionTransitioning || imageTransitioning

  // 🎭 v22: 获取当前情绪的光效颜色
  const emotionGlow = useMemo(() => EMOTION_GLOW[emotion] || EMOTION_GLOW.neutral, [emotion])
  const emotionEmoji = useMemo(() => EMOTION_EMOJI[emotion] || EMOTION_EMOJI.neutral, [emotion])

  return (
    <Box
      ref={containerRef}
      className={`character-portrait-panel ${className}`}
      style={{
        position: 'relative',
        width: isCollapsed ? 50 : DYNAMIC_IMAGE_CONFIG.portraitPanelWidth,
        height: '100%',
        background: `linear-gradient(180deg, ${theaterColors.voidDeep} 0%, ${theaterColors.stageGlow} 100%)`,
        borderLeft: position === 'right' ? `1px solid ${theaterColors.glassGold}` : undefined,
        borderRight: position === 'left' ? `1px solid ${theaterColors.glassGold}` : undefined,
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: position === 'right'
          ? `inset 2px 0 20px ${theaterColors.spotlightGoldDim}`
          : `inset -2px 0 20px ${theaterColors.spotlightGoldDim}`,
      }}
    >
      {/* 🎭 v22: 收起/展开按钮 - 剧场级样式 */}
      <Tooltip label={isCollapsed ? '展开立绘' : '收起立绘'} position={position === 'right' ? 'left' : 'right'}>
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
            border: `1px solid ${theaterColors.glassBorder}`,
          }}
        >
          {position === 'right' ? (
            isCollapsed ? <IconChevronLeft size={16} /> : <IconChevronRight size={16} />
          ) : (
            isCollapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />
          )}
        </ActionIcon>
      </Tooltip>

      {/* 🎭 v22: 收起状态的迷你显示 - 情绪光效 */}
      {isCollapsed && (
        <Stack gap="xs" align="center" pt={48} px={4}>
          {/* 迷你头像带情绪光晕 */}
          <Box style={{ position: 'relative' }}>
            <Box
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                overflow: 'hidden',
                border: `2px solid ${emotionGlow.primary}`,
                boxShadow: `0 0 12px ${emotionGlow.glow}`,
                transition: 'all 0.3s ease',
              }}
            >
              {currentExpression?.thumbnail || currentExpression?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentExpression.thumbnail || currentExpression.url}
                  alt={characterName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Box
                  style={{
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(135deg, ${theaterColors.spotlightGold} 0%, ${theaterColors.emotionRose} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text size="xs" fw={700} c="dark">{characterName[0]}</Text>
                </Box>
              )}
            </Box>
            {/* 情绪表情指示器 */}
            <Box
              style={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                fontSize: 12,
              }}
            >
              {emotionEmoji}
            </Box>
          </Box>

          {/* 亲密度迷你指示器 - 增强版 */}
          <Tooltip label={`亲密度: ${intimacyLevel}`}>
            <Box
              style={{
                width: 6,
                height: 80,
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 3,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <Box
                style={{
                  position: 'absolute',
                  bottom: 0,
                  width: '100%',
                  height: `${intimacyLevel}%`,
                  background: `linear-gradient(180deg, ${theaterColors.emotionRose} 0%, ${theaterColors.spotlightGold} 100%)`,
                  borderRadius: 3,
                  transition: 'height 0.5s ease',
                  boxShadow: `0 0 8px ${theaterColors.emotionRoseDim}`,
                }}
              />
            </Box>
          </Tooltip>
        </Stack>
      )}

      {/* 🎭 v22: 展开状态的完整面板 */}
      <Transition mounted={!isCollapsed} transition="fade" duration={200}>
        {(styles) => (
          <Box style={{ ...styles, flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
            {/* 角色名称 - 剧场级标题 */}
            <Box
              px="md"
              pt="md"
              pb="xs"
              style={{
                borderBottom: `1px solid ${theaterColors.glassBorder}`,
                background: 'rgba(0, 0, 0, 0.2)',
              }}
            >
              <Group gap="xs" justify="space-between">
                <Text
                  size="md"
                  fw={700}
                  truncate
                  style={{
                    maxWidth: 180,
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
                    leftSection={<span style={{ fontSize: 10 }}>{emotionEmoji}</span>}
                    styles={{
                      root: {
                        background: emotionGlow.bg,
                        color: emotionGlow.primary,
                        border: `1px solid ${emotionGlow.primary}`,
                      },
                    }}
                  >
                    {EMOTION_LABELS[emotion]}
                  </Badge>
                )}
              </Group>
            </Box>

            {/* 🎭 v22: 关系总览条 - 剧场级样式 */}
            <Box px="md" pb="sm" pt="sm">
              <Group gap="sm" justify="space-between" wrap="nowrap">
                <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                  {/* v22: 支持视频展示的头像区域 - 情绪光效 */}
                  <Box style={{ position: 'relative' }}>
                    {showVideo && videoUrl ? (
                      <Box
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          border: `2px solid ${emotionGlow.primary}`,
                          boxShadow: `0 0 16px ${emotionGlow.glow}`,
                          position: 'relative',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <video
                          ref={videoRef}
                          src={videoUrl}
                          autoPlay
                          loop
                          muted
                          playsInline
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <ActionIcon
                          size="xs"
                          variant="filled"
                          onClick={() => setShowVideo(false)}
                          style={{
                            position: 'absolute',
                            bottom: -2,
                            right: -2,
                            zIndex: 5,
                            background: theaterColors.voidDeep,
                            color: theaterColors.spotlightGold,
                          }}
                        >
                          <IconPhoto size={10} />
                        </ActionIcon>
                      </Box>
                    ) : (
                      <Box style={{ position: 'relative' }}>
                        <Avatar
                          size={64}
                          radius="xl"
                          src={currentExpression?.thumbnail || currentExpression?.url || undefined}
                          style={{
                            border: `2px solid ${emotionGlow.primary}`,
                            boxShadow: `0 0 16px ${emotionGlow.glow}`,
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {characterName?.[0] || '?'}
                        </Avatar>
                        {/* 情绪表情叠加 */}
                        <Box
                          style={{
                            position: 'absolute',
                            bottom: -4,
                            right: -4,
                            fontSize: 14,
                            background: theaterColors.voidDeep,
                            borderRadius: '50%',
                            width: 22,
                            height: 22,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px solid ${theaterColors.glassBorder}`,
                          }}
                        >
                          {emotionEmoji}
                        </Box>
                        {videoUrl && (
                          <Tooltip label="播放视频">
                            <ActionIcon
                              size="xs"
                              variant="filled"
                              onClick={() => setShowVideo(true)}
                              style={{
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                zIndex: 5,
                                background: `linear-gradient(135deg, ${theaterColors.glassViolet} 0%, ${theaterColors.glassRose} 100%)`,
                                color: theaterColors.moonlight,
                              }}
                            >
                              <IconPlayerPlay size={10} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </Box>
                    )}
                  </Box>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Group gap={6} justify="space-between" wrap="nowrap">
                      <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                        <Text size="xs" fw={600} truncate style={{ color: theaterColors.moonlight }}>
                          {emotion !== 'neutral' ? `${emotionEmoji} ${EMOTION_LABELS[emotion]}` : '😌 平静'}
                        </Text>
                        {!currentExpression && !videoUrl && (
                          <Badge
                            size="xs"
                            variant="light"
                            styles={{
                              root: {
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: 'rgba(255, 255, 255, 0.4)',
                              },
                            }}
                          >
                            暂无立绘
                          </Badge>
                        )}
                        {videoUrl && (
                          <Badge
                            size="xs"
                            variant="light"
                            styles={{
                              root: {
                                background: theaterColors.glassViolet,
                                color: theaterColors.moonlight,
                              },
                            }}
                          >
                            <IconVideo size={10} style={{ marginRight: 2 }} /> 视频
                          </Badge>
                        )}
                      </Group>
                      <Tooltip label="查看相册">
                        <ActionIcon
                          variant="light"
                          size="sm"
                          onClick={onViewGallery}
                          disabled={!onViewGallery}
                          style={{
                            background: theaterColors.glassGold,
                            color: theaterColors.spotlightGold,
                          }}
                        >
                          <IconPhoto size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>

                    {/* 🎭 v22: 亲密度区域 - 剧场级样式 */}
                    <Group gap="xs" justify="space-between" mt={8}>
                      <Group gap={4}>
                        <IconHeart size={14} style={{ color: theaterColors.emotionRose }} />
                        <Text size="xs" style={{ color: theaterColors.moonlight }}>
                          亲密度
                        </Text>
                      </Group>
                      <Text size="xs" fw={700} style={{ color: theaterColors.emotionRose }}>
                        {intimacyLevel} / 100
                      </Text>
                    </Group>

                    <Progress
                      value={intimacyLevel}
                      size="sm"
                      mt={6}
                      styles={{
                        root: {
                          background: 'rgba(255, 255, 255, 0.1)',
                        },
                        section: {
                          background: `linear-gradient(90deg, ${theaterColors.emotionRose} 0%, ${theaterColors.spotlightGold} 100%)`,
                          transition: 'width 0.5s ease',
                          boxShadow: `0 0 10px ${theaterColors.emotionRoseDim}`,
                        },
                      }}
                    />

                    {intimacyLevel < 100 && (
                      <Text size="xs" mt={6} style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        <IconSparkles size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        再提升 {getNextMilestone(intimacyLevel) - intimacyLevel} 点解锁新CG
                      </Text>
                    )}
                  </Box>
                </Group>
              </Group>

              {availableCGs.length > 0 && (
                <Group gap="xs" mt="xs">
                  <Tooltip label={`已解锁 ${availableCGs.length} 张CG`}>
                    <Badge
                      variant="light"
                      size="sm"
                      styles={{
                        root: {
                          background: `linear-gradient(135deg, ${theaterColors.glassRose} 0%, ${theaterColors.glassGold} 100%)`,
                          color: theaterColors.spotlightGold,
                          border: `1px solid ${theaterColors.emotionRoseDim}`,
                        },
                      }}
                    >
                      ✨ CG ×{availableCGs.length}
                    </Badge>
                  </Tooltip>
                </Group>
              )}
            </Box>

            {/* 🎭 v22: 单面板多 Tab（进展 / 剧情 / 人物） - 剧场级样式 */}
            <Tabs
              value={activeTab}
              onChange={setActiveTab}
              variant="pills"
              radius="md"
              keepMounted={false}
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
                        '&:hover': { background: 'rgba(255, 255, 255, 0.05)' },
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

              <Tabs.Panel value="progress" style={{ flex: 1, overflow: 'hidden' }}>
                <ScrollArea style={{ height: '100%' }} offsetScrollbars>
                  <Box
                    style={{
                      borderTop: `1px solid ${theaterColors.glassBorder}`,
                      background: 'rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <RelationshipStatsPanel
                      key={`stats-${refreshKey}`}
                      userId={userId || null}
                      characterId={characterId}
                      charType={charType}
                      characterName={characterName}
                      compact={false}
                      onRefreshRequest={handleRefreshRequest}
                    />
                  </Box>
                </ScrollArea>
              </Tabs.Panel>

              <Tabs.Panel value="story" style={{ flex: 1, overflow: 'hidden' }}>
                <ScrollArea style={{ height: '100%' }} offsetScrollbars>
                  <Box
                    style={{
                      borderTop: `1px solid ${theaterColors.glassBorder}`,
                      background: 'rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <CharacterEventTimeline
                      key={`timeline-${refreshKey}`}
                      userId={userId || null}
                      characterId={characterId}
                      charType={charType}
                      characterName={characterName}
                      maxItems={8}
                      compact={false}
                      onRefreshRequest={handleRefreshRequest}
                    />
                  </Box>
                </ScrollArea>
              </Tabs.Panel>

              <Tabs.Panel value="people" style={{ flex: 1, overflow: 'hidden' }}>
                <ScrollArea style={{ height: '100%' }} offsetScrollbars>
                  <Box
                    style={{
                      borderTop: `1px solid ${theaterColors.glassBorder}`,
                      background: 'rgba(0, 0, 0, 0.2)',
                      padding: 'var(--mantine-spacing-md)',
                    }}
                  >
                    {/* 🎭 v22: NPC 区域标题 - 剧场级样式 */}
                    <Group justify="space-between" mb="sm">
                      <Group gap={6}>
                        <IconUsers size={16} style={{ color: theaterColors.moonlight }} />
                        <Text size="sm" fw={600} style={{ color: theaterColors.spotlightGold }}>
                          在场角色
                        </Text>
                        <Badge
                          size="xs"
                          variant="light"
                          styles={{
                            root: {
                              background: theaterColors.glassViolet,
                              color: theaterColors.moonlight,
                            },
                          }}
                        >
                          {activeNPCs.length}
                        </Badge>
                      </Group>
                      <Group gap={6}>
                        <Tooltip label="刷新">
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            onClick={fetchActiveNPCs}
                            loading={isLoadingNPCs}
                            style={{ color: theaterColors.moonlight }}
                          >
                            <IconRefresh size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => setNpcPanelOpen(true)}
                          disabled={!chatId}
                          styles={{
                            root: {
                              background: theaterColors.glassViolet,
                              color: theaterColors.moonlight,
                              '&:hover': {
                                background: 'rgba(139, 92, 246, 0.25)',
                              },
                            },
                          }}
                        >
                          管理NPC
                        </Button>
                      </Group>
                    </Group>

                    {activeNPCs.length === 0 ? (
                      <Box py="md" style={{ textAlign: 'center' }}>
                        <IconUsers size={32} style={{ color: 'rgba(255, 255, 255, 0.2)', marginBottom: 8 }} />
                        <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                          暂无在场角色
                        </Text>
                        <Text size="xs" mt={4} style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
                          继续推进剧情将解锁登场人物
                        </Text>
                      </Box>
                    ) : (
                      <Stack gap="xs">
                        {activeNPCs.map((appearance) => {
                          const npcData = appearance.npc
                          if (!npcData) return null
                          return (
                            <Box
                              key={appearance.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '10px 12px',
                                borderRadius: 10,
                                background: theaterColors.glassViolet,
                                border: `1px solid rgba(139, 92, 246, 0.2)`,
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <Avatar
                                size="sm"
                                radius="xl"
                                src={npcData.avatar}
                                style={{
                                  border: `2px solid ${theaterColors.moonlight}`,
                                  boxShadow: `0 0 8px ${theaterColors.moonlightDim}`,
                                }}
                              >
                                {npcData.name?.[0] || '?'}
                              </Avatar>
                              <Box style={{ flex: 1, minWidth: 0 }}>
                                <Group gap={4} wrap="nowrap">
                                  <Text size="sm" fw={500} truncate style={{ maxWidth: 120, color: 'white' }}>
                                    {npcData.name}
                                  </Text>
                                  {appearance.relationToMain && (
                                    <Badge
                                      size="xs"
                                      variant="light"
                                      styles={{
                                        root: {
                                          background: theaterColors.glassGold,
                                          color: theaterColors.spotlightGold,
                                        },
                                      }}
                                    >
                                      {appearance.relationToMain}
                                    </Badge>
                                  )}
                                </Group>
                                {npcData.description && (
                                  <Text size="xs" truncate style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                    {npcData.description.slice(0, 30)}...
                                  </Text>
                                )}
                              </Box>
                            </Box>
                          )
                        })}
                      </Stack>
                    )}
                  </Box>
                </ScrollArea>
              </Tabs.Panel>
            </Tabs>
          </Box>
        )}
      </Transition>

      {/* NPC 管理抽屉 */}
      {chatId && (
        <NPCPanel
          isOpen={npcPanelOpen}
          onClose={() => setNpcPanelOpen(false)}
          chatId={chatId}
          mainCharacterName={characterName}
        />
      )}
    </Box>
  )
}

// 获取下一个亲密度里程碑
function getNextMilestone(current: number): number {
  const milestones = [20, 40, 60, 80, 100]
  return milestones.find(m => m > current) || 100
}

export default memo(CharacterPortraitPanel)
