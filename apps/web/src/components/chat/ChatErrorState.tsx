/**
 * ChatErrorState - 聊天错误状态组件
 *
 * 显示友好的错误提示和重试选项
 * 支持不同类型的错误（网络、服务器、超时等）
 */

'use client'

import { memo } from 'react'
import { Box, Stack, Text, Button, Group, Paper, ThemeIcon } from '@mantine/core'
import {
  IconAlertTriangle,
  IconRefresh,
  IconWifi,
  IconServer,
  IconClock,
  IconBug,
  IconHome,
  IconSettings,
} from '@tabler/icons-react'
import { useTranslation } from '@/lib/i18n'

export type ErrorType = 'network' | 'server' | 'timeout' | 'auth' | 'rateLimit' | 'unknown'

interface ChatErrorStateProps {
  /** 错误类型 */
  errorType?: ErrorType
  /** 错误消息 */
  errorMessage?: string
  /** 重试回调 */
  onRetry?: () => void
  /** 返回首页回调 */
  onGoHome?: () => void
  /** 打开设置回调 */
  onOpenSettings?: () => void
  /** 是否正在重试 */
  isRetrying?: boolean
  /** 重试次数 */
  retryCount?: number
  /** 最大重试次数 */
  maxRetries?: number
  /** 是否显示详细信息 */
  showDetails?: boolean
}

// 错误类型配置
const ERROR_CONFIG: Record<ErrorType, {
  icon: typeof IconAlertTriangle
  title: string
  description: string
  color: string
  gradient: string
}> = {
  network: {
    icon: IconWifi,
    title: '网络连接失败',
    description: '无法连接到服务器，请检查你的网络连接',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(234, 88, 12, 0.2) 100%)',
  },
  server: {
    icon: IconServer,
    title: '服务器错误',
    description: '服务器暂时无法处理请求，请稍后重试',
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
  },
  timeout: {
    icon: IconClock,
    title: '请求超时',
    description: '服务器响应时间过长，请稍后重试',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.2) 100%)',
  },
  auth: {
    icon: IconAlertTriangle,
    title: '认证失败',
    description: '登录状态已过期，请重新登录',
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
  },
  rateLimit: {
    icon: IconClock,
    title: '请求过于频繁',
    description: '请稍等片刻后再试',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(14, 165, 233, 0.2) 100%)',
  },
  unknown: {
    icon: IconBug,
    title: '出了点问题',
    description: '发生了未知错误，请稍后重试',
    color: '#6b7280',
    gradient: 'linear-gradient(135deg, rgba(107, 114, 128, 0.2) 0%, rgba(75, 85, 99, 0.2) 100%)',
  },
}

function ChatErrorState({
  errorType = 'unknown',
  errorMessage,
  onRetry,
  onGoHome,
  onOpenSettings,
  isRetrying = false,
  retryCount = 0,
  maxRetries = 3,
  showDetails = false,
}: ChatErrorStateProps) {
  const { t } = useTranslation()
  const config = ERROR_CONFIG[errorType]
  const IconComponent = config.icon
  const canRetry = retryCount < maxRetries

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        textAlign: 'center',
        minHeight: '250px',
      }}
    >
      <Paper
        p="xl"
        radius="lg"
        style={{
          background: config.gradient,
          border: `1px solid ${config.color}33`,
          backdropFilter: 'blur(16px)',
          maxWidth: 420,
          width: '100%',
        }}
      >
        <Stack align="center" gap="md">
          {/* 错误图标 */}
          <Box
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: `${config.color}20`,
              border: `2px solid ${config.color}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            <IconComponent size={32} style={{ color: config.color }} />
          </Box>

          {/* 错误标题 */}
          <Text
            size="lg"
            fw={600}
            style={{ color: 'rgba(255, 255, 255, 0.95)' }}
          >
            {t(`chat.error.${errorType}Title`) || config.title}
          </Text>

          {/* 错误描述 */}
          <Text
            size="sm"
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: 1.6,
              maxWidth: 320,
            }}
          >
            {errorMessage || t(`chat.error.${errorType}Description`) || config.description}
          </Text>

          {/* 重试次数提示 */}
          {retryCount > 0 && (
            <Text
              size="xs"
              style={{ color: 'rgba(255, 255, 255, 0.5)' }}
            >
              已重试 {retryCount} 次 {!canRetry && '(已达上限)'}
            </Text>
          )}

          {/* 操作按钮 */}
          <Group gap="sm" mt="sm">
            {onRetry && canRetry && (
              <Button
                variant="filled"
                size="sm"
                leftSection={<IconRefresh size={16} />}
                onClick={onRetry}
                loading={isRetrying}
                style={{
                  background: config.color,
                  boxShadow: `0 4px 16px ${config.color}40`,
                }}
              >
                {isRetrying ? '重试中...' : '重试'}
              </Button>
            )}

            {onGoHome && (
              <Button
                variant="subtle"
                size="sm"
                leftSection={<IconHome size={16} />}
                onClick={onGoHome}
                style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  background: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                返回首页
              </Button>
            )}

            {errorType === 'auth' && onOpenSettings && (
              <Button
                variant="subtle"
                size="sm"
                leftSection={<IconSettings size={16} />}
                onClick={onOpenSettings}
                style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  background: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                打开设置
              </Button>
            )}
          </Group>

          {/* 详细错误信息（开发模式） */}
          {showDetails && errorMessage && process.env.NODE_ENV === 'development' && (
            <Box
              mt="md"
              p="sm"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: 8,
                width: '100%',
              }}
            >
              <Text
                size="xs"
                style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                }}
              >
                {errorMessage}
              </Text>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* 帮助提示 */}
      <Text
        size="xs"
        mt="lg"
        style={{
          color: 'rgba(255, 255, 255, 0.4)',
          maxWidth: 300,
        }}
      >
        {errorType === 'network'
          ? '提示：检查 Wi-Fi 或移动数据是否正常'
          : errorType === 'timeout'
          ? '提示：服务器可能正在处理大量请求'
          : '如果问题持续存在，请联系技术支持'}
      </Text>

      {/* 脉冲动画样式 */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
      `}</style>
    </Box>
  )
}

export default memo(ChatErrorState)
