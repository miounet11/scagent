'use client'

import { Badge, Group, Tooltip } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import { getEmotionEmoji, type EmotionTransition } from '@/lib/immersiveChat/parser'

interface EmotionBadgeProps {
  emotion?: string
  transition?: EmotionTransition
  size?: 'xs' | 'sm' | 'md'
}

export function EmotionBadge({ emotion, transition, size = 'sm' }: EmotionBadgeProps) {
  if (transition) {
    return (
      <Tooltip label={`情绪变化: ${transition.from} → ${transition.to}`}>
        <Badge
          variant="light"
          color="pink"
          size={size}
          style={{
            background: 'linear-gradient(135deg, rgba(244,114,182,0.2), rgba(236,72,153,0.2))',
            border: '1px solid rgba(244,114,182,0.3)'
          }}
        >
          <Group gap={4}>
            <span>{getEmotionEmoji(transition.from)}</span>
            <IconArrowRight size={10} />
            <span>{getEmotionEmoji(transition.to)}</span>
          </Group>
        </Badge>
      </Tooltip>
    )
  }

  if (emotion) {
    return (
      <Tooltip label={`情绪: ${emotion}`}>
        <Badge variant="light" color="pink" size={size}>
          {getEmotionEmoji(emotion)}
        </Badge>
      </Tooltip>
    )
  }

  return null
}
