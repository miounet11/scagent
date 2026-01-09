"use client"

/**
 * StoryTrackingPanel - 剧情追踪面板
 * v17: Story Tracking Panel
 *
 * 功能：
 * - 显示角色卡专属实体（角色、地点、物品等）
 * - 手动触发实体提取
 * - 编辑、删除实体
 * - 投放到全局 NPC 库
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Drawer,
  Tabs,
  Stack,
  Group,
  Text,
  Badge,
  Avatar,
  Card,
  ActionIcon,
  Button,
  TextInput,
  Textarea,
  Select,
  ScrollArea,
  Collapse,
  Divider,
  LoadingOverlay,
  Alert,
  Tooltip,
  Menu,
  Modal,
  Box
} from '@mantine/core'
import {
  IconUsers,
  IconMapPin,
  IconBox,
  IconCalendarEvent,
  IconBuilding,
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconUpload,
  IconChevronDown,
  IconChevronUp,
  IconRefresh,
  IconSparkles,
  IconWorld,
  IconEye,
  IconX,
  IconCheck,
  IconClock,
  IconAlertCircle,
  IconDots
} from '@tabler/icons-react'
import { useTranslation } from '@/lib/i18n'
import toast from 'react-hot-toast'
import type { CharacterNPCInfo, EntityType, PublishStatus } from '@/lib/storyTracking/types'

interface StoryTrackingPanelProps {
  isOpen: boolean
  onClose: () => void
  chatId?: string
  characterId?: string
  characterName?: string
}

/** 实体类型配置 */
const ENTITY_TYPE_CONFIG: Record<EntityType, {
  icon: typeof IconUsers
  label: string
  color: string
}> = {
  character: { icon: IconUsers, label: '角色', color: 'blue' },
  location: { icon: IconMapPin, label: '地点', color: 'green' },
  item: { icon: IconBox, label: '物品', color: 'orange' },
  event: { icon: IconCalendarEvent, label: '事件', color: 'violet' },
  organization: { icon: IconBuilding, label: '组织', color: 'cyan' }
}

/** 发布状态配置 */
const PUBLISH_STATUS_CONFIG: Record<PublishStatus, {
  label: string
  color: string
  icon: typeof IconCheck
}> = {
  private: { label: '私有', color: 'gray', icon: IconEye },
  pending: { label: '待审核', color: 'yellow', icon: IconClock },
  published: { label: '已发布', color: 'green', icon: IconCheck },
  rejected: { label: '已拒绝', color: 'red', icon: IconX }
}

export default function StoryTrackingPanel({
  isOpen,
  onClose,
  chatId,
  characterId,
  characterName
}: StoryTrackingPanelProps) {
  const { t } = useTranslation()

  // 状态
  const [entities, setEntities] = useState<CharacterNPCInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<EntityType | 'all'>('all')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [editingEntity, setEditingEntity] = useState<CharacterNPCInfo | null>(null)
  const [stats, setStats] = useState<any>(null)

  // 加载实体数据
  const loadEntities = useCallback(async () => {
    if (!characterId) return
    setLoading(true)
    try {
      const response = await fetch(`/api/story-tracking/entities?characterId=${characterId}`)
      if (response.ok) {
        const data = await response.json()
        setEntities(data.entities || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error('Failed to load entities:', error)
      toast.error('加载实体失败')
    } finally {
      setLoading(false)
    }
  }, [characterId])

  // 手动触发提取
  const triggerExtraction = async () => {
    if (!chatId || !characterId) {
      toast.error('缺少聊天或角色信息')
      return
    }

    setExtracting(true)
    try {
      const response = await fetch('/api/story-tracking/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, characterId })
      })

      const data = await response.json()

      if (data.success) {
        if (data.newEntities && data.newEntities.length > 0) {
          toast.success(`发现 ${data.newEntities.length} 个新实体: ${data.newEntities.join(', ')}`)
        } else {
          toast.success(data.message || '未发现新实体')
        }
        await loadEntities()
      } else {
        toast.error(data.message || '提取失败')
      }
    } catch (error) {
      console.error('Extraction failed:', error)
      toast.error('提取失败')
    } finally {
      setExtracting(false)
    }
  }

  // 投放到全局
  const publishToGlobal = async (entityId: string) => {
    try {
      const response = await fetch(`/api/story-tracking/entities/${entityId}/publish`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || '已提交审核')
        await loadEntities()
      } else {
        toast.error(data.error || '发布失败')
      }
    } catch (error) {
      console.error('Publish failed:', error)
      toast.error('发布失败')
    }
  }

  // 删除实体
  const deleteEntity = async (entityId: string) => {
    if (!confirm('确定要删除这个实体吗？关联的世界观设定也会被删除。')) {
      return
    }

    try {
      const response = await fetch(`/api/story-tracking/entities/${entityId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('删除成功')
        await loadEntities()
      } else {
        toast.error('删除失败')
      }
    } catch (error) {
      console.error('Delete failed:', error)
      toast.error('删除失败')
    }
  }

  // 保存编辑
  const saveEntity = async () => {
    if (!editingEntity) return

    try {
      const response = await fetch(`/api/story-tracking/entities/${editingEntity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingEntity)
      })

      if (response.ok) {
        toast.success('保存成功')
        setEditingEntity(null)
        await loadEntities()
      } else {
        toast.error('保存失败')
      }
    } catch (error) {
      console.error('Save failed:', error)
      toast.error('保存失败')
    }
  }

  // 切换展开
  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  useEffect(() => {
    if (isOpen && characterId) {
      loadEntities()
    }
  }, [isOpen, characterId, loadEntities])

  // 过滤实体
  const filteredEntities = entities.filter(entity => {
    const matchesSearch = entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entity.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = selectedType === 'all' || entity.entityType === selectedType
    return matchesSearch && matchesType
  })

  // 按类型分组
  const groupedEntities = filteredEntities.reduce((acc, entity) => {
    const type = entity.entityType || 'character'
    if (!acc[type]) acc[type] = []
    acc[type].push(entity)
    return acc
  }, {} as Record<string, CharacterNPCInfo[]>)

  return (
    <>
      <Drawer
        opened={isOpen}
        onClose={onClose}
        title={
          <Group gap="xs">
            <IconWorld size={20} />
            <Text fw={600}>剧情追踪</Text>
            {characterName && (
              <Badge size="sm" variant="light" color="blue">
                {characterName}
              </Badge>
            )}
          </Group>
        }
        position="right"
        size="lg"
        padding="md"
      >
        <LoadingOverlay visible={loading} />

        <Stack gap="md" h="calc(100vh - 120px)">
          {/* 统计信息 */}
          {stats && (
            <Group gap="xs">
              <Badge variant="light" color="gray">
                共 {stats.total} 个实体
              </Badge>
              {Object.entries(stats.byType).map(([type, count]) => {
                if (count === 0) return null
                const config = ENTITY_TYPE_CONFIG[type as EntityType]
                return (
                  <Badge key={type} variant="light" color={config?.color || 'gray'}>
                    {config?.label || type}: {count as number}
                  </Badge>
                )
              })}
            </Group>
          )}

          {/* 搜索和筛选 */}
          <Group gap="xs">
            <TextInput
              placeholder="搜索实体..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1 }}
            />
            <Select
              value={selectedType}
              onChange={(v) => setSelectedType((v as EntityType | 'all') || 'all')}
              data={[
                { value: 'all', label: '全部类型' },
                { value: 'character', label: '角色' },
                { value: 'location', label: '地点' },
                { value: 'item', label: '物品' },
                { value: 'event', label: '事件' },
                { value: 'organization', label: '组织' }
              ]}
              w={120}
            />
          </Group>

          {/* 实体列表 */}
          <ScrollArea style={{ flex: 1 }}>
            <Stack gap="md">
              {filteredEntities.length === 0 ? (
                <Alert icon={<IconAlertCircle size={16} />} color="gray">
                  {searchQuery ? '没有找到匹配的实体' : '暂无实体，点击下方按钮提取'}
                </Alert>
              ) : (
                Object.entries(groupedEntities).map(([type, typeEntities]) => {
                  const config = ENTITY_TYPE_CONFIG[type as EntityType]
                  const Icon = config?.icon || IconUsers

                  return (
                    <Box key={type}>
                      <Group gap="xs" mb="xs">
                        <Icon size={16} color={`var(--mantine-color-${config?.color || 'gray'}-6)`} />
                        <Text size="sm" fw={600} c={config?.color}>
                          {config?.label || type} ({typeEntities.length})
                        </Text>
                      </Group>

                      <Stack gap="xs">
                        {typeEntities.map(entity => (
                          <EntityCard
                            key={entity.id}
                            entity={entity}
                            expanded={expandedIds.has(entity.id)}
                            onToggleExpand={() => toggleExpand(entity.id)}
                            onEdit={() => setEditingEntity(entity)}
                            onDelete={() => deleteEntity(entity.id)}
                            onPublish={() => publishToGlobal(entity.id)}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )
                })
              )}
            </Stack>
          </ScrollArea>

          {/* 底部操作栏 */}
          <Divider />
          <Group justify="space-between">
            <Button
              leftSection={<IconSparkles size={16} />}
              onClick={triggerExtraction}
              loading={extracting}
              disabled={!chatId}
              variant="light"
            >
              手动提取
            </Button>
            <Button
              leftSection={<IconRefresh size={16} />}
              onClick={loadEntities}
              variant="subtle"
            >
              刷新
            </Button>
          </Group>
        </Stack>
      </Drawer>

      {/* 编辑模态框 */}
      <EditEntityModal
        entity={editingEntity}
        onClose={() => setEditingEntity(null)}
        onSave={saveEntity}
        onChange={setEditingEntity}
      />
    </>
  )
}

/** 实体卡片组件 */
function EntityCard({
  entity,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onPublish
}: {
  entity: CharacterNPCInfo
  expanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
  onDelete: () => void
  onPublish: () => void
}) {
  const config = ENTITY_TYPE_CONFIG[entity.entityType]
  const statusConfig = PUBLISH_STATUS_CONFIG[entity.publishStatus]
  const Icon = config?.icon || IconUsers
  const StatusIcon = statusConfig?.icon || IconEye

  return (
    <Card withBorder padding="sm" radius="md">
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <Avatar
            src={entity.avatar}
            radius="xl"
            size="md"
            color={config?.color || 'gray'}
          >
            <Icon size={16} />
          </Avatar>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Group gap="xs">
              <Text fw={600} size="sm" truncate>
                {entity.name}
              </Text>
              <Badge size="xs" variant="light" color={statusConfig?.color}>
                <Group gap={4}>
                  <StatusIcon size={10} />
                  {statusConfig?.label}
                </Group>
              </Badge>
              {entity.sourceType === 'extracted' && (
                <Badge size="xs" variant="dot" color="violet">
                  AI提取
                </Badge>
              )}
            </Group>
            <Text size="xs" c="dimmed" lineClamp={1}>
              {entity.description}
            </Text>
          </Box>
        </Group>

        <Group gap="xs">
          <ActionIcon
            variant="subtle"
            size="sm"
            onClick={onToggleExpand}
          >
            {expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
          </ActionIcon>
          <Menu position="bottom-end" shadow="md">
            <Menu.Target>
              <ActionIcon variant="subtle" size="sm">
                <IconDots size={14} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEdit size={14} />} onClick={onEdit}>
                编辑
              </Menu.Item>
              {entity.publishStatus === 'private' && (
                <Menu.Item leftSection={<IconUpload size={14} />} onClick={onPublish}>
                  投放全局
                </Menu.Item>
              )}
              <Menu.Divider />
              <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={onDelete}>
                删除
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <Collapse in={expanded}>
        <Divider my="xs" />
        <Stack gap="xs">
          {entity.alias && (
            <Text size="xs"><strong>别名：</strong>{entity.alias}</Text>
          )}
          {entity.personality && (
            <Text size="xs"><strong>性格：</strong>{entity.personality}</Text>
          )}
          {entity.speakingStyle && (
            <Text size="xs"><strong>说话风格：</strong>{entity.speakingStyle}</Text>
          )}
          {entity.background && (
            <Text size="xs"><strong>背景：</strong>{entity.background}</Text>
          )}
          {entity.firstAppearance && (
            <Text size="xs" c="dimmed">
              首次出现：{entity.firstAppearance.context}
            </Text>
          )}
        </Stack>
      </Collapse>
    </Card>
  )
}

/** 编辑实体模态框 */
function EditEntityModal({
  entity,
  onClose,
  onSave,
  onChange
}: {
  entity: CharacterNPCInfo | null
  onClose: () => void
  onSave: () => void
  onChange: (entity: CharacterNPCInfo) => void
}) {
  if (!entity) return null

  return (
    <Modal
      opened={!!entity}
      onClose={onClose}
      title={`编辑: ${entity.name}`}
      size="lg"
    >
      <Stack gap="md">
        <TextInput
          label="名称"
          value={entity.name}
          onChange={(e) => onChange({ ...entity, name: e.target.value })}
        />
        <TextInput
          label="别名"
          value={entity.alias || ''}
          onChange={(e) => onChange({ ...entity, alias: e.target.value })}
          placeholder="多个别名用逗号分隔"
        />
        <Textarea
          label="描述"
          value={entity.description}
          onChange={(e) => onChange({ ...entity, description: e.target.value })}
          minRows={2}
        />
        {entity.entityType === 'character' && (
          <>
            <Textarea
              label="性格"
              value={entity.personality}
              onChange={(e) => onChange({ ...entity, personality: e.target.value })}
              minRows={2}
            />
            <Textarea
              label="说话风格"
              value={entity.speakingStyle || ''}
              onChange={(e) => onChange({ ...entity, speakingStyle: e.target.value })}
              minRows={2}
            />
          </>
        )}
        <Textarea
          label="背景"
          value={entity.background || ''}
          onChange={(e) => onChange({ ...entity, background: e.target.value })}
          minRows={2}
        />
        <Select
          label="实体类型"
          value={entity.entityType}
          onChange={(v) => onChange({ ...entity, entityType: v as EntityType })}
          data={[
            { value: 'character', label: '角色' },
            { value: 'location', label: '地点' },
            { value: 'item', label: '物品' },
            { value: 'event', label: '事件' },
            { value: 'organization', label: '组织' }
          ]}
        />
        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>取消</Button>
          <Button onClick={onSave}>保存</Button>
        </Group>
      </Stack>
    </Modal>
  )
}
