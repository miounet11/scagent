/**
 * ChatEmptyState - 聊天空状态组件
 *
 * 在没有消息时显示友好的欢迎界面和建议操作
 * 支持角色信息展示和快速开始提示
 */

'use client'

import { memo } from 'react'
import { Box, Stack, Text, Button, Group, Paper, ThemeIcon } from '@mantine/core'
import {
  IconMessageCircle,
  IconSparkles,
  IconWand,
  IconHeart,
  IconMoodSmile,
  IconBulb,
} from '@tabler/icons-react'
import { useTranslation } from '@/lib/i18n'

interface ChatEmptyStateProps {
  /** 角色名称 */
  characterName?: string
  /** 角色头像 */
  characterAvatar?: string
  /** 角色描述 */
  characterDescription?: string
  /** 是否有角色 */
  hasCharacter?: boolean
  /** 建议的开场白 */
  suggestedStarters?: string[]
  /** 点击建议时的回调 */
  onSuggestionClick?: (suggestion: string) => void
  /** 选择角色的回调 */
  onSelectCharacter?: () => void
}

// 默认的对话建议
const DEFAULT_SUGGESTIONS = [
  '你好，很高兴认识你！',
  '能介绍一下你自己吗？',
  '今天过得怎么样？',
  '有什么有趣的事情想分享吗？',
]

function ChatEmptyState({
  characterName,
  characterAvatar,
  characterDescription,
  hasCharacter = false,
  suggestedStarters,
  onSuggestionClick,
  onSelectCharacter,
}: ChatEmptyStateProps) {
  const { t } = useTranslation()
  const suggestions = suggestedStarters?.length ? suggestedStarters : DEFAULT_SUGGESTIONS

  // 没有角色时的状态
  if (!hasCharacter) {
    return (
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          textAlign: 'center',
          minHeight: '300px',
        }}
      >
        <Box
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
            border: '2px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          <IconMessageCircle size={36} style={{ color: 'rgba(139, 92, 246, 0.8)' }} />
        </Box>

        <Text
          size="xl"
          fw={600}
          style={{
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: 8,
          }}
        >
          {t('chat.emptyState.noCharacterTitle') || '开始你的对话之旅'}
        </Text>

        <Text
          size="sm"
          style={{
            color: 'rgba(255, 255, 255, 0.6)',
            maxWidth: 320,
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          {t('chat.emptyState.noCharacterDescription') || '选择一个角色，开启精彩的对话体验'}
        </Text>

        {onSelectCharacter && (
          <Button
            variant="gradient"
            gradient={{ from: '#8b5cf6', to: '#ec4899', deg: 135 }}
            size="md"
            leftSection={<IconSparkles size={18} />}
            onClick={onSelectCharacter}
            style={{
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
            }}
          >
            {t('chat.emptyState.selectCharacter') || '选择角色'}
          </Button>
        )}
      </Box>
    )
  }

  // 有角色但没有消息时的状态
  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        textAlign: 'center',
      }}
    >
      {/* 角色信息卡片 */}
      <Paper
        p="lg"
        radius="lg"
        style={{
          background: 'linear-gradient(135deg, rgba(26, 20, 41, 0.9) 0%, rgba(20, 15, 32, 0.95) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          backdropFilter: 'blur(16px)',
          maxWidth: 400,
          width: '100%',
          marginBottom: 24,
        }}
      >
        <Stack align="center" gap="md">
          {/* 角色头像 */}
          <Box
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: characterAvatar
                ? `url(${characterAvatar}) center/cover`
                : 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%)',
              border: '3px solid rgba(139, 92, 246, 0.4)',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {!characterAvatar && <IconMoodSmile size={32} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />}
          </Box>

          {/* 角色名称 */}
          <Text
            size="lg"
            fw={600}
            style={{
              color: 'rgba(255, 255, 255, 0.95)',
              background: 'linear-gradient(135deg, #fff 0%, rgba(139, 92, 246, 0.8) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {characterName || t('chat.emptyState.defaultCharacterName') || '角色'}
          </Text>

          {/* 角色描述 */}
          {characterDescription && (
            <Text
              size="sm"
              style={{
                color: 'rgba(255, 255, 255, 0.6)',
                lineHeight: 1.6,
                maxWidth: 300,
              }}
              lineClamp={2}
            >
              {characterDescription}
            </Text>
          )}

          {/* 欢迎提示 */}
          <Group gap="xs" style={{ color: 'rgba(245, 197, 66, 0.8)' }}>
            <IconHeart size={16} />
            <Text size="xs" fw={500}>
              {t('chat.emptyState.welcomeHint') || '准备好开始对话了吗？'}
            </Text>
          </Group>
        </Stack>
      </Paper>

      {/* 对话建议 */}
      <Box style={{ width: '100%', maxWidth: 400 }}>
        <Group gap="xs" mb="sm" style={{ justifyContent: 'center' }}>
          <IconBulb size={16} style={{ color: 'rgba(245, 197, 66, 0.8)' }} />
          <Text size="sm" fw={500} style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {t('chat.emptyState.suggestionsTitle') || '试试这些开场白'}
          </Text>
        </Group>

        <Stack gap="xs">
          {suggestions.slice(0, 4).map((suggestion, index) => (
            <Button
              key={index}
              variant="subtle"
              size="sm"
              fullWidth
              onClick={() => onSuggestionClick?.(suggestion)}
              leftSection={<IconWand size={14} />}
              style={{
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                color: 'rgba(255, 255, 255, 0.85)',
                justifyContent: 'flex-start',
                textAlign: 'left',
                height: 'auto',
                padding: '10px 14px',
                transition: 'all 0.2s ease',
              }}
              styles={{
                root: {
                  '&:hover': {
                    background: 'rgba(139, 92, 246, 0.15)',
                    borderColor: 'rgba(139, 92, 246, 0.3)',
                    transform: 'translateX(4px)',
                  },
                },
                inner: {
                  justifyContent: 'flex-start',
                },
                label: {
                  whiteSpace: 'normal',
                  lineHeight: 1.4,
                },
              }}
            >
              {suggestion}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* 底部提示 */}
      <Text
        size="xs"
        mt="xl"
        style={{
          color: 'rgba(255, 255, 255, 0.4)',
          maxWidth: 300,
        }}
      >
        {t('chat.emptyState.inputHint') || '或者直接在下方输入框中输入你想说的话'}
      </Text>
    </Box>
  )
}

export default memo(ChatEmptyState)
