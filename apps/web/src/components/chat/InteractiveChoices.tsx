'use client'

/**
 * 交互选项组件
 *
 * 在对话中展示角色给出的选项，让用户进行选择
 * 使用 CSS 动画替代 framer-motion
 */

import { useState, useCallback, memo, useEffect } from 'react'
import { Box, Text, Group, Paper, UnstyledButton, Badge, Tooltip } from '@mantine/core'
import { IconSparkles, IconHeart, IconChevronRight } from '@tabler/icons-react'
import type { ChoiceOption, ChoiceTag } from '@/lib/immersiveChat/types'

interface InteractiveChoicesProps {
  /** 选项数据 */
  choices: ChoiceTag

  /** 角色名称 */
  characterName?: string

  /** 是否已选择 */
  selectedId?: string

  /** 是否禁用 */
  disabled?: boolean

  /** 选择回调 */
  onSelect?: (choice: ChoiceOption) => void

  /** 显示样式 */
  variant?: 'cards' | 'buttons' | 'inline'

  /** 是否显示选择后果提示 */
  showConsequences?: boolean
}

function InteractiveChoices({
  choices,
  characterName = '角色',
  selectedId,
  disabled = false,
  onSelect,
  variant = 'cards',
  showConsequences = true,
}: InteractiveChoicesProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // 挂载动画触发
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSelect = useCallback((choice: ChoiceOption) => {
    if (disabled || selectedId) return
    onSelect?.(choice)
  }, [disabled, selectedId, onSelect])

  const isSelected = (id: string) => selectedId === id

  // 卡片样式
  if (variant === 'cards') {
    return (
      <Box className="mt-4 mb-2">
        {/* 提示语 */}
        {choices.prompt && (
          <Text size="sm" c="dimmed" mb="sm" className="flex items-center gap-2">
            <IconSparkles size={16} className="text-yellow-500" />
            {choices.prompt}
          </Text>
        )}

        {/* 选项卡片 */}
        <div className="grid gap-2">
          {choices.options.map((option, index) => (
            <div
              key={option.id}
              className="transition-all duration-300 ease-out"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
                transitionDelay: `${index * 100}ms`,
              }}
            >
              <UnstyledButton
                className={`w-full transition-all duration-200 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                onClick={() => handleSelect(option)}
                disabled={disabled || !!selectedId}
                onMouseEnter={() => setHoveredId(option.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <Paper
                  p="md"
                  radius="lg"
                  className={`
                    border-2 transition-all duration-200
                    ${isSelected(option.id)
                      ? 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-500/20'
                      : hoveredId === option.id
                        ? 'border-purple-400/50 bg-purple-500/5 transform scale-[1.02]'
                        : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'
                    }
                  `}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap">
                      {/* Emoji */}
                      <span className="text-xl">{option.emoji || '💭'}</span>

                      {/* 文本 */}
                      <Box>
                        <Text
                          size="sm"
                          fw={500}
                          className={isSelected(option.id) ? 'text-pink-300' : ''}
                        >
                          {option.text}
                        </Text>

                        {/* 后果提示 */}
                        {showConsequences && option.consequence && (
                          <Text size="xs" c="dimmed" mt={2} className="italic">
                            → {option.consequence}
                          </Text>
                        )}
                      </Box>
                    </Group>

                    {/* 右侧指示 */}
                    <Group gap="xs">
                      {/* 亲密度奖励 */}
                      {option.intimacyBonus && option.intimacyBonus > 0 && (
                        <Tooltip label={`+${option.intimacyBonus} 亲密度`}>
                          <Badge
                            size="sm"
                            color="pink"
                            variant="light"
                            leftSection={<IconHeart size={10} />}
                          >
                            +{option.intimacyBonus}
                          </Badge>
                        </Tooltip>
                      )}

                      {/* 箭头 */}
                      <IconChevronRight
                        size={16}
                        className={`
                          transition-transform duration-200
                          ${hoveredId === option.id ? 'translate-x-1' : ''}
                          ${isSelected(option.id) ? 'text-pink-400' : 'text-gray-500'}
                        `}
                      />
                    </Group>
                  </Group>
                </Paper>
              </UnstyledButton>
            </div>
          ))}
        </div>

        {/* 已选择提示 */}
        {selectedId && (
          <div
            className="mt-3 text-center transition-all duration-300"
            style={{
              opacity: 1,
              transform: 'translateY(0)',
            }}
          >
            <Badge color="green" variant="light" size="sm">
              ✓ 你做出了选择
            </Badge>
          </div>
        )}
      </Box>
    )
  }

  // 按钮样式
  if (variant === 'buttons') {
    return (
      <Box className="mt-4 mb-2">
        {choices.prompt && (
          <Text size="sm" c="dimmed" mb="sm">
            {choices.prompt}
          </Text>
        )}

        <Group gap="sm" wrap="wrap">
          {choices.options.map((option) => (
            <UnstyledButton
              key={option.id}
              onClick={() => handleSelect(option)}
              disabled={disabled || !!selectedId}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                ${isSelected(option.id)
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                  : 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-200'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <span className="mr-1">{option.emoji}</span>
              {option.text}
            </UnstyledButton>
          ))}
        </Group>
      </Box>
    )
  }

  // 内联样式
  return (
    <span className="inline-flex flex-wrap gap-2 mx-1">
      {choices.options.map((option) => (
        <UnstyledButton
          key={option.id}
          onClick={() => handleSelect(option)}
          disabled={disabled || !!selectedId}
          className={`
            px-2 py-0.5 rounded text-xs transition-all duration-200
            ${isSelected(option.id)
              ? 'bg-pink-500/30 text-pink-300 ring-1 ring-pink-500'
              : 'bg-gray-700/50 hover:bg-gray-600/50'
            }
          `}
        >
          {option.emoji} {option.text}
        </UnstyledButton>
      ))}
    </span>
  )
}

export default memo(InteractiveChoices)

// ==================== 工具组件 ====================

/**
 * 简化版选项显示（用于消息历史）
 */
export const SelectedChoiceDisplay = memo(function SelectedChoiceDisplay({
  choice,
  timestamp,
}: {
  choice: ChoiceOption
  timestamp?: Date
}) {
  return (
    <Box className="mt-2 mb-1 pl-4 border-l-2 border-pink-500/50">
      <Group gap="xs">
        <Badge size="xs" color="pink" variant="light">
          你的选择
        </Badge>
        <Text size="xs" c="dimmed">
          {choice.emoji} {choice.text}
        </Text>
      </Group>
    </Box>
  )
})

/**
 * 等待选择提示
 */
export const WaitingForChoice = memo(function WaitingForChoice({
  characterName,
}: {
  characterName?: string
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-400 mt-2 animate-pulse">
      <span className="animate-bounce">⏳</span>
      <span>{characterName || '角色'}正在等待你的回应...</span>
    </div>
  )
})
