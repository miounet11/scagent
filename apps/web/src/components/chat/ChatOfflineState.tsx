/**
 * ChatOfflineState - 网络离线状态组件
 *
 * 在网络断开时显示友好的离线提示
 * 支持自动检测网络恢复和手动重连
 */

'use client'

import { memo, useEffect, useState, useCallback } from 'react'
import { Box, Stack, Text, Button, Group, Progress } from '@mantine/core'
import {
  IconWifiOff,
  IconRefresh,
  IconCloud,
  IconCloudOff,
} from '@tabler/icons-react'
import { useTranslation } from '@/lib/i18n'

interface ChatOfflineStateProps {
  /** 重连回调 */
  onReconnect?: () => void
  /** 是否正在重连 */
  isReconnecting?: boolean
  /** 是否显示为浮动横幅（而非全屏） */
  variant?: 'fullscreen' | 'banner'
  /** 自动重连间隔（毫秒），0 表示禁用 */
  autoReconnectInterval?: number
  /** 关闭横幅回调（仅 banner 模式） */
  onDismiss?: () => void
}

function ChatOfflineState({
  onReconnect,
  isReconnecting = false,
  variant = 'fullscreen',
  autoReconnectInterval = 5000,
  onDismiss,
}: ChatOfflineStateProps) {
  const { t } = useTranslation()
  const [isOnline, setIsOnline] = useState(true)
  const [countdown, setCountdown] = useState(0)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  // 监听网络状态变化
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setReconnectAttempts(0)
      onReconnect?.()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    // 初始化状态
    setIsOnline(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [onReconnect])

  // 自动重连倒计时
  useEffect(() => {
    if (isOnline || autoReconnectInterval <= 0 || isReconnecting) {
      setCountdown(0)
      return
    }

    const intervalSeconds = Math.floor(autoReconnectInterval / 1000)
    setCountdown(intervalSeconds)

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // 触发重连
          setReconnectAttempts((a) => a + 1)
          onReconnect?.()
          return intervalSeconds
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOnline, autoReconnectInterval, isReconnecting, onReconnect])

  // 手动重连
  const handleManualReconnect = useCallback(() => {
    setReconnectAttempts((a) => a + 1)
    onReconnect?.()
  }, [onReconnect])

  // 如果在线，不显示任何内容
  if (isOnline && variant === 'fullscreen') {
    return null
  }

  // 横幅模式
  if (variant === 'banner') {
    if (isOnline) return null

    return (
      <Box
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(234, 88, 12, 0.15) 100%)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
          padding: '10px 16px',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap="sm" wrap="nowrap">
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <IconWifiOff size={18} style={{ color: '#f59e0b' }} />
            </Box>
            <Stack gap={2}>
              <Text size="sm" fw={600} style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
                网络已断开
              </Text>
              <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {countdown > 0 ? `${countdown}秒后自动重连...` : '请检查网络连接'}
              </Text>
            </Stack>
          </Group>

          <Group gap="xs">
            <Button
              variant="light"
              size="xs"
              color="yellow"
              leftSection={<IconRefresh size={14} />}
              onClick={handleManualReconnect}
              loading={isReconnecting}
            >
              重连
            </Button>
            {onDismiss && (
              <Button
                variant="subtle"
                size="xs"
                color="gray"
                onClick={onDismiss}
              >
                关闭
              </Button>
            )}
          </Group>
        </Group>

        {/* 自动重连进度条 */}
        {countdown > 0 && autoReconnectInterval > 0 && (
          <Progress
            value={(countdown / (autoReconnectInterval / 1000)) * 100}
            size="xs"
            color="yellow"
            mt="xs"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          />
        )}
      </Box>
    )
  }

  // 全屏模式
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
      {/* 动画图标 */}
      <Box
        style={{
          position: 'relative',
          width: 100,
          height: 100,
          marginBottom: 24,
        }}
      >
        {/* 背景圆环 */}
        <Box
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(234, 88, 12, 0.1) 100%)',
            border: '2px solid rgba(245, 158, 11, 0.2)',
            animation: 'offline-pulse 2s ease-in-out infinite',
          }}
        />

        {/* 图标容器 */}
        <Box
          style={{
            position: 'absolute',
            inset: 10,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(234, 88, 12, 0.2) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isReconnecting ? (
            <IconCloud
              size={40}
              style={{
                color: '#f59e0b',
                animation: 'offline-bounce 1s ease-in-out infinite',
              }}
            />
          ) : (
            <IconCloudOff size={40} style={{ color: '#f59e0b' }} />
          )}
        </Box>
      </Box>

      {/* 标题 */}
      <Text
        size="xl"
        fw={600}
        style={{
          color: 'rgba(255, 255, 255, 0.95)',
          marginBottom: 8,
        }}
      >
        {isReconnecting ? '正在重新连接...' : '网络连接已断开'}
      </Text>

      {/* 描述 */}
      <Text
        size="sm"
        style={{
          color: 'rgba(255, 255, 255, 0.6)',
          maxWidth: 320,
          marginBottom: 8,
          lineHeight: 1.6,
        }}
      >
        {isReconnecting
          ? '请稍候，正在尝试恢复连接'
          : '无法连接到服务器，请检查你的网络设置'}
      </Text>

      {/* 重连次数 */}
      {reconnectAttempts > 0 && (
        <Text
          size="xs"
          style={{
            color: 'rgba(255, 255, 255, 0.4)',
            marginBottom: 16,
          }}
        >
          已尝试重连 {reconnectAttempts} 次
        </Text>
      )}

      {/* 自动重连倒计时 */}
      {countdown > 0 && !isReconnecting && (
        <Box style={{ width: '100%', maxWidth: 200, marginBottom: 16 }}>
          <Text size="xs" mb="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            {countdown} 秒后自动重连
          </Text>
          <Progress
            value={(countdown / (autoReconnectInterval / 1000)) * 100}
            size="sm"
            color="yellow"
            radius="xl"
            style={{ background: 'rgba(255, 255, 255, 0.1)' }}
          />
        </Box>
      )}

      {/* 操作按钮 */}
      <Button
        variant="gradient"
        gradient={{ from: '#f59e0b', to: '#ea580c', deg: 135 }}
        size="md"
        leftSection={<IconRefresh size={18} />}
        onClick={handleManualReconnect}
        loading={isReconnecting}
        style={{
          boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
        }}
      >
        {isReconnecting ? '连接中...' : '立即重连'}
      </Button>

      {/* 帮助提示 */}
      <Stack gap="xs" mt="xl" align="center">
        <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
          可能的解决方法：
        </Text>
        <Group gap="md">
          <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            检查 Wi-Fi 连接
          </Text>
          <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>|</Text>
          <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            切换移动数据
          </Text>
          <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>|</Text>
          <Text size="xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            刷新页面
          </Text>
        </Group>
      </Stack>

      {/* 动画样式 */}
      <style>{`
        @keyframes offline-pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.7;
          }
        }

        @keyframes offline-bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </Box>
  )
}

export default memo(ChatOfflineState)
