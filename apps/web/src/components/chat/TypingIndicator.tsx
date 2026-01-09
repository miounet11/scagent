/**
 * TypingIndicator - AI 正在输入指示器组件
 *
 * 功能特性:
 * - 三个跳动的点动画（经典打字指示器）
 * - 可选显示 "AI 正在思考..." 文字
 * - 支持多种动画风格（波浪、脉冲、弹跳等）
 * - 与消息气泡风格一致的外观
 * - 支持自定义颜色和尺寸
 * - 响应式设计，支持移动端
 */

'use client'

import { memo, useMemo } from 'react'
import { Box, Text, Group, Avatar } from '@mantine/core'

/** 动画风格类型 */
export type AnimationStyle = 'bounce' | 'wave' | 'pulse' | 'fade' | 'scale'

/** 指示器尺寸 */
export type IndicatorSize = 'sm' | 'md' | 'lg'

interface TypingIndicatorProps {
  /** 动画风格 */
  animationStyle?: AnimationStyle
  /** 是否显示文字提示 */
  showText?: boolean
  /** 自定义文字内容 */
  text?: string
  /** 角色名称（用于显示 "XXX 正在输入"） */
  characterName?: string
  /** 角色头像 URL */
  characterAvatar?: string
  /** 是否显示头像 */
  showAvatar?: boolean
  /** 指示器尺寸 */
  size?: IndicatorSize
  /** 主题色（用于点的颜色） */
  color?: string
  /** 辅助色（用于发光效果） */
  glowColor?: string
  /** 是否为移动端样式 */
  isMobile?: boolean
  /** 自定义类名 */
  className?: string
}

// 尺寸配置
const SIZE_CONFIG: Record<IndicatorSize, { dot: number; gap: number; padding: string; fontSize: string; avatarSize: number }> = {
  sm: { dot: 6, gap: 4, padding: '8px 12px', fontSize: '12px', avatarSize: 32 },
  md: { dot: 8, gap: 6, padding: '12px 16px', fontSize: '14px', avatarSize: 40 },
  lg: { dot: 10, gap: 8, padding: '16px 20px', fontSize: '16px', avatarSize: 48 },
}

// 动画关键帧定义
const ANIMATION_KEYFRAMES: Record<AnimationStyle, string> = {
  bounce: `
    @keyframes typing-bounce {
      0%, 80%, 100% {
        transform: translateY(0);
        opacity: 0.6;
      }
      40% {
        transform: translateY(-8px);
        opacity: 1;
      }
    }
  `,
  wave: `
    @keyframes typing-wave {
      0%, 100% {
        transform: translateY(0);
      }
      25% {
        transform: translateY(-6px);
      }
      50% {
        transform: translateY(0);
      }
      75% {
        transform: translateY(3px);
      }
    }
  `,
  pulse: `
    @keyframes typing-pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 0.6;
      }
      50% {
        transform: scale(1.3);
        opacity: 1;
      }
    }
  `,
  fade: `
    @keyframes typing-fade {
      0%, 100% {
        opacity: 0.3;
      }
      50% {
        opacity: 1;
      }
    }
  `,
  scale: `
    @keyframes typing-scale {
      0%, 100% {
        transform: scale(0.8);
        opacity: 0.5;
      }
      50% {
        transform: scale(1.2);
        opacity: 1;
      }
    }
  `,
}

// 动画配置
const ANIMATION_CONFIG: Record<AnimationStyle, { name: string; duration: string; timing: string }> = {
  bounce: { name: 'typing-bounce', duration: '1.4s', timing: 'ease-in-out' },
  wave: { name: 'typing-wave', duration: '1.2s', timing: 'ease-in-out' },
  pulse: { name: 'typing-pulse', duration: '1s', timing: 'ease-in-out' },
  fade: { name: 'typing-fade', duration: '1.5s', timing: 'ease-in-out' },
  scale: { name: 'typing-scale', duration: '1.2s', timing: 'ease-in-out' },
}

/**
 * AI 正在输入指示器组件
 */
function TypingIndicator({
  animationStyle = 'bounce',
  showText = true,
  text,
  characterName,
  characterAvatar,
  showAvatar = true,
  size = 'md',
  color,
  glowColor,
  isMobile = false,
  className = '',
}: TypingIndicatorProps) {
  const sizeConfig = SIZE_CONFIG[size]
  const animConfig = ANIMATION_CONFIG[animationStyle]

  // 默认颜色 - 使用项目主题色
  const dotColor = color || 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
  const dotGlowColor = glowColor || 'rgba(139, 92, 246, 0.4)'

  // 显示的文字
  const displayText = useMemo(() => {
    if (text) return text
    if (characterName) return `${characterName} 正在输入...`
    return 'AI 正在思考...'
  }, [text, characterName])

  // 生成唯一的动画延迟
  const dotDelays = useMemo(() => [0, 0.16, 0.32], [])

  return (
    <>
      {/* 注入动画关键帧 */}
      <style>{ANIMATION_KEYFRAMES[animationStyle]}</style>

      <Box
        className={`typing-indicator ${className}`}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: isMobile ? '10px' : '14px',
          padding: isMobile ? '8px 12px' : '12px 16px',
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        {/* 头像 */}
        {showAvatar && (
          <Box
            style={{
              position: 'relative',
              flexShrink: 0,
            }}
          >
            {/* 发光光环 */}
            <Box
              style={{
                position: 'absolute',
                inset: -4,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${dotGlowColor} 0%, transparent 70%)`,
                animation: 'typing-pulse 2s ease-in-out infinite',
                opacity: 0.6,
              }}
            />

            {characterAvatar ? (
              <Avatar
                src={characterAvatar}
                alt={characterName}
                size={sizeConfig.avatarSize}
                radius="xl"
                style={{
                  border: '2px solid rgba(139, 92, 246, 0.5)',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {characterName?.charAt(0)}
              </Avatar>
            ) : (
              <Box
                style={{
                  width: sizeConfig.avatarSize,
                  height: sizeConfig.avatarSize,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 1,
                  border: '2px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                <Box
                  style={{
                    width: sizeConfig.avatarSize * 0.6,
                    height: sizeConfig.avatarSize * 0.6,
                    borderRadius: '50%',
                    background: dotColor,
                  }}
                />
              </Box>
            )}
          </Box>
        )}

        {/* 打字气泡 */}
        <Box
          style={{
            background: 'linear-gradient(135deg, rgba(26, 20, 41, 0.95) 0%, rgba(20, 15, 32, 0.98) 100%)',
            borderRadius: '6px 20px 20px 20px',
            padding: sizeConfig.padding,
            border: '1px solid rgba(139, 92, 246, 0.25)',
            borderLeft: '3px solid rgba(139, 92, 246, 0.6)',
            boxShadow: `0 4px 20px rgba(0, 0, 0, 0.3), 0 0 20px ${dotGlowColor}`,
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {/* 跳动的点 */}
          <Group gap={sizeConfig.gap}>
            {dotDelays.map((delay, i) => (
              <Box
                key={i}
                style={{
                  width: sizeConfig.dot,
                  height: sizeConfig.dot,
                  borderRadius: '50%',
                  background: dotColor,
                  boxShadow: `0 0 8px ${dotGlowColor}`,
                  animation: `${animConfig.name} ${animConfig.duration} ${animConfig.timing} infinite`,
                  animationDelay: `${delay}s`,
                }}
              />
            ))}
          </Group>

          {/* 文字提示 */}
          {showText && (
            <Text
              size={sizeConfig.fontSize}
              fw={500}
              style={{
                color: 'rgba(196, 181, 253, 0.9)',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              {displayText}
            </Text>
          )}
        </Box>
      </Box>
    </>
  )
}

/**
 * 简化版打字指示器 - 仅显示三个点
 */
export function DotsIndicator({
  animationStyle = 'bounce',
  size = 'md',
  color,
  glowColor,
}: Pick<TypingIndicatorProps, 'animationStyle' | 'size' | 'color' | 'glowColor'>) {
  const sizeConfig = SIZE_CONFIG[size]
  const animConfig = ANIMATION_CONFIG[animationStyle]
  const dotColor = color || 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
  const dotGlowColor = glowColor || 'rgba(139, 92, 246, 0.4)'
  const dotDelays = [0, 0.16, 0.32]

  return (
    <>
      <style>{ANIMATION_KEYFRAMES[animationStyle]}</style>
      <Group gap={sizeConfig.gap} style={{ display: 'inline-flex' }}>
        {dotDelays.map((delay, i) => (
          <Box
            key={i}
            style={{
              width: sizeConfig.dot,
              height: sizeConfig.dot,
              borderRadius: '50%',
              background: dotColor,
              boxShadow: `0 0 6px ${dotGlowColor}`,
              animation: `${animConfig.name} ${animConfig.duration} ${animConfig.timing} infinite`,
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </Group>
    </>
  )
}

/**
 * 内联打字指示器 - 用于消息气泡内部
 */
export function InlineTypingIndicator({
  animationStyle = 'bounce',
  color = 'var(--accent-gold-hex)',
  glowColor = 'rgba(245, 197, 66, 0.4)',
}: Pick<TypingIndicatorProps, 'animationStyle' | 'color' | 'glowColor'>) {
  const animConfig = ANIMATION_CONFIG[animationStyle]
  const dotDelays = [0, 0.15, 0.3]

  return (
    <>
      <style>{ANIMATION_KEYFRAMES[animationStyle]}</style>
      <Box
        component="span"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          marginLeft: '4px',
          verticalAlign: 'middle',
        }}
      >
        {dotDelays.map((delay, i) => (
          <Box
            key={i}
            component="span"
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: color,
              boxShadow: `0 0 4px ${glowColor}`,
              animation: `${animConfig.name} ${animConfig.duration} ${animConfig.timing} infinite`,
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </Box>
    </>
  )
}

/**
 * 带进度的打字指示器
 */
export function TypingIndicatorWithProgress({
  characterName,
  characterAvatar,
  elapsedSeconds = 0,
  onCancel,
  animationStyle = 'bounce',
  size = 'md',
  isMobile = false,
}: TypingIndicatorProps & {
  elapsedSeconds?: number
  onCancel?: () => void
}) {
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <TypingIndicator
        animationStyle={animationStyle}
        characterName={characterName}
        characterAvatar={characterAvatar}
        size={size}
        isMobile={isMobile}
        showText={true}
      />

      {/* 进度信息 */}
      {elapsedSeconds > 0 && (
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '6px 16px',
            marginLeft: isMobile ? '42px' : '54px',
          }}
        >
          <Text size="xs" c="dimmed">
            已用时 {formatTime(elapsedSeconds)}
          </Text>

          {onCancel && elapsedSeconds > 5 && (
            <Box
              component="button"
              onClick={onCancel}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                padding: '4px 12px',
                color: '#f87171',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              取消生成
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}

export default memo(TypingIndicator)
