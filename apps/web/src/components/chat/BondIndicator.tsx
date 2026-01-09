'use client'
/**
 * BondIndicator - 输入框旁的关系等级指示器
 *
 * 特性：
 * - 紧凑显示当前关系等级
 * - 点击展开显示详细信息
 * - 动画反馈关系变化
 */

import { useState, memo } from 'react'
import { Box, Text, Tooltip, Progress, Stack } from '@mantine/core'
import { motion, AnimatePresence } from 'framer-motion'
import { IconHeart, IconSparkles } from '@tabler/icons-react'

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

interface BondIndicatorProps {
  /** 当前羁绊经验值 */
  bondExp?: number
  /** 点击回调 */
  onClick?: () => void
  /** 是否显示详细信息 */
  showDetails?: boolean
  /** 紧凑模式 */
  compact?: boolean
}

function BondIndicator({
  bondExp = 0,
  onClick,
  showDetails = false,
  compact = true,
}: BondIndicatorProps) {
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

  // 紧凑模式 - 只显示图标和等级
  if (compact) {
    return (
      <Tooltip
        label={
          <Stack gap={4}>
            <Text size="xs" fw={600}>{bondLevel.name} (Lv.{bondLevel.level})</Text>
            <Progress
              value={progress}
              size="xs"
              radius="xl"
              color={bondLevel.color}
              style={{ width: 80 }}
            />
            <Text size="xs" c="dimmed">{bondExp.toLocaleString()} EXP</Text>
          </Stack>
        }
        position="top"
        withArrow
      >
        <motion.button
          onClick={onClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '12px',
            background: `${bondLevel.color}20`,
            border: `1px solid ${bondLevel.color}40`,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Text size="sm">{bondLevel.icon}</Text>
          <Text size="xs" fw={600} style={{ color: bondLevel.color }}>
            Lv.{bondLevel.level}
          </Text>
        </motion.button>
      </Tooltip>
    )
  }

  // 详细模式
  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: '12px',
        background: `${bondLevel.color}15`,
        border: `1px solid ${bondLevel.color}30`,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
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
      <div style={{ flex: 1 }}>
        <Text size="xs" c="dimmed">羁绊等级</Text>
        <Text size="sm" fw={600} style={{ color: bondLevel.color }}>
          {bondLevel.name}
        </Text>
      </div>
      <div style={{ textAlign: 'right' }}>
        <Text size="xs" c="dimmed">{progress}%</Text>
        <Box style={{ width: 60 }}>
          <Progress
            value={progress}
            size="xs"
            radius="xl"
            styles={{
              root: { background: 'rgba(255, 255, 255, 0.1)' },
              section: {
                background: `linear-gradient(90deg, ${bondLevel.color}, ${bondLevel.color}dd)`,
              },
            }}
          />
        </Box>
      </div>
    </motion.div>
  )
}

export default memo(BondIndicator)
