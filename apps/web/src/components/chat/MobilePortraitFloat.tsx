'use client'

/**
 * 移动端角色迷你头像组件
 *
 * 在移动端显示悬浮的角色头像，点击可展开表情选择器
 */

import { useState, useEffect, memo } from 'react'
import { Box, ActionIcon, Badge, Transition, Paper, Group, Text, Progress, Button } from '@mantine/core'
import { IconHeart, IconX, IconPhoto } from '@tabler/icons-react'
import { useDynamicImage } from '@/lib/dynamicImage/useDynamicImage'
import { useEmotionDetection } from '@/lib/dynamicImage/useEmotionDetection'
import { type EmotionType } from '@/lib/dynamicImage/config'
import { useTranslation } from '@/lib/i18n'

interface MobilePortraitFloatProps {
  characterId: string
  characterName: string
  charType?: 'character' | 'community'
  userId?: string
  latestMessage?: string
  intimacyLevel?: number
  onViewGallery?: () => void
  onExpressionChange?: (emotion: EmotionType) => void
}

function MobilePortraitFloat({
  characterId,
  characterName,
  charType = 'community',
  userId,
  latestMessage,
  intimacyLevel = 0,
  onViewGallery,
  onExpressionChange,
}: MobilePortraitFloatProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showExpressionPicker, setShowExpressionPicker] = useState(false)

  // 表情选项 - 使用翻译
  const EXPRESSION_OPTIONS: { emotion: EmotionType; label: string; emoji: string }[] = [
    { emotion: 'happy', label: t('mobilePortrait.emotions.happy'), emoji: '😊' },
    { emotion: 'shy', label: t('mobilePortrait.emotions.shy'), emoji: '😳' },
    { emotion: 'angry', label: t('mobilePortrait.emotions.angry'), emoji: '😤' },
    { emotion: 'surprised', label: t('mobilePortrait.emotions.surprised'), emoji: '😲' },
    { emotion: 'sad', label: t('mobilePortrait.emotions.sad'), emoji: '😢' },
    { emotion: 'love', label: t('mobilePortrait.emotions.love'), emoji: '🥰' },
    { emotion: 'neutral', label: t('mobilePortrait.emotions.neutral'), emoji: '😌' },
  ]

  // 情绪检测
  const { emotion: detectedEmotion } = useEmotionDetection(latestMessage)

  // 动态图片管理
  const {
    currentExpression,
    isLoading,
    hasAssets,
    setExpressionByEmotion,
    availableExpressions,
  } = useDynamicImage({
    characterId,
    charType,
    userId,
    enabled: true,
  })

  // 当检测到情绪变化时更新表情
  useEffect(() => {
    if (detectedEmotion && hasAssets) {
      setExpressionByEmotion(detectedEmotion)
      onExpressionChange?.(detectedEmotion)
    }
  }, [detectedEmotion, hasAssets, setExpressionByEmotion, onExpressionChange])

  // 手动选择表情
  const handleSelectExpression = (emotion: EmotionType) => {
    setExpressionByEmotion(emotion)
    onExpressionChange?.(emotion)
    setShowExpressionPicker(false)
  }

  // 如果没有素材，不显示
  if (!hasAssets && !isLoading) {
    return null
  }

  return (
    <>
      {/* 主悬浮头像 */}
      <Box
        className="character-portrait-mini"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          position: 'fixed',
          bottom: 90,
          right: 16,
          zIndex: 100,
          width: 56,
          height: 56,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '3px solid var(--accent-gold-hex)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          background: 'hsl(var(--bg-card))',
        }}
      >
        {currentExpression?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentExpression.thumbnail || currentExpression.url}
            alt={characterName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'opacity 0.3s ease',
            }}
          />
        ) : (
          <Box
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--accent-gold-hex), #e8d7b0)',
            }}
          >
            <Text size="lg" fw={700} c="dark">{characterName[0]}</Text>
          </Box>
        )}

        {/* 亲密度指示点 */}
        <Box
          style={{
            position: 'absolute',
            bottom: 2,
            right: 2,
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: intimacyLevel >= 50 ? '#ec4899' : intimacyLevel >= 20 ? '#f472b6' : '#6b7280',
            border: '2px solid hsl(var(--bg-card))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconHeart size={8} style={{ color: 'white' }} />
        </Box>
      </Box>

      {/* 展开面板 */}
      <Transition mounted={isExpanded} transition="slide-up" duration={200}>
        {(styles) => (
          <Paper
            shadow="xl"
            radius="lg"
            p="md"
            style={{
              ...styles,
              position: 'fixed',
              bottom: 160,
              right: 16,
              zIndex: 99,
              width: 200,
              background: 'hsl(var(--bg-card))',
              border: '1px solid hsl(var(--border-muted))',
            }}
          >
            {/* 关闭按钮 */}
            <ActionIcon
              size="xs"
              variant="subtle"
              onClick={() => setIsExpanded(false)}
              style={{ position: 'absolute', top: 8, right: 8 }}
            >
              <IconX size={14} />
            </ActionIcon>

            {/* 角色名 */}
            <Text size="sm" fw={600} mb="xs" truncate>
              {characterName}
            </Text>

            {/* 亲密度 */}
            <Group gap={4} mb="xs">
              <IconHeart size={12} style={{ color: '#ec4899' }} />
              <Text size="xs" c="dimmed">{t('mobilePortrait.intimacy')}</Text>
              <Text size="xs" fw={600} style={{ color: '#ec4899' }}>{intimacyLevel}</Text>
            </Group>
            <Progress
              value={intimacyLevel}
              size="xs"
              color="pink"
              mb="sm"
            />

            {/* 表情切换按钮 */}
            <Text size="xs" c="dimmed" mb={4}>{t('mobilePortrait.switchExpression')}</Text>
            <Group gap={4} wrap="wrap">
              {EXPRESSION_OPTIONS.slice(0, 6).map(({ emotion, emoji }) => {
                const hasExpression = availableExpressions.some(e => e.category === emotion)
                return (
                  <ActionIcon
                    key={emotion}
                    size="sm"
                    variant={detectedEmotion === emotion ? 'filled' : 'light'}
                    color={detectedEmotion === emotion ? 'pink' : 'gray'}
                    onClick={() => handleSelectExpression(emotion)}
                    disabled={!hasExpression}
                    title={EXPRESSION_OPTIONS.find(e => e.emotion === emotion)?.label}
                  >
                    <span style={{ fontSize: 14 }}>{emoji}</span>
                  </ActionIcon>
                )
              })}
            </Group>

            {/* 相册按钮 */}
            {onViewGallery && (
              <Button
                variant="light"
                size="xs"
                mt="sm"
                fullWidth
                leftSection={<IconPhoto size={14} />}
                onClick={onViewGallery}
              >
                {t('mobilePortrait.viewGallery')}
              </Button>
            )}
          </Paper>
        )}
      </Transition>

      {/* 点击遮罩关闭 */}
      {isExpanded && (
        <Box
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 98,
          }}
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  )
}

export default memo(MobilePortraitFloat)
