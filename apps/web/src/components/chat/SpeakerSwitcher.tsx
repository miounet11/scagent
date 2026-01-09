'use client'
/**
 * SpeakerSwitcher - 说话者选择器（多选模式）
 *
 * v29 重新设计：
 * - 支持多选：点击头像勾选/取消参与者
 * - 自动群聊：选择 > 1 个角色时自动群聊
 * - 单选模式：只选择 1 个角色时单独对话
 * - 主角色默认选中，但可以取消（和NPC单独聊）
 * - 最少选择 1 个参与者
 */

import { memo, useCallback, useMemo } from 'react'
import { Box, Text, Group, Avatar, Tooltip, Badge, ScrollArea } from '@mantine/core'
import { motion, AnimatePresence } from 'framer-motion'
import { IconUsers, IconCheck, IconLock, IconQuestionMark, IconUser } from '@tabler/icons-react'

interface Speaker {
  id: string
  name: string
  avatar?: string
  isMainCharacter?: boolean
  isLocked?: boolean
  unlockHint?: string
}

interface SpeakerSwitcherProps {
  /** 主角色 */
  mainCharacter?: Speaker
  /** NPC列表 */
  npcs?: Speaker[]
  /** 当前选中的说话者ID列表（支持多选） */
  selectedSpeakerIds?: string[]
  /** 切换说话者选择回调 */
  onSelectionChange?: (speakerIds: string[]) => void
  /** 紧凑模式 */
  compact?: boolean
}

function SpeakerSwitcher({
  mainCharacter,
  npcs = [],
  selectedSpeakerIds = [],
  onSelectionChange,
  compact = false,
}: SpeakerSwitcherProps) {
  // 合并所有说话者，过滤掉无效的说话者
  const allSpeakers = useMemo(() => {
    const speakers = mainCharacter
      ? [{ ...mainCharacter, isMainCharacter: true }, ...npcs]
      : npcs
    return speakers.filter(speaker => speaker && speaker.id && speaker.name && speaker.name.trim())
  }, [mainCharacter, npcs])

  // 计算当前模式
  const isGroupMode = selectedSpeakerIds.length > 1
  const selectedCount = selectedSpeakerIds.length

  // 处理说话者点击（切换选中状态）
  const handleSpeakerClick = useCallback((speaker: Speaker) => {
    if (speaker.isLocked) return

    const isSelected = selectedSpeakerIds.includes(speaker.id)

    if (isSelected) {
      // 取消选择 - 但至少保留1个
      if (selectedSpeakerIds.length > 1) {
        onSelectionChange?.(selectedSpeakerIds.filter(id => id !== speaker.id))
      }
      // 如果只剩1个，不能取消（可以切换到其他角色）
    } else {
      // 添加选择
      onSelectionChange?.([...selectedSpeakerIds, speaker.id])
    }
  }, [selectedSpeakerIds, onSelectionChange])

  // 处理单独选择一个角色（排他性选择）
  const handleExclusiveSelect = useCallback((speaker: Speaker) => {
    if (speaker.isLocked) return
    onSelectionChange?.([speaker.id])
  }, [onSelectionChange])

  if (allSpeakers.length === 0) return null

  return (
    <Box
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(8px)',
        borderRadius: compact ? '8px' : '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: compact ? '6px 8px' : '8px 12px',
      }}
    >
      <ScrollArea scrollbarSize={4} type="never">
        <Group gap={compact ? 'xs' : 'sm'} wrap="nowrap" align="center">
          {/* 模式指示器 */}
          <Tooltip
            label={isGroupMode ? `${selectedCount}人群聊` : '单人对话'}
            position="bottom"
          >
            <Box
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: compact ? 28 : 36,
                height: compact ? 28 : 36,
                borderRadius: '50%',
                background: isGroupMode
                  ? 'rgba(167, 139, 250, 0.2)'
                  : 'rgba(255, 255, 255, 0.1)',
                border: isGroupMode
                  ? '2px solid #a78bfa'
                  : '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {isGroupMode ? (
                <IconUsers size={compact ? 14 : 18} style={{ color: '#a78bfa' }} />
              ) : (
                <IconUser size={compact ? 14 : 18} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
              )}
            </Box>
          </Tooltip>

          {/* 分隔线 */}
          <Box
            style={{
              width: 1,
              height: compact ? 20 : 28,
              background: 'rgba(255, 255, 255, 0.15)',
            }}
          />

          {/* 说话者头像列表 */}
          <AnimatePresence mode="popLayout">
            {allSpeakers.map((speaker, index) => {
              const isSelected = selectedSpeakerIds.includes(speaker.id)
              const isDisabled = speaker.isLocked
              const isOnlySelected = isSelected && selectedSpeakerIds.length === 1

              return (
                <motion.div
                  key={speaker.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Tooltip
                    label={
                      isDisabled
                        ? speaker.unlockHint || '需要解锁'
                        : isOnlySelected
                          ? `正在和${speaker.name}对话`
                          : isSelected
                            ? `点击取消${speaker.name}的参与`
                            : `点击添加${speaker.name}参与`
                    }
                    position="bottom"
                  >
                    <motion.button
                      onClick={() => handleSpeakerClick(speaker)}
                      onDoubleClick={() => handleExclusiveSelect(speaker)}
                      whileHover={!isDisabled ? { scale: 1.1, y: -2 } : {}}
                      whileTap={!isDisabled ? { scale: 0.95 } : {}}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        padding: compact ? '4px' : '6px',
                        borderRadius: '12px',
                        background: isSelected
                          ? speaker.isMainCharacter
                            ? 'rgba(251, 191, 36, 0.15)'
                            : 'rgba(167, 139, 250, 0.15)'
                          : 'transparent',
                        border: isSelected
                          ? speaker.isMainCharacter
                            ? '2px solid rgba(251, 191, 36, 0.5)'
                            : '2px solid rgba(167, 139, 250, 0.5)'
                          : '2px solid transparent',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        opacity: isDisabled ? 0.4 : isSelected ? 1 : 0.7,
                        transition: 'all 0.2s',
                      }}
                    >
                      {/* 头像 */}
                      <Box style={{ position: 'relative' }}>
                        <Avatar
                          src={speaker.avatar}
                          size={compact ? 'sm' : 'md'}
                          radius="xl"
                          style={{
                            border: speaker.isMainCharacter
                              ? '2px solid #fbbf24'
                              : isSelected
                                ? '2px solid #a78bfa'
                                : '2px solid rgba(255, 255, 255, 0.2)',
                            filter: isDisabled ? 'grayscale(1)' : 'none',
                          }}
                        >
                          {isDisabled ? (
                            <IconQuestionMark size={16} />
                          ) : (
                            (speaker.name || '?').charAt(0)
                          )}
                        </Avatar>

                        {/* 主角色标识 */}
                        {speaker.isMainCharacter && !compact && (
                          <Box
                            style={{
                              position: 'absolute',
                              top: -4,
                              right: -4,
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                            }}
                          >
                            👑
                          </Box>
                        )}

                        {/* 锁定标识 */}
                        {isDisabled && (
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

                        {/* 选中勾选标识 */}
                        {isSelected && !isDisabled && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            style={{
                              position: 'absolute',
                              bottom: -2,
                              right: -2,
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: speaker.isMainCharacter ? '#fbbf24' : '#a78bfa',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                            }}
                          >
                            <IconCheck size={10} color="white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </Box>

                      {/* 名称 */}
                      {!compact && (
                        <Text
                          size="xs"
                          c={isSelected ? (speaker.isMainCharacter ? 'yellow' : 'violet') : 'dimmed'}
                          fw={isSelected ? 600 : 400}
                          lineClamp={1}
                          style={{
                            maxWidth: 60,
                            textAlign: 'center',
                          }}
                        >
                          {isDisabled ? '???' : speaker.name}
                        </Text>
                      )}
                    </motion.button>
                  </Tooltip>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </Group>
      </ScrollArea>

      {/* 模式提示 */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
      >
        <Box
          style={{
            marginTop: 8,
            padding: '6px 10px',
            borderRadius: 8,
            background: isGroupMode
              ? 'rgba(167, 139, 250, 0.15)'
              : 'rgba(255, 255, 255, 0.05)',
            border: isGroupMode
              ? '1px solid rgba(167, 139, 250, 0.3)'
              : '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Group gap="xs" justify="center">
            {isGroupMode ? (
              <>
                <IconUsers size={14} style={{ color: '#a78bfa' }} />
                <Text size="xs" c="violet">
                  群聊模式 - {selectedCount}人参与对话
                </Text>
              </>
            ) : (
              <>
                <IconUser size={14} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                <Text size="xs" c="dimmed">
                  单击切换参与者 · 双击单独对话
                </Text>
              </>
            )}
          </Group>
        </Box>
      </motion.div>
    </Box>
  )
}

export default memo(SpeakerSwitcher)
