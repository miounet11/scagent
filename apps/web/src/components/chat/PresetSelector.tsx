'use client'

import { useState, useEffect } from 'react'
import { Select, Button, Group, Text, Badge, Loader, ActionIcon, Tooltip } from '@mantine/core'
import { IconAdjustments, IconCheck, IconX, IconInfoCircle } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useTranslation } from '@/lib/i18n'

interface Preset {
  id: string
  name: string
  description?: string
  author?: string
  sourceFormat: string
  category?: string
  version?: string
  promptCount?: number
  regexCount?: number
  tags?: string[]
}

interface PresetSelectorProps {
  chatId: string
  currentPresetId?: string | null
  onPresetChange?: (presetId: string | null) => void
}

export default function PresetSelector({ chatId, currentPresetId, onPresetChange }: PresetSelectorProps) {
  const { t } = useTranslation()
  const [presets, setPresets] = useState<Preset[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(currentPresetId || null)
  const [currentPreset, setCurrentPreset] = useState<Preset | null>(null)

  useEffect(() => {
    fetchPresets()
    fetchCurrentPreset()
  }, [chatId])

  const fetchPresets = async () => {
    try {
      const res = await fetch('/api/presets?limit=50')
      const data = await res.json()
      if (res.ok) {
        setPresets(data.presets || [])
      } else {
        console.error('获取预设列表失败:', data.error)
        notifications.show({
          title: '加载失败',
          message: data.error || '无法加载预设列表',
          color: 'red'
        })
      }
    } catch (error) {
      console.error('获取预设列表失败:', error)
      notifications.show({
        title: '加载失败',
        message: '网络错误，无法加载预设列表',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCurrentPreset = async () => {
    try {
      const res = await fetch(`/api/chats/${chatId}/preset`)
      const data = await res.json()
      if (res.ok && data.preset) {
        setCurrentPreset(data.preset)
        setSelectedPresetId(data.preset.id)
      }
    } catch (error) {
      console.error('获取当前预设失败:', error)
    }
  }

  const handleApplyPreset = async () => {
    try {
      setApplying(true)
      const res = await fetch(`/api/chats/${chatId}/preset`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId: selectedPresetId })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || '应用预设失败')

      const selectedPreset = presets.find(p => p.id === selectedPresetId)
      setCurrentPreset(selectedPreset || null)

      notifications.show({
        title: '预设已应用',
        message: selectedPresetId 
          ? `已将"${selectedPreset?.name}"应用到当前对话`
          : '已移除预设',
        color: 'green',
        icon: <IconCheck size={16} />
      })

      onPresetChange?.(selectedPresetId)
    } catch (error) {
      notifications.show({
        title: '应用失败',
        message: error instanceof Error ? error.message : '未知错误',
        color: 'red',
        icon: <IconX size={16} />
      })
    } finally {
      setApplying(false)
    }
  }

  const handleRemovePreset = async () => {
    setSelectedPresetId(null)
    try {
      setApplying(true)
      const res = await fetch(`/api/chats/${chatId}/preset`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId: null })
      })

      if (!res.ok) throw new Error('移除预设失败')

      setCurrentPreset(null)

      notifications.show({
        title: '预设已移除',
        message: '对话将使用默认设置',
        color: 'blue',
        icon: <IconCheck size={16} />
      })

      onPresetChange?.(null)
    } catch (error) {
      notifications.show({
        title: '移除失败',
        message: error instanceof Error ? error.message : '未知错误',
        color: 'red',
        icon: <IconX size={16} />
      })
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <Group gap="xs">
        <Loader size="xs" />
        <Text size="xs" c="dimmed">{t('chat.status.loading')}</Text>
      </Group>
    )
  }

  // 如果没有预设，显示提示
  if (presets.length === 0) {
    return (
      <Group gap="xs">
        <IconAdjustments size={16} style={{ color: 'var(--mantine-color-dimmed)' }} />
        <Text size="xs" c="dimmed">{t('chat.preset.noPresets')}</Text>
        <Tooltip label={t('chat.preset.createFirstHint')}>
          <ActionIcon size="sm" variant="subtle" color="gray">
            <IconInfoCircle size={14} />
          </ActionIcon>
        </Tooltip>
      </Group>
    )
  }

  return (
    <Group gap="xs" wrap="nowrap">
      <IconAdjustments size={16} style={{ color: 'var(--mantine-color-dimmed)' }} />
      
      <Select
        placeholder={t("chat.preset.selectPlaceholder")}
        value={selectedPresetId}
        onChange={setSelectedPresetId}
        data={presets.map(p => ({
          value: p.id,
          label: p.name
        }))}
        size="xs"
        style={{ minWidth: 180 }}
        clearable
        disabled={applying}
        searchable
        nothingFoundMessage={t('chat.preset.noMatching')}
        renderOption={({ option }) => {
          // 从presets数组中找到对应的preset获取完整信息
          const preset = presets.find(p => p.id === option.value)
          if (!preset) return <Text>{option.label}</Text>
          
          return (
            <div style={{ padding: '4px 0' }}>
              <Group justify="space-between" wrap="nowrap" gap="xs">
                <Text size="sm" fw={500}>{preset.name}</Text>
                <Group gap={4}>
                  {preset.promptCount !== undefined && (
                    <Badge size="xs" variant="light" color="blue">
                      {preset.promptCount}{t('chat.preset.promptUnit')}
                    </Badge>
                  )}
                  {preset.regexCount && preset.regexCount > 0 && (
                    <Badge size="xs" variant="light" color="teal">
                      {preset.regexCount}{t('chat.preset.regexUnit')}
                    </Badge>
                  )}
                </Group>
              </Group>
              {preset.description && (
                <Text size="xs" c="dimmed" lineClamp={2} mt={2}>
                  {preset.description}
                </Text>
              )}
              <Group gap={4} mt={4}>
                {preset.category && (
                  <Badge size="xs" variant="dot" color="gray">
                    {preset.category}
                  </Badge>
                )}
                {preset.version && (
                  <Badge size="xs" variant="outline" color="gray">
                    v{preset.version}
                  </Badge>
                )}
              </Group>
            </div>
          )
        }}
      />

      {selectedPresetId !== currentPreset?.id && (
        <Button
          size="xs"
          variant="light"
          onClick={handleApplyPreset}
          loading={applying}
          leftSection={<IconCheck size={14} />}
        >
          {t('chat.buttons.apply')}
        </Button>
      )}

      {currentPreset && (
        <Group gap="xs">
          <Badge size="sm" variant="dot" color="green">
            {currentPreset.name}
          </Badge>
          <Tooltip label={t('chat.preset.removePreset')}>
            <ActionIcon
              size="sm"
              variant="subtle"
              color="gray"
              onClick={handleRemovePreset}
              disabled={applying}
            >
              <IconX size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      )}

      {currentPreset?.description && (
        <Tooltip label={currentPreset.description} multiline w={300}>
          <ActionIcon size="sm" variant="subtle" color="gray">
            <IconInfoCircle size={14} />
          </ActionIcon>
        </Tooltip>
      )}
    </Group>
  )
}

