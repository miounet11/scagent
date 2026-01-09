'use client'

/**
 * DirectorPanel - 剧情导演面板
 *
 * v17.2: 独立渲染 Director 建议
 * - 可折叠显示
 * - 剧情选项
 * - 场景建议
 * - NPC 引入建议
 * - 事件暗示
 */

import { memo, useState, useCallback } from 'react'
import {
  Box,
  Paper,
  Text,
  Group,
  Stack,
  Badge,
  UnstyledButton,
  Collapse,
  Tooltip,
  ActionIcon,
} from '@mantine/core'
import {
  IconSparkles,
  IconChevronDown,
  IconChevronRight,
  IconMapPin,
  IconClock,
  IconUsers,
  IconAlertCircle,
  IconPlayerPlay,
} from '@tabler/icons-react'
import type {
  DirectorResult,
  DirectorChoice,
  SceneSuggestion,
  NPCSuggestion,
  EventHint,
} from '@/lib/chat/directorTypes'
import {
  getChoiceTypeLabel,
  getChoiceTypeColor,
  getSceneTypeLabel,
  getEventHintTypeLabel,
} from '@/lib/chat/directorTypes'

interface DirectorPanelProps {
  /** Director 数据 */
  data: DirectorResult
  /** 是否是最新消息 */
  isLatest?: boolean
  /** 角色名称 */
  characterName?: string
  /** 选择回调 */
  onChoiceSelect?: (choice: DirectorChoice) => void
  /** 场景建议回调 */
  onSceneSuggestion?: (suggestion: SceneSuggestion) => void
  /** NPC 建议回调 */
  onNPCSuggestion?: (suggestion: NPCSuggestion) => void
  /** 是否禁用交互 */
  disabled?: boolean
}

function DirectorPanel({
  data,
  isLatest = false,
  characterName = '角色',
  onChoiceSelect,
  onSceneSuggestion,
  onNPCSuggestion,
  disabled = false,
}: DirectorPanelProps) {
  // 最新消息默认展开，旧消息默认折叠
  const [expanded, setExpanded] = useState(isLatest)
  const [hoveredChoiceId, setHoveredChoiceId] = useState<string | null>(null)

  const handleChoiceClick = useCallback((choice: DirectorChoice) => {
    if (disabled || data.selectedChoiceId) return
    onChoiceSelect?.(choice)
  }, [disabled, data.selectedChoiceId, onChoiceSelect])

  const hasExtras = data.sceneSuggestion || data.npcSuggestions?.length || data.eventHint

  return (
    <Paper
      p="sm"
      radius="md"
      mt="sm"
      style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(236, 72, 153, 0.08) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* 标题栏 - 可点击折叠 */}
      <UnstyledButton
        onClick={() => setExpanded(!expanded)}
        style={{ width: '100%' }}
      >
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <Box
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconSparkles size={14} color="white" />
            </Box>
            <Text size="sm" fw={600} style={{ color: '#e9d5ff' }}>
              剧情导演
            </Text>
            {data.selectedChoiceId && (
              <Badge size="xs" color="green" variant="light">
                已选择
              </Badge>
            )}
          </Group>

          <Group gap="xs">
            {hasExtras && (
              <Badge size="xs" variant="dot" color="violet">
                有建议
              </Badge>
            )}
            {expanded ? (
              <IconChevronDown size={16} style={{ color: '#a78bfa' }} />
            ) : (
              <IconChevronRight size={16} style={{ color: '#a78bfa' }} />
            )}
          </Group>
        </Group>
      </UnstyledButton>

      {/* 可折叠内容 */}
      <Collapse in={expanded}>
        <Stack gap="sm" mt="sm">
          {/* 剧情选项 */}
          <Box>
            <Text size="xs" c="dimmed" mb="xs">
              选择下一步行动
            </Text>
            <Stack gap="xs">
              {data.choices.map((choice) => {
                const isSelected = data.selectedChoiceId === choice.id
                const isHovered = hoveredChoiceId === choice.id
                const color = getChoiceTypeColor(choice.type)

                return (
                  <UnstyledButton
                    key={choice.id}
                    onClick={() => handleChoiceClick(choice)}
                    onMouseEnter={() => setHoveredChoiceId(choice.id)}
                    onMouseLeave={() => setHoveredChoiceId(null)}
                    disabled={disabled || !!data.selectedChoiceId}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: isSelected
                        ? `var(--mantine-color-${color}-light)`
                        : isHovered
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isSelected
                        ? `var(--mantine-color-${color}-light-color)`
                        : isHovered
                          ? 'rgba(255, 255, 255, 0.15)'
                          : 'rgba(255, 255, 255, 0.08)'
                      }`,
                      transition: 'all 0.2s ease',
                      cursor: disabled || data.selectedChoiceId ? 'default' : 'pointer',
                      opacity: disabled && !isSelected ? 0.5 : 1,
                    }}
                  >
                    <Group gap="sm" wrap="nowrap">
                      <Text size="lg">{choice.emoji || '💭'}</Text>
                      <Box style={{ flex: 1 }}>
                        <Group gap="xs" mb={choice.consequence ? 2 : 0}>
                          <Text
                            size="sm"
                            fw={500}
                            style={{
                              color: isSelected ? `var(--mantine-color-${color}-light-color)` : 'inherit'
                            }}
                          >
                            {choice.text}
                          </Text>
                          <Badge size="xs" variant="light" color={color}>
                            {getChoiceTypeLabel(choice.type)}
                          </Badge>
                        </Group>
                        {choice.consequence && (
                          <Text size="xs" c="dimmed" style={{ opacity: 0.8 }}>
                            → {choice.consequence}
                          </Text>
                        )}
                      </Box>
                      {isSelected && (
                        <Badge color={color} variant="filled" size="xs">
                          已选
                        </Badge>
                      )}
                    </Group>
                  </UnstyledButton>
                )
              })}
            </Stack>
          </Box>

          {/* 场景建议 */}
          {data.sceneSuggestion && (
            <Box>
              <Group gap="xs" mb="xs">
                <IconMapPin size={14} style={{ color: '#14b8a6' }} />
                <Text size="xs" c="dimmed">场景建议</Text>
              </Group>
              <Paper
                p="xs"
                radius="sm"
                style={{
                  background: 'rgba(20, 184, 166, 0.1)',
                  border: '1px solid rgba(20, 184, 166, 0.2)',
                }}
              >
                <Group gap="xs" wrap="nowrap">
                  <Badge size="xs" color="teal" variant="light">
                    {getSceneTypeLabel(data.sceneSuggestion.type)}
                  </Badge>
                  <Text size="xs">{data.sceneSuggestion.description}</Text>
                </Group>
                {data.sceneSuggestion.targetLocation && (
                  <Text size="xs" c="dimmed" mt={4}>
                    目标: {data.sceneSuggestion.targetLocation}
                  </Text>
                )}
                {onSceneSuggestion && (
                  <Tooltip label="应用此建议">
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="teal"
                      mt="xs"
                      onClick={() => onSceneSuggestion(data.sceneSuggestion!)}
                    >
                      <IconPlayerPlay size={12} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Paper>
            </Box>
          )}

          {/* NPC 建议 */}
          {data.npcSuggestions && data.npcSuggestions.length > 0 && (
            <Box>
              <Group gap="xs" mb="xs">
                <IconUsers size={14} style={{ color: '#f59e0b' }} />
                <Text size="xs" c="dimmed">角色引入建议</Text>
              </Group>
              <Stack gap="xs">
                {data.npcSuggestions.map((npc, i) => (
                  <Paper
                    key={i}
                    p="xs"
                    radius="sm"
                    style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                    }}
                  >
                    <Group gap="xs" wrap="nowrap" justify="space-between">
                      <Box>
                        <Group gap="xs">
                          <Text size="sm" fw={500}>{npc.name}</Text>
                          <Badge size="xs" color="yellow" variant="light">
                            {npc.role}
                          </Badge>
                        </Group>
                        <Text size="xs" c="dimmed">{npc.reason}</Text>
                      </Box>
                      {onNPCSuggestion && (
                        <Tooltip label="引入此角色">
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            color="yellow"
                            onClick={() => onNPCSuggestion(npc)}
                          >
                            <IconPlayerPlay size={12} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}

          {/* 事件暗示 */}
          {data.eventHint && (
            <Box>
              <Group gap="xs" mb="xs">
                <IconAlertCircle size={14} style={{ color: '#a78bfa' }} />
                <Text size="xs" c="dimmed">剧情暗示</Text>
              </Group>
              <Paper
                p="xs"
                radius="sm"
                style={{
                  background: 'rgba(167, 139, 250, 0.1)',
                  border: '1px solid rgba(167, 139, 250, 0.2)',
                }}
              >
                <Group gap="xs">
                  <Badge size="xs" color="violet" variant="light">
                    {getEventHintTypeLabel(data.eventHint.type)}
                  </Badge>
                  <Text size="xs" style={{ fontStyle: 'italic' }}>
                    {data.eventHint.hint}
                  </Text>
                </Group>
                {data.eventHint.relatedTo && (
                  <Text size="xs" c="dimmed" mt={4}>
                    相关: {data.eventHint.relatedTo}
                  </Text>
                )}
              </Paper>
            </Box>
          )}
        </Stack>
      </Collapse>
    </Paper>
  )
}

export default memo(DirectorPanel)
