'use client'

/**
 * 剧情选择框组件
 *
 * 在对话中显示场景转换/剧情选择
 */

import { memo, useState } from 'react'
import { Box, Text, Paper, Group, Badge, Stack, UnstyledButton } from '@mantine/core'
import { IconSparkles, IconClock, IconMapPin, IconMessageCircle } from '@tabler/icons-react'
import type { SuggestedChoice, ChoiceType } from '@/lib/storyProgression/types'
import { useTranslation } from '@/lib/i18n'

interface StoryChoiceBoxProps {
  /** 标题 */
  title: string
  /** 描述 */
  description: string
  /** 选择列表 */
  choices: SuggestedChoice[]
  /** 角色名称 */
  characterName?: string
  /** 选择回调 */
  onSelect: (choice: SuggestedChoice) => void
  /** 是否已选择 */
  selectedId?: string
  /** 是否禁用 */
  disabled?: boolean
}

// 选择类型图标
const CHOICE_TYPE_ICONS: Record<ChoiceType, typeof IconMessageCircle> = {
  continue: IconMessageCircle,
  end_scene: IconSparkles,
  scene_end: IconSparkles,
  time_skip: IconClock,
  location_change: IconMapPin,
  mood_change: IconSparkles,
  action: IconSparkles,
  activity_change: IconSparkles,
  relationship: IconSparkles,
  exploration: IconMapPin,
}

// 选择类型颜色
const CHOICE_TYPE_COLORS: Record<ChoiceType, string> = {
  continue: 'blue',
  end_scene: 'violet',
  scene_end: 'violet',
  time_skip: 'yellow',
  location_change: 'teal',
  mood_change: 'pink',
  action: 'orange',
  activity_change: 'cyan',
  relationship: 'red',
  exploration: 'green',
}

function StoryChoiceBox({
  title,
  description,
  choices,
  characterName,
  onSelect,
  selectedId,
  disabled = false,
}: StoryChoiceBoxProps) {
  const { t } = useTranslation()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const displayCharacterName = characterName || t('chat.storyChoice.defaultCharacter')

  return (
    <Paper
      p="md"
      radius="lg"
      style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* 标题区域 */}
      <Group gap="sm" mb="md">
        <Box
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconSparkles size={20} color="white" />
        </Box>
        <Box>
          <Text fw={600} size="sm" style={{ color: '#e9d5ff' }}>
            {title}
          </Text>
          <Text size="xs" c="dimmed">
            {description}
          </Text>
        </Box>
      </Group>

      {/* 选择列表 */}
      <Stack gap="sm">
        {choices.map((choice) => {
          const Icon = CHOICE_TYPE_ICONS[choice.type] || IconSparkles
          const color = CHOICE_TYPE_COLORS[choice.type] || 'gray'
          const isSelected = selectedId === choice.id
          const isHovered = hoveredId === choice.id

          return (
            <UnstyledButton
              key={choice.id}
              onClick={() => !disabled && !isSelected && onSelect(choice)}
              onMouseEnter={() => setHoveredId(choice.id)}
              onMouseLeave={() => setHoveredId(null)}
              disabled={disabled || isSelected}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                background: isSelected
                  ? `var(--mantine-color-${color}-light)`
                  : isHovered
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${isSelected
                  ? `var(--mantine-color-${color}-light-color)`
                  : isHovered
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'rgba(255, 255, 255, 0.1)'
                }`,
                transition: 'all 0.2s ease',
                cursor: disabled || isSelected ? 'default' : 'pointer',
                opacity: disabled && !isSelected ? 0.5 : 1,
              }}
            >
              <Group gap="sm" wrap="nowrap">
                {/* Emoji */}
                <Text size="lg">{choice.emoji}</Text>

                {/* 内容 */}
                <Box style={{ flex: 1 }}>
                  <Group gap="xs" mb={choice.consequence ? 4 : 0}>
                    <Text size="sm" fw={500} style={{ color: isSelected ? `var(--mantine-color-${color}-light-color)` : 'inherit' }}>
                      {choice.text}
                    </Text>
                    {choice.type !== 'continue' && (
                      <Badge
                        size="xs"
                        variant="light"
                        color={color}
                        leftSection={<Icon size={10} />}
                      >
                        {choice.type === 'time_skip' ? t('chat.storyChoice.types.timeSkip')
                          : choice.type === 'end_scene' ? t('chat.storyChoice.types.endScene')
                          : choice.type === 'location_change' ? t('chat.storyChoice.types.locationChange')
                          : choice.type === 'mood_change' ? t('chat.storyChoice.types.moodChange')
                          : t('chat.storyChoice.types.action')}
                      </Badge>
                    )}
                  </Group>
                  {choice.consequence && (
                    <Text size="xs" c="dimmed" style={{ opacity: 0.8 }}>
                      {choice.consequence}
                    </Text>
                  )}
                </Box>

                {/* 选中标记 */}
                {isSelected && (
                  <Badge color={color} variant="filled" size="sm">
                    {t('chat.storyChoice.selected')}
                  </Badge>
                )}
              </Group>
            </UnstyledButton>
          )
        })}
      </Stack>

      {/* 底部提示 */}
      <Text size="xs" c="dimmed" mt="md" ta="center" style={{ opacity: 0.6 }}>
        {t('chat.storyChoice.hint')}
      </Text>
    </Paper>
  )
}

export default memo(StoryChoiceBox)
