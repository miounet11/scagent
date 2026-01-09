'use client'

/**
 * 角色事件时间线组件
 *
 * 展示用户与角色之间的关键互动事件：
 * - 史诗级事件（亲密度里程碑）
 * - 情感高峰事件
 * - 特殊解锁事件
 * - 🆕 v16.2 NPC事件、选择事件、互动里程碑
 */

import { memo, useEffect, useState, useCallback, useMemo } from 'react'
import { Box, Text, Stack, Badge, Tooltip, ScrollArea, Loader, ActionIcon, Group, Progress } from '@mantine/core'
import { IconSparkles, IconHeart, IconTrophy, IconPhoto, IconStar, IconChevronDown, IconChevronUp, IconFlame, IconUsers, IconCalendarEvent, IconRefresh } from '@tabler/icons-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { CharacterMemory, MemoryEventType } from '@/lib/memories/types'
import { MEMORY_ICONS, MEMORY_COLORS, MEMORY_TITLES } from '@/lib/memories/types'

interface CharacterEventTimelineProps {
  userId: string | null
  characterId: string | null
  charType?: 'character' | 'community'
  characterName?: string
  maxItems?: number
  compact?: boolean
  className?: string
  /** 外部触发刷新的回调 */
  onRefreshRequest?: () => void
}

// 暴露给父组件的方法
export interface CharacterEventTimelineRef {
  refresh: () => Promise<void>
}

// 事件稀有度配置
const EVENT_RARITY: Record<MemoryEventType, 'common' | 'rare' | 'epic' | 'legendary'> = {
  first_chat: 'epic',
  intimacy_20: 'rare',
  intimacy_40: 'rare',
  intimacy_60: 'epic',
  intimacy_80: 'epic',
  intimacy_100: 'legendary',
  cg_unlock: 'epic',
  emotion_love: 'rare',
  emotion_touched: 'rare',
  emotion_sad: 'common',
  emotion_happy: 'common',
  user_mark: 'common',
  // 🆕 v16.2 新增
  npc_encounter: 'rare',
  npc_farewell: 'common',
  scene_change: 'common',
  choice_made: 'rare',
  plot_climax: 'epic',
  relationship_change: 'rare',
  daily_checkin: 'common',
  chat_streak: 'rare',
  long_chat: 'rare',
  first_week: 'epic',
  first_month: 'legendary',
}

// 稀有度颜色配置
const RARITY_CONFIG = {
  common: {
    border: 'rgba(156, 163, 175, 0.3)',
    bg: 'rgba(156, 163, 175, 0.1)',
    glow: 'none',
    label: '普通',
    gradient: 'linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, rgba(107, 114, 128, 0.05) 100%)',
  },
  rare: {
    border: 'rgba(96, 165, 250, 0.4)',
    bg: 'rgba(96, 165, 250, 0.15)',
    glow: '0 0 10px rgba(96, 165, 250, 0.3)',
    label: '稀有',
    gradient: 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
  },
  epic: {
    border: 'rgba(168, 85, 247, 0.5)',
    bg: 'rgba(168, 85, 247, 0.15)',
    glow: '0 0 15px rgba(168, 85, 247, 0.4)',
    label: '史诗',
    gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
  },
  legendary: {
    border: 'rgba(251, 191, 36, 0.6)',
    bg: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.15) 100%)',
    glow: '0 0 20px rgba(251, 191, 36, 0.5)',
    label: '传说',
    gradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.25) 0%, rgba(245, 158, 11, 0.15) 100%)',
  },
}

// 事件类型分组
const EVENT_TYPE_GROUPS = {
  milestone: { label: '里程碑', icon: '🏆', color: 'orange' },
  emotion: { label: '情感', icon: '💖', color: 'pink' },
  interaction: { label: '互动', icon: '✨', color: 'blue' },
  npc: { label: 'NPC', icon: '👥', color: 'violet' },
}

// 获取事件分组
function getEventGroup(eventType: string): keyof typeof EVENT_TYPE_GROUPS {
  if (eventType.startsWith('intimacy_') || eventType === 'first_chat' || eventType === 'cg_unlock') {
    return 'milestone'
  }
  if (eventType.startsWith('emotion_')) {
    return 'emotion'
  }
  if (eventType.startsWith('npc_')) {
    return 'npc'
  }
  return 'interaction'
}

function CharacterEventTimeline({
  userId,
  characterId,
  charType = 'community',
  characterName = '角色',
  maxItems = 10,
  compact = false,
  className = '',
  onRefreshRequest,
}: CharacterEventTimelineProps) {
  const [events, setEvents] = useState<CharacterMemory[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(!compact)
  const [hasMore, setHasMore] = useState(false)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 获取事件列表
  const fetchEvents = useCallback(async () => {
    if (!userId || !characterId) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        userId,
        characterId,
        charType,
        limit: String(maxItems + 1),
      })

      const response = await fetch(`/api/memories?${params}`)
      if (response.ok) {
        const data = await response.json()
        const fetchedEvents = data.memories || []
        setHasMore(fetchedEvents.length > maxItems)
        setEvents(fetchedEvents.slice(0, maxItems))
      }
    } catch (error) {
      console.error('[CharacterEventTimeline] Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, characterId, charType, maxItems])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // 手动刷新
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchEvents()
    setIsRefreshing(false)
  }, [fetchEvents])

  // 计算事件统计
  const eventStats = useMemo(() => {
    const stats = {
      total: events.length,
      legendary: 0,
      epic: 0,
      rare: 0,
      common: 0,
      byGroup: {} as Record<string, number>,
    }

    events.forEach(event => {
      const rarity = EVENT_RARITY[event.eventType as MemoryEventType] || 'common'
      stats[rarity]++

      const group = getEventGroup(event.eventType)
      stats.byGroup[group] = (stats.byGroup[group] || 0) + 1
    })

    return stats
  }, [events])

  // 过滤后的事件
  const filteredEvents = useMemo(() => {
    if (!activeFilter) return events
    return events.filter(event => getEventGroup(event.eventType) === activeFilter)
  }, [events, activeFilter])

  // 获取事件图标组件
  const getEventIcon = (eventType: MemoryEventType) => {
    if (eventType.startsWith('intimacy_')) {
      return <IconTrophy size={14} />
    }
    if (eventType === 'cg_unlock') {
      return <IconPhoto size={14} />
    }
    if (eventType.startsWith('emotion_')) {
      return <IconHeart size={14} />
    }
    if (eventType === 'first_chat') {
      return <IconStar size={14} />
    }
    if (eventType.startsWith('npc_')) {
      return <IconUsers size={14} />
    }
    if (eventType === 'daily_checkin' || eventType === 'chat_streak') {
      return <IconFlame size={14} />
    }
    if (eventType.startsWith('first_')) {
      return <IconCalendarEvent size={14} />
    }
    return <IconSparkles size={14} />
  }

  // 格式化时间
  const formatTime = (date: Date) => {
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: zhCN
      })
    } catch {
      return '未知时间'
    }
  }

  if (!userId || !characterId) {
    return null
  }

  return (
    <Box className={className}>
      {/* 标题栏 - 优化配色 */}
      <Box
        px="sm"
        py="xs"
        onClick={() => compact && setExpanded(!expanded)}
        style={{
          cursor: compact ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: expanded ? '1px solid rgba(251, 191, 36, 0.15)' : 'none',
          background: 'linear-gradient(90deg, rgba(251, 191, 36, 0.08) 0%, transparent 100%)',
        }}
      >
        <Box style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconSparkles size={14} style={{ color: '#fbbf24' }} />
          <Text size="xs" fw={600} style={{ color: 'rgba(251, 191, 36, 0.9)' }}>
            羁绊历程
          </Text>
          {events.length > 0 && (
            <Badge size="xs" variant="light" color="yellow">
              {events.length}{hasMore ? '+' : ''} 事件
            </Badge>
          )}
        </Box>
        <Group gap={4}>
          {/* 手动刷新按钮 */}
          <Tooltip label="刷新数据">
            <ActionIcon
              variant="subtle"
              size="xs"
              onClick={(e) => {
                e.stopPropagation()
                handleRefresh()
              }}
              loading={isRefreshing}
              style={{ color: 'rgba(251, 191, 36, 0.6)' }}
            >
              <IconRefresh size={12} />
            </ActionIcon>
          </Tooltip>
          {compact && (
            <ActionIcon variant="subtle" size="xs">
              {expanded ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
            </ActionIcon>
          )}
        </Group>
      </Box>

      {/* 事件列表 */}
      {expanded && (
        <Box style={{ background: 'rgba(0, 0, 0, 0.15)' }}>
          {loading ? (
            <Box py="md" style={{ display: 'flex', justifyContent: 'center' }}>
              <Loader size="sm" color="yellow" />
            </Box>
          ) : events.length === 0 ? (
            <Box py="md" px="sm" style={{ textAlign: 'center' }}>
              <Box style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>✨</Box>
              <Text size="xs" c="dimmed">
                与{characterName}开始对话，解锁更多羁绊事件
              </Text>
              <Text size="xs" c="dimmed" mt={4} style={{ opacity: 0.6 }}>
                互动越多，故事越精彩
              </Text>
            </Box>
          ) : (
            <>
              {/* 🆕 事件统计概览 - 优化配色 */}
              <Box px="sm" py="xs" style={{ background: 'rgba(251, 191, 36, 0.05)', borderBottom: '1px solid rgba(251, 191, 36, 0.1)' }}>
                <Group gap={4} justify="center">
                  {eventStats.legendary > 0 && (
                    <Tooltip label="传说事件">
                      <Badge
                        size="xs"
                        variant="filled"
                        color="yellow"
                        style={{
                          cursor: 'default',
                          boxShadow: '0 0 8px rgba(251, 191, 36, 0.4)'
                        }}
                      >
                        👑 {eventStats.legendary}
                      </Badge>
                    </Tooltip>
                  )}
                  {eventStats.epic > 0 && (
                    <Tooltip label="史诗事件">
                      <Badge
                        size="xs"
                        variant="light"
                        color="violet"
                        style={{
                          cursor: 'default',
                          background: 'rgba(168, 85, 247, 0.15)',
                          border: '1px solid rgba(168, 85, 247, 0.3)'
                        }}
                      >
                        💎 {eventStats.epic}
                      </Badge>
                    </Tooltip>
                  )}
                  {eventStats.rare > 0 && (
                    <Tooltip label="稀有事件">
                      <Badge
                        size="xs"
                        variant="light"
                        color="blue"
                        style={{
                          cursor: 'default',
                          background: 'rgba(96, 165, 250, 0.15)',
                          border: '1px solid rgba(96, 165, 250, 0.3)'
                        }}
                      >
                        ⭐ {eventStats.rare}
                      </Badge>
                    </Tooltip>
                  )}
                </Group>

                {/* 事件分组过滤器 - 优化样式 */}
                <Group gap={4} justify="center" mt={6}>
                  <Badge
                    size="xs"
                    variant={activeFilter === null ? 'filled' : 'light'}
                    color="gray"
                    style={{
                      cursor: 'pointer',
                      background: activeFilter === null ? 'rgba(156, 163, 175, 0.3)' : 'transparent',
                      border: '1px solid rgba(156, 163, 175, 0.3)'
                    }}
                    onClick={() => setActiveFilter(null)}
                  >
                    全部
                  </Badge>
                  {Object.entries(EVENT_TYPE_GROUPS).map(([key, group]) => {
                    const count = eventStats.byGroup[key] || 0
                    if (count === 0) return null
                    return (
                      <Badge
                        key={key}
                        size="xs"
                        variant={activeFilter === key ? 'filled' : 'light'}
                        color={group.color}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setActiveFilter(activeFilter === key ? null : key)}
                      >
                        {group.icon} {count}
                      </Badge>
                    )
                  })}
                </Group>
              </Box>

              <ScrollArea h={compact ? 200 : 260} offsetScrollbars>
                <Stack gap={0} p="xs">
                  {filteredEvents.map((event, index) => {
                    const rarity = EVENT_RARITY[event.eventType as MemoryEventType] || 'common'
                    const rarityConfig = RARITY_CONFIG[rarity]
                    const eventColor = MEMORY_COLORS[event.eventType as MemoryEventType] || 'gray'
                    const eventIcon = MEMORY_ICONS[event.eventType as MemoryEventType] || '✨'

                    return (
                      <Box
                        key={event.id}
                        style={{
                          position: 'relative',
                          paddingLeft: 20,
                          paddingBottom: index === filteredEvents.length - 1 ? 0 : 12,
                        }}
                      >
                        {/* 时间线 - 优化渐变颜色 */}
                        {index < filteredEvents.length - 1 && (
                          <Box
                            style={{
                              position: 'absolute',
                              left: 7,
                              top: 18,
                              bottom: 0,
                              width: 2,
                              background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.4) 0%, rgba(251, 191, 36, 0.1) 100%)',
                            }}
                          />
                        )}

                        {/* 时间线节点 - 增强视觉效果 */}
                        <Tooltip label={rarityConfig.label + '事件'}>
                          <Box
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 4,
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              background: rarityConfig.gradient,
                              border: `2px solid ${rarityConfig.border}`,
                              boxShadow: rarityConfig.glow,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                            }}
                          >
                            {eventIcon}
                          </Box>
                        </Tooltip>

                        {/* 事件卡片 - 优化配色 */}
                        <Box
                          style={{
                            background: rarityConfig.gradient,
                            border: `1px solid ${rarityConfig.border}`,
                            borderRadius: 8,
                            padding: '8px 10px',
                            boxShadow: rarity !== 'common' ? rarityConfig.glow : '0 1px 3px rgba(0,0,0,0.2)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Box style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Badge
                              size="xs"
                              variant="light"
                              color={eventColor}
                              leftSection={getEventIcon(event.eventType as MemoryEventType)}
                              style={{
                                background: `rgba(var(--mantine-color-${eventColor}-4), 0.15)`,
                              }}
                            >
                              {MEMORY_TITLES[event.eventType as MemoryEventType] || event.title}
                            </Badge>
                            {rarity === 'legendary' && (
                              <Badge
                                size="xs"
                                variant="filled"
                                color="yellow"
                                style={{ boxShadow: '0 0 6px rgba(251, 191, 36, 0.5)' }}
                              >
                                传说
                              </Badge>
                            )}
                            {rarity === 'epic' && (
                              <Badge
                                size="xs"
                                variant="light"
                                color="violet"
                                style={{
                                  background: 'rgba(168, 85, 247, 0.2)',
                                  border: '1px solid rgba(168, 85, 247, 0.4)'
                                }}
                              >
                                史诗
                              </Badge>
                            )}
                          </Box>

                          {event.description && (
                            <Text size="xs" c="dimmed" lineClamp={2} style={{ marginBottom: 4 }}>
                              {event.description}
                            </Text>
                          )}

                          <Text size="xs" c="dimmed" style={{ opacity: 0.6 }}>
                            {formatTime(event.createdAt)}
                          </Text>
                        </Box>
                      </Box>
                    )
                  })}

                  {hasMore && (
                    <Box py="xs" style={{ textAlign: 'center' }}>
                      <Text size="xs" c="dimmed" style={{ cursor: 'pointer' }}>
                        查看更多历程...
                      </Text>
                    </Box>
                  )}
                </Stack>
              </ScrollArea>
            </>
          )}
        </Box>
      )}
    </Box>
  )
}

export default memo(CharacterEventTimeline)
