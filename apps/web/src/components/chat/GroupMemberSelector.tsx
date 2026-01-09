'use client'
/**
 * GroupMemberSelector - 群聊成员选择器
 *
 * 特性：
 * - 显示可选的群聊成员
 * - 支持勾选/取消选择
 * - 主角色默认选中且不可取消
 * - 显示成员头像和名称
 */

import { memo, useCallback } from 'react'
import { Box, Text, Group, Avatar, Checkbox, Stack, Badge, ActionIcon } from '@mantine/core'
import { motion, AnimatePresence } from 'framer-motion'
import { IconUsers, IconLock, IconQuestionMark, IconX } from '@tabler/icons-react'

interface GroupMember {
  id: string
  name: string
  avatar?: string
  isMainCharacter?: boolean
  isLocked?: boolean
  unlockHint?: string
}

interface GroupMemberSelectorProps {
  /** 主角色 */
  mainCharacter?: GroupMember
  /** NPC列表 */
  npcs?: GroupMember[]
  /** 已选中的成员ID列表 */
  selectedMembers?: string[]
  /** 切换成员选择回调 */
  onToggleMember?: (memberId: string) => void
  /** 全选回调 */
  onSelectAll?: () => void
  /** 取消全选回调 */
  onDeselectAll?: () => void
  /** 确认回调 */
  onConfirm?: () => void
  /** 关闭回调 */
  onClose?: () => void
  /** 是否显示 */
  isOpen?: boolean
}

function GroupMemberSelector({
  mainCharacter,
  npcs = [],
  selectedMembers = [],
  onToggleMember,
  onSelectAll,
  onDeselectAll,
  onConfirm,
  onClose,
  isOpen = true,
}: GroupMemberSelectorProps) {
  // 合并所有成员
  const allMembers = mainCharacter
    ? [{ ...mainCharacter, isMainCharacter: true }, ...npcs]
    : npcs

  // 可选成员（排除主角色和锁定成员）
  const selectableMembers = allMembers.filter(m => !m.isMainCharacter && !m.isLocked)

  // 已选中的可选成员数量
  const selectedCount = selectedMembers.filter(id =>
    selectableMembers.some(m => m.id === id)
  ).length

  // 是否全选
  const isAllSelected = selectedCount === selectableMembers.length

  const handleToggle = useCallback((member: GroupMember) => {
    if (member.isMainCharacter || member.isLocked) return
    onToggleMember?.(member.id)
  }, [onToggleMember])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <Box
          style={{
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px',
            minWidth: 280,
            maxWidth: 360,
          }}
        >
          {/* 头部 */}
          <Group justify="space-between" mb="md">
            <Group gap="xs">
              <IconUsers size={18} style={{ color: '#a78bfa' }} />
              <Text size="sm" fw={600} c="white">群聊成员</Text>
            </Group>
            <Group gap="xs">
              <Badge size="sm" variant="light" color="violet">
                {selectedMembers.length}/{allMembers.length} 人
              </Badge>
              {onClose && (
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={onClose}
                  style={{ color: 'rgba(255, 255, 255, 0.5)' }}
                >
                  <IconX size={14} />
                </ActionIcon>
              )}
            </Group>
          </Group>

          {/* 全选/取消全选 */}
          {selectableMembers.length > 0 && (
            <Group justify="flex-end" mb="sm">
              <Text
                size="xs"
                c="violet"
                style={{ cursor: 'pointer' }}
                onClick={isAllSelected ? onDeselectAll : onSelectAll}
              >
                {isAllSelected ? '取消全选' : '全选'}
              </Text>
            </Group>
          )}

          {/* 成员列表 */}
          <Stack gap="xs">
            {allMembers.map((member, index) => {
              const isSelected = selectedMembers.includes(member.id)
              const isDisabled = member.isMainCharacter || member.isLocked

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Box
                    onClick={() => handleToggle(member)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      background: isSelected
                        ? 'rgba(167, 139, 250, 0.15)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: isSelected
                        ? '1px solid rgba(167, 139, 250, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: isDisabled ? 'default' : 'pointer',
                      opacity: member.isLocked ? 0.5 : 1,
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* 头像 */}
                    <Box style={{ position: 'relative' }}>
                      <Avatar
                        src={member.isLocked ? undefined : member.avatar}
                        size="md"
                        radius="xl"
                        style={{
                          border: member.isMainCharacter
                            ? '2px solid #fbbf24'
                            : isSelected
                            ? '2px solid #a78bfa'
                            : '2px solid rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        {member.isLocked ? (
                          <IconQuestionMark size={18} />
                        ) : (
                          (member.name || '?').charAt(0)
                        )}
                      </Avatar>

                      {/* 主角色标识 */}
                      {member.isMainCharacter && (
                        <Box
                          style={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                          }}
                        >
                          👑
                        </Box>
                      )}

                      {/* 锁定标识 */}
                      {member.isLocked && (
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

                    {/* 名称和状态 */}
                    <div style={{ flex: 1 }}>
                      <Text size="sm" fw={500} c="white">
                        {member.isLocked ? '???' : member.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {member.isMainCharacter
                          ? '主角色 (必选)'
                          : member.isLocked
                          ? member.unlockHint || '需要解锁'
                          : isSelected
                          ? '已加入群聊'
                          : '点击加入'}
                      </Text>
                    </div>

                    {/* 选择框 */}
                    <Checkbox
                      checked={isSelected || member.isMainCharacter}
                      disabled={isDisabled}
                      onChange={() => handleToggle(member)}
                      styles={{
                        input: {
                          cursor: isDisabled ? 'default' : 'pointer',
                          backgroundColor: (isSelected || member.isMainCharacter)
                            ? '#a78bfa'
                            : 'transparent',
                          borderColor: (isSelected || member.isMainCharacter)
                            ? '#a78bfa'
                            : 'rgba(255, 255, 255, 0.3)',
                        },
                      }}
                    />
                  </Box>
                </motion.div>
              )
            })}
          </Stack>

          {/* 确认按钮 */}
          {onConfirm && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              style={{
                width: '100%',
                marginTop: '16px',
                padding: '12px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                border: 'none',
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <IconUsers size={16} />
              确认 ({selectedMembers.length} 人参与)
            </motion.button>
          )}
        </Box>
      </motion.div>
    </AnimatePresence>
  )
}

export default memo(GroupMemberSelector)
