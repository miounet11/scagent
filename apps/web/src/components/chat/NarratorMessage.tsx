'use client'

/**
 * v4.0 活世界系统 - 叙述者消息组件
 *
 * 显示导演层生成的旁白/叙述内容
 * 支持不同类型的叙述样式
 */

import React, { useMemo } from 'react'
import { Box, Text, Paper, Group, ThemeIcon, Transition } from '@mantine/core'
import {
  IconQuote,
  IconClock,
  IconSparkles,
  IconMist,
  IconArrowsExchange,
  IconMicrophone
} from '@tabler/icons-react'

// ==================== 类型定义 ====================

/** 叙述者消息类型 */
export type NarratorMessageType =
  | 'scene_description'   // 场景描述
  | 'time_passage'        // 时间流逝
  | 'event_announcement'  // 事件公告
  | 'atmosphere'          // 氛围渲染
  | 'transition'          // 过渡旁白
  | 'silence_filler'      // 沉默填充
  | 'system'              // 系统消息

export interface NarratorMessageProps {
  /** 消息类型 */
  type: NarratorMessageType
  /** 消息内容 */
  content: string
  /** 是否内联显示（在消息中间） */
  isInline?: boolean
  /** 是否显示 */
  visible?: boolean
  /** 是否启用动画 */
  animated?: boolean
  /** 自定义样式类 */
  className?: string
}

// ==================== 样式配置 ====================

interface TypeStyleConfig {
  icon: React.ReactNode
  gradient: { from: string; to: string; deg: number }
  label: string
  textColor: string
}

const TYPE_STYLES: Record<NarratorMessageType, TypeStyleConfig> = {
  scene_description: {
    icon: <IconQuote size={16} />,
    gradient: { from: 'teal.4', to: 'green.4', deg: 135 },
    label: '场景',
    textColor: 'teal.8'
  },
  time_passage: {
    icon: <IconClock size={16} />,
    gradient: { from: 'blue.4', to: 'cyan.4', deg: 135 },
    label: '时间',
    textColor: 'blue.8'
  },
  event_announcement: {
    icon: <IconSparkles size={16} />,
    gradient: { from: 'orange.4', to: 'yellow.4', deg: 135 },
    label: '事件',
    textColor: 'orange.8'
  },
  atmosphere: {
    icon: <IconMist size={16} />,
    gradient: { from: 'violet.4', to: 'grape.4', deg: 135 },
    label: '氛围',
    textColor: 'violet.8'
  },
  transition: {
    icon: <IconArrowsExchange size={16} />,
    gradient: { from: 'gray.4', to: 'gray.5', deg: 135 },
    label: '过渡',
    textColor: 'gray.7'
  },
  silence_filler: {
    icon: <IconMicrophone size={16} />,
    gradient: { from: 'gray.3', to: 'gray.4', deg: 135 },
    label: '旁白',
    textColor: 'gray.6'
  },
  system: {
    icon: <IconSparkles size={16} />,
    gradient: { from: 'indigo.4', to: 'blue.4', deg: 135 },
    label: '系统',
    textColor: 'indigo.7'
  }
}

// ==================== 内联样式组件 ====================

function InlineNarratorMessage({
  type,
  content,
  animated
}: {
  type: NarratorMessageType
  content: string
  animated?: boolean
}) {
  const style = TYPE_STYLES[type]

  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '8px 16px',
        margin: '8px 0'
      }}
    >
      <Text
        size="sm"
        c={style.textColor}
        fs="italic"
        ta="center"
        style={{
          maxWidth: '80%',
          lineHeight: 1.6,
          letterSpacing: '0.02em'
        }}
      >
        —— {content} ——
      </Text>
    </Box>
  )
}

// ==================== 块级样式组件 ====================

function BlockNarratorMessage({
  type,
  content,
  animated
}: {
  type: NarratorMessageType
  content: string
  animated?: boolean
}) {
  const style = TYPE_STYLES[type]

  return (
    <Paper
      radius="md"
      p="md"
      style={{
        background: `linear-gradient(${style.gradient.deg}deg, var(--mantine-color-${style.gradient.from.replace('.', '-')}), var(--mantine-color-${style.gradient.to.replace('.', '-')}))`,
        opacity: 0.95,
        margin: '12px 0',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 装饰性边框 */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, transparent, var(--mantine-color-white), transparent)`
        }}
      />

      <Group gap="sm" align="flex-start">
        {/* 图标 */}
        <ThemeIcon
          size="md"
          radius="xl"
          variant="white"
          color={style.textColor.split('.')[0]}
          style={{ flexShrink: 0 }}
        >
          {style.icon}
        </ThemeIcon>

        {/* 内容 */}
        <Box style={{ flex: 1 }}>
          {/* 类型标签 */}
          <Text size="xs" c="white" opacity={0.8} mb={4}>
            【{style.label}】
          </Text>

          {/* 消息文本 */}
          <Text
            size="sm"
            c="white"
            style={{
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap'
            }}
          >
            {content}
          </Text>
        </Box>
      </Group>
    </Paper>
  )
}

// ==================== 主组件 ====================

export function NarratorMessage({
  type,
  content,
  isInline = false,
  visible = true,
  animated = true,
  className
}: NarratorMessageProps) {
  // 空内容不渲染
  if (!content || content.trim() === '') return null

  const messageElement = isInline ? (
    <InlineNarratorMessage type={type} content={content} animated={animated} />
  ) : (
    <BlockNarratorMessage type={type} content={content} animated={animated} />
  )

  // 如果启用动画
  if (animated) {
    return (
      <Transition
        mounted={visible}
        transition="fade"
        duration={400}
        timingFunction="ease"
      >
        {(styles) => (
          <Box style={styles} className={className}>
            {messageElement}
          </Box>
        )}
      </Transition>
    )
  }

  return visible ? (
    <Box className={className}>
      {messageElement}
    </Box>
  ) : null
}

// ==================== 便捷组件 ====================

/** 场景描述消息 */
export function SceneDescriptionMessage({ content, ...props }: Omit<NarratorMessageProps, 'type'>) {
  return <NarratorMessage type="scene_description" content={content} {...props} />
}

/** 时间流逝消息 */
export function TimePassageMessage({ content, ...props }: Omit<NarratorMessageProps, 'type'>) {
  return <NarratorMessage type="time_passage" content={content} isInline {...props} />
}

/** 事件公告消息 */
export function EventAnnouncementMessage({ content, ...props }: Omit<NarratorMessageProps, 'type'>) {
  return <NarratorMessage type="event_announcement" content={content} {...props} />
}

/** 氛围渲染消息 */
export function AtmosphereMessage({ content, ...props }: Omit<NarratorMessageProps, 'type'>) {
  return <NarratorMessage type="atmosphere" content={content} isInline {...props} />
}

/** 过渡旁白消息 */
export function TransitionMessage({ content, ...props }: Omit<NarratorMessageProps, 'type'>) {
  return <NarratorMessage type="transition" content={content} isInline {...props} />
}

export default NarratorMessage
