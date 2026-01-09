'use client'

import { Box, Drawer, Stack, Group, Text, Button, Badge, ActionIcon, ScrollArea, Divider } from '@mantine/core'
import { IconBroadcast, IconBolt, IconMicrophone, IconPaperclip, IconCheck } from '@tabler/icons-react'
import { useTranslation } from '@/lib/i18n'

interface AdvancedActionsDrawerProps {
  opened: boolean
  onClose: () => void
  isStreamingEnabled: boolean
  onToggleStreaming: () => void
  isFastModeEnabled: boolean
  onToggleFastMode: () => void
  models: Array<{ id: string; name?: string; provider: string; model: string }>
  activeModel?: { id: string }
  onSwitchModel: (id: string) => void
  onStartRecording: () => void
  onUploadFile: () => void
}

export default function AdvancedActionsDrawer({
  opened,
  onClose,
  isStreamingEnabled,
  onToggleStreaming,
  isFastModeEnabled,
  onToggleFastMode,
  models,
  activeModel,
  onSwitchModel,
  onStartRecording,
  onUploadFile
}: AdvancedActionsDrawerProps) {
  const { t } = useTranslation()

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="bottom"
      size="auto"
      radius="md"
      overlayProps={{ opacity: 0.4, blur: 4 }}
      styles={{
        content: {
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          borderTop: '1px solid rgba(55, 65, 81, 0.5)',
        }
      }}
    >
      <Box className="drawer-mobile-bottom-padding input-safe-area">
        <Stack gap="md">
          {/* Quick Toggles */}
          <Stack gap={8}>
            <Text size="sm" c="dimmed">{t('chat.advancedActions.modes')}</Text>
            <Group gap="xs">
              <Badge
                variant={isStreamingEnabled ? 'filled' : 'outline'}
                color="accent"
                className="mobile-touch-target"
                onClick={onToggleStreaming}
                style={{ cursor: 'pointer' }}
                leftSection={<IconBroadcast size={14} />}
              >
                {isStreamingEnabled ? t('chat.advancedActions.streamingOn') : t('chat.advancedActions.streamingOff')}
              </Badge>
              <Badge
                variant={isFastModeEnabled ? 'filled' : 'outline'}
                color="yellow"
                className="mobile-touch-target"
                onClick={onToggleFastMode}
                style={{ cursor: 'pointer' }}
                leftSection={<IconBolt size={14} />}
              >
                {isFastModeEnabled ? t('chat.advancedActions.fastOn') : t('chat.advancedActions.fastOff')}
              </Badge>
            </Group>
          </Stack>

          <Divider variant="dashed" />

          {/* Model Switch */}
          <Stack gap={8}>
            <Text size="sm" c="dimmed">{t('chat.advancedActions.model')}</Text>
            <ScrollArea.Autosize mah={220} type="auto">
              <Stack gap={6}>
                {models && models.length > 0 ? models.map((m) => (
                  <Button
                    key={m.id}
                    variant={activeModel?.id === m.id ? 'light' : 'subtle'}
                    color={activeModel?.id === m.id ? 'accent' : 'gray'}
                    onClick={() => onSwitchModel(m.id)}
                    leftSection={activeModel?.id === m.id ? <IconCheck size={16} /> : undefined}
                    styles={{
                      root: {
                        justifyContent: 'space-between',
                        height: 40,
                      }
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.name || `${m.provider}/${m.model}`}
                    </span>
                  </Button>
                )) : (
                  <Text size="sm" c="dimmed">{t('chat.advancedActions.noModels')}</Text>
                )}
              </Stack>
            </ScrollArea.Autosize>
          </Stack>

          <Divider variant="dashed" />

          {/* Utilities */}
          <Stack gap={8}>
            <Text size="sm" c="dimmed">{t('chat.advancedActions.tools')}</Text>
            <Group>
              <Button
                variant="light"
                leftSection={<IconMicrophone size={16} />}
                onClick={onStartRecording}
              >
                {t('chat.advancedActions.voiceInput')}
              </Button>
              <Button
                variant="light"
                leftSection={<IconPaperclip size={16} />}
                onClick={onUploadFile}
              >
                {t('chat.advancedActions.uploadFile')}
              </Button>
            </Group>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  )
}


