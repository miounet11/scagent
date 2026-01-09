'use client'
/**
 * FloatingRelationCard - 沉浸模式浮动关系卡
 *
 * 特性：
 * - 默认窄卡模式 (48px): 只显示关系等级图标 + 情绪
 * - Hover/点击展开: 显示进度条 + 最近互动摘要
 * - 支持最小化（只显示关系等级 + 图标）
 */

import { useState, useEffect, memo } from 'react'
import { Box, Text, Group, Stack, Progress, Badge, Tooltip, ActionIcon } from '@mantine/core'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconHeart,
  IconHeartFilled,
  IconChevronLeft,
  IconChevronRight,
  IconSparkles,
  IconMoodHappy,
  IconMoodSad,
  IconMoodSmile,
} from '@tabler/icons-react'

// 羁绊等级配置
const BOND_LEVELS = [
  { level: 1, name: '陌生人', minExp: 0, color: '#6b7280', icon: '👤' },
  { level: 2, name: '相识', minExp: 100, color: '#9ca3af', icon: '🤝' },
  { level: 3, name: '朋友', minExp: 300, color: '#60a5fa', icon: '😊' },
  { level: 4, name: '密友', minExp: 600, color: '#a78bfa', icon: '💜' },
  { level: 5, name: '挚友', minExp: 1000, color: '#f472b6', icon: '💖' },
  { level: 6, name: '灵魂伴侣', minExp: 1500, color: '#fb7185', icon: '❤️' },
  { level: 7, name: '命定之人', minExp: 2100, color: '#f43f5e', icon: '💕' },
  { level: 8, name: '永恒', minExp: 2800, color: '#fbbf24', icon: '✨' },
]

// 情绪图标映射
const EMOTION_ICONS: Record<string, { icon: string; color: string }> = {
  happy: { icon: '😊', color: '#fbbf24' },
  love: { icon: '❤️', color: '#f43f5e' },
  shy: { icon: '😳', color: '#f472b6' },
  sad: { icon: '😢', color: '#60a5fa' },
  angry: { icon: '😠', color: '#ef4444' },
  surprised: { icon: '😲', color: '#a78bfa' },
  neutral: { icon: '😐', color: '#9ca3af' },
  excited: { icon: '🤩', color: '#fbbf24' },
  anxious: { icon: '😰', color: '#60a5fa' },
  touched: { icon: '🥹', color: '#f472b6' },
}

interface FloatingRelationCardProps {
  /** 当前羁绊经验值 */
  bondExp?: number
  /** 当前情绪 */
  currentEmotion?: string
  /** 最近互动摘要 */
  recentInteraction?: string
  /** 角色名称 */
  characterName?: string
  /** 是否移动端 */
  isMobile?: boolean
  /** 点击回调 */
  onClick?: () => void
}

function FloatingRelationCard({
  bondExp = 0,
  currentEmotion = 'neutral',
  recentInteraction,
  characterName,
  isMobile = false,
  onClick,
}: FloatingRelationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // 计算当前羁绊等级
  const getCurrentBondLevel = () => {
    for (let i = BOND_LEVELS.length - 1; i >= 0; i--) {
      if (bondExp >= BOND_LEVELS[i].minExp) {
        return BOND_LEVELS[i]
      }
    }
    return BOND_LEVELS[0]
  }

  // 计算下一等级进度
  const getProgress = () => {
    const current = getCurrentBondLevel()
    const currentIndex = BOND_LEVELS.findIndex(l => l.level === current.level)
    const next = BOND_LEVELS[currentIndex + 1]

    if (!next) return 100 // Max level

    const expInLevel = bondExp - current.minExp
    const expNeeded = next.minExp - current.minExp
    return Math.min(100, Math.round((expInLevel / expNeeded) * 100))
  }

  const bondLevel = getCurrentBondLevel()
  const progress = getProgress()
  const emotionData = EMOTION_ICONS[currentEmotion] || EMOTION_ICONS.neutral

  // 自动展开/收起
  const shouldExpand = isHovered || isExpanded

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      onClick={() => isMobile && setIsExpanded(!isExpanded)}
      style={{
        position: 'fixed',
        right: 16,
        top: isMobile ? 100 : 180,
        zIndex: 100,
        cursor: 'pointer',
      }}
    >
      <AnimatePresence mode="wait">
        {shouldExpand ? (
          // 展开模式
          <motion.div
            key="expanded"
            initial={{ width: 48, opacity: 0.8 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 48, opacity: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Box
              style={{
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              }}
            >
              <Stack gap="sm">
                {/* 头部 - 等级和情绪 */}
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="xs">
                    <Text size="lg">{bondLevel.icon}</Text>
                    <div>
                      <Text size="xs" c="dimmed">羁绊等级</Text>
                      <Text size="sm" fw={600} style={{ color: bondLevel.color }}>
                        {bondLevel.name}
                      </Text>
                    </div>
                  </Group>
                  <Tooltip label={currentEmotion}>
                    <Text size="xl">{emotionData.icon}</Text>
                  </Tooltip>
                </Group>

                {/* 进度条 */}
                <Box>
                  <Group justify="space-between" mb={4}>
                    <Text size="xs" c="dimmed">进度</Text>
                    <Text size="xs" fw={500} style={{ color: bondLevel.color }}>
                      {progress}%
                    </Text>
                  </Group>
                  <Progress
                    value={progress}
                    size="sm"
                    radius="xl"
                    styles={{
                      root: { background: 'rgba(255, 255, 255, 0.1)' },
                      section: {
                        background: `linear-gradient(90deg, ${bondLevel.color}, ${bondLevel.color}dd)`,
                      },
                    }}
                  />
                </Box>

                {/* 最近互动摘要 */}
                {recentInteraction && (
                  <Box
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      padding: '8px 10px',
                    }}
                  >
                    <Text size="xs" c="dimmed" mb={2}>最近互动</Text>
                    <Text size="xs" lineClamp={2} style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {recentInteraction}
                    </Text>
                  </Box>
                )}

                {/* 经验值 */}
                <Group justify="center" gap="xs">
                  <IconSparkles size={14} style={{ color: bondLevel.color }} />
                  <Text size="xs" c="dimmed">
                    {bondExp.toLocaleString()} EXP
                  </Text>
                </Group>
              </Stack>
            </Box>
          </motion.div>
        ) : (
          // 窄卡模式
          <motion.div
            key="collapsed"
            initial={{ width: 220, opacity: 1 }}
            animate={{ width: 48, opacity: 1 }}
            exit={{ width: 220, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Box
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(12px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '8px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {/* 羁绊等级图标 */}
              <Tooltip label={`${bondLevel.name} (Lv.${bondLevel.level})`} position="left">
                <Box
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${bondLevel.color}40, ${bondLevel.color}20)`,
                    border: `2px solid ${bondLevel.color}60`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text size="md">{bondLevel.icon}</Text>
                </Box>
              </Tooltip>

              {/* 当前情绪图标 */}
              <Tooltip label={currentEmotion} position="left">
                <Box
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: `${emotionData.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text size="sm">{emotionData.icon}</Text>
                </Box>
              </Tooltip>

              {/* 展开提示 */}
              <IconChevronLeft
                size={14}
                style={{
                  color: 'rgba(255, 255, 255, 0.4)',
                  marginTop: 4,
                }}
              />
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default memo(FloatingRelationCard)
