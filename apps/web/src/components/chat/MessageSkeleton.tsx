/**
 * MessageSkeleton - 消息加载骨架屏组件
 *
 * 在 AI 生成回复时显示，提供更好的加载体验
 * 模拟消息气泡的形状，带有流畅的动画效果
 *
 * v2.0 更新：
 * - 添加波浪式加载动画
 * - 支持多种变体（default, minimal, immersive）
 * - 改进视觉效果和动画流畅度
 */

'use client'

import { memo, useMemo } from 'react'
import { Box, Skeleton, Stack, Text } from '@mantine/core'

interface MessageSkeletonProps {
  /** 是否是用户消息样式 */
  isUser?: boolean
  /** 行数 */
  lines?: number
  /** 是否显示头像 */
  showAvatar?: boolean
  /** 是否显示动画 */
  animated?: boolean
  /** 变体样式 */
  variant?: 'default' | 'minimal' | 'immersive'
  /** 角色名称（用于显示"正在输入"） */
  characterName?: string
}

function MessageSkeleton({
  isUser = false,
  lines = 3,
  showAvatar = true,
  animated = true,
  variant = 'default',
  characterName,
}: MessageSkeletonProps) {
  const baseColor = isUser
    ? 'rgba(245, 197, 66, 0.08)'
    : 'rgba(139, 92, 246, 0.08)'

  // 使用 useMemo 避免每次渲染生成不同的宽度
  const lineWidths = useMemo(() =>
    Array.from({ length: lines }, (_, i) => {
      if (i === lines - 1) return '40%'
      return `${70 + Math.floor(Math.random() * 30)}%`
    }), [lines])

  // 最小化变体
  if (variant === 'minimal') {
    return (
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
        }}
      >
        <Box
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'rgba(139, 92, 246, 0.6)',
            animation: animated ? 'skeleton-pulse 1.5s ease-in-out infinite' : 'none',
          }}
        />
        <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          {characterName ? `${characterName} 正在输入...` : '正在输入...'}
        </Text>
      </Box>
    )
  }

  // 沉浸式变体
  if (variant === 'immersive') {
    return (
      <>
        <style>{`
          @keyframes skeleton-shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
          @keyframes skeleton-wave {
            0%, 100% {
              transform: scaleX(0.7);
              opacity: 0.5;
            }
            50% {
              transform: scaleX(1);
              opacity: 1;
            }
          }
        `}</style>
        <Box
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '16px 20px',
            maxWidth: '85%',
          }}
        >
          {/* 头像骨架 - 带呼吸动画 */}
          {showAvatar && (
            <Box
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%)',
                flexShrink: 0,
                animation: animated ? 'skeleton-pulse 2s ease-in-out infinite' : 'none',
                border: '2px solid rgba(139, 92, 246, 0.2)',
              }}
            />
          )}

          {/* 消息内容骨架 - 带波浪动画 */}
          <Box
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, rgba(26, 20, 41, 0.8) 0%, rgba(20, 15, 32, 0.9) 100%)',
              borderRadius: '6px 20px 20px 20px',
              padding: '16px 20px',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              borderLeft: '3px solid rgba(139, 92, 246, 0.4)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {/* 角色名称 */}
            {characterName && (
              <Text
                size="sm"
                fw={600}
                mb="xs"
                style={{
                  color: 'rgba(139, 92, 246, 0.8)',
                }}
              >
                {characterName}
              </Text>
            )}

            <Stack gap={10}>
              {lineWidths.map((width, index) => (
                <Box
                  key={index}
                  style={{
                    height: 14,
                    width: width,
                    borderRadius: 4,
                    background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.2) 50%, rgba(139, 92, 246, 0.1) 100%)',
                    backgroundSize: '200% 100%',
                    animation: animated
                      ? `skeleton-shimmer 1.5s ease-in-out infinite, skeleton-wave 2s ease-in-out infinite ${index * 0.1}s`
                      : 'none',
                    transformOrigin: 'left center',
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Box>
      </>
    )
  }

  // 默认变体
  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        @keyframes skeleton-shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
      <Box
        style={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '12px 16px',
          maxWidth: '85%',
          marginLeft: isUser ? 'auto' : undefined,
          marginRight: isUser ? undefined : 'auto',
        }}
      >
        {/* 头像骨架 */}
        {showAvatar && (
          <Box
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: isUser
                ? 'linear-gradient(135deg, rgba(245, 197, 66, 0.2) 0%, rgba(245, 197, 66, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
              flexShrink: 0,
              animation: animated ? 'skeleton-pulse 2s ease-in-out infinite' : 'none',
            }}
          />
        )}

        {/* 消息内容骨架 */}
        <Box
          style={{
            flex: 1,
            background: isUser
              ? 'linear-gradient(135deg, rgba(245, 197, 66, 0.06) 0%, rgba(245, 197, 66, 0.02) 100%)'
              : 'linear-gradient(135deg, rgba(26, 20, 41, 0.6) 0%, rgba(20, 15, 32, 0.7) 100%)',
            borderRadius: isUser ? '16px 6px 16px 16px' : '6px 16px 16px 16px',
            padding: '14px 18px',
            border: isUser
              ? '1px solid rgba(245, 197, 66, 0.2)'
              : '1px solid rgba(139, 92, 246, 0.15)',
          }}
        >
          <Stack gap={8}>
            {lineWidths.map((width, index) => (
              <Box
                key={index}
                style={{
                  height: 14,
                  width: width,
                  borderRadius: 4,
                  background: isUser
                    ? 'linear-gradient(90deg, rgba(245, 197, 66, 0.1) 0%, rgba(245, 197, 66, 0.2) 50%, rgba(245, 197, 66, 0.1) 100%)'
                    : 'linear-gradient(90deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.2) 50%, rgba(139, 92, 246, 0.1) 100%)',
                  backgroundSize: '200% 100%',
                  animation: animated ? `skeleton-shimmer 1.5s ease-in-out infinite ${index * 0.15}s` : 'none',
                }}
              />
            ))}
          </Stack>
        </Box>
      </Box>
    </>
  )
}

/**
 * 打字指示器 - 显示 AI 正在输入
 */
export function TypingIndicator() {
  return (
    <>
      <style>{`
        @keyframes typing-bounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.6;
          }
          40% {
            transform: translateY(-6px);
            opacity: 1;
          }
        }
      `}</style>
      <Box
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '12px 16px',
        }}
      >
        {/* 头像 */}
        <Box
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Box
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
            }}
          />
        </Box>

        {/* 打字气泡 */}
        <Box
          style={{
            background: 'linear-gradient(135deg, rgba(26, 20, 41, 0.8) 0%, rgba(20, 15, 32, 0.9) 100%)',
            borderRadius: '16px',
            padding: '14px 20px',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                animation: `typing-bounce 1.4s infinite ease-in-out`,
                animationDelay: `${i * 0.16}s`,
              }}
            />
          ))}
        </Box>
      </Box>
    </>
  )
}

/**
 * 生成中状态组件 - 显示进度和预估时间
 */
export function GeneratingStatus({
  elapsedSeconds,
  onCancel,
}: {
  elapsedSeconds: number
  onCancel?: () => void
}) {
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}分${secs}秒`
  }

  return (
    <>
      <style>{`
        @keyframes generating-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '8px 16px',
          background: 'rgba(139, 92, 246, 0.1)',
          borderRadius: '8px',
          margin: '8px 16px',
        }}
      >
        <Box
          style={{
            width: 16,
            height: 16,
            border: '2px solid rgba(139, 92, 246, 0.3)',
            borderTopColor: '#8b5cf6',
            borderRadius: '50%',
            animation: 'generating-spin 1s linear infinite',
          }}
        />
        <Box style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>
          正在生成... {formatTime(elapsedSeconds)}
        </Box>
        {onCancel && elapsedSeconds > 5 && (
          <Box
            component="button"
            onClick={onCancel}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '6px',
              padding: '4px 12px',
              color: '#f87171',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            取消
          </Box>
        )}
      </Box>
    </>
  )
}

export default memo(MessageSkeleton)
