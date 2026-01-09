"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation, getLocale } from '@/lib/i18n'
import {
  Modal,
  Button,
  TextInput,
  Textarea,
  Badge,
  Table,
  Select,
  Switch,
  Group,
  Stack,
  Text,
  ActionIcon,
  ScrollArea,
  FileButton,
  Alert
} from '@mantine/core'
import {
  IconX,
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconCopy,
  IconUpload,
  IconDownload,
  IconFileText,
  IconChevronDown,
  IconChevronUp,
  IconMessage
} from '@tabler/icons-react'
import toast from 'react-hot-toast'

interface Preset {
  id: string
  name: string
  enabled: boolean
  content: string
  category: string
  updatedAt: string
}

interface PresetEditorProps {
  isOpen: boolean
  onClose: () => void
}

export default function PresetEditor({
  isOpen,
  onClose
}: PresetEditorProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [presets, setPresets] = useState<Preset[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'updated'>('updated')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: '',
    enabled: true
  })

  // 从数据库加载预设
  useEffect(() => {
    if (isOpen) {
      fetchPresetsFromDB()
    }
  }, [isOpen])

  const fetchPresetsFromDB = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/presets?limit=100')
      const data = await res.json()

      if (res.ok && data.presets) {
        // 转换为组件的Preset格式
        const loadedPresets: Preset[] = data.presets.map((p: any) => ({
          id: p.id,
          name: p.name,
          enabled: true, // 预设默认都是启用的
          content: p.description || '',
          category: p.category || t('chat.preset.uncategorized'),
          updatedAt: p.updatedAt
        }))
        setPresets(loadedPresets)
      } else {
        toast.error(t('chat.error.failedLoadPresets') || '加载预设失败')
      }
    } catch (error) {
      console.error('加载预设失败:', error)
      toast.error(t('chat.error.failedLoadPresets') || '加载预设失败')
    } finally {
      setLoading(false)
    }
  }

  const filteredPresets = presets
    .filter(preset =>
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name)
      } else {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const handleCreate = () => {
    setIsEditing(true)
    setEditingPreset(null)
    setFormData({
      name: '',
      content: '',
      category: '',
      enabled: true
    })
  }

  const handleSave = () => {
    const newPreset: Preset = {
      id: editingPreset?.id || Date.now().toString(),
      name: formData.name,
      enabled: formData.enabled,
      content: formData.content,
      category: formData.category,
      updatedAt: new Date().toISOString()
    }

    if (editingPreset) {
      setPresets(presets.map(p => p.id === editingPreset.id ? newPreset : p))
    } else {
      setPresets([...presets, newPreset])
    }

    setIsEditing(false)
    setEditingPreset(null)
  }

  const handleEdit = (preset: Preset) => {
    setEditingPreset(preset)
    setIsEditing(true)
    setFormData({
      name: preset.name,
      content: preset.content,
      category: preset.category,
      enabled: preset.enabled
    })
  }

  const handleDelete = (id: string) => {
    if (confirm(t('chat.confirm.deletePreset'))) {
      setPresets(presets.filter(p => p.id !== id))
    }
  }

  const handleDuplicate = (preset: Preset) => {
    const newPreset: Preset = {
      ...preset,
      id: Date.now().toString(),
      name: `${preset.name} ${t('chat.preset.copy')}`,
      updatedAt: new Date().toISOString()
    }
    setPresets([...presets, newPreset])
  }

  const togglePreset = (id: string) => {
    setPresets(presets.map(p =>
      p.id === id ? { ...p, enabled: !p.enabled } : p
    ))
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(presets, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'presets.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (file: File | null) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        if (Array.isArray(imported)) {
          setPresets([...presets, ...imported])
          toast.success(t('chat.success.importSuccess') || '导入成功')
        }
      } catch (error) {
        toast.error(t('chat.error.importFailed') || '导入失败：文件格式错误')
      }
    }
    reader.readAsText(file)
  }

  const handlePresetClick = (preset: Preset) => {
    if (confirm(t('chat.confirm.applyPreset', { name: preset.name }))) {
      // Apply preset (this would typically save to settings/state)
      toast.success(t('chat.success.presetApplied', { name: preset.name }) || `已应用预设: ${preset.name}`)

      // Close the preset editor
      onClose()

      // Navigate to chat if not already there
      if (window.location.pathname !== '/chat') {
        router.push('/chat')
      }
    }
  }

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <Group gap="xs">
          <IconFileText size={24} color="hsl(var(--primary-rose))" />
          <Text size="xl" fw={700}>{t('chat.preset.editor')}</Text>
        </Group>
      }
      styles={{
        content: { height: '85vh' },
        body: { height: 'calc(100% - 60px)', display: 'flex', flexDirection: 'column' }
      }}
    >
      <Stack style={{ flex: 1, overflow: 'hidden' }} gap="md">
          {!isEditing ? (
            <>
              {/* Search and Actions */}
              <Group gap="xs">
                <TextInput
                  placeholder={t('chat.placeholder.searchPresets')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  leftSection={<IconSearch size={16} />}
                  style={{ flex: 1 }}
                />

                <Select
                  value={sortBy}
                  onChange={(value) => setSortBy(value as 'name' | 'updated')}
                  data={[
                    { value: 'name', label: t('chat.preset.sortByName') },
                    { value: 'updated', label: t('chat.preset.sortByUpdated') }
                  ]}
                  w={120}
                />

                <ActionIcon
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  variant="default"
                  size="lg"
                >
                  {sortOrder === 'asc' ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                </ActionIcon>

                <FileButton onChange={handleImport} accept=".json">
                  {(props) => (
                    <Button {...props} variant="default" leftSection={<IconUpload size={16} />}>
                      {t('common.import')}
                    </Button>
                  )}
                </FileButton>

                <Button
                  onClick={handleExport}
                  disabled={presets.length === 0}
                  variant="default"
                  leftSection={<IconDownload size={16} />}
                >
                  {t('common.export')}
                </Button>

                <Button
                  onClick={handleCreate}
                  leftSection={<IconPlus size={16} />}
                  color="brand"
                  variant="gradient"
                >
                  {t('chat.preset.createPreset')}
                </Button>
              </Group>

              {/* Hint */}
              {filteredPresets.length > 0 && (
                <Alert
                  icon={<IconMessage size={16} />}
                  color="brand"
                  variant="light"
                >
                  <Text size="sm">{t('chat.preset.clickToApply')}</Text>
                </Alert>
              )}

              {/* Presets Table */}
              <ScrollArea style={{ flex: 1 }}>
                {filteredPresets.length === 0 ? (
                  <Stack align="center" gap="md" py={60}>
                    <IconFileText size={64} opacity={0.3} />
                    <Text c="dimmed">
                      {searchQuery ? t('chat.preset.noMatching') : t('chat.preset.noPresets')}
                    </Text>
                    {!searchQuery && (
                      <Button
                        onClick={handleCreate}
                        variant="light"
                        leftSection={<IconPlus size={16} />}
                      >
                        {t('chat.preset.createFirst')}
                      </Button>
                    )}
                  </Stack>
                ) : (
                  <Table highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{t('chat.preset.toggle')}</Table.Th>
                        <Table.Th>{t('chat.preset.status')}</Table.Th>
                        <Table.Th>{t('chat.preset.name')}</Table.Th>
                        <Table.Th>{t('chat.preset.category')}</Table.Th>
                        <Table.Th>{t('chat.preset.updated')}</Table.Th>
                        <Table.Th ta="center">{t('chat.preset.actions')}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredPresets.map((preset) => (
                        <Table.Tr
                          key={preset.id}
                          onClick={(e) => {
                            // Don't trigger row click if clicking on buttons or toggles
                            const target = e.target as HTMLElement
                            if (!target.closest('button') && !target.closest('input[type="checkbox"]')) {
                              handlePresetClick(preset)
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <Table.Td>
                            <Switch
                              checked={preset.enabled}
                              onChange={() => togglePreset(preset.id)}
                              onClick={(e) => e.stopPropagation()}
                              color="brand"
                            />
                          </Table.Td>

                          <Table.Td>
                            <Badge
                              color={preset.enabled ? "brand" : "gray"}
                              variant="light"
                            >
                              {preset.enabled ? t('chat.preset.enabled') : t('chat.preset.disabled')}
                            </Badge>
                          </Table.Td>

                          <Table.Td>
                            <Text size="sm" fw={500}>
                              {preset.name}
                            </Text>
                          </Table.Td>

                          <Table.Td>
                            {preset.category && (
                              <Badge
                                variant="light"
                                color="gray"
                                size="sm"
                              >
                                {preset.category}
                              </Badge>
                            )}
                          </Table.Td>

                          <Table.Td>
                            <Text size="sm" c="dimmed">
                              {new Date(preset.updatedAt).toLocaleString(getLocale())}
                            </Text>
                          </Table.Td>

                          <Table.Td>
                            <Group gap={4} justify="center">
                              <ActionIcon
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEdit(preset)
                                }}
                                variant="subtle"
                                color="brand"
                                title={t('common.edit')}
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDuplicate(preset)
                                }}
                                variant="subtle"
                                color="blue"
                                title={t('common.copy')}
                              >
                                <IconCopy size={16} />
                              </ActionIcon>
                              <ActionIcon
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(preset.id)
                                }}
                                variant="subtle"
                                color="red"
                                title={t('common.delete')}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                )}
              </ScrollArea>
            </>
          ) : (
            /* Edit Form */
            <ScrollArea style={{ flex: 1 }}>
              <Stack gap="md">
                <TextInput
                  label={t('chat.preset.presetName')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
                  placeholder={t('chat.placeholder.presetName')}
                  required
                />

                <TextInput
                  label={t('chat.preset.presetCategory')}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.currentTarget.value })}
                  placeholder={t('chat.placeholder.presetCategory')}
                />

                <Textarea
                  label={t('chat.preset.presetContent')}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.currentTarget.value })}
                  placeholder={t('chat.placeholder.presetContent')}
                  minRows={12}
                  required
                />

                <Switch
                  label={t('chat.preset.enablePreset')}
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.currentTarget.checked })}
                  color="brand"
                />

                <Group gap="xs" mt="md">
                  <Button
                    onClick={handleSave}
                    disabled={!formData.name || !formData.content}
                    style={{ flex: 1 }}
                    color="brand"
                    variant="gradient"
                  >
                    {t('common.save')}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false)
                      setEditingPreset(null)
                    }}
                    variant="default"
                    style={{ flex: 1 }}
                  >
                    {t('common.cancel')}
                  </Button>
                </Group>
              </Stack>
            </ScrollArea>
          )}
      </Stack>
    </Modal>
  )
}

