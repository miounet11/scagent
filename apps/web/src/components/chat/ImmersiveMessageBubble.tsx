'use client'

/**
 * 沉浸式消息气泡组件
 *
 * 在传统消息基础上增加：
 * - 角色表情图片（小型气泡）
 * - 内嵌场景图片/CG
 * - 交互选项
 * - 角色状态描写高亮
 * - 情绪感知背景
 */

import { memo, useMemo, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Box,
  Group,
  Avatar,
  Text,
  Paper,
  Image,
  Tooltip,
  ActionIcon,
  Menu,
  Skeleton,
} from '@mantine/core'
import {
  IconDotsVertical,
  IconCopy,
  IconEdit,
  IconRefresh,
  IconTrash,
  IconUser,
  IconRobot,
  IconMoodSmile,
  IconPhoto,
} from '@tabler/icons-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

import { parseEnhancedMessage, detectEmotion, parseEmotionTransition, parseEmotionTag } from '@/lib/immersiveChat/parser'
import type { EmotionType, ChoiceOption, ImmersiveChatConfig } from '@/lib/immersiveChat/types'
import type { EmotionTransition } from '@/lib/immersiveChat/parser'
import InteractiveChoices from './InteractiveChoices'
import { EmotionBadge } from './EmotionBadge'
import toast from 'react-hot-toast'

// ==================== 类型定义 ====================

interface ImmersiveMessageBubbleProps {
  /** 消息ID */
  messageId: string

  /** 消息角色 */
  role: 'user' | 'assistant' | 'system'

  /** 消息内容 */
  content: string

  /** 时间戳 */
  timestamp?: Date | string

  /** 角色信息 */
  characterName?: string
  characterAvatar?: string
  characterId?: string

  /** 用户ID（用于获取表情素材） */
  userId?: string

  /** 表情图片URL（如果有） */
  expressionImageUrl?: string

  /** 是否是最后一条AI消息 */
  isLastAssistantMessage?: boolean

  /** 是否启用沉浸式功能 */
  immersiveEnabled?: boolean

  /** 沉浸式配置 */
  immersiveConfig?: Partial<ImmersiveChatConfig>

  /** 亲密度等级（用于解锁判断） */
  intimacyLevel?: number

  /** 编辑回调 */
  onEdit?: (messageId: string, newContent: string) => void

  /** 删除回调 */
  onDelete?: (messageId: string) => void

  /** 重新生成回调 */
  onRegenerate?: (messageId: string) => void

  /** 选择交互选项回调 */
  onChoiceSelect?: (choice: ChoiceOption) => void

  /** CG点击回调 */
  onCGClick?: (imageUrl: string) => void

  /** 已选择的选项ID */
  selectedChoiceId?: string
}

// ==================== 情绪颜色映射 ====================

const EMOTION_COLORS: Record<EmotionType, { bg: string; border: string; glow: string }> = {
  happy: { bg: 'rgba(251, 191, 36, 0.08)', border: 'rgba(251, 191, 36, 0.3)', glow: 'rgba(251, 191, 36, 0.2)' },
  love: { bg: 'rgba(236, 72, 153, 0.08)', border: 'rgba(236, 72, 153, 0.3)', glow: 'rgba(236, 72, 153, 0.2)' },
  shy: { bg: 'rgba(244, 114, 182, 0.08)', border: 'rgba(244, 114, 182, 0.3)', glow: 'rgba(244, 114, 182, 0.2)' },
  angry: { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.3)', glow: 'rgba(239, 68, 68, 0.2)' },
  sad: { bg: 'rgba(96, 165, 250, 0.08)', border: 'rgba(96, 165, 250, 0.3)', glow: 'rgba(96, 165, 250, 0.2)' },
  surprised: { bg: 'rgba(251, 146, 60, 0.08)', border: 'rgba(251, 146, 60, 0.3)', glow: 'rgba(251, 146, 60, 0.2)' },
  scared: { bg: 'rgba(168, 85, 247, 0.08)', border: 'rgba(168, 85, 247, 0.3)', glow: 'rgba(168, 85, 247, 0.2)' },
  neutral: { bg: 'rgba(148, 163, 184, 0.06)', border: 'rgba(148, 163, 184, 0.2)', glow: 'transparent' },
  smug: { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.3)', glow: 'rgba(245, 158, 11, 0.2)' },
  crying: { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.3)', glow: 'rgba(59, 130, 246, 0.2)' },
  thinking: { bg: 'rgba(139, 92, 246, 0.08)', border: 'rgba(139, 92, 246, 0.3)', glow: 'rgba(139, 92, 246, 0.2)' },
  excited: { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.3)', glow: 'rgba(16, 185, 129, 0.2)' },
}

// ==================== 主组件 ====================

function ImmersiveMessageBubble({
  messageId,
  role,
  content,
  timestamp,
  characterName = '角色',
  characterAvatar,
  characterId,
  userId,
  expressionImageUrl,
  isLastAssistantMessage = false,
  immersiveEnabled = true,
  immersiveConfig = {},
  intimacyLevel = 0,
  onEdit,
  onDelete,
  onRegenerate,
  onChoiceSelect,
  onCGClick,
  selectedChoiceId,
}: ImmersiveMessageBubbleProps) {
  const isUser = role === 'user'
  const isSystem = role === 'system'
  const [isHovered, setIsHovered] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(true)

  // 解析情绪标记
  const emotionData = useMemo(() => {
    if (isUser || isSystem) return null

    const transition = parseEmotionTransition(content)
    if (transition) return { transition }

    const emotion = parseEmotionTag(content)
    if (emotion) return { emotion }

    return null
  }, [content, isUser, isSystem])

  // 合并配置
  const config: ImmersiveChatConfig = useMemo(() => ({
    enableExpressions: true,
    enableImages: true,
    enableChoices: true,
    enableStateHighlight: true,
    enableCGUnlock: true,
    expressionPosition: 'bubble',
    imageSize: 'medium',
    choiceStyle: 'cards',
    ...immersiveConfig,
  }), [immersiveConfig])

  // 解析消息增强内容
  const parsed = useMemo(() => {
    if (!immersiveEnabled || isUser || isSystem) {
      return null
    }
    return parseEnhancedMessage(content)
  }, [content, immersiveEnabled, isUser, isSystem])

  // 获取情绪颜色
  const emotionColors = useMemo(() => {
    if (!parsed) return EMOTION_COLORS.neutral
    return EMOTION_COLORS[parsed.emotion] || EMOTION_COLORS.neutral
  }, [parsed])

  // 格式化时间
  const timeAgo = useMemo(() => {
    if (!timestamp) return ''
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp
      return formatDistanceToNow(date, { addSuffix: true, locale: zhCN })
    } catch {
      return ''
    }
  }, [timestamp])

  // 渲染内容（高亮状态描写 + 移除情绪标记）
  const renderedContent = useMemo(() => {
    let result = content

    // 移除情绪标记（包括 → 和 ->）
    result = result.replace(/\[emotion:\s*\w+(?:\s*[\u2192\->]\s*\w+)?\]/gi, '')

    if (!parsed || !config.enableStateHighlight) {
      return result
    }

    result = parsed.cleanContent

    // 高亮【】内的状态描写
    result = result.replace(/【([^】]+)】/g,
      '<span class="text-purple-300/80 italic text-sm">【$1】</span>'
    )

    // 高亮 *动作*
    result = result.replace(/\*([^*]+)\*/g,
      '<span class="text-amber-300/80 italic">*$1*</span>'
    )

    // 换行处理
    result = result.replace(/\n/g, '<br />')

    return result
  }, [content, parsed, config.enableStateHighlight])

  // 复制消息
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content)
    toast.success('已复制')
  }, [content])

  // 系统消息特殊渲染
  if (isSystem) {
    return (
      <Box className="my-4 text-center">
        <Paper
          p="sm"
          radius="md"
          className="inline-block bg-indigo-500/10 border border-indigo-500/20"
        >
          <Text size="sm" c="dimmed" className="italic">
            {content}
          </Text>
        </Paper>
      </Box>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Group
        gap="md"
        align="flex-start"
        p="md"
        className="rounded-xl transition-colors duration-200"
        style={{
          backgroundColor: isUser ? 'rgba(99, 102, 241, 0.1)' : emotionColors.bg,
          borderLeft: isUser ? 'none' : `3px solid ${emotionColors.border}`,
        }}
      >
        {/* 头像 + 表情 */}
        <Box className="relative flex-shrink-0">
          <Avatar
            size="md"
            radius="xl"
            color={isUser ? 'indigo' : 'pink'}
            src={isUser ? undefined : characterAvatar}
          >
            {isUser ? <IconUser size={20} /> : <IconRobot size={20} />}
          </Avatar>

          {/* 表情气泡 - 显示在头像旁边 */}
          {!isUser && expressionImageUrl && config.enableExpressions && config.expressionPosition === 'avatar' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute -right-1 -top-1"
            >
              <Tooltip label={`${characterName}的表情`}>
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
                  <Image
                    src={expressionImageUrl}
                    alt="expression"
                    className="w-full h-full object-cover"
                  />
                </div>
              </Tooltip>
            </motion.div>
          )}
        </Box>

        {/* 消息内容 */}
        <Box className="flex-1 min-w-0">
          {/* 头部 */}
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <Text size="sm" fw={600} className={isUser ? 'text-indigo-300' : 'text-pink-300'}>
                {isUser ? '你' : characterName}
              </Text>

              {/* 情绪徽章 - 显示情绪标记或变化 */}
              {!isUser && emotionData && (
                <EmotionBadge
                  emotion={emotionData.emotion}
                  transition={emotionData.transition}
                  size="sm"
                />
              )}

              {/* 原有的情绪标签（从解析后的情绪检测） */}
              {!isUser && !emotionData && parsed && parsed.emotion !== 'neutral' && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-xs px-2 py-0.5 rounded-full bg-white/10"
                >
                  {getEmotionEmoji(parsed.emotion)}
                </motion.span>
              )}

              {timeAgo && (
                <Text size="xs" c="dimmed">
                  {timeAgo}
                </Text>
              )}
            </Group>

            {/* 操作菜单 */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Menu position="bottom-end" shadow="md" withinPortal>
                    <Menu.Target>
                      <ActionIcon variant="subtle" size="sm" color="gray">
                        <IconDotsVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<IconCopy size={14} />} onClick={handleCopy}>
                        复制
                      </Menu.Item>
                      {onEdit && (
                        <Menu.Item leftSection={<IconEdit size={14} />}>
                          编辑
                        </Menu.Item>
                      )}
                      {!isUser && isLastAssistantMessage && onRegenerate && (
                        <Menu.Item
                          leftSection={<IconRefresh size={14} />}
                          onClick={() => onRegenerate(messageId)}
                        >
                          重新生成
                        </Menu.Item>
                      )}
                      {onDelete && (
                        <Menu.Item
                          leftSection={<IconTrash size={14} />}
                          color="red"
                          onClick={() => onDelete(messageId)}
                        >
                          删除
                        </Menu.Item>
                      )}
                    </Menu.Dropdown>
                  </Menu>
                </motion.div>
              )}
            </AnimatePresence>
          </Group>

          {/* 表情图片 - 气泡内显示 */}
          {!isUser && expressionImageUrl && config.enableExpressions && config.expressionPosition === 'bubble' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-3 inline-block"
            >
              <div
                className="relative rounded-lg overflow-hidden shadow-lg"
                style={{ width: 100, height: 100 }}
              >
                {isImageLoading && (
                  <Skeleton className="absolute inset-0" />
                )}
                <Image
                  src={expressionImageUrl}
                  alt={`${characterName}的表情`}
                  className="w-full h-full object-cover"
                  onLoad={() => setIsImageLoading(false)}
                />
              </div>
            </motion.div>
          )}

          {/* 内嵌图片/CG */}
          {parsed && parsed.hasImages && config.enableImages && (
            <div className="mb-3 space-y-2">
              {parsed.images.map((img, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="cursor-pointer"
                  onClick={() => img.src && onCGClick?.(img.src)}
                >
                  <Paper
                    radius="lg"
                    className="overflow-hidden border border-white/10"
                    style={{
                      maxWidth: config.imageSize === 'large' ? '100%' : config.imageSize === 'medium' ? 300 : 150,
                    }}
                  >
                    {img.src ? (
                      <Image
                        src={img.src}
                        alt={img.alt || 'CG'}
                        className="w-full h-auto"
                      />
                    ) : (
                      <Box className="p-4 text-center text-gray-400">
                        <IconPhoto size={24} className="mx-auto mb-2" />
                        <Text size="xs">{img.category || '场景'}</Text>
                      </Box>
                    )}
                  </Paper>
                </motion.div>
              ))}
            </div>
          )}

          {/* 消息文本 */}
          <div
            className="whitespace-pre-wrap break-words text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderedContent }}
            style={{ color: 'hsl(var(--text-primary))' }}
          />

          {/* 交互选项 */}
          {parsed && parsed.hasChoices && config.enableChoices && parsed.choices && (
            <InteractiveChoices
              choices={parsed.choices}
              characterName={characterName}
              selectedId={selectedChoiceId}
              onSelect={onChoiceSelect}
              variant={config.choiceStyle}
            />
          )}
        </Box>
      </Group>
    </motion.div>
  )
}

// ==================== 辅助函数 ====================

function getEmotionEmoji(emotion: EmotionType): string {
  const emojiMap: Record<EmotionType, string> = {
    happy: '😊',
    love: '🥰',
    shy: '😳',
    angry: '😤',
    sad: '😢',
    surprised: '😲',
    scared: '😰',
    neutral: '😐',
    smug: '😏',
    crying: '😭',
    thinking: '🤔',
    excited: '🤩',
  }
  return emojiMap[emotion] || '😐'
}

export default memo(ImmersiveMessageBubble)
