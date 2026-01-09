'use client'

/**
 * GroupMessageRenderer - 群聊消息渲染组件
 *
 * 解析并渲染群聊模式下的多角色回复
 * 格式：【角色名】内容
 *
 * 支持：
 * - 主角色和NPC角色的区分显示
 * - 每个角色独立的头像和颜色
 * - 动作描写和对话的高亮
 * - 情绪检测和视觉效果
 */

import { useMemo, memo } from 'react'
import {
  Box,
  Stack,
  Group,
  Avatar,
  Text,
  Paper,
} from '@mantine/core'
import { IconRobot, IconUsers } from '@tabler/icons-react'
import { parseGroupResponse, type GroupMember, type ParsedGroupMessage } from '@/lib/context/groupContextBuilder'
import { detectEmotionFromContent, getEmotionColors } from '@/components/effects'
import type { EmotionType } from '@/components/effects'

// ==================== Types ====================

export interface GroupMemberInfo {
  id: string
  name: string
  avatar?: string | null
  isMainCharacter?: boolean
}

export interface GroupMessageRendererProps {
  /** 消息内容（包含【角色名】格式） */
  content: string
  /** 主角色信息 */
  mainCharacter: GroupMemberInfo
  /** NPC成员列表 */
  groupMembers: GroupMemberInfo[]
  /** 是否使用沉浸式样式 */
  immersiveMode?: boolean
  /** 是否移动端 */
  isMobile?: boolean
  /** 格式化内容的回调（用于应用regex等） */
  formatContent?: (content: string) => string
  /** TTS播放回调 */
  onPlayTTS?: (content: string, speakerId: string) => void
  /** 当前播放的角色ID */
  currentTTSSpeakerId?: string
}

// ==================== Color Mapping ====================

// NPC 角色颜色（用于区分不同NPC）
const NPC_COLORS = [
  { bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.4)', text: '#a78bfa' }, // 紫色
  { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.4)', text: '#60a5fa' }, // 蓝色
  { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.4)', text: '#34d399' }, // 绿色
  { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.4)', text: '#fbbf24' }, // 橙色
  { bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.4)', text: '#f472b6' }, // 粉色
]

// 主角色颜色
const MAIN_CHARACTER_COLOR = {
  bg: 'rgba(244, 114, 182, 0.12)',
  border: 'rgba(244, 114, 182, 0.4)',
  text: '#f472b6',
}

// ==================== Helper Functions ====================

/**
 * 根据NPC索引获取颜色
 */
function getNPCColor(index: number) {
  return NPC_COLORS[index % NPC_COLORS.length]
}

/**
 * 高亮内容中的动作和对话
 */
function highlightContent(content: string): string {
  let result = content

  // 高亮 *动作*
  result = result.replace(/\*([^*]+)\*/g,
    '<span style="color: rgba(245, 197, 66, 0.9); font-style: italic;">*$1*</span>'
  )

  // 高亮【状态描写】
  result = result.replace(/【([^】]+)】/g,
    '<span style="color: rgba(196, 181, 253, 0.9); font-style: italic; font-size: 0.95em;">【$1】</span>'
  )

  // 高亮（心理活动）
  result = result.replace(/（([^）]+)）/g,
    '<span style="color: rgba(244, 114, 182, 0.85); font-style: italic; font-size: 0.95em;">（$1）</span>'
  )

  // 换行处理
  result = result.replace(/\n/g, '<br />')

  return result
}

// ==================== Sub Components ====================

interface SingleSpeakerBubbleProps {
  parsed: ParsedGroupMessage
  member: GroupMemberInfo | undefined
  isMainCharacter: boolean
  colorIndex: number
  immersiveMode: boolean
  isMobile: boolean
  formatContent?: (content: string) => string
}

const SingleSpeakerBubble = memo(function SingleSpeakerBubble({
  parsed,
  member,
  isMainCharacter,
  colorIndex,
  immersiveMode,
  isMobile,
  formatContent,
}: SingleSpeakerBubbleProps) {
  // 获取颜色
  const colors = isMainCharacter ? MAIN_CHARACTER_COLOR : getNPCColor(colorIndex)

  // 检测情绪
  const emotion: EmotionType = detectEmotionFromContent(parsed.content)
  const emotionColors = getEmotionColors(emotion)

  // 格式化内容
  const formattedContent = useMemo(() => {
    let content = parsed.content
    if (formatContent) {
      content = formatContent(content)
    } else {
      content = highlightContent(content)
    }
    return content
  }, [parsed.content, formatContent])

  const avatarSize = isMobile ? 32 : 40

  return (
    <Box
      style={{
        marginBottom: '0.75rem',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <Group gap="sm" align="flex-start" wrap="nowrap">
        {/* 角色头像 */}
        <Avatar
          size={avatarSize}
          radius="xl"
          src={member?.avatar}
          style={{
            flexShrink: 0,
            border: `2px solid ${isMainCharacter ? emotionColors.primary : colors.border}`,
            boxShadow: emotion !== 'neutral' ? `0 0 12px ${emotionColors.glow}` : 'none',
          }}
        >
          {isMainCharacter ? (
            member?.name?.charAt(0) || <IconRobot size={16} />
          ) : (
            member?.name?.charAt(0) || <IconUsers size={16} />
          )}
        </Avatar>

        {/* 消息内容 */}
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          {/* 角色名 */}
          <Group gap="xs" wrap="nowrap">
            <Text
              size="sm"
              fw={600}
              style={{
                color: colors.text,
                textShadow: isMainCharacter && emotion !== 'neutral'
                  ? `0 0 12px ${emotionColors.glow}`
                  : 'none',
              }}
            >
              {parsed.speakerName}
            </Text>
            {isMainCharacter && (
              <Text
                size="xs"
                style={{
                  color: 'rgba(244, 114, 182, 0.6)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: 'rgba(244, 114, 182, 0.1)',
                  border: '1px solid rgba(244, 114, 182, 0.2)',
                }}
              >
                主角
              </Text>
            )}
          </Group>

          {/* 消息气泡 */}
          <Paper
            p={isMobile ? 'sm' : 'md'}
            radius="lg"
            style={{
              background: immersiveMode
                ? `linear-gradient(135deg, ${colors.bg} 0%, rgba(26, 20, 41, 0.9) 100%)`
                : colors.bg,
              border: `1px solid ${colors.border}`,
              borderLeft: `3px solid ${isMainCharacter ? emotionColors.primary : colors.border}`,
              boxShadow: isMainCharacter && emotion !== 'neutral'
                ? `0 4px 20px ${emotionColors.glow}`
                : '0 2px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div
              className="group-message-content"
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: isMobile ? '0.9375rem' : '1rem',
                lineHeight: 1.75,
                color: 'rgba(255, 255, 255, 0.95)',
              }}
              dangerouslySetInnerHTML={{ __html: formattedContent }}
            />
          </Paper>
        </Stack>
      </Group>
    </Box>
  )
})

// ==================== Main Component ====================

function GroupMessageRenderer({
  content,
  mainCharacter,
  groupMembers,
  immersiveMode = false,
  isMobile = false,
  formatContent,
  onPlayTTS,
  currentTTSSpeakerId,
}: GroupMessageRendererProps) {
  // 合并所有成员
  const allMembers: GroupMember[] = useMemo(() => {
    const members: GroupMember[] = [
      {
        id: mainCharacter.id,
        name: mainCharacter.name,
        isMainCharacter: true,
      },
      ...groupMembers.map(m => ({
        id: m.id,
        name: m.name,
        isMainCharacter: false,
      })),
    ]
    return members
  }, [mainCharacter, groupMembers])

  // 解析群聊消息
  const parsedMessages = useMemo(() => {
    return parseGroupResponse(content, allMembers)
  }, [content, allMembers])

  // 创建成员ID到信息的映射
  const memberMap = useMemo(() => {
    const map = new Map<string, GroupMemberInfo>()
    map.set(mainCharacter.id, mainCharacter)
    groupMembers.forEach(m => map.set(m.id, m))
    return map
  }, [mainCharacter, groupMembers])

  // 创建NPC的颜色索引映射
  const npcColorIndex = useMemo(() => {
    const map = new Map<string, number>()
    let index = 0
    groupMembers.forEach(m => {
      map.set(m.id, index)
      index++
    })
    return map
  }, [groupMembers])

  // v30: 只要有解析出角色消息就显示，不再要求必须 > 1
  if (parsedMessages.length === 0) {
    return null
  }

  return (
    <Box className="group-message-container">
      {/* 群聊标识 */}
      <Group gap="xs" mb="sm" opacity={0.7}>
        <IconUsers size={16} />
        <Text size="xs" c="dimmed">
          群聊消息 · {parsedMessages.length}人参与
        </Text>
      </Group>

      {/* 渲染每个角色的消息 */}
      <Stack gap={0}>
        {parsedMessages.map((parsed, index) => {
          const member = memberMap.get(parsed.speakerId)
          const isMain = parsed.speakerId === mainCharacter.id
          const isUnknown = (parsed as any).isUnknownSpeaker === true
          const colorIdx = isUnknown ? index : (npcColorIndex.get(parsed.speakerId) ?? 0)

          return (
            <SingleSpeakerBubble
              key={`${parsed.speakerId}-${index}`}
              parsed={parsed}
              member={isUnknown ? { id: parsed.speakerId, name: parsed.speakerName, isMainCharacter: false } : member}
              isMainCharacter={isMain}
              colorIndex={colorIdx}
              immersiveMode={immersiveMode}
              isMobile={isMobile}
              formatContent={formatContent}
            />
          )
        })}
      </Stack>

      {/* 全局样式 */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .group-message-container .group-message-content a {
          color: rgb(196, 181, 253);
          text-decoration: underline;
        }

        .group-message-container .group-message-content a:hover {
          color: rgb(245, 197, 66);
        }
      `}</style>
    </Box>
  )
}

export default memo(GroupMessageRenderer)

// ==================== Utility Export ====================

/**
 * 检测消息是否为群聊消息格式
 * v30: 降低检测门槛，只要有【角色名】格式就视为群聊消息
 */
export function isGroupMessage(content: string): boolean {
  // 检测是否包含【角色名】格式
  // v30: 只要有1个以上的【】标记且内容不为空，就视为群聊消息
  const pattern = /【([^】]+)】[\s\S]*?(?=【|$)/g
  const matches = content.match(pattern)

  if (!matches || matches.length < 1) {
    return false
  }

  // 检查是否有实际内容（不只是标记）
  for (const match of matches) {
    const contentAfterTag = match.replace(/【[^】]+】/, '').trim()
    if (contentAfterTag.length > 0) {
      return true
    }
  }

  return false
}
