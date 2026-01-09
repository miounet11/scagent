/**
 * NPC 激活通知组件
 *
 * 在 AI 回复完成后显示待激活的 NPC
 * 用户可以确认或取消 NPC 的出场
 */

import { useState } from 'react'
import {
  Box,
  Group,
  Stack,
  Text,
  Avatar,
  Button,
  Badge,
  Paper,
  Collapse,
  ActionIcon,
  Tooltip,
} from '@mantine/core'
import {
  IconUsers,
  IconCheck,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconSparkles,
} from '@tabler/icons-react'
import type { NPCActivation } from '@/lib/npc/types'

interface NPCActivationNotificationProps {
  /** 待激活的 NPC 列表 */
  activations: NPCActivation[]
  /** 确认激活回调 */
  onConfirm: (activation: NPCActivation) => void
  /** 取消激活回调 */
  onDismiss: (npcId: string) => void
  /** 确认全部 */
  onConfirmAll?: () => void
  /** 取消全部 */
  onDismissAll?: () => void
}

/** 获取分类对应的颜色 */
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    ordinary: 'blue',
    elite: 'violet',
    villain: 'red',
    fantasy: 'pink',
    relation: 'orange',
    celebrity: 'yellow',
  }
  return colors[category] || 'gray'
}

/** 获取分类对应的标签 */
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    ordinary: '路人',
    elite: '精英',
    villain: '反派',
    fantasy: '奇幻',
    relation: '关系',
    celebrity: '名人',
  }
  return labels[category] || category
}

export function NPCActivationNotification({
  activations,
  onConfirm,
  onDismiss,
  onConfirmAll,
  onDismissAll,
}: NPCActivationNotificationProps) {
  const [expanded, setExpanded] = useState(true)

  if (activations.length === 0) return null

  return (
    <Paper
      shadow="md"
      p="md"
      radius="md"
      style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* 标题栏 */}
      <Group justify="space-between" mb={expanded ? 'md' : 0}>
        <Group gap="xs">
          <IconSparkles size={20} style={{ color: '#8b5cf6' }} />
          <Text size="sm" fw={600} style={{ color: '#8b5cf6' }}>
            新角色即将登场
          </Text>
          <Badge size="sm" color="violet" variant="light">
            {activations.length}
          </Badge>
        </Group>

        <Group gap="xs">
          {activations.length > 1 && (
            <>
              <Tooltip label="全部确认">
                <ActionIcon
                  size="sm"
                  variant="light"
                  color="green"
                  onClick={onConfirmAll}
                >
                  <IconCheck size={14} />
                </ActionIcon>
              </Tooltip>
              <Tooltip label="全部取消">
                <ActionIcon
                  size="sm"
                  variant="light"
                  color="red"
                  onClick={onDismissAll}
                >
                  <IconX size={14} />
                </ActionIcon>
              </Tooltip>
            </>
          )}
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </ActionIcon>
        </Group>
      </Group>

      {/* NPC 列表 */}
      <Collapse in={expanded}>
        <Stack gap="sm">
          {activations.map((activation) => (
            <NPCActivationCard
              key={activation.npc.id}
              activation={activation}
              onConfirm={() => onConfirm(activation)}
              onDismiss={() => onDismiss(activation.npc.id)}
            />
          ))}
        </Stack>
      </Collapse>
    </Paper>
  )
}

/** 单个 NPC 激活卡片 */
function NPCActivationCard({
  activation,
  onConfirm,
  onDismiss,
}: {
  activation: NPCActivation
  onConfirm: () => void
  onDismiss: () => void
}) {
  const { npc, reason, confidence } = activation
  const categoryColor = getCategoryColor(npc.category)
  const categoryLabel = getCategoryLabel(npc.category)

  // 解析触发原因
  const getReasonText = (reason: string): string => {
    if (reason.startsWith('keyword_mention:')) {
      const keyword = reason.replace('keyword_mention:', '').trim()
      return `提到了 ${keyword}`
    }
    if (reason.startsWith('scene_trigger:')) {
      return '场景触发'
    }
    if (reason.startsWith('random_encounter:')) {
      return '随机偶遇'
    }
    if (reason.startsWith('time_based:')) {
      return '时间触发'
    }
    if (reason.startsWith('location_based:')) {
      return '地点触发'
    }
    return reason
  }

  return (
    <Box
      p="sm"
      style={{
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <Group justify="space-between" align="flex-start">
        {/* NPC 信息 */}
        <Group gap="sm" style={{ flex: 1 }}>
          <Avatar
            src={npc.avatar}
            size={48}
            radius="xl"
            style={{
              border: `2px solid var(--mantine-color-${categoryColor}-6)`,
            }}
          >
            <IconUsers size={24} />
          </Avatar>

          <Stack gap={2} style={{ flex: 1 }}>
            <Group gap="xs">
              <Text size="sm" fw={600}>
                {npc.name}
              </Text>
              {npc.alias && (
                <Text size="xs" c="dimmed">
                  ({npc.alias})
                </Text>
              )}
              <Badge size="xs" color={categoryColor} variant="light">
                {categoryLabel}
              </Badge>
            </Group>

            <Text size="xs" c="dimmed" lineClamp={1}>
              {npc.description}
            </Text>

            <Group gap={4}>
              <Badge size="xs" variant="outline" color="gray">
                {getReasonText(reason)}
              </Badge>
              <Badge size="xs" variant="dot" color={confidence > 0.7 ? 'green' : 'yellow'}>
                置信度 {Math.round(confidence * 100)}%
              </Badge>
            </Group>
          </Stack>
        </Group>

        {/* 操作按钮 */}
        <Group gap={4}>
          <Tooltip label="确认出场">
            <Button
              size="xs"
              variant="light"
              color="green"
              leftSection={<IconCheck size={14} />}
              onClick={onConfirm}
            >
              出场
            </Button>
          </Tooltip>
          <Tooltip label="取消">
            <ActionIcon
              size="md"
              variant="subtle"
              color="gray"
              onClick={onDismiss}
            >
              <IconX size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </Box>
  )
}

export default NPCActivationNotification
