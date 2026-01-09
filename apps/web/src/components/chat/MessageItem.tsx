/**
 * Optimized message item component with React.memo and useMemo
 * 性能优化：仅在 content 或 id 变化时重渲染
 */

import { memo, useMemo, useState } from 'react'
import { Message } from '@sillytavern-clone/shared'
import { formatDistanceToNow } from 'date-fns'
import { applyRegexScripts, getRegexScripts } from '@/lib/regexScriptStorage'
import { getActiveRegexScripts } from '@/lib/characterRegexStorage'
import { parseCGTags, getCGLayerStyles } from '@/lib/cgParser'
import { useTranslation } from '@/lib/i18n'
import toast from 'react-hot-toast'
import { stripReasoningBlocks, isStripReasoningEnabled } from '@/lib/stripReasoningBlocks'
import { replaceMessageVariables } from '@/lib/preset-application'
import {
  Box,
  Group,
  Avatar,
  Text,
  Menu,
  ActionIcon,
  Textarea,
  Button,
  Tooltip,
} from '@mantine/core'
import {
  IconCopy,
  IconRefresh,
  IconTrash,
  IconUser,
  IconRobot,
  IconEdit,
  IconDotsVertical,
  IconCheck,
  IconX,
  IconSettings,
} from '@tabler/icons-react'

interface MessageItemProps {
  message: Message
  characterName?: string
  characterAvatar?: string
  characterId?: string
  galModeEnabled?: boolean
  isLastAssistantMessage?: boolean
  isCharacterNSFW?: boolean
  onEditMessage?: (messageId: string, newContent: string) => void
  onDeleteMessage?: (messageId: string) => void
  onRegenerateMessage?: (messageId: string) => void
}

const MessageItem = memo(({
  message,
  characterName = 'Character',
  characterAvatar,
  characterId,
  galModeEnabled = false,
  isLastAssistantMessage = false,
  isCharacterNSFW = false,
  onEditMessage,
  onDeleteMessage,
  onRegenerateMessage
}: MessageItemProps) => {
  const { t } = useTranslation()
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isNSFWRevealed, setIsNSFWRevealed] = useState(false)

  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  const isEditing = editingMessageId === message.id

  // Get NSFW settings from localStorage
  const nsfwSettings = useMemo(() => {
    try {
      const settings = localStorage.getItem('app_settings')
      if (settings) {
        const parsed = JSON.parse(settings)
        return parsed.nsfw || { enabled: false, blurLevel: 'heavy' }
      }
    } catch (error) {
      console.error('Error reading NSFW settings:', error)
    }
    return { enabled: false, blurLevel: 'heavy' }
  }, [])

  // Check if content should be blurred
  const shouldBlurContent = useMemo(() => {
    // Only blur assistant messages from NSFW characters when NSFW is disabled
    return !isUser && isCharacterNSFW && !nsfwSettings.enabled && !isNSFWRevealed
  }, [isUser, isCharacterNSFW, nsfwSettings.enabled, isNSFWRevealed])

  // Get blur CSS class based on blur level
  const blurClass = useMemo(() => {
    if (!shouldBlurContent) return ''
    switch (nsfwSettings.blurLevel) {
      case 'light':
        return 'blur-sm'
      case 'heavy':
        return 'blur-lg'
      case 'none':
      default:
        return ''
    }
  }, [shouldBlurContent, nsfwSettings.blurLevel])

  // Parse CG tags if GAL mode is enabled
  const cgData = useMemo(() => {
    if (!galModeEnabled || !message.content || isUser || isSystem) {
      return { cleanedContent: message.content, layers: [] }
    }
    return parseCGTags(message.content)
  }, [message.content, galModeEnabled, isUser, isSystem])

  // 使用 useMemo 缓存格式化内容，避免重复计算
  const formattedContent = useMemo(() => {
    // 系统消息不需要格式化，直接返回原始内容
    if (isSystem) {
      return message.content
    }
    
    const contentToFormat = galModeEnabled ? cgData.cleanedContent : message.content
    if (!contentToFormat) return ''
    
    // 1. 首先替换模板变量 {{user}}, {{char}} 等
    let preprocessed = replaceMessageVariables(contentToFormat, characterName)
    
    // 2. Strip reasoning blocks (assistant only) when enabled
    try {
      if (!isUser && isStripReasoningEnabled()) {
        preprocessed = stripReasoningBlocks(preprocessed)
      }
    } catch {}
    
    // 3. Get active regex scripts (character-specific or global)
    const globalScripts = getRegexScripts()
    const activeScripts = getActiveRegexScripts(characterId, globalScripts)
    
    // 4. Apply regex scripts
    let formatted = applyRegexScripts(preprocessed, activeScripts)
    
    // 5. Then apply basic formatting
    formatted = formatted
      .replace(/\n/g, '<br />')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold text-blue-300 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-purple-300 mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-purple-400 mt-4 mb-2">$1</h1>')
    
    return formatted
  }, [message.content, cgData.cleanedContent, galModeEnabled, characterId, characterName, isSystem, isUser])

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content)
    toast.success(t('chat.message.copied'))
  }

  const handleStartEdit = () => {
    setEditingMessageId(message.id)
    setEditContent(message.content)
  }

  const handleSaveEdit = () => {
    if (editContent.trim() && onEditMessage) {
      onEditMessage(message.id, editContent)
      setEditingMessageId(null)
      setEditContent('')
    }
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditContent('')
  }

  const handleDeleteMessage = () => {
    if (confirm(t('chat.message.deleteConfirm'))) {
      if (onDeleteMessage) {
        onDeleteMessage(message.id)
      }
    }
  }

  const handleRegenerateMessage = () => {
    if (onRegenerateMessage) {
      onRegenerateMessage(message.id)
    }
  }

  // 时间戳格式化（也缓存）
  const timeAgo = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })
    } catch {
      return ''
    }
  }, [message.timestamp])

  // System message 特殊渲染
  if (isSystem) {
    // 清理系统消息内容，移除标记
    const cleanContent = message.content
      .replace(/^\[系统指令\]\s*/i, '')
      .replace(/^\[系统消息\]\s*/i, '')
      .trim()
    
    return (
      <Box
        p="sm"
        my="sm"
        style={{
          backgroundColor: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: 'var(--radius-md)',
          textAlign: 'center',
        }}
      >
        <Group justify="center" gap="xs" mb="xs">
          <IconSettings size={16} color="rgba(99, 102, 241, 0.8)" />
          <Text size="xs" fw={600} c="indigo" style={{ fontStyle: 'italic' }}>
            系统消息
          </Text>
        </Group>
        <Text 
          size="sm" 
          c="dimmed" 
          style={{ 
            fontStyle: 'italic',
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap'
          }}
        >
          {cleanContent}
        </Text>
        {timeAgo && (
          <Text size="xs" c="dimmed" mt="xs" style={{ opacity: 0.6 }}>
            {timeAgo}
          </Text>
        )}
      </Box>
    )
  }

  return (
    <Group
      gap="md"
      align="flex-start"
      p="md"
      style={{
        backgroundColor: 'hsl(var(--accent-gold) / 0.06)',
        borderRadius: 'var(--radius-lg)',
        transition: 'background-color 0.2s',
      }}
    >
      {/* Avatar */}
      <Avatar
        size="md"
        radius="xl"
        color={'accent'}
        style={{ flexShrink: 0 }}
      >
        {isUser ? (
          <IconUser size={20} />
        ) : characterAvatar ? (
          <img src={characterAvatar} alt={characterName} />
        ) : (
          <IconRobot size={20} />
        )}
      </Avatar>

      {/* Content */}
      <Box style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <Group justify="space-between" mb="xs">
          <Group gap="xs">
            <Text size="sm" fw={600} style={{ color: 'var(--accent-gold-hex)' }}>
              {isUser ? 'You' : characterName}
            </Text>
            {timeAgo && (
              <Text size="xs" c="dimmed">
                {timeAgo}
              </Text>
            )}
          </Group>

          {/* Actions Menu */}
          <Menu position="bottom-end" shadow="md" withinPortal>
            <Menu.Target>
              <ActionIcon variant="subtle" size="sm" color="gray">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconCopy size={14} />}
                onClick={handleCopyMessage}
              >
                {t('chat.message.copy')}
              </Menu.Item>
              {onEditMessage && (
                <Menu.Item
                  leftSection={<IconEdit size={14} />}
                  onClick={handleStartEdit}
                >
                  {t('chat.message.edit')}
                </Menu.Item>
              )}
              {!isUser && isLastAssistantMessage && onRegenerateMessage && (
                <Menu.Item
                  leftSection={<IconRefresh size={14} />}
                  onClick={handleRegenerateMessage}
                >
                  {t('chat.message.regenerate')}
                </Menu.Item>
              )}
              {onDeleteMessage && (
                <Menu.Item
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={handleDeleteMessage}
                >
                  {t('chat.message.delete')}
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        </Group>

        {/* Message Content */}
        {isEditing ? (
          <Box>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              minRows={3}
              autosize
              mb="xs"
            />
            <Group gap="xs">
              <Button
                size="xs"
                leftSection={<IconCheck size={14} />}
                onClick={handleSaveEdit}
              >
                {t('chat.message.save')}
              </Button>
              <Button
                size="xs"
                variant="subtle"
                color="gray"
                leftSection={<IconX size={14} />}
                onClick={handleCancelEdit}
              >
                {t('chat.message.cancel')}
              </Button>
            </Group>
          </Box>
        ) : (
          <div className="relative">
            {/* CG Layers (only for GAL mode) */}
            {galModeEnabled && cgData.layers.length > 0 && (
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                {cgData.layers.map((layer, index) => (
                  <div
                    key={index}
                    className={`cg-layer cg-layer-${layer.layer}`}
                    style={getCGLayerStyles(layer)}
                  />
                ))}
              </div>
            )}
            
            {/* Message Content */}
            <div
              className={`whitespace-pre-wrap break-words text-sm leading-relaxed transition-all duration-300 ${blurClass}`}
              dangerouslySetInnerHTML={{ __html: formattedContent }}
              style={{ 
                color: 'hsl(var(--text-primary))',
                position: 'relative',
                zIndex: 4
              }}
            />
            
            {/* NSFW Warning Overlay */}
            {shouldBlurContent && (
              <div 
                className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm rounded-lg cursor-pointer transition-all hover:bg-gray-900/90"
                onClick={() => setIsNSFWRevealed(true)}
              >
                <div className="text-center p-4">
                  <div className="mb-2">
                    <span className="inline-block px-3 py-1 text-sm font-bold bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-full animate-pulse">
                      18+
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-1 font-medium">该内容已被隐藏</p>
                  <p className="text-gray-400 text-xs">点击此处临时显示</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Box>
    </Group>
  )
}, (prevProps, nextProps) => {
  // 自定义比较函数：仅在这些属性变化时才重渲染
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.timestamp === nextProps.message.timestamp &&
    prevProps.characterName === nextProps.characterName &&
    prevProps.characterId === nextProps.characterId &&
    prevProps.galModeEnabled === nextProps.galModeEnabled &&
    prevProps.isLastAssistantMessage === nextProps.isLastAssistantMessage
  )
})

MessageItem.displayName = 'MessageItem'

export default MessageItem

