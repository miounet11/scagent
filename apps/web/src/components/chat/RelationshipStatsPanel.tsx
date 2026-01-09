'use client'

/**
 * 角色关系统计面板
 *
 * 展示用户与角色之间的关系参数：
 * - 总对话次数
 * - 总消息数
 * - 相识天数
 * - 当前关系阶段
 * - 互动频率统计
 */

import { memo, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import { Box, Text, Stack, Badge, Tooltip, Progress, Group, ThemeIcon, Loader, ActionIcon } from '@mantine/core'
import {
  IconMessageCircle,
  IconCalendar,
  IconHeart,
  IconFlame,
  IconTrophy,
  IconSparkles,
  IconMoodHeart,
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
} from '@tabler/icons-react'
import { formatDistanceToNow, differenceInDays } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface RelationshipStatsPanelProps {
  userId: string | null
  characterId: string | null
  charType?: 'character' | 'community'
  characterName?: string
  compact?: boolean
  className?: string
  /** 外部触发刷新的回调 */
  onRefreshRequest?: () => void
}

// 暴露给父组件的方法
export interface RelationshipStatsPanelRef {
  refresh: () => Promise<void>
}

// 关系阶段配置
const RELATIONSHIP_STAGES = [
  { minLevel: 0, maxLevel: 10, title: '初识', icon: '👋', color: 'gray', description: '刚刚认识，还很陌生' },
  { minLevel: 10, maxLevel: 25, title: '熟悉', icon: '😊', color: 'blue', description: '逐渐熟悉中' },
  { minLevel: 25, maxLevel: 40, title: '朋友', icon: '🤝', color: 'teal', description: '成为了不错的朋友' },
  { minLevel: 40, maxLevel: 60, title: '好友', icon: '💫', color: 'violet', description: '关系更加亲密了' },
  { minLevel: 60, maxLevel: 80, title: '挚友', icon: '💖', color: 'pink', description: '非常亲密的关系' },
  { minLevel: 80, maxLevel: 95, title: '羁绊', icon: '💗', color: 'red', description: '深深的羁绊连接' },
  { minLevel: 95, maxLevel: 100, title: '命运', icon: '👑', color: 'yellow', description: '命运共同体' },
]

// 获取当前关系阶段
function getRelationshipStage(level: number) {
  return RELATIONSHIP_STAGES.find(s => level >= s.minLevel && level < s.maxLevel) ||
    RELATIONSHIP_STAGES[RELATIONSHIP_STAGES.length - 1]
}

// 互动频率评级
function getInteractionRating(totalMessages: number, daysSinceFirst: number) {
  if (daysSinceFirst <= 0) return { rating: '新朋友', color: 'blue', avgPerDay: 0 }

  const avgPerDay = totalMessages / daysSinceFirst

  if (avgPerDay >= 50) return { rating: '形影不离', color: 'pink', avgPerDay }
  if (avgPerDay >= 20) return { rating: '亲密无间', color: 'violet', avgPerDay }
  if (avgPerDay >= 10) return { rating: '经常交流', color: 'teal', avgPerDay }
  if (avgPerDay >= 5) return { rating: '保持联系', color: 'blue', avgPerDay }
  if (avgPerDay >= 1) return { rating: '偶尔问候', color: 'gray', avgPerDay }
  return { rating: '久违重逢', color: 'gray', avgPerDay }
}

interface RelationshipStats {
  level: number
  experience: number
  totalChats: number
  totalMessages: number
  firstChatDate?: string
  lastChatDate?: string
  currentStreak?: number
  longestStreak?: number
}

function RelationshipStatsPanel({
  userId,
  characterId,
  charType = 'community',
  characterName = '角色',
  compact = false,
  className = '',
  onRefreshRequest,
}: RelationshipStatsPanelProps) {
  const [stats, setStats] = useState<RelationshipStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(!compact)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 获取关系统计数据
  const fetchStats = useCallback(async () => {
    if (!userId || !characterId) return

    setLoading(true)
    try {
      const response = await fetch(
        `/api/intimacy?userId=${userId}&characterId=${characterId}&charType=${charType}`
      )
      if (response.ok) {
        const data = await response.json()
        setStats({
          level: data.level || 0,
          experience: data.experience || 0,
          totalChats: data.totalChats || 0,
          totalMessages: data.totalMessages || 0,
          firstChatDate: data.firstChatDate,
          lastChatDate: data.lastChatDate,
          currentStreak: data.currentStreak,
          longestStreak: data.longestStreak,
        })
      }
    } catch (error) {
      console.error('[RelationshipStats] Failed to fetch:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, characterId, charType])

  // 手动刷新
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchStats()
    setIsRefreshing(false)
  }, [fetchStats])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (!userId || !characterId) {
    return null
  }

  const stage = stats ? getRelationshipStage(stats.level) : RELATIONSHIP_STAGES[0]
  const daysSinceFirst = stats?.firstChatDate
    ? differenceInDays(new Date(), new Date(stats.firstChatDate))
    : 0
  const interactionRating = stats
    ? getInteractionRating(stats.totalMessages, daysSinceFirst)
    : { rating: '新朋友', color: 'blue', avgPerDay: 0 }

  // 计算下一阶段进度
  const stageProgress = stats
    ? ((stats.level - stage.minLevel) / (stage.maxLevel - stage.minLevel)) * 100
    : 0

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
          borderBottom: expanded ? '1px solid rgba(236, 72, 153, 0.15)' : 'none',
          background: 'linear-gradient(90deg, rgba(236, 72, 153, 0.08) 0%, transparent 100%)',
        }}
      >
        <Box style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconMoodHeart size={14} style={{ color: '#ec4899' }} />
          <Text size="xs" fw={600} style={{ color: 'rgba(236, 72, 153, 0.9)' }}>
            关系档案
          </Text>
          {stats && (
            <Badge size="xs" variant="light" color={stage.color}>
              {stage.title}
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
              style={{ color: 'rgba(236, 72, 153, 0.6)' }}
            >
              <IconRefresh size={12} />
            </ActionIcon>
          </Tooltip>
          {compact && (
            <Box
              style={{
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {expanded ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
            </Box>
          )}
        </Group>
      </Box>

      {/* 内容区域 - 优化配色 */}
      {expanded && (
        <Box p="sm" style={{ background: 'rgba(0, 0, 0, 0.15)' }}>
          {loading ? (
            <Box py="md" style={{ display: 'flex', justifyContent: 'center' }}>
              <Loader size="sm" color="pink" />
            </Box>
          ) : !stats ? (
            <Box py="md" style={{ textAlign: 'center' }}>
              <Text size="xs" c="dimmed">
                开始与{characterName}对话，建立羁绊
              </Text>
            </Box>
          ) : (
            <Stack gap="sm">
              {/* 关系阶段卡片 - 优化配色增强辨识度 */}
              <Box
                style={{
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  borderRadius: 10,
                  padding: '10px 12px',
                  boxShadow: '0 2px 8px rgba(236, 72, 153, 0.1)',
                }}
              >
                <Group gap="xs" mb={6}>
                  <Text size="lg">{stage.icon}</Text>
                  <Box style={{ flex: 1 }}>
                    <Group gap={4} justify="space-between">
                      <Text size="sm" fw={600} style={{ color: `var(--mantine-color-${stage.color}-5)` }}>
                        {stage.title}
                      </Text>
                      <Badge size="xs" variant="light" color="gray">
                        Lv.{stats.level}
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">
                      {stage.description}
                    </Text>
                  </Box>
                </Group>

                {/* 阶段进度条 */}
                <Box>
                  <Group gap={4} justify="space-between" mb={2}>
                    <Text size="xs" c="dimmed">
                      阶段进度
                    </Text>
                    <Text size="xs" c="dimmed">
                      {Math.floor(stageProgress)}%
                    </Text>
                  </Group>
                  <Progress
                    value={stageProgress}
                    size="xs"
                    color={stage.color}
                    style={{ background: 'rgba(0,0,0,0.2)' }}
                  />
                </Box>
              </Box>

              {/* 统计数据网格 - 优化配色 */}
              <Box
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                }}
              >
                {/* 总消息数 */}
                <Tooltip label="你们之间的消息总数">
                  <Box
                    style={{
                      background: 'rgba(59, 130, 246, 0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.15)',
                      borderRadius: 8,
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <ThemeIcon size="sm" variant="light" color="blue">
                      <IconMessageCircle size={12} />
                    </ThemeIcon>
                    <Box>
                      <Text size="xs" c="dimmed">消息</Text>
                      <Text size="sm" fw={600}>{stats.totalMessages.toLocaleString()}</Text>
                    </Box>
                  </Box>
                </Tooltip>

                {/* 对话次数 */}
                <Tooltip label="开始过的对话次数">
                  <Box
                    style={{
                      background: 'rgba(20, 184, 166, 0.08)',
                      border: '1px solid rgba(20, 184, 166, 0.15)',
                      borderRadius: 8,
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <ThemeIcon size="sm" variant="light" color="teal">
                      <IconSparkles size={12} />
                    </ThemeIcon>
                    <Box>
                      <Text size="xs" c="dimmed">对话</Text>
                      <Text size="sm" fw={600}>{stats.totalChats}</Text>
                    </Box>
                  </Box>
                </Tooltip>

                {/* 相识天数 */}
                <Tooltip label={stats.firstChatDate ? `首次对话: ${new Date(stats.firstChatDate).toLocaleDateString()}` : '还没开始对话'}>
                  <Box
                    style={{
                      background: 'rgba(139, 92, 246, 0.08)',
                      border: '1px solid rgba(139, 92, 246, 0.15)',
                      borderRadius: 8,
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <ThemeIcon size="sm" variant="light" color="violet">
                      <IconCalendar size={12} />
                    </ThemeIcon>
                    <Box>
                      <Text size="xs" c="dimmed">相识</Text>
                      <Text size="sm" fw={600}>
                        {daysSinceFirst > 0 ? `${daysSinceFirst} 天` : '今天'}
                      </Text>
                    </Box>
                  </Box>
                </Tooltip>

                {/* 互动频率 */}
                <Tooltip label={`日均 ${interactionRating.avgPerDay.toFixed(1)} 条消息`}>
                  <Box
                    style={{
                      background: `rgba(${interactionRating.color === 'pink' ? '236, 72, 153' : interactionRating.color === 'violet' ? '139, 92, 246' : interactionRating.color === 'teal' ? '20, 184, 166' : '59, 130, 246'}, 0.08)`,
                      border: `1px solid rgba(${interactionRating.color === 'pink' ? '236, 72, 153' : interactionRating.color === 'violet' ? '139, 92, 246' : interactionRating.color === 'teal' ? '20, 184, 166' : '59, 130, 246'}, 0.15)`,
                      borderRadius: 8,
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <ThemeIcon size="sm" variant="light" color={interactionRating.color}>
                      <IconFlame size={12} />
                    </ThemeIcon>
                    <Box>
                      <Text size="xs" c="dimmed">频率</Text>
                      <Text size="sm" fw={600} style={{ color: `var(--mantine-color-${interactionRating.color}-5)` }}>
                        {interactionRating.rating}
                      </Text>
                    </Box>
                  </Box>
                </Tooltip>
              </Box>

              {/* 经验值进度 - 优化配色 */}
              <Box
                style={{
                  background: 'rgba(236, 72, 153, 0.08)',
                  border: '1px solid rgba(236, 72, 153, 0.15)',
                  borderRadius: 8,
                  padding: '8px 10px',
                }}
              >
                <Group gap={4} justify="space-between" mb={4}>
                  <Group gap={4}>
                    <IconHeart size={12} style={{ color: '#ec4899' }} />
                    <Text size="xs" c="dimmed">当前经验</Text>
                  </Group>
                  <Text size="xs" fw={500} style={{ color: '#ec4899' }}>
                    {stats.experience} / 50
                  </Text>
                </Group>
                <Progress
                  value={(stats.experience / 50) * 100}
                  size="xs"
                  color="pink"
                  style={{ background: 'rgba(0,0,0,0.3)' }}
                />
                <Text size="xs" c="dimmed" mt={4}>
                  再获得 {50 - stats.experience} 经验升至 Lv.{stats.level + 1}
                </Text>
              </Box>

              {/* 连续互动（如果有数据） - 优化配色 */}
              {stats.currentStreak !== undefined && stats.currentStreak > 0 && (
                <Group gap="xs" justify="center" style={{ padding: '4px 0' }}>
                  <Badge
                    size="sm"
                    variant="light"
                    color="orange"
                    leftSection={<IconFlame size={10} />}
                    style={{
                      background: 'rgba(251, 146, 60, 0.15)',
                      border: '1px solid rgba(251, 146, 60, 0.3)',
                    }}
                  >
                    连续互动 {stats.currentStreak} 天
                  </Badge>
                  {stats.longestStreak !== undefined && stats.longestStreak > stats.currentStreak && (
                    <Badge size="xs" variant="outline" color="gray">
                      最高 {stats.longestStreak} 天
                    </Badge>
                  )}
                </Group>
              )}
            </Stack>
          )}
        </Box>
      )}
    </Box>
  )
}

export default memo(RelationshipStatsPanel)
