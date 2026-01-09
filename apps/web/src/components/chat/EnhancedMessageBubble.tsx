/**
 * 增强型消息气泡组件
 *
 * 使用新的渲染引擎，包含错误边界和性能监控
 * 替代原有的内联渲染逻辑
 */

'use client'

import React, { memo, useMemo } from 'react'
import { Box } from '@mantine/core'
import { renderMessage, RenderMode, type RenderOptions } from '@/lib/chat/messageRenderer'
import { performanceMonitor } from '@/lib/chat/performanceMonitor'
import MessageErrorBoundary from './MessageErrorBoundary'
import { getRegexScripts } from '@/lib/regexScriptStorage'
import { getActiveRegexScripts } from '@/lib/characterRegexStorage'

interface EnhancedMessageBubbleProps {
  /** 消息ID */
  messageId: string
  /** 消息内容 */
  content: string
  /** 是否为用户消息 */
  isUser: boolean
  /** 角色ID */
  characterId?: string
  /** 角色名称 */
  characterName?: string
  /** 是否启用GAL模式 */
  galModeEnabled?: boolean
  /** 是否为富媒体开场白（使用Rich Content Renderer） */
  isRichGreeting?: boolean
  /** 自定义样式类名 */
  className?: string
  /** 自定义样式 */
  style?: React.CSSProperties
}

/**
 * 增强型消息气泡组件
 *
 * 核心改进:
 * 1. 使用统一的渲染引擎
 * 2. 内置错误边界
 * 3. 性能监控
 * 4. 智能缓存
 */
const EnhancedMessageBubble = memo<EnhancedMessageBubbleProps>(
  ({
    messageId,
    content,
    isUser,
    characterId,
    characterName,
    galModeEnabled = false,
    isRichGreeting = false,
    className = '',
    style = {}
  }) => {
    // 获取环境变量配置
    const enableDisplayDedupe = process.env.NEXT_PUBLIC_ENABLE_DISPLAY_DEDUPLICATION === 'true'

    // 渲染配置
    const renderOptions = useMemo<RenderOptions>(() => {
      return {
        mode: isRichGreeting ? RenderMode.RICH_MEDIA : RenderMode.NORMAL,
        enableDialogueHighlight: !isUser,
        enableRegexScripts: true,
        enableDedupe: enableDisplayDedupe,
        enableStripReasoning: true,
        enableCGLayers: galModeEnabled,
        characterId,
        characterName,
        isUser,
        // 预加载regex scripts以避免每次都重新获取
        regexScripts: characterId ? getActiveRegexScripts(characterId, getRegexScripts()) : undefined
      }
    }, [isUser, characterId, characterName, galModeEnabled, isRichGreeting, enableDisplayDedupe])

    // 渲染消息（带性能监控）
    const renderResult = useMemo(() => {
      return performanceMonitor.measure(
        'renderMessage',
        () => renderMessage(content, renderOptions),
        {
          messageId,
          isUser,
          mode: renderOptions.mode
        }
      )
    }, [content, renderOptions, messageId, isUser])

    // 性能警告（仅开发模式）
    if (process.env.NODE_ENV === 'development' && renderResult.metadata.renderTime > 30) {
      console.warn(
        `[EnhancedMessageBubble] Slow render for message ${messageId}:`,
        {
          renderTime: renderResult.metadata.renderTime,
          fromCache: renderResult.metadata.fromCache,
          mode: renderResult.mode
        }
      )
    }

    return (
      <MessageErrorBoundary messageId={messageId}>
        <Box
          className={`enhanced-message-bubble ${className}`}
          style={style}
        >
          <div
            className="text-safe"
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              maxWidth: '100%',
              fontSize: '1rem',
              lineHeight: '1.75',
              position: 'relative',
            }}
            dangerouslySetInnerHTML={{ __html: renderResult.html }}
          />

          {/* 性能调试信息（仅开发模式） */}
          {process.env.NODE_ENV === 'development' && renderResult.metadata.renderTime > 0 && (
            <div
              style={{
                fontSize: '0.65rem',
                color: 'rgba(156, 163, 175, 0.6)',
                marginTop: '0.25rem',
                fontFamily: 'monospace'
              }}
            >
              ⚡ {renderResult.metadata.renderTime.toFixed(2)}ms
              {renderResult.metadata.fromCache && ' (cached)'}
            </div>
          )}
        </Box>
      </MessageErrorBoundary>
    )
  },
  // 自定义比较函数 - 只有这些属性变化时才重新渲染
  (prevProps, nextProps) => {
    return (
      prevProps.messageId === nextProps.messageId &&
      prevProps.content === nextProps.content &&
      prevProps.isUser === nextProps.isUser &&
      prevProps.characterId === nextProps.characterId &&
      prevProps.characterName === nextProps.characterName &&
      prevProps.galModeEnabled === nextProps.galModeEnabled &&
      prevProps.isRichGreeting === nextProps.isRichGreeting
    )
  }
)

EnhancedMessageBubble.displayName = 'EnhancedMessageBubble'

export default EnhancedMessageBubble
