/**
 * 沉浸式消息增强渲染
 *
 * 在现有消息内容下方渲染：
 * - 交互选项
 * - 表情图片（如有）
 * - 惊喜通知
 * - 剧情选择框（场景转换/时间跳跃）
 *
 * 使用 CSS 动画替代 framer-motion
 */

'use client'

import { memo, useMemo, useCallback, useState, useEffect } from 'react'
import { Box, Badge, Text, Group, Paper, Image } from '@mantine/core'
import { IconSparkles, IconHeart, IconGift } from '@tabler/icons-react'

import { parseEnhancedMessage, checkSurpriseTriggers } from '@/lib/immersiveChat'
import type { ChoiceOption, EmotionType } from '@/lib/immersiveChat/types'
import type { SurpriseTrigger, SurpriseContext } from '@/lib/immersiveChat/intimacyConfig'
import InteractiveChoices from './InteractiveChoices'
import StoryChoiceBox from './StoryChoiceBox'
import { detectPlotPoint, shouldShowChoices, DEFAULT_SCENE_CONTEXT } from '@/lib/storyProgression'
import type { SuggestedChoice, PlotPoint, SceneContext } from '@/lib/storyProgression'

interface ImmersiveMessageEnhancementsProps {
  /** 消息内容 */
  content: string
  /** 消息ID */
  messageId: string
  /** 是否是助手消息 */
  isAssistant: boolean
  /** 是否启用沉浸式功能 */
  enabled?: boolean
  /** 角色ID（用于获取表情） */
  characterId?: string
  /** 角色名称 */
  characterName?: string
  /** 已选择的选项ID */
  selectedChoiceId?: string
  /** 亲密度等级 */
  intimacyLevel?: number
  /** 消息索引/计数 */
  messageCount?: number
  /** 聊天持续时间（分钟） */
  chatDurationMinutes?: number
  /** 上次惊喜触发时间 */
  lastSurpriseTime?: Date
  /** 选择回调 */
  onChoiceSelect?: (choice: ChoiceOption, messageId: string) => void
  /** 惊喜触发回调 */
  onSurpriseTriggered?: (trigger: SurpriseTrigger) => void
  /** CG点击回调 */
  onCGClick?: (imageUrl: string) => void
  /** 场景上下文（用于剧情检测） */
  sceneContext?: SceneContext
  /** 剧情选择回调 */
  onStoryChoiceSelect?: (choice: SuggestedChoice, messageId: string) => void
  /** 已选择的剧情选择ID */
  selectedStoryChoiceId?: string
  /** 是否是最新消息（只有最新消息才显示选择框） */
  isLatestMessage?: boolean
}

function ImmersiveMessageEnhancements({
  content,
  messageId,
  isAssistant,
  enabled = true,
  characterId,
  characterName = '角色',
  selectedChoiceId,
  intimacyLevel = 1,
  messageCount = 0,
  chatDurationMinutes = 0,
  lastSurpriseTime,
  onChoiceSelect,
  onSurpriseTriggered,
  onCGClick,
  sceneContext = DEFAULT_SCENE_CONTEXT,
  onStoryChoiceSelect,
  selectedStoryChoiceId,
  isLatestMessage = false,
}: ImmersiveMessageEnhancementsProps) {
  const [surpriseNotification, setSurpriseNotification] = useState<{
    trigger: SurpriseTrigger
    show: boolean
  } | null>(null)

  // 解析消息增强内容
  const parsed = useMemo(() => {
    if (!enabled || !isAssistant) return null
    return parseEnhancedMessage(content)
  }, [content, enabled, isAssistant])

  // 检测剧情转折点
  const storyChoiceData = useMemo(() => {
    if (!enabled || !isAssistant || !isLatestMessage) return null

    const plotPoint = detectPlotPoint(content, sceneContext)
    if (!plotPoint) return null

    // 判断是否应该显示选择框
    if (!shouldShowChoices(plotPoint, sceneContext)) return null

    // 生成选择框数据
    return {
      plotPoint,
      title: getPlotPointTitle(plotPoint.type),
      description: getPlotPointDescription(plotPoint.type, characterName),
      choices: plotPoint.suggestedChoices,
    }
  }, [content, enabled, isAssistant, isLatestMessage, sceneContext, characterName])

  // 检查惊喜触发
  useEffect(() => {
    if (!enabled || !isAssistant || !parsed) return

    const context: SurpriseContext = {
      content,
      emotion: parsed.emotion,
      intimacyLevel,
      messageCount,
      chatDurationMinutes,
      lastSurpriseTime,
    }

    const trigger = checkSurpriseTriggers(context)
    if (trigger) {
      setSurpriseNotification({ trigger, show: true })
      onSurpriseTriggered?.(trigger)

      // 6秒后隐藏通知（延长显示时间让用户更容易注意到）
      const timer = setTimeout(() => {
        setSurpriseNotification(prev =>
          prev ? { ...prev, show: false } : null
        )
      }, 6000)

      return () => clearTimeout(timer)
    }
  }, [content, enabled, isAssistant, parsed, intimacyLevel, messageCount, chatDurationMinutes, lastSurpriseTime, onSurpriseTriggered])

  // 处理选项选择
  const handleChoiceSelect = useCallback((choice: ChoiceOption) => {
    onChoiceSelect?.(choice, messageId)
  }, [onChoiceSelect, messageId])

  // 处理剧情选择
  const handleStoryChoiceSelect = useCallback((choice: SuggestedChoice) => {
    onStoryChoiceSelect?.(choice, messageId)
  }, [onStoryChoiceSelect, messageId])

  // 如果未启用或不是助手消息，不渲染任何内容
  if (!enabled || !isAssistant || !parsed) {
    return null
  }

  return (
    <Box className="mt-3">
      {/* 惊喜通知 */}
      {surpriseNotification?.show && (
        <div
          className="transition-all duration-500 ease-out"
          style={{
            opacity: surpriseNotification.show ? 1 : 0,
            transform: surpriseNotification.show ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.9)',
          }}
        >
          <Paper
            p="md"
            mb="md"
            radius="lg"
            className="bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-pink-500/20 border border-pink-500/30"
          >
            <Group gap="sm">
              <span className="animate-bounce">
                <IconGift size={24} className="text-pink-400" />
              </span>
              <Box>
                <Text fw={600} className="text-pink-300">
                  {surpriseNotification.trigger.name}！
                </Text>
                <Text size="sm" c="dimmed">
                  {surpriseNotification.trigger.description}
                </Text>
                {surpriseNotification.trigger.reward.type === 'exp' && (
                  <Badge color="pink" variant="light" size="sm" mt="xs">
                    +{surpriseNotification.trigger.reward.amount} 亲密度
                  </Badge>
                )}
              </Box>
            </Group>
          </Paper>
        </div>
      )}

      {/* 情绪指示器（可选显示） */}
      {parsed.emotion !== 'neutral' && (
        <Box className="mb-2">
          <Badge
            size="sm"
            variant="light"
            color={getEmotionColor(parsed.emotion)}
            leftSection={<span>{getEmotionEmoji(parsed.emotion)}</span>}
            style={{
              maxWidth: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {characterName} · {getEmotionLabel(parsed.emotion)}
          </Badge>
        </Box>
      )}

      {/* 内嵌图片/CG */}
      {parsed.hasImages && parsed.images.length > 0 && (
        <div className="mb-3 space-y-2">
          {parsed.images.map((img, i) => (
            <div
              key={i}
              className="cursor-pointer transition-all duration-300 ease-out"
              style={{
                opacity: 1,
                transform: 'translateY(0)',
                transitionDelay: `${i * 100}ms`,
              }}
              onClick={() => img.src && onCGClick?.(img.src)}
            >
              <Paper
                radius="lg"
                className="overflow-hidden border border-white/10"
                style={{ maxWidth: 300 }}
              >
                {img.src ? (
                  <Image
                    src={img.src}
                    alt={img.alt || 'CG'}
                    className="w-full h-auto"
                  />
                ) : (
                  <Box className="p-4 text-center text-gray-400 bg-gray-800/50">
                    <IconSparkles size={24} className="mx-auto mb-2" />
                    <Text size="xs">{img.category || '场景图片'}</Text>
                  </Box>
                )}
              </Paper>
            </div>
          ))}
        </div>
      )}

      {/* 交互选项 - v20.5: 禁用，选项现在由 DirectorPanel 统一处理 */}
      {/* {parsed.hasChoices && parsed.choices && (
        <InteractiveChoices
          choices={parsed.choices}
          characterName={characterName}
          selectedId={selectedChoiceId}
          onSelect={handleChoiceSelect}
          variant="cards"
          showConsequences={true}
        />
      )} */}

      {/* 剧情选择框 - 场景转换/时间跳跃 - v20.5: 禁用，选项现在由 DirectorPanel 统一处理 */}
      {/* {storyChoiceData && (
        <Box mt="md">
          <StoryChoiceBox
            title={storyChoiceData.title}
            description={storyChoiceData.description}
            choices={storyChoiceData.choices}
            characterName={characterName}
            onSelect={handleStoryChoiceSelect}
            selectedId={selectedStoryChoiceId}
            disabled={!!selectedStoryChoiceId}
          />
        </Box>
      )} */}
    </Box>
  )
}

// 辅助函数
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

function getEmotionLabel(emotion: EmotionType): string {
  const labelMap: Record<EmotionType, string> = {
    happy: '开心',
    love: '心动',
    shy: '害羞',
    angry: '生气',
    sad: '难过',
    surprised: '惊讶',
    scared: '害怕',
    neutral: '平静',
    smug: '得意',
    crying: '哭泣',
    thinking: '思考',
    excited: '兴奋',
  }
  return labelMap[emotion] || '平静'
}

function getEmotionColor(emotion: EmotionType): string {
  const colorMap: Record<EmotionType, string> = {
    happy: 'yellow',
    love: 'pink',
    shy: 'pink',
    angry: 'red',
    sad: 'blue',
    surprised: 'orange',
    scared: 'grape',
    neutral: 'gray',
    smug: 'orange',
    crying: 'blue',
    thinking: 'violet',
    excited: 'teal',
  }
  return colorMap[emotion] || 'gray'
}

// 剧情点类型标题
function getPlotPointTitle(type: PlotPoint['type']): string {
  const titleMap: Partial<Record<PlotPoint['type'], string>> = {
    scene_end: '场景结束',
    time_skip: '时间流转',
    location_change: '场景转换',
    mood_change: '气氛转变',
    decision_point: '做出选择',
    activity_change: '下一步',
    relationship_moment: '关系时刻',
    revelation: '真相揭晓',
    conflict_peak: '冲突高峰',
    resolution: '问题解决',
    flashback: '回忆闪现',
    foreshadowing: '伏笔暗示',
    cliffhanger: '悬念时刻',
    callback: '前情回顾',
    character_growth: '角色成长',
    secret_unlock: '秘密解锁',
  }
  return titleMap[type] || '剧情选择'
}

// 剧情点类型描述
function getPlotPointDescription(type: PlotPoint['type'], characterName: string): string {
  const descMap: Partial<Record<PlotPoint['type'], string>> = {
    scene_end: '这个场景似乎要告一段落了，你想...',
    time_skip: '时间悄然流逝...',
    location_change: '要去其他地方吗？',
    mood_change: '对话的氛围发生了变化...',
    decision_point: `${characterName}在等待你的回应...`,
    activity_change: '接下来要做什么？',
    relationship_moment: '你们之间的关系正在发生变化...',
    revelation: '有些事情正在浮出水面...',
    conflict_peak: '紧张的氛围达到了顶点...',
    resolution: '事情似乎有了转机...',
    flashback: '记忆涌上心头...',
    foreshadowing: '似乎有什么即将发生...',
    cliffhanger: '故事在此停顿...',
    callback: '之前的事情再次被提起...',
    character_growth: '这是一个重要的成长时刻...',
    secret_unlock: '隐藏的秘密被发现了...',
  }
  return descMap[type] || '选择下一步剧情发展'
}

export default memo(ImmersiveMessageEnhancements)
