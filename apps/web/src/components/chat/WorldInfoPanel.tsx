"use client"

/**
 * WorldInfoPanel - Chat Drawer for WorldInfo Management
 * v12: Refactored to use useWorldInfoEntries hook with full API integration
 */

import { useState, useEffect } from 'react'
import {
  Drawer,
  Button,
  TextInput,
  NumberInput,
  Textarea,
  Badge,
  SegmentedControl,
  Switch,
  Checkbox,
  ActionIcon,
  Stack,
  Group,
  Text,
  ScrollArea,
  Box,
  LoadingOverlay,
  Alert,
  Select
} from '@mantine/core'
import WorldInfoTableView from './WorldInfoTableView'
import {
  IconX,
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconChevronDown,
  IconChevronUp,
  IconBook,
  IconTable,
  IconLayoutGrid,
  IconAlertCircle
} from '@tabler/icons-react'
import { useTranslation } from '@/lib/i18n'
import { useWorldInfoEntries } from '@/hooks/useWorldInfoEntries'
import {
  type WorldInfoFull,
  toWorldInfoFormData,
  toCreateWorldInfoPayload,
  DEFAULT_WORLD_INFO_FORM,
  WORLD_INFO_POSITIONS,
} from '@sillytavern-clone/shared'

interface WorldInfoPanelProps {
  isOpen: boolean
  onClose: () => void
  characterId?: string
}

export default function WorldInfoPanel({
  isOpen,
  onClose,
  characterId
}: WorldInfoPanelProps) {
  const { t } = useTranslation()

  // v12: Use shared hook with API integration
  const {
    entries,
    loading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    toggleEntry,
    bindToCharacter,
    clearError,
  } = useWorldInfoEntries({ characterId, autoLoad: true })

  const [searchQuery, setSearchQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingEntry, setEditingEntry] = useState<WorldInfoFull | null>(null)
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table')

  // v12: Use complete form data with all fields
  const [formData, setFormData] = useState(DEFAULT_WORLD_INFO_FORM)

  const filteredEntries = entries.filter(entry =>
    entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.keywordsParsed.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreate = () => {
    setIsCreating(true)
    setEditingEntry(null)
    setFormData({
      ...DEFAULT_WORLD_INFO_FORM,
      // Pre-fill characterIds if in character context
      characterIds: characterId ? [characterId] : []
    })
  }

  const handleSave = async () => {
    if (!formData.name || !formData.content) return

    try {
      const payload = toCreateWorldInfoPayload(formData)

      if (editingEntry) {
        // Update existing entry
        const updated = await updateEntry(editingEntry.id, payload)
        if (updated) {
          // If characterId is provided and not in characterIds, bind it
          if (characterId && !formData.characterIds.includes(characterId)) {
            await bindToCharacter(updated.id, characterId)
          }
        }
      } else {
        // Create new entry
        const created = await createEntry(payload)
        if (created && characterId && !formData.characterIds.includes(characterId)) {
          // Bind to current character
          await bindToCharacter(created.id, characterId)
        }
      }

      // Reset form
      setIsCreating(false)
      setEditingEntry(null)
      setFormData(DEFAULT_WORLD_INFO_FORM)
    } catch (err) {
      console.error('[WorldInfoPanel] Save failed:', err)
    }
  }

  const handleEdit = (entry: WorldInfoFull) => {
    setEditingEntry(entry)
    setIsCreating(true)
    setFormData(toWorldInfoFormData(entry))
  }

  const handleUpdate = async (id: string, updates: any) => {
    // Type adapter: Convert any updates to proper payload format
    await updateEntry(id, updates as any)
  }

  const handleDelete = async (id: string) => {
    if (confirm(t('chat.worldInfo.deleteConfirm'))) {
      await deleteEntry(id)
    }
  }

  const handleToggle = async (id: string) => {
    const entry = entries.find(e => e.id === id)
    if (entry) {
      await toggleEntry(id, !entry.enabled)
    }
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedEntries)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedEntries(newExpanded)
  }

  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      size="xl"
      position="right"
      title={
        <Group gap="xs">
          <IconBook size={24} color="var(--mantine-color-teal-4)" />
          <Text size="xl" fw={700}>{t('chat.worldInfo.title')}</Text>
          {characterId && (
            <Badge size="sm" color="teal" variant="light">
              {t('chat.worldInfo.characterSpecific')}
            </Badge>
          )}
        </Group>
      }
    >
      <Stack style={{ height: '100%', position: 'relative' }} gap="md">
        {/* Loading overlay */}
        <LoadingOverlay visible={loading} />

        {/* Error alert */}
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title={t('common.error')}
            color="red"
            withCloseButton
            onClose={clearError}
          >
            {error}
          </Alert>
        )}

        {!isCreating ? (
          <>
            {/* Search and Add */}
            <Group gap="xs" wrap="nowrap">
              <TextInput
                placeholder={t('chat.worldInfo.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                leftSection={<IconSearch size={16} />}
                style={{ flex: 1 }}
              />

              {/* View Mode Toggle */}
              <SegmentedControl
                value={viewMode}
                onChange={(value) => setViewMode(value as 'table' | 'card')}
                data={[
                  { value: 'table', label: <IconTable size={16} /> },
                  { value: 'card', label: <IconLayoutGrid size={16} /> }
                ]}
              />

              <Button
                onClick={handleCreate}
                leftSection={<IconPlus size={16} />}
                gradient={{ from: 'teal', to: 'cyan' }}
                variant="gradient"
                disabled={loading}
              >
                {t('chat.worldInfo.addEntry')}
              </Button>
            </Group>

            {/* Entries count */}
            {entries.length > 0 && (
              <Text size="sm" c="dimmed">
                {t('chat.worldInfo.entriesCount', { count: entries.length })}
                {filteredEntries.length !== entries.length && (
                  <> ({t('chat.worldInfo.filteredCount', { count: filteredEntries.length })})</>
                )}
              </Text>
            )}

            {/* Entries List/Table */}
            <ScrollArea style={{ flex: 1 }}>
              {filteredEntries.length === 0 ? (
                <Stack align="center" gap="md" py={60}>
                  <IconBook size={64} opacity={0.3} />
                  <Text c="dimmed">
                    {searchQuery ? t('chat.worldInfo.noMatchingEntries') : t('chat.worldInfo.noEntries')}
                  </Text>
                  {!searchQuery && (
                    <Button
                      onClick={handleCreate}
                      variant="light"
                      leftSection={<IconPlus size={16} />}
                      disabled={loading}
                    >
                      {t('chat.worldInfo.createFirstEntry')}
                    </Button>
                  )}
                </Stack>
              ) : viewMode === 'table' ? (
                <WorldInfoTableView
                  entries={filteredEntries as any}
                  onEdit={handleEdit as any}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                  onUpdate={handleUpdate}
                />
              ) : (
                <Stack gap="xs">
                  {filteredEntries.map((entry) => (
                    <Box
                      key={entry.id}
                      p="md"
                      style={{
                        borderRadius: 'var(--mantine-radius-md)',
                        backgroundColor: 'var(--mantine-color-dark-7)',
                        border: '1px solid var(--mantine-color-dark-5)'
                      }}
                    >
                      <Group justify="space-between" align="flex-start">
                        <Stack gap="xs" style={{ flex: 1 }}>
                          <Group gap="xs">
                            <Text fw={600}>{entry.name}</Text>
                            <Switch
                              checked={entry.enabled}
                              onChange={() => handleToggle(entry.id)}
                              color="teal"
                              size="sm"
                              disabled={loading}
                            />
                            {entry.characterIds && entry.characterIds.length > 0 && (
                              <Badge size="xs" color="blue">
                                {entry.characterIds.length} {t('chat.worldInfo.characters')}
                              </Badge>
                            )}
                          </Group>

                          <Group gap={4}>
                            {entry.keywordsParsed.map((keyword, i) => (
                              <Badge
                                key={i}
                                size="sm"
                                variant="light"
                                color="teal"
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </Group>

                          {expandedEntries.has(entry.id) && (
                            <>
                              <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                                {entry.content}
                              </Text>
                              <Group gap="xs">
                                <Badge size="xs" variant="outline">
                                  {t('chat.worldInfo.priority')}: {entry.priority}
                                </Badge>
                                <Badge size="xs" variant="outline">
                                  {t('chat.worldInfo.position')}: {entry.position || 'after_char'}
                                </Badge>
                              </Group>
                            </>
                          )}
                        </Stack>

                        <Group gap={4}>
                          <ActionIcon
                            onClick={() => toggleExpand(entry.id)}
                            variant="subtle"
                            color="gray"
                          >
                            {expandedEntries.has(entry.id) ? (
                              <IconChevronUp size={16} />
                            ) : (
                              <IconChevronDown size={16} />
                            )}
                          </ActionIcon>
                          <ActionIcon
                            onClick={() => handleEdit(entry)}
                            variant="subtle"
                            color="gray"
                            disabled={loading}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            onClick={() => handleDelete(entry.id)}
                            variant="subtle"
                            color="red"
                            disabled={loading}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Group>
                    </Box>
                  ))}
                </Stack>
              )}
            </ScrollArea>
          </>
        ) : (
          /* Create/Edit Form - v12: Extended with all fields */
          <ScrollArea style={{ flex: 1 }}>
            <Stack gap="md">
              <TextInput
                label={t('chat.worldInfo.entryName')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
                placeholder={t('chat.worldInfo.entryNameExample')}
                required
              />

              <TextInput
                label={t('chat.worldInfo.keywords')}
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.currentTarget.value })}
                placeholder={t('chat.worldInfo.keywordsExample')}
                description={t('chat.worldInfo.keywordsHelp')}
              />

              <Textarea
                label={t('chat.worldInfo.entryContent')}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.currentTarget.value })}
                placeholder={t('chat.worldInfo.contentPlaceholder')}
                minRows={8}
                required
              />

              {/* v12: Position is now a string enum */}
              <Select
                label={t('chat.worldInfo.position')}
                value={formData.position}
                onChange={(value) => setFormData({ ...formData, position: value || 'after_char' })}
                data={WORLD_INFO_POSITIONS.map(pos => ({
                  value: pos,
                  label: t(`chat.worldInfo.positions.${pos}`)
                }))}
                description={t('chat.worldInfo.positionHelp')}
              />

              <Group grow>
                <NumberInput
                  label={t('chat.worldInfo.depth')}
                  value={formData.depth}
                  onChange={(value) => setFormData({ ...formData, depth: Number(value) || 4 })}
                  min={0}
                  description={t('chat.worldInfo.depthHelp')}
                />

                <NumberInput
                  label={t('chat.worldInfo.priority')}
                  value={formData.priority}
                  onChange={(value) => setFormData({ ...formData, priority: Number(value) || 100 })}
                  min={0}
                  description={t('chat.worldInfo.priorityHelp')}
                />
              </Group>

              <Checkbox
                label={t('chat.worldInfo.enableEntry')}
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.currentTarget.checked })}
              />

              <Group grow>
                <Button
                  onClick={handleSave}
                  disabled={!formData.name || !formData.content || loading}
                  loading={loading}
                >
                  {t('chat.worldInfo.save')}
                </Button>
                <Button
                  onClick={() => {
                    setIsCreating(false)
                    setEditingEntry(null)
                  }}
                  variant="default"
                  disabled={loading}
                >
                  {t('chat.worldInfo.cancel')}
                </Button>
              </Group>
            </Stack>
          </ScrollArea>
        )}
      </Stack>
    </Drawer>
  )
}
