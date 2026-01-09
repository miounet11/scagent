/**
 * 消息渲染错误边界组件
 *
 * 🎯 核心功能:
 * - 捕获单条消息渲染错误
 * - 防止错误传播到整个聊天列表
 * - 提供友好的错误提示和重试机制
 * - 收集错误信息用于调试
 *
 * ⚠️ 生产环境警告:
 * - 13,803+用户依赖稳定的聊天体验
 * - 单条消息崩溃不应影响其他消息
 * - 必须提供清晰的错误反馈
 */

'use client'

import React, { Component, ReactNode } from 'react'
import { Box, Text, Button, Group, Alert, Stack, Code } from '@mantine/core'
import { IconAlertCircle, IconRefresh, IconBug } from '@tabler/icons-react'

interface MessageErrorBoundaryProps {
  /** 子组件 */
  children: ReactNode
  /** 消息ID（用于错误报告） */
  messageId?: string
  /** 自定义降级UI */
  fallback?: ReactNode
  /** 错误回调 */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface MessageErrorBoundaryState {
  /** 是否发生错误 */
  hasError: boolean
  /** 错误对象 */
  error?: Error
  /** 错误详情 */
  errorInfo?: React.ErrorInfo
  /** 重试次数 */
  retryCount: number
}

/**
 * 消息错误边界
 *
 * React Error Boundary 用于捕获渲染期间的错误
 * 防止单条消息的错误导致整个聊天列表崩溃
 */
export default class MessageErrorBoundary extends Component<
  MessageErrorBoundaryProps,
  MessageErrorBoundaryState
> {
  constructor(props: MessageErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0
    }
  }

  /**
   * 静态方法: 从错误中派生状态
   */
  static getDerivedStateFromError(error: Error): Partial<MessageErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  /**
   * 生命周期: 捕获错误
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { messageId, onError } = this.props

    // 记录错误到控制台
    console.error('[MessageErrorBoundary] Caught error:', {
      messageId,
      error,
      errorInfo,
      componentStack: errorInfo.componentStack
    })

    // 更新状态
    this.setState({
      error,
      errorInfo
    })

    // 调用错误回调
    if (onError) {
      onError(error, errorInfo)
    }

    // 生产环境: 上报错误到监控系统
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToMonitoring(error, errorInfo, messageId)
    }
  }

  /**
   * 上报错误到监控系统
   */
  private reportErrorToMonitoring(
    error: Error,
    errorInfo: React.ErrorInfo,
    messageId?: string
  ) {
    try {
      // TODO: 集成实际的错误监控服务（如 Sentry）
      const errorData = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        messageId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }

      console.log('[ErrorMonitoring] Would report:', errorData)

      // 示例: 发送到后端API
      // fetch('/api/errors/report', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // })
    } catch (reportError) {
      console.error('[ErrorMonitoring] Failed to report error:', reportError)
    }
  }

  /**
   * 重试渲染
   */
  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }))
  }

  /**
   * 复制错误信息
   */
  handleCopyError = () => {
    const { error, errorInfo } = this.state
    const { messageId } = this.props

    const errorText = [
      '=== 消息渲染错误报告 ===',
      `消息ID: ${messageId || '未知'}`,
      `时间: ${new Date().toISOString()}`,
      '',
      '错误信息:',
      error?.toString() || '未知错误',
      '',
      '错误堆栈:',
      error?.stack || '无堆栈信息',
      '',
      '组件堆栈:',
      errorInfo?.componentStack || '无组件堆栈'
    ].join('\n')

    navigator.clipboard.writeText(errorText).then(
      () => {
        console.log('[MessageErrorBoundary] Error copied to clipboard')
      },
      (err) => {
        console.error('[MessageErrorBoundary] Failed to copy:', err)
      }
    )
  }

  render() {
    const { hasError, error, retryCount } = this.state
    const { children, fallback, messageId } = this.props

    // 没有错误,正常渲染子组件
    if (!hasError) {
      return children
    }

    // 发生错误,渲染降级UI

    // 如果提供了自定义fallback
    if (fallback) {
      return fallback
    }

    // 默认错误UI
    return (
      <Box
        p="md"
        style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <Alert
          icon={<IconAlertCircle size={20} />}
          title="消息渲染失败"
          color="red"
          variant="light"
        >
          <Stack gap="sm">
            <Text size="sm">
              该消息在渲染时发生错误。您可以尝试重新渲染，或联系技术支持。
            </Text>

            {/* 错误详情（开发模式） */}
            {process.env.NODE_ENV === 'development' && error && (
              <Box>
                <Text size="xs" fw={600} c="dimmed" mb="xs">
                  错误详情 (仅开发环境可见):
                </Text>
                <Code
                  block
                  style={{
                    fontSize: '0.75rem',
                    maxHeight: '200px',
                    overflow: 'auto',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: '#ff6b6b'
                  }}
                >
                  {error.toString()}
                  {'\n\n'}
                  {error.stack}
                </Code>
              </Box>
            )}

            {/* 操作按钮 */}
            <Group gap="xs" mt="sm">
              <Button
                size="xs"
                variant="light"
                color="blue"
                leftSection={<IconRefresh size={14} />}
                onClick={this.handleRetry}
              >
                重试 {retryCount > 0 && `(${retryCount})`}
              </Button>

              {process.env.NODE_ENV === 'development' && (
                <Button
                  size="xs"
                  variant="subtle"
                  color="gray"
                  leftSection={<IconBug size={14} />}
                  onClick={this.handleCopyError}
                >
                  复制错误信息
                </Button>
              )}
            </Group>

            {/* 消息ID（用于调试） */}
            {messageId && process.env.NODE_ENV === 'development' && (
              <Text size="xs" c="dimmed" mt="xs">
                消息ID: {messageId}
              </Text>
            )}
          </Stack>
        </Alert>
      </Box>
    )
  }
}

/**
 * 函数式包装器（可选）
 *
 * 提供更简洁的使用方式
 */
export function withMessageErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  messageIdExtractor?: (props: P) => string
) {
  return function MessageErrorBoundaryWrapper(props: P) {
    const messageId = messageIdExtractor ? messageIdExtractor(props) : undefined

    return (
      <MessageErrorBoundary messageId={messageId}>
        <Component {...props} />
      </MessageErrorBoundary>
    )
  }
}
