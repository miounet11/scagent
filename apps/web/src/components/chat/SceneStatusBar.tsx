'use client'

/**
 * v4.0 活世界系统 - 场景状态栏组件
 *
 * 显示当前场景、时间、天气等世界状态信息
 *
 * 位置: ChatHeader 下方
 * 格式: 📍 老街酒吧 │ 🌅 傍晚 │ ☁️ 多云 │ 第3天
 */

import React, { useMemo } from 'react'
import { Group, Text, Badge, Tooltip, ActionIcon, Box } from '@mantine/core'
import {
  IconMapPin,
  IconSun,
  IconMoon,
  IconSunrise,
  IconSunset,
  IconCloud,
  IconCloudRain,
  IconSnowflake,
  IconWind,
  IconLeaf,
  IconFlower,
  IconTree,
  IconCalendar,
  IconChevronRight
} from '@tabler/icons-react'
import type { TimeOfDay, Season, Weather } from '@/lib/world/types'

// ==================== 类型定义 ====================

export interface SceneStatusBarProps {
  /** 当前场景名称 */
  sceneName?: string | null
  /** 场景描述（tooltip） */
  sceneDescription?: string | null
  /** 当前时间 */
  timeOfDay: TimeOfDay
  /** 当前天气 */
  weather?: Weather | null
  /** 当前季节 */
  season?: Season | null
  /** 已过天数 */
  daysPassed: number
  /** 是否显示场景切换按钮 */
  showSceneSwitch?: boolean
  /** 场景切换回调 */
  onSceneSwitch?: () => void
  /** 是否启用活世界系统 */
  enabled?: boolean
  /** 紧凑模式 */
  compact?: boolean
}

// ==================== 图标映射 ====================

const TIME_ICONS: Record<TimeOfDay, React.ReactNode> = {
  dawn: <IconSunrise size={14} />,
  morning: <IconSun size={14} />,
  noon: <IconSun size={14} />,
  afternoon: <IconSunset size={14} />,
  evening: <IconSunset size={14} />,
  night: <IconMoon size={14} />
}

const TIME_LABELS: Record<TimeOfDay, string> = {
  dawn: '黎明',
  morning: '早晨',
  noon: '正午',
  afternoon: '下午',
  evening: '傍晚',
  night: '夜晚'
}

const TIME_COLORS: Record<TimeOfDay, string> = {
  dawn: 'pink',
  morning: 'yellow',
  noon: 'orange',
  afternoon: 'orange',
  evening: 'grape',
  night: 'indigo'
}

const WEATHER_ICONS: Record<Weather, React.ReactNode> = {
  sunny: <IconSun size={14} />,
  cloudy: <IconCloud size={14} />,
  rainy: <IconCloudRain size={14} />,
  snowy: <IconSnowflake size={14} />,
  windy: <IconWind size={14} />,
  foggy: <IconCloud size={14} />,
  stormy: <IconCloudRain size={14} />
}

const WEATHER_LABELS: Record<Weather, string> = {
  sunny: '晴朗',
  cloudy: '多云',
  rainy: '下雨',
  snowy: '下雪',
  windy: '大风',
  foggy: '大雾',
  stormy: '暴风雨'
}

const SEASON_ICONS: Record<Season, React.ReactNode> = {
  spring: <IconFlower size={14} />,
  summer: <IconSun size={14} />,
  autumn: <IconLeaf size={14} />,
  winter: <IconSnowflake size={14} />
}

const SEASON_LABELS: Record<Season, string> = {
  spring: '春',
  summer: '夏',
  autumn: '秋',
  winter: '冬'
}

const SEASON_COLORS: Record<Season, string> = {
  spring: 'green',
  summer: 'yellow',
  autumn: 'orange',
  winter: 'blue'
}

// ==================== 组件 ====================

export function SceneStatusBar({
  sceneName,
  sceneDescription,
  timeOfDay,
  weather,
  season,
  daysPassed,
  showSceneSwitch = false,
  onSceneSwitch,
  enabled = true,
  compact = false
}: SceneStatusBarProps) {
  // 如果未启用，不渲染
  if (!enabled) return null

  // 场景徽章
  const sceneBadge = useMemo(() => {
    if (!sceneName) return null

    return (
      <Tooltip label={sceneDescription || sceneName} position="bottom" withArrow>
        <Badge
          variant="light"
          color="blue"
          size={compact ? 'xs' : 'sm'}
          leftSection={<IconMapPin size={12} />}
          style={{ cursor: 'default' }}
        >
          {sceneName}
        </Badge>
      </Tooltip>
    )
  }, [sceneName, sceneDescription, compact])

  // 时间徽章
  const timeBadge = useMemo(() => (
    <Badge
      variant="light"
      color={TIME_COLORS[timeOfDay]}
      size={compact ? 'xs' : 'sm'}
      leftSection={TIME_ICONS[timeOfDay]}
    >
      {TIME_LABELS[timeOfDay]}
    </Badge>
  ), [timeOfDay, compact])

  // 天气徽章
  const weatherBadge = useMemo(() => {
    if (!weather) return null

    return (
      <Badge
        variant="light"
        color="gray"
        size={compact ? 'xs' : 'sm'}
        leftSection={WEATHER_ICONS[weather]}
      >
        {WEATHER_LABELS[weather]}
      </Badge>
    )
  }, [weather, compact])

  // 季节徽章
  const seasonBadge = useMemo(() => {
    if (!season) return null

    return (
      <Badge
        variant="light"
        color={SEASON_COLORS[season]}
        size={compact ? 'xs' : 'sm'}
        leftSection={SEASON_ICONS[season]}
      >
        {SEASON_LABELS[season]}
      </Badge>
    )
  }, [season, compact])

  // 天数徽章
  const daysBadge = useMemo(() => (
    <Badge
      variant="outline"
      color="gray"
      size={compact ? 'xs' : 'sm'}
      leftSection={<IconCalendar size={12} />}
    >
      第{daysPassed + 1}天
    </Badge>
  ), [daysPassed, compact])

  return (
    <Box
      style={{
        padding: compact ? '4px 8px' : '6px 12px',
        borderBottom: '1px solid var(--mantine-color-gray-2)',
        background: 'var(--mantine-color-gray-0)'
      }}
    >
      <Group gap={compact ? 'xs' : 'sm'} justify="center" wrap="nowrap">
        {/* 场景 */}
        {sceneBadge}

        {/* 分隔符 */}
        {sceneName && (
          <Text size="xs" c="dimmed">│</Text>
        )}

        {/* 时间 */}
        {timeBadge}

        {/* 天气 */}
        {weatherBadge && (
          <>
            <Text size="xs" c="dimmed">│</Text>
            {weatherBadge}
          </>
        )}

        {/* 季节 */}
        {seasonBadge && (
          <>
            <Text size="xs" c="dimmed">│</Text>
            {seasonBadge}
          </>
        )}

        {/* 天数 */}
        <Text size="xs" c="dimmed">│</Text>
        {daysBadge}

        {/* 场景切换按钮 */}
        {showSceneSwitch && onSceneSwitch && (
          <>
            <Text size="xs" c="dimmed">│</Text>
            <Tooltip label="切换场景" position="bottom" withArrow>
              <ActionIcon
                variant="subtle"
                color="blue"
                size={compact ? 'xs' : 'sm'}
                onClick={onSceneSwitch}
              >
                <IconChevronRight size={14} />
              </ActionIcon>
            </Tooltip>
          </>
        )}
      </Group>
    </Box>
  )
}

export default SceneStatusBar
