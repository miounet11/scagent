"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Edit, 
  Trash2, 
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface WorldInfoEntry {
  id: string
  name: string
  keywords: string[]
  content: string
  enabled: boolean
  position: number
  depth: number
  priority: number
}

interface WorldInfoTableViewProps {
  entries: WorldInfoEntry[]
  onEdit: (entry: WorldInfoEntry) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
  onUpdate: (id: string, updates: Partial<WorldInfoEntry>) => void
}

export default function WorldInfoTableView({
  entries,
  onEdit,
  onDelete,
  onToggle,
  onUpdate
}: WorldInfoTableViewProps) {
  const { t } = useTranslation()
  const [expandedKeywords, setExpandedKeywords] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<keyof WorldInfoEntry>('priority')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const toggleKeywords = (id: string) => {
    const newExpanded = new Set(expandedKeywords)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedKeywords(newExpanded)
  }

  const handleSort = (field: keyof WorldInfoEntry) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedEntries = [...entries].sort((a, b) => {
    const aVal = a[sortField]
    const bVal = b[sortField]
    
    let comparison = 0
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal)
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal
    } else if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
      comparison = aVal === bVal ? 0 : aVal ? 1 : -1
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const SortIcon = ({ field }: { field: keyof WorldInfoEntry }) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <button
                onClick={() => handleSort('enabled')}
                className="flex items-center gap-1 hover:text-gray-200"
              >
                {t('chat.worldInfo.table.toggle')}
                <SortIcon field="enabled" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t('chat.worldInfo.table.status')}
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <button
                onClick={() => handleSort('name')}
                className="flex items-center gap-1 hover:text-gray-200"
              >
                {t('chat.worldInfo.table.comment')}
                <SortIcon field="name" />
              </button>
            </th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t('chat.worldInfo.table.keywords')}
            </th>
            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <button
                onClick={() => handleSort('position')}
                className="flex items-center gap-1 hover:text-gray-200"
              >
                {t('chat.worldInfo.table.position')}
                <SortIcon field="position" />
              </button>
            </th>
            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <button
                onClick={() => handleSort('depth')}
                className="flex items-center gap-1 hover:text-gray-200"
              >
                {t('chat.worldInfo.table.depth')}
                <SortIcon field="depth" />
              </button>
            </th>
            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <button
                onClick={() => handleSort('priority')}
                className="flex items-center gap-1 hover:text-gray-200"
              >
                {t('chat.worldInfo.table.priority')}
                <SortIcon field="priority" />
              </button>
            </th>
            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t('chat.worldInfo.table.actions')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedEntries.map((entry) => (
            <tr 
              key={entry.id}
              className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
            >
              {/* 开关 */}
              <td className="px-3 py-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={entry.enabled}
                    onChange={() => onToggle(entry.id)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all" style={{ backgroundColor: entry.enabled ? 'var(--accent-gold-hex)' : undefined }}></div>
                </label>
              </td>

              {/* 状态 */}
              <td className="px-3 py-3">
                <Badge
                  variant={entry.enabled ? "default" : "secondary"}
                  style={{ 
                    backgroundColor: entry.enabled ? 'rgba(249,200,109,0.15)' : undefined,
                    color: entry.enabled ? 'var(--accent-gold-hex)' : undefined,
                    borderColor: entry.enabled ? 'rgba(249,200,109,0.3)' : undefined
                  }}
                  className={entry.enabled 
                    ? ""
                    : "bg-gray-700/50 text-gray-400 border-gray-600/50"
                  }
                >
                  {entry.enabled ? t('chat.worldInfo.table.enabled') : t('chat.worldInfo.table.disabled')}
                </Badge>
              </td>

              {/* 注释（名称） */}
              <td className="px-3 py-3">
                <div className="text-sm text-gray-200 font-medium max-w-xs truncate">
                  {entry.name}
                </div>
              </td>

              {/* 关键词 */}
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  {entry.keywords.length > 0 && (
                    <>
                      {expandedKeywords.has(entry.id) ? (
                        <div className="flex flex-wrap gap-1">
                          {entry.keywords.map((keyword, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-xs bg-orange-500/20 text-orange-300 border-orange-500/30"
                            >
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-orange-500/20 text-orange-300 border-orange-500/30"
                        >
                          {entry.keywords[0]}
                          {entry.keywords.length > 1 && ` +${entry.keywords.length - 1}`}
                        </Badge>
                      )}
                      {entry.keywords.length > 1 && (
                        <button
                          onClick={() => toggleKeywords(entry.id)}
                          className="text-gray-400 hover:text-gray-200"
                        >
                          {expandedKeywords.has(entry.id) ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </td>

              {/* 位置 */}
              <td className="px-3 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onUpdate(entry.id, { position: Math.max(0, entry.position - 1) })}
                    className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
                    disabled={entry.position <= 0}
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="text-sm text-gray-300 min-w-[2rem] text-center">
                    {entry.position}
                  </span>
                  <button
                    onClick={() => onUpdate(entry.id, { position: Math.min(100, entry.position + 1) })}
                    className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
                    disabled={entry.position >= 100}
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </td>

              {/* 深度 */}
              <td className="px-3 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onUpdate(entry.id, { depth: Math.max(0, entry.depth - 1) })}
                    className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
                    disabled={entry.depth <= 0}
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="text-sm text-gray-300 min-w-[2rem] text-center">
                    {entry.depth}
                  </span>
                  <button
                    onClick={() => onUpdate(entry.id, { depth: entry.depth + 1 })}
                    className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </td>

              {/* 优先级 */}
              <td className="px-3 py-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onUpdate(entry.id, { priority: Math.max(0, entry.priority - 10) })}
                    className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
                    disabled={entry.priority <= 0}
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="text-sm text-gray-300 min-w-[3rem] text-center">
                    {entry.priority}
                  </span>
                  <button
                    onClick={() => onUpdate(entry.id, { priority: entry.priority + 10 })}
                    className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </td>

              {/* 操作 */}
              <td className="px-3 py-3">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onEdit(entry)}
                    className="p-2 hover:bg-gray-700 rounded text-gray-400 transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-gold-hex)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = ''}
                    title={t('chat.worldInfo.actions.edit')}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400 transition-colors"
                    title={t('chat.worldInfo.actions.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sortedEntries.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>{t('chat.worldInfo.noEntries')}</p>
        </div>
      )}
    </div>
  )
}

