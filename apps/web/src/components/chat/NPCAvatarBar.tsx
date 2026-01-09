'use client'

/**
 * v4.0 活世界系统 - NPC头像栏组件
 *
 * 显示当前场景中在场的NPC头像
 * 支持点击切换对话对象，显示紧急目标提示
 */

import React, { useMemo } from 'react'
import { Group, Avatar, Tooltip, Badge, Indicator, ActionIcon, Text, Box, Stack } from '@mantine/core'
import { IconUser, IconMessageCircle, IconAlertTriangle } from '@tabler/icons-react'

// ==================== 类型定义 ====================

export interface NPCAvatarInfo {
  id: string
  name: string
  avatar?: string | null
  /** 健谈度 0-100 */
  talkativeness?: number
  /** 当前心情 */
  mood?: string | null
  /** 是否有紧急目标 */
  hasUrgentGoal?: boolean
  /** 紧急目标描述 */
  urgentGoalHint?: string
  /** 与用户的关系 */
  relation?: string
  /** 是否为主角色 */
  isMainCharacter?: boolean
  /** 是否被选中 */
  isSelected?: boolean
}

export interface NPCAvatarBarProps {
  /** 主角色信息 */
  mainCharacter: NPCAvatarInfo
  /** 在场NPC列表 */
  presentNPCs: NPCAvatarInfo[]
  /** 当前选中的发言者ID */
  selectedSpeakerId?: string | null
  /** 选择发言者回调 */
  onSelectSpeaker?: (npcId: string) => void
  /** 查看NPC详情回调 */
  onViewNPCDetail?: (npcId: string) => void
  /** 是否启用 */
  enabled?: boolean
  /** 紧凑模式 */
  compact?: boolean
  /** 最大显示数量 */
  maxDisplay?: number
}

// ==================== 辅助组件 ====================

interface NPCAvatarItemProps {
  npc: NPCAvatarInfo
  isSelected: boolean
  compact: boolean
  onSelect?: () => void
  onViewDetail?: () => void
}

function NPCAvatarItem({
  npc,
  isSelected,
  compact,
  onSelect,
  onViewDetail
}: NPCAvatarItemProps) {
  const avatarSize = compact ? 32 : 40
  const indicatorSize = compact ? 8 : 10

  // 根据心情选择边框颜色
  const moodColor = useMemo(() => {
    const moodColors: Record<string, string> = {
      happy: 'green',
      sad: 'blue',
      angry: 'red',
      anxious: 'yellow',
      neutral: 'gray',
      silent: 'gray'
    }
    return npc.mood ? moodColors[npc.mood] || 'gray' : 'gray'
  }, [npc.mood])

  // 健谈度显示（越高越亮）
  const talkativenessOpacity = npc.talkativeness ? npc.talkativeness / 100 : 0.5

  const tooltipContent = (
    <Stack gap={4}>
      <Text size="sm" fw={500}>{npc.name}</Text>
      {npc.relation && (
        <Text size="xs" c="dimmed">关系: {npc.relation}</Text>
      )}
      {npc.mood && (
        <Text size="xs" c="dimmed">心情: {npc.mood}</Text>
      )}
      {npc.talkativeness !== undefined && (
        <Text size="xs" c="dimmed">健谈度: {npc.talkativeness}%</Text>
      )}
      {npc.hasUrgentGoal && npc.urgentGoalHint && (
        <Text size="xs" c="orange">📌 {npc.urgentGoalHint}</Text>
      )}
    </Stack>
  )

  return (
    <Tooltip label={tooltipContent} position="bottom" withArrow multiline w={180}>
      <Box
        style={{
          position: 'relative',
          cursor: onSelect ? 'pointer' : 'default'
        }}
        onClick={onSelect}
        onDoubleClick={onViewDetail}
      >
        <Indicator
          color="red"
          size={indicatorSize}
          offset={2}
          disabled={!npc.hasUrgentGoal}
          processing={npc.hasUrgentGoal}
        >
          <Avatar
            src={npc.avatar}
            size={avatarSize}
            radius="xl"
            style={{
              border: isSelected
                ? '3px solid var(--mantine-color-blue-5)'
                : `2px solid var(--mantine-color-${moodColor}-4)`,
              opacity: talkativenessOpacity + 0.4,
              transition: 'all 0.2s ease'
            }}
          >
            {!npc.avatar && <IconUser size={avatarSize * 0.5} />}
          </Avatar>
        </Indicator>

        {/* 主角色标记 */}
        {npc.isMainCharacter && (
          <Badge
            size="xs"
            variant="filled"
            color="violet"
            style={{
              position: 'absolute',
              bottom: -4,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 8,
              padding: '0 4px'
            }}
          >
            主角
          </Badge>
        )}
      </Box>
    </Tooltip>
  )
}

// ==================== 主组件 ====================

export function NPCAvatarBar({
  mainCharacter,
  presentNPCs,
  selectedSpeakerId,
  onSelectSpeaker,
  onViewNPCDetail,
  enabled = true,
  compact = false,
  maxDisplay = 8
}: NPCAvatarBarProps) {
  // 如果未启用，不渲染
  if (!enabled) return null

  // 限制显示数量
  const displayNPCs = presentNPCs.slice(0, maxDisplay)
  const hasMore = presentNPCs.length > maxDisplay

  // 主角色始终显示在第一位
  const allCharacters = [
    { ...mainCharacter, isMainCharacter: true },
    ...displayNPCs
  ]

  return (
    <Box
      style={{
        padding: compact ? '4px 8px' : '8px 12px',
        borderBottom: '1px solid var(--mantine-color-gray-2)',
        background: 'var(--mantine-color-gray-0)'
      }}
    >
      <Group gap={compact ? 'xs' : 'sm'} justify="center" wrap="nowrap">
        {/* 角色头像列表 */}
        {allCharacters.map((npc) => (
          <NPCAvatarItem
            key={npc.id}
            npc={npc}
            isSelected={selectedSpeakerId === npc.id}
            compact={compact}
            onSelect={onSelectSpeaker ? () => onSelectSpeaker(npc.id) : undefined}
            onViewDetail={onViewNPCDetail ? () => onViewNPCDetail(npc.id) : undefined}
          />
        ))}

        {/* 更多提示 */}
        {hasMore && (
          <Tooltip label={`还有 ${presentNPCs.length - maxDisplay} 个角色`} position="bottom" withArrow>
            <Badge
              variant="outline"
              color="gray"
              size={compact ? 'xs' : 'sm'}
            >
              +{presentNPCs.length - maxDisplay}
            </Badge>
          </Tooltip>
        )}

        {/* 无NPC提示 */}
        {presentNPCs.length === 0 && (
          <Text size="xs" c="dimmed" fs="italic">
            当前场景没有其他角色
          </Text>
        )}
      </Group>
    </Box>
  )
}

export default NPCAvatarBar
