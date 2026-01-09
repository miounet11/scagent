"use client"

/**
 * NPCMessageBubble - NPC 消息气泡组件
 *
 * 用于在聊天中显示 NPC 的发言，与主角色消息有视觉区分
 */

import { useMemo } from 'react'
import {
  Box,
  Group,
  Text,
  Avatar,
  Badge,
  Paper,
  Tooltip,
} from '@mantine/core'
import {
  IconUser,
  IconCrown,
  IconMask,
  IconSparkles,
  IconHeart,
  IconStar,
} from '@tabler/icons-react'
import type { NPCCategory } from '@/lib/npc/types'
import { parseMultiCharacterMessage } from '@/lib/context/npcContextBuilder'

interface NPCMessageBubbleProps {
  /** 消息内容 */
  content: string
  /** NPC 名称（如果有） */
  npcName?: string
  /** NPC 分类 */
  npcCategory?: NPCCategory
  /** NPC 头像 */
  npcAvatar?: string
  /** 是否显示 NPC 标签 */
  showNPCLabel?: boolean
  /** 时间戳 */
  timestamp?: Date
  /** 自定义样式 */
  className?: string
}

/** NPC 分类图标映射 */
const CATEGORY_ICONS: Record<NPCCategory, typeof IconUser> = {
  ordinary: IconUser,
  elite: IconCrown,
  villain: IconMask,
  fantasy: IconSparkles,
  relation: IconHeart,
  celebrity: IconStar,
}

/** NPC 分类颜色（用于气泡边框） */
const CATEGORY_BORDER_COLORS: Record<NPCCategory, string> = {
  ordinary: 'var(--mantine-color-gray-4)',
  elite: 'var(--mantine-color-yellow-4)',
  villain: 'var(--mantine-color-red-4)',
  fantasy: 'var(--mantine-color-violet-4)',
  relation: 'var(--mantine-color-pink-4)',
  celebrity: 'var(--mantine-color-blue-4)',
}

/** NPC 分类背景色 */
const CATEGORY_BG_COLORS: Record<NPCCategory, string> = {
  ordinary: 'var(--mantine-color-gray-0)',
  elite: 'var(--mantine-color-yellow-0)',
  villain: 'var(--mantine-color-red-0)',
  fantasy: 'var(--mantine-color-violet-0)',
  relation: 'var(--mantine-color-pink-0)',
  celebrity: 'var(--mantine-color-blue-0)',
}

export default function NPCMessageBubble({
  content,
  npcName,
  npcCategory = 'ordinary',
  npcAvatar,
  showNPCLabel = true,
  timestamp,
  className,
}: NPCMessageBubbleProps) {
  // 解析消息中的角色标记
  const parsedMessage = useMemo(() => {
    return parseMultiCharacterMessage(content)
  }, [content])

  // 使用解析出的角色名，或传入的 npcName
  const displayName = parsedMessage.speaker || npcName || '路人'
  const displayContent = parsedMessage.content

  const CategoryIcon = CATEGORY_ICONS[npcCategory]
  const borderColor = CATEGORY_BORDER_COLORS[npcCategory]
  const bgColor = CATEGORY_BG_COLORS[npcCategory]

  return (
    <Box className={className} mb="md">
      {/* NPC 头像和名称 */}
      <Group gap="xs" mb={4} ml={40}>
        <Avatar
          src={npcAvatar}
          size="sm"
          radius="xl"
          style={{
            border: `2px solid ${borderColor}`,
          }}
        >
          <CategoryIcon size={14} />
        </Avatar>
        <Text size="xs" fw={500} c="dimmed">
          {displayName}
        </Text>
        {showNPCLabel && (
          <Tooltip label="NPC 角色">
            <Badge
              size="xs"
              variant="dot"
              color="gray"
              style={{ cursor: 'help' }}
            >
              NPC
            </Badge>
          </Tooltip>
        )}
        {timestamp && (
          <Text size="xs" c="dimmed">
            {new Date(timestamp).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
      </Group>

      {/* 消息气泡 */}
      <Paper
        shadow="xs"
        p="sm"
        radius="md"
        ml={40}
        style={{
          backgroundColor: bgColor,
          borderLeft: `3px solid ${borderColor}`,
          maxWidth: '85%',
        }}
      >
        <Text
          size="sm"
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {displayContent}
        </Text>
      </Paper>
    </Box>
  )
}

/**
 * 检测消息是否为 NPC 消息
 */
export function isNPCMessage(message: {
  speakerType?: string
  metadata?: string
}): boolean {
  // 检查 speakerType
  if (message.speakerType === 'npc') {
    return true
  }

  // 检查 metadata
  if (message.metadata) {
    try {
      const meta = typeof message.metadata === 'string'
        ? JSON.parse(message.metadata)
        : message.metadata
      return meta.isNPCMessage === true || !!meta.npcId
    } catch {
      return false
    }
  }

  return false
}

/**
 * 从消息中提取 NPC 信息
 */
export function extractNPCInfo(message: {
  speakerId?: string | null
  metadata?: string
}): {
  npcId: string | null
  npcName: string | null
  npcCategory: NPCCategory | null
} {
  const result = {
    npcId: message.speakerId || null,
    npcName: null as string | null,
    npcCategory: null as NPCCategory | null,
  }

  if (message.metadata) {
    try {
      const meta = typeof message.metadata === 'string'
        ? JSON.parse(message.metadata)
        : message.metadata

      if (meta.npcId) result.npcId = meta.npcId
      if (meta.npcName) result.npcName = meta.npcName
      if (meta.npcCategory) result.npcCategory = meta.npcCategory
    } catch {
      // 忽略解析错误
    }
  }

  return result
}

/**
 * 渲染多角色消息
 * 将包含多个角色发言的响应渲染为独立的气泡
 */
export function renderMultiCharacterMessages(
  content: string,
  mainCharacterName: string,
  activeNPCs: Array<{ id: string; name: string; category: NPCCategory; avatar?: string }>
): JSX.Element[] {
  const { splitMultiCharacterResponse } = require('@/lib/context/npcContextBuilder')
  const segments = splitMultiCharacterResponse(content)
  const elements: JSX.Element[] = []

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]

    // 查找对应的 NPC
    const npc = activeNPCs.find(
      (n) => n.name === segment.speaker || n.name.includes(segment.speaker)
    )

    if (npc) {
      // NPC 消息
      elements.push(
        <NPCMessageBubble
          key={`npc-${i}`}
          content={segment.content}
          npcName={npc.name}
          npcCategory={npc.category}
          npcAvatar={npc.avatar}
        />
      )
    } else if (segment.speaker === 'main' || segment.speaker === mainCharacterName) {
      // 主角色消息 - 返回 null，让调用者处理
      elements.push(
        <Box key={`main-${i}`} data-main-character data-content={segment.content} />
      )
    } else {
      // 未知角色，默认作为 NPC
      elements.push(
        <NPCMessageBubble
          key={`unknown-${i}`}
          content={segment.content}
          npcName={segment.speaker}
          npcCategory="ordinary"
        />
      )
    }
  }

  return elements
}
