"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { X, Save } from 'lucide-react'
import { useTranslation, getLocale } from '@/lib/i18n'

interface ChatNode {
  id: string
  content: string
  role: 'user' | 'assistant'
  memorySummary?: string
  timestamp: string
}

interface ChatNodeEditorProps {
  isOpen: boolean
  onClose: () => void
  nodeId: string | null
  onSave?: (nodeId: string, data: { content: string; memorySummary?: string }) => void
}

export default function ChatNodeEditor({
  isOpen,
  onClose,
  nodeId,
  onSave
}: ChatNodeEditorProps) {
  const { t } = useTranslation()
  const [content, setContent] = useState('')
  const [memorySummary, setMemorySummary] = useState('')
  const [originalNode, setOriginalNode] = useState<ChatNode | null>(null)

  // Mock: Load node data
  useEffect(() => {
    if (isOpen && nodeId) {
      // In production, fetch from API
      const mockNode: ChatNode = {
        id: nodeId,
        content: '这是一条示例消息内容，可以在这里编辑。你可以修改消息的内容，以及与之关联的记忆摘要。',
        role: 'assistant',
        memorySummary: '## 记忆摘要\n\n### 关键信息\n- 用户询问了关于项目的信息\n- AI 提供了详细的解释\n- 讨论了未来的计划\n\n### 重要细节\n- 项目名称: SillyTavern\n- 开发语言: TypeScript\n- 框架: Next.js\n\n### 后续行动\n- 继续完善功能\n- 优化用户体验',
        timestamp: new Date().toISOString()
      }
      
      setOriginalNode(mockNode)
      setContent(mockNode.content)
      setMemorySummary(mockNode.memorySummary || '')
    }
  }, [isOpen, nodeId])

  const handleSave = () => {
    if (!nodeId) return

    onSave?.(nodeId, {
      content,
      memorySummary
    })

    onClose()
  }

  const handleCancel = () => {
    // Reset to original values
    if (originalNode) {
      setContent(originalNode.content)
      setMemorySummary(originalNode.memorySummary || '')
    }
    onClose()
  }

  if (!isOpen || !nodeId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-6xl h-[85vh] bg-gray-900/95 backdrop-blur-xl rounded-lg border border-gray-700/50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
          <div>
            <h2 className="text-2xl font-bold text-gray-100">{t('chat.nodeEditor.title')}</h2>
            <p className="text-sm text-gray-400 mt-1">{t('chat.nodeEditor.nodeId')}: {nodeId}</p>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Memory Summary */}
          <div className="flex-1 border-r border-gray-800 p-6 flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-100 mb-2">{t('chat.nodeEditor.memorySummary.title')}</h3>
              <p className="text-sm text-gray-400">
                {t('chat.nodeEditor.memorySummary.description')}
              </p>
            </div>

            <Textarea
              value={memorySummary}
              onChange={(e) => setMemorySummary(e.target.value)}
              className="flex-1 tavern-textarea font-mono text-sm resize-none"
              placeholder={t('chat.nodeEditor.memorySummary.placeholder')}
            />

            <div className="mt-4 text-xs text-gray-500">
              <p>{t('chat.nodeEditor.memorySummary.tips.title')}</p>
              <p>{t('chat.nodeEditor.memorySummary.tips.sections')}</p>
              <p>{t('chat.nodeEditor.memorySummary.tips.lists')}</p>
              <p>{t('chat.nodeEditor.memorySummary.tips.formatting')}</p>
            </div>
          </div>

          {/* Right Panel - Message Content */}
          <div className="flex-1 p-6 flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-100 mb-2">{t('chat.nodeEditor.content.title')}</h3>
              <p className="text-sm text-gray-400">
                {t('chat.nodeEditor.content.description')}
              </p>
            </div>

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 tavern-textarea resize-none"
              placeholder={t('chat.nodeEditor.content.placeholder')}
            />

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <div>
                <p>{t('chat.nodeEditor.content.charCount')}: {content.length}</p>
                {originalNode && (
                  <p className="mt-1">
                    {t('chat.nodeEditor.content.timestamp')}: {new Date(originalNode.timestamp).toLocaleString(getLocale())}
                  </p>
                )}
              </div>
              
              {originalNode && (
                <div className="text-right">
                  <span
                    className="px-2 py-1 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: originalNode.role === 'user' ? 'rgba(249,200,109,0.15)' : 'rgba(232,215,176,0.15)',
                      color: originalNode.role === 'user' ? 'var(--accent-gold-hex)' : 'var(--accent-gold-muted-hex)'
                    }}
                  >
                    {originalNode.role === 'user' ? t('chat.nodeEditor.roles.user') : t('chat.nodeEditor.roles.assistant')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800/50 flex justify-end gap-3">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="tavern-button-secondary"
          >
            {t('chat.nodeEditor.actions.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            className="tavern-button gap-2"
          >
            <Save className="w-4 h-4" />
            {t('chat.nodeEditor.actions.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}

