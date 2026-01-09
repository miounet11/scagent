"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  X,
  GitBranch,
  Edit,
  Trash2,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Loader2
} from 'lucide-react'
import { useTranslation, getLocale } from '@/lib/i18n'
import { useChatStore } from '@/stores/chatStore'
import toast from 'react-hot-toast'

interface ChatBranchNode {
  id: string
  messageId: string
  parentId: string | null
  content: string
  role: 'user' | 'assistant'
  children: string[]
  isCurrent: boolean
  timestamp: string
}

interface ChatBranchVisualizationProps {
  isOpen: boolean
  onClose: () => void
  onSelectNode?: (nodeId: string) => void
  onEditNode?: (nodeId: string) => void
  onDeleteNode?: (nodeId: string) => void
}

export default function ChatBranchVisualization({
  isOpen,
  onClose,
  onSelectNode,
  onEditNode,
  onDeleteNode
}: ChatBranchVisualizationProps) {
  const { t } = useTranslation()
  const { currentChat } = useChatStore()
  const [nodes, setNodes] = useState<ChatBranchNode[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch branch data when modal opens
  useEffect(() => {
    if (isOpen && currentChat) {
      fetchBranches()
    }
  }, [isOpen, currentChat])

  const fetchBranches = async () => {
    if (!currentChat) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/chats/${currentChat.id}/branches`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch branches')
      }

      const data = await response.json()
      const branchNodes = data.nodes || []
      
      setNodes(branchNodes)
      
      // Auto-expand all nodes by default
      const allNodeIds = new Set<string>(branchNodes.map((n: ChatBranchNode) => n.id))
      setExpandedNodes(allNodeIds)
    } catch (error) {
      console.error('Error fetching branches:', error)
      toast.error(t('chat.branchVisualization.loadError') || '加载分支数据失败')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  const toggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const handleSelectNode = (nodeId: string) => {
    setSelectedNode(nodeId)
    onSelectNode?.(nodeId)
  }

  const renderNode = (node: ChatBranchNode, level: number = 0): React.ReactNode => {
    const hasChildren = node.children.length > 0
    const isExpanded = expandedNodes.has(node.id)
    const isSelected = selectedNode === node.id

    return (
      <div key={node.id} className="relative">
        {/* Node */}
        <div
          className={`flex items-start gap-2 mb-2 transition-all ${
            level > 0 ? `ml-${Math.min(level * 8, 32)}` : ''
          }`}
          style={{ marginLeft: `${level * 2}rem` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={() => toggleExpand(node.id)}
              className="mt-2 p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Node Card */}
          <div
            className={`flex-1 rounded-lg border-2 transition-all cursor-pointer ${
              node.isCurrent
                ? ''
                : isSelected
                ? ''
                : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
            }`}
            style={{
              borderColor: node.isCurrent ? 'var(--accent-gold-hex)' : isSelected ? 'var(--accent-gold-hex)' : undefined,
              backgroundColor: node.isCurrent ? 'rgba(249,200,109,0.10)' : isSelected ? 'rgba(249,200,109,0.10)' : undefined
            }}
            onClick={() => handleSelectNode(node.id)}
          >
            <div className="p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: node.role === 'user' ? 'rgba(249,200,109,0.15)' : 'rgba(232,215,176,0.15)',
                      color: node.role === 'user' ? 'var(--accent-gold-hex)' : 'var(--accent-gold-muted-hex)'
                    }}
                  >
                    {node.role === 'user' ? t('chat.branchVisualization.roles.user') : t('chat.branchVisualization.roles.assistant')}
                  </span>
                  {node.isCurrent && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(249,200,109,0.15)', color: 'var(--accent-gold-hex)' }}>
                      {t('chat.branchVisualization.currentBranch')}
                    </span>
                  )}
                  {hasChildren && (
                    <span className="text-xs text-gray-500">
                      {node.children.length} {t('chat.branchVisualization.branches')}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditNode?.(node.id)
                    }}
                    className="p-1 rounded hover:bg-gray-700 text-gray-400 transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-gold-hex)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = ''}
                    title={t('chat.branchVisualization.tooltips.edit')}
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  {node.id !== 'root' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(t('chat.branchVisualization.deleteConfirm'))) {
                          onDeleteNode?.(node.id)
                        }
                      }}
                      className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-colors"
                      title={t('chat.branchVisualization.tooltips.delete')}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-300 line-clamp-2">
                {node.content}
              </p>

              <div className="text-xs text-gray-500 mt-2">
                {new Date(node.timestamp).toLocaleString(getLocale())}
              </div>
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute top-0 bottom-0 w-px bg-gray-700"
              style={{ left: `${(level + 1) * 2 + 0.5}rem` }}
            />
            
            {node.children.map((childId) => {
              const childNode = nodes.find(n => n.id === childId)
              return childNode ? renderNode(childNode, level + 1) : null
            })}
          </div>
        )}
      </div>
    )
  }

  const rootNode = nodes.find(n => n.id === 'root')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-6xl h-[85vh] bg-gray-900/95 backdrop-blur-xl rounded-lg border border-gray-700/50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <GitBranch className="w-6 h-6" style={{ color: 'var(--accent-gold-hex)' }} />
            <h2 className="text-2xl font-bold text-gray-100">{t('chat.branchVisualization.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Tree View */}
          <div className="flex-1 overflow-y-auto p-6 tavern-scrollbar">
            <div className="max-w-4xl">
              {isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: 'var(--accent-gold-hex)' }} />
                  <p className="text-gray-400">{t('chat.branchVisualization.loading') || '加载中...'}</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-4 rounded-lg text-sm" style={{ backgroundColor: 'rgba(249,200,109,0.10)', border: '1px solid rgba(249,200,109,0.3)', color: 'var(--accent-gold-hex)' }}>
                    <p className="mb-1"><strong>{t('chat.branchVisualization.tips.title')}</strong></p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>{t('chat.branchVisualization.tips.clickNode')}</li>
                      <li>{t('chat.branchVisualization.tips.expandCollapse')}</li>
                      <li>{t('chat.branchVisualization.tips.currentHighlight')}</li>
                      <li>{t('chat.branchVisualization.tips.hoverActions')}</li>
                    </ul>
                  </div>

                  {rootNode ? (
                    renderNode(rootNode)
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <GitBranch className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p>{t('chat.branchVisualization.noBranches')}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Side Panel - Node Details */}
          {selectedNode && (
            <div className="w-80 border-l border-gray-800 p-6 overflow-y-auto tavern-scrollbar">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">{t('chat.branchVisualization.nodeDetails.title')}</h3>
              
              {(() => {
                const node = nodes.find(n => n.id === selectedNode)
                if (!node) return null

                return (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-gray-500 uppercase">{t('chat.branchVisualization.nodeDetails.id')}</label>
                      <p className="text-sm text-gray-300 font-mono">{node.id}</p>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 uppercase">{t('chat.branchVisualization.nodeDetails.role')}</label>
                      <p className="text-sm text-gray-300">
                        {node.role === 'user' ? t('chat.branchVisualization.roles.user') : t('chat.branchVisualization.roles.assistantFull')}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 uppercase">{t('chat.branchVisualization.nodeDetails.content')}</label>
                      <p className="text-sm text-gray-300 whitespace-pre-wrap">
                        {node.content}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 uppercase">{t('chat.branchVisualization.nodeDetails.childrenCount')}</label>
                      <p className="text-sm text-gray-300">{node.children.length}</p>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 uppercase">{t('chat.branchVisualization.nodeDetails.timestamp')}</label>
                      <p className="text-sm text-gray-300">
                        {new Date(node.timestamp).toLocaleString(getLocale())}
                      </p>
                    </div>

                    <div className="pt-4 space-y-2">
                      <Button
                        onClick={() => onSelectNode?.(node.id)}
                        className="w-full tavern-button"
                      >
                        {t('chat.branchVisualization.actions.jumpToNode')}
                      </Button>
                      <Button
                        onClick={() => onEditNode?.(node.id)}
                        variant="outline"
                        className="w-full tavern-button-secondary"
                      >
                        {t('chat.branchVisualization.actions.editNode')}
                      </Button>
                      {node.id !== 'root' && (
                        <Button
                          onClick={() => {
                            if (confirm(t('chat.branchVisualization.deleteConfirm'))) {
                              onDeleteNode?.(node.id)
                            }
                          }}
                          variant="outline"
                          className="w-full tavern-button-danger"
                        >
                          {t('chat.branchVisualization.actions.deleteNode')}
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

