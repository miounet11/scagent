'use client'

/**
 * ContextAwareQuickActions v2.0 - Redesigned Layout
 *
 * 重新设计的快捷动作面板：
 * - 分类标签页切换
 * - 紧凑的药丸按钮设计
 * - 移动端友好的水平滚动
 * - AI智能推荐标记
 */

import { memo, useMemo, useState, useEffect, useRef } from 'react'
import { Group, Button, Tooltip, Box, Text, Loader, Badge, ScrollArea, SegmentedControl, Stack } from '@mantine/core'
import { IconDots, IconSparkles, IconHeart, IconMoodSmile, IconMessageCircle } from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'

// ==================== Types ====================

export type QuickActionCategory = 'intimate' | 'expression' | 'verbal'

export interface QuickAction {
  id: string
  label: string
  emoji: string
  category: QuickActionCategory
  keywords: string[]
}

export interface Message {
  role: string
  content: string
}

interface ContextAwareQuickActionsProps {
  messages: Message[]
  onActionSelect: (action: QuickAction) => void
  onOpenRadialMenu: () => void
  disabled?: boolean
  maxActions?: number
  showCategories?: boolean
  /** Skip updates during streaming */
  isStreaming?: boolean
}

// ==================== Quick Actions Database ====================

const QUICK_ACTIONS: QuickAction[] = [
  // 亲密动作 (Intimate)
  { id: 'hug', label: '拥抱', emoji: '🤗', category: 'intimate', keywords: ['温柔', '爱', '喜欢', '心动', '安慰', '想念', '难过', '哭'] },
  { id: 'hold_hand', label: '牵手', emoji: '🤝', category: 'intimate', keywords: ['温柔', '爱', '喜欢', '心动', '一起', '陪伴'] },
  { id: 'kiss', label: '亲吻', emoji: '💋', category: 'intimate', keywords: ['爱', '喜欢', '心动', '想你', '深情'] },
  { id: 'pat_head', label: '摸头', emoji: '✋', category: 'intimate', keywords: ['温柔', '安慰', '可爱', '乖', '害羞'] },
  { id: 'caress_face', label: '抚脸', emoji: '🤚', category: 'intimate', keywords: ['温柔', '爱', '深情', '凝视', '近距离'] },
  { id: 'approach', label: '靠近', emoji: '🫂', category: 'intimate', keywords: ['接近', '温暖', '安全', '陪伴', '距离'] },
  { id: 'back_hug', label: '背后抱', emoji: '💕', category: 'intimate', keywords: ['温柔', '惊喜', '亲密', '保护', '依赖'] },
  { id: 'gaze', label: '凝视', emoji: '👀', category: 'intimate', keywords: ['认真', '深情', '专注', '观察', '注视'] },

  // 表情动作 (Expression)
  { id: 'smile', label: '微笑', emoji: '😊', category: 'expression', keywords: ['开心', '高兴', '快乐', '愉快', '满意'] },
  { id: 'sigh', label: '叹息', emoji: '😔', category: 'expression', keywords: ['难过', '无奈', '疲惫', '失望', '复杂'] },
  { id: 'blush', label: '脸红', emoji: '😳', category: 'expression', keywords: ['害羞', '尴尬', '紧张', '心动', '表白'] },
  { id: 'wink', label: '眨眼', emoji: '😉', category: 'expression', keywords: ['调皮', '暗示', '有趣', '俏皮', '默契'] },
  { id: 'pout', label: '撅嘴', emoji: '😤', category: 'expression', keywords: ['生气', '不满', '委屈', '可爱', '撒娇'] },
  { id: 'whisper', label: '耳语', emoji: '🔉', category: 'expression', keywords: ['秘密', '悄悄', '轻声', '亲密', '靠近'] },
  { id: 'tease', label: '调侃', emoji: '😏', category: 'expression', keywords: ['有趣', '开玩笑', '逗', '玩', '好笑'] },
  { id: 'comfort_expr', label: '安慰', emoji: '💗', category: 'expression', keywords: ['难过', '担心', '害怕', '哭', '伤心'] },

  // 语言互动 (Verbal)
  { id: 'praise', label: '夸奖', emoji: '🌟', category: 'verbal', keywords: ['厉害', '棒', '优秀', '成功', '做到了', '好'] },
  { id: 'ask', label: '询问', emoji: '❓', category: 'verbal', keywords: ['问题', '疑问', '好奇', '不明白', '为什么', '怎么'] },
  { id: 'apologize', label: '道歉', emoji: '🙏', category: 'verbal', keywords: ['对不起', '抱歉', '错了', '不好意思', '愧疚'] },
  { id: 'thank', label: '感谢', emoji: '💝', category: 'verbal', keywords: ['谢谢', '感谢', '辛苦', '帮助', '帮忙'] },
  { id: 'encourage', label: '鼓励', emoji: '💪', category: 'verbal', keywords: ['加油', '努力', '坚持', '相信', '可以的'] },
  { id: 'explain', label: '解释', emoji: '💬', category: 'verbal', keywords: ['因为', '所以', '原因', '说明', '不明白'] },
  { id: 'agree', label: '同意', emoji: '👍', category: 'verbal', keywords: ['好的', '可以', '没问题', '嗯', '对'] },
  { id: 'refuse', label: '拒绝', emoji: '🙅', category: 'verbal', keywords: ['不', '不行', '不要', '拒绝', '不可以'] },
]

// Category metadata
const CATEGORY_META = {
  intimate: {
    label: '亲密',
    icon: IconHeart,
    color: 'rgba(236, 72, 153, 0.6)', // Rose/Pink
    bgColor: 'rgba(236, 72, 153, 0.1)',
  },
  expression: {
    label: '表情',
    icon: IconMoodSmile,
    color: 'rgba(251, 191, 36, 0.8)', // Gold/Yellow
    bgColor: 'rgba(251, 191, 36, 0.1)',
  },
  verbal: {
    label: '语言',
    icon: IconMessageCircle,
    color: 'rgba(96, 165, 250, 0.8)', // Blue
    bgColor: 'rgba(96, 165, 250, 0.1)',
  },
}

// Theater Soul color palette
const theaterColors = {
  spotlightGold: '#f5c542',
  spotlightGoldDim: 'rgba(245, 197, 66, 0.3)',
  moonlight: 'rgba(196, 181, 253, 0.6)',
  emotionRose: 'rgba(232, 72, 106, 0.6)',
  voidDark: 'rgba(26, 20, 41, 0.95)',
  glassBorder: 'rgba(245, 197, 66, 0.15)',
  glassBackground: 'rgba(26, 20, 41, 0.85)',
}

// ==================== AI Recommendation Engine ====================

class AIRecommendationEngine {
  private actions: QuickAction[]

  constructor(actions: QuickAction[]) {
    this.actions = actions
  }

  recommend(messages: Message[], maxResults: number = 6): QuickAction[] {
    if (!messages || messages.length === 0) {
      return this.getDefaultActions(maxResults)
    }

    const recentMessages = messages.slice(-3)
    const combinedText = recentMessages.map(m => m.content).join(' ').toLowerCase()

    const scoredActions = this.actions.map(action => {
      let score = 0
      action.keywords.forEach(keyword => {
        const matches = (combinedText.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length
        score += matches
      })

      if (recentMessages.length > 0) {
        const lastMessage = recentMessages[recentMessages.length - 1].content.toLowerCase()
        action.keywords.forEach(keyword => {
          if (lastMessage.includes(keyword.toLowerCase())) {
            score += 0.5
          }
        })
      }

      return { action, score }
    })

    scoredActions.sort((a, b) => b.score - a.score)

    const topActions = scoredActions
      .filter(item => item.score > 0)
      .slice(0, maxResults)
      .map(item => item.action)

    if (topActions.length === 0) {
      return this.getDefaultActions(maxResults)
    }

    return topActions.slice(0, maxResults)
  }

  getRecommendedIds(messages: Message[]): Set<string> {
    const recommended = this.recommend(messages, 6)
    return new Set(recommended.map(a => a.id))
  }

  private getDefaultActions(count: number): QuickAction[] {
    const categories: QuickActionCategory[] = ['intimate', 'expression', 'verbal']
    const defaults: QuickAction[] = []
    categories.forEach(category => {
      const categoryActions = this.actions.filter(a => a.category === category).slice(0, 2)
      defaults.push(...categoryActions)
    })
    return defaults.slice(0, count)
  }
}

// ==================== Main Component ====================

function ContextAwareQuickActions({
  messages,
  onActionSelect,
  onOpenRadialMenu,
  disabled = false,
  maxActions = 6,
  isStreaming = false,
}: ContextAwareQuickActionsProps) {
  const [activeCategory, setActiveCategory] = useState<QuickActionCategory | 'recommended'>('recommended')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [recommendedIds, setRecommendedIds] = useState<Set<string>>(new Set())

  // 🎭 v2.3: Track stable message signature to prevent flickering during streaming
  const lastAnalyzedSignatureRef = useRef<string>('')
  const isInitialLoadRef = useRef(true)
  // 🎭 v2.3: Track last update time to implement 5-second debounce
  const lastUpdateTimeRef = useRef<number>(0)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const engine = useMemo(() => new AIRecommendationEngine(QUICK_ACTIONS), [])

  // 🎭 v2.3: Create a TRULY stable signature based only on message count and role
  // This signature should ONLY change when a message is fully complete (new message added)
  const messageSignature = useMemo(() => {
    const count = messages?.length || 0
    const lastRole = messages?.[messages.length - 1]?.role || ''
    // Only use count and role - content changes during streaming shouldn't trigger updates
    return `${count}-${lastRole}`
  }, [messages])

  // 🎭 v2.3: Analyze messages with 5-second debounce and streaming check
  useEffect(() => {
    // Skip updates during streaming
    if (isStreaming) {
      return
    }

    // Skip if signature hasn't changed
    if (messageSignature === lastAnalyzedSignatureRef.current) {
      return
    }

    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // For initial load, use shorter delay
    if (isInitialLoadRef.current) {
      setIsAnalyzing(true)
      debounceTimerRef.current = setTimeout(() => {
        const ids = engine.getRecommendedIds(messages)
        setRecommendedIds(ids)
        setIsAnalyzing(false)
        lastAnalyzedSignatureRef.current = messageSignature
        isInitialLoadRef.current = false
        lastUpdateTimeRef.current = Date.now()
      }, 300)
      return
    }

    // 🎭 v2.3: Use 5-second debounce for updates after initial load
    // This prevents flickering during typing or rapid interactions
    debounceTimerRef.current = setTimeout(() => {
      const ids = engine.getRecommendedIds(messages)
      setRecommendedIds(ids)
      lastAnalyzedSignatureRef.current = messageSignature
      lastUpdateTimeRef.current = Date.now()
    }, 5000)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [messageSignature, messages, engine, isStreaming])

  // Get actions to display based on active category
  // 🎭 v2.1: Use messageSignature for stability, not raw messages
  const displayActions = useMemo(() => {
    if (activeCategory === 'recommended') {
      return engine.recommend(messages, 8)
    }
    return QUICK_ACTIONS.filter(a => a.category === activeCategory)
  }, [activeCategory, messageSignature, engine]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleActionClick = (action: QuickAction) => {
    if (!disabled) {
      onActionSelect(action)
    }
  }

  return (
    <Box>
      {/* Category Tabs */}
      <Group gap="xs" mb="xs" wrap="nowrap">
        <ScrollArea type="never" offsetScrollbars={false} style={{ flex: 1 }}>
          <Group gap={4} wrap="nowrap">
            {/* AI Recommended Tab */}
            <Button
              variant={activeCategory === 'recommended' ? 'filled' : 'subtle'}
              size="compact-xs"
              onClick={() => setActiveCategory('recommended')}
              leftSection={<IconSparkles size={12} />}
              styles={{
                root: {
                  background: activeCategory === 'recommended'
                    ? theaterColors.spotlightGold
                    : 'transparent',
                  color: activeCategory === 'recommended' ? '#1a1429' : theaterColors.spotlightGold,
                  border: `1px solid ${theaterColors.spotlightGoldDim}`,
                  fontSize: '11px',
                  height: '24px',
                  padding: '0 8px',
                  flexShrink: 0,
                  '&:hover': {
                    background: activeCategory === 'recommended'
                      ? theaterColors.spotlightGold
                      : theaterColors.spotlightGoldDim,
                  },
                },
              }}
            >
              推荐
            </Button>

            {/* Category Tabs */}
            {(['intimate', 'expression', 'verbal'] as QuickActionCategory[]).map((cat) => {
              const meta = CATEGORY_META[cat]
              const isActive = activeCategory === cat
              return (
                <Button
                  key={cat}
                  variant={isActive ? 'filled' : 'subtle'}
                  size="compact-xs"
                  onClick={() => setActiveCategory(cat)}
                  styles={{
                    root: {
                      background: isActive ? meta.color : 'transparent',
                      color: isActive ? '#fff' : meta.color,
                      border: `1px solid ${meta.color}`,
                      fontSize: '11px',
                      height: '24px',
                      padding: '0 8px',
                      flexShrink: 0,
                      '&:hover': {
                        background: isActive ? meta.color : meta.bgColor,
                      },
                    },
                  }}
                >
                  {meta.label}
                </Button>
              )
            })}
          </Group>
        </ScrollArea>

        {/* More Button */}
        <Tooltip label="全部动作" position="top">
          <Button
            variant="subtle"
            size="compact-xs"
            onClick={onOpenRadialMenu}
            disabled={disabled}
            styles={{
              root: {
                background: theaterColors.glassBackground,
                border: `1px solid ${theaterColors.glassBorder}`,
                color: theaterColors.spotlightGold,
                height: '24px',
                padding: '0 6px',
                minWidth: 'auto',
                flexShrink: 0,
              },
            }}
          >
            <IconDots size={14} />
          </Button>
        </Tooltip>
      </Group>

      {/* Actions Grid */}
      {/* 🎭 v2.1: Removed AnimatePresence mode="wait" to prevent flickering */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.8 }}
          transition={{ duration: 0.1 }}
        >
          <ScrollArea type="hover" offsetScrollbars={false} scrollbarSize={4}>
            <Group gap={6} wrap="wrap" style={{ minHeight: '32px' }}>
              {isAnalyzing && activeCategory === 'recommended' ? (
                <Group gap="xs" justify="center" style={{ width: '100%', padding: '4px 0' }}>
                  <Loader size="xs" color={theaterColors.spotlightGold} />
                  <Text size="xs" c="dimmed">分析中...</Text>
                </Group>
              ) : (
                displayActions.map((action, index) => {
                  const isRecommended = recommendedIds.has(action.id)
                  const categoryMeta = CATEGORY_META[action.category]

                  return (
                    <motion.div
                      key={action.id}
                      initial={false}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.1 }}
                      layout="position"
                    >
                      <Tooltip
                        label={
                          isRecommended && activeCategory !== 'recommended'
                            ? `${action.label} ✨ AI推荐`
                            : action.label
                        }
                        position="top"
                        withArrow
                      >
                        <Button
                          variant="light"
                          size="compact-xs"
                          onClick={() => handleActionClick(action)}
                          disabled={disabled}
                          styles={{
                            root: {
                              background: theaterColors.glassBackground,
                              border: `1px solid ${
                                isRecommended && activeCategory !== 'recommended'
                                  ? theaterColors.spotlightGold
                                  : categoryMeta.color
                              }`,
                              backdropFilter: 'blur(8px)',
                              color: '#fff',
                              fontSize: '12px',
                              height: '28px',
                              padding: '0 10px',
                              transition: 'all 0.15s ease',
                              position: 'relative',
                              '&:hover': {
                                background: 'rgba(255, 255, 255, 0.1)',
                                transform: 'translateY(-1px)',
                                boxShadow: `0 2px 8px ${categoryMeta.color}`,
                              },
                              '&:disabled': {
                                opacity: 0.4,
                              },
                            },
                          }}
                        >
                          <Group gap={4} wrap="nowrap">
                            <Text size="sm" style={{ lineHeight: 1 }}>{action.emoji}</Text>
                            <Text size="xs" fw={500}>{action.label}</Text>
                            {isRecommended && activeCategory !== 'recommended' && (
                              <IconSparkles size={10} color={theaterColors.spotlightGold} />
                            )}
                          </Group>
                        </Button>
                      </Tooltip>
                    </motion.div>
                  )
                })
              )}
            </Group>
          </ScrollArea>
        </motion.div>
      </AnimatePresence>
    </Box>
  )
}

// ==================== Exports ====================

export default memo(ContextAwareQuickActions)

export { AIRecommendationEngine, QUICK_ACTIONS, CATEGORY_META }
