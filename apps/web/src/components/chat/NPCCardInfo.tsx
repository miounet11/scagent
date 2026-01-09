'use client'
/**
 * NPCCardInfo - NPC角色卡信息展示组件
 *
 * 特性：
 * - 显示NPC信息（头像、名称、描述）
 * - 显示创建者和统计信息
 * - 支持隐藏/锁定状态展示
 * - 解锁进度条
 */

import { memo } from 'react'
import { Box, Text, Group, Avatar, Stack, Badge, Progress, Tooltip } from '@mantine/core'
import { motion } from 'framer-motion'
import {
  IconLock,
  IconUsers,
  IconMessage,
  IconQuestionMark,
  IconSparkles,
  IconPlus,
} from '@tabler/icons-react'

interface NPCCardInfoProps {
  /** NPC ID */
  id: string
  /** NPC名称 */
  name: string
  /** NPC描述 */
  description?: string
  /** NPC头像 */
  avatar?: string | null
  /** 是否已解锁 */
  isUnlocked?: boolean
  /** 可见性 */
  visibility?: 'PUBLIC' | 'HIDDEN' | 'LOCKED'
  /** 解锁进度 (0-100) */
  unlockProgress?: number
  /** 解锁进度描述 */
  unlockProgressDescription?: string
  /** 创建者名称 */
  creatorName?: string
  /** 创建日期 */
  createdAt?: string
  /** 使用人数 */
  userCount?: number
  /** 对话次数 */
  chatCount?: number
  /** 点击回调 */
  onClick?: () => void
  /** 添加回调 */
  onAdd?: () => void
  /** 紧凑模式 */
  compact?: boolean
}

function NPCCardInfo({
  id,
  name,
  description,
  avatar,
  isUnlocked = true,
  visibility = 'PUBLIC',
  unlockProgress = 0,
  unlockProgressDescription,
  creatorName,
  createdAt,
  userCount = 0,
  chatCount = 0,
  onClick,
  onAdd,
  compact = false,
}: NPCCardInfoProps) {
  const isHidden = visibility === 'HIDDEN' || visibility === 'LOCKED'
  const showLockOverlay = isHidden && !isUnlocked

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // 计算创建天数
  const getDaysAgo = (dateString?: string) => {
    if (!dateString) return 0
    const date = new Date(dateString)
    const now = new Date()
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  }

  if (compact) {
    return (
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Box
          onClick={onClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 12px',
            borderRadius: '10px',
            background: showLockOverlay
              ? 'rgba(255, 255, 255, 0.03)'
              : 'rgba(255, 255, 255, 0.05)',
            border: showLockOverlay
              ? '1px dashed rgba(255, 255, 255, 0.15)'
              : '1px solid rgba(255, 255, 255, 0.08)',
            cursor: onClick ? 'pointer' : 'default',
            opacity: showLockOverlay ? 0.7 : 1,
          }}
        >
          <Box style={{ position: 'relative' }}>
            <Avatar
              src={showLockOverlay ? undefined : avatar}
              size="md"
              radius="xl"
              style={{ filter: showLockOverlay ? 'grayscale(1)' : 'none' }}
            >
              {showLockOverlay ? <IconQuestionMark size={18} /> : (name || '?').charAt(0)}
            </Avatar>
            {showLockOverlay && (
              <Box
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconLock size={10} color="#9ca3af" />
              </Box>
            )}
          </Box>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text size="sm" fw={500} c="white" truncate>
              {showLockOverlay ? '???' : name}
            </Text>
            {showLockOverlay && unlockProgressDescription && (
              <Text size="xs" c="dimmed" truncate>
                {unlockProgressDescription}
              </Text>
            )}
          </div>
          {onAdd && isUnlocked && (
            <Tooltip label="添加到群聊">
              <Box
                onClick={(e) => {
                  e.stopPropagation()
                  onAdd()
                }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(167, 139, 250, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <IconPlus size={14} color="#a78bfa" />
              </Box>
            </Tooltip>
          )}
        </Box>
      </motion.div>
    )
  }

  // 完整版本
  return (
    <motion.div whileHover={{ y: -2 }}>
      <Box
        onClick={onClick}
        style={{
          padding: '16px',
          borderRadius: '14px',
          background: showLockOverlay
            ? 'rgba(255, 255, 255, 0.02)'
            : 'rgba(255, 255, 255, 0.05)',
          border: showLockOverlay
            ? '1px dashed rgba(255, 255, 255, 0.15)'
            : '1px solid rgba(255, 255, 255, 0.1)',
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
        <Group align="flex-start" gap="md">
          {/* 头像 */}
          <Box style={{ position: 'relative' }}>
            <Avatar
              src={showLockOverlay ? undefined : avatar}
              size="lg"
              radius="xl"
              style={{
                filter: showLockOverlay ? 'grayscale(1) blur(2px)' : 'none',
              }}
            >
              {showLockOverlay ? <IconQuestionMark size={24} /> : (name || '?').charAt(0)}
            </Avatar>
            {showLockOverlay && (
              <Box
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: '50%',
                }}
              >
                <IconLock size={20} color="#fff" />
              </Box>
            )}
          </Box>

          {/* 信息 */}
          <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
            <Group justify="space-between" wrap="nowrap">
              <Text size="md" fw={600} c="white">
                {showLockOverlay ? '??? (隐藏角色)' : name}
              </Text>
              {visibility !== 'PUBLIC' && (
                <Badge
                  size="xs"
                  variant="light"
                  color={isUnlocked ? 'green' : 'gray'}
                  leftSection={isUnlocked ? <IconSparkles size={10} /> : <IconLock size={10} />}
                >
                  {isUnlocked ? '已解锁' : '未解锁'}
                </Badge>
              )}
            </Group>

            {/* 解锁进度（未解锁时显示） */}
            {showLockOverlay && (
              <Box
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                }}
              >
                <Group justify="space-between" mb={4}>
                  <Text size="xs" c="dimmed">解锁进度</Text>
                  <Text size="xs" c="dimmed">{unlockProgress}%</Text>
                </Group>
                <Progress
                  value={unlockProgress}
                  size="sm"
                  radius="xl"
                  color="violet"
                  styles={{
                    root: { background: 'rgba(255, 255, 255, 0.1)' },
                  }}
                />
                {unlockProgressDescription && (
                  <Text size="xs" c="dimmed" mt={6}>
                    {unlockProgressDescription}
                  </Text>
                )}
              </Box>
            )}

            {/* 描述（已解锁时显示） */}
            {!showLockOverlay && description && (
              <Text size="xs" c="dimmed" lineClamp={2}>
                {description}
              </Text>
            )}

            {/* 创建者信息 */}
            {!showLockOverlay && creatorName && (
              <Box
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <Text size="xs" c="dimmed">
                  由 @{creatorName} 于 {formatDate(createdAt)} 首次触发创建
                </Text>
                {createdAt && (
                  <Text size="xs" c="dimmed">
                    已创建 {getDaysAgo(createdAt)} 天
                  </Text>
                )}
              </Box>
            )}

            {/* 统计信息 */}
            {!showLockOverlay && (
              <Group gap="md">
                <Group gap={4}>
                  <IconUsers size={12} style={{ color: '#9ca3af' }} />
                  <Text size="xs" c="dimmed">
                    {userCount.toLocaleString()} 人使用
                  </Text>
                </Group>
                <Group gap={4}>
                  <IconMessage size={12} style={{ color: '#9ca3af' }} />
                  <Text size="xs" c="dimmed">
                    {chatCount.toLocaleString()} 次对话
                  </Text>
                </Group>
              </Group>
            )}
          </Stack>

          {/* 添加按钮 */}
          {onAdd && isUnlocked && (
            <Tooltip label="添加到群聊">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation()
                  onAdd()
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <IconPlus size={18} color="white" />
              </motion.button>
            </Tooltip>
          )}
        </Group>
      </Box>
    </motion.div>
  )
}

export default memo(NPCCardInfo)
