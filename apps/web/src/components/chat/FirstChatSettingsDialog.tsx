'use client'

import { useState } from 'react'
import { Modal, Stack, Text, Checkbox, Group, Button } from '@mantine/core'
import { IconUser, IconSettings } from '@tabler/icons-react'
import { useTranslation } from '@/lib/i18n'

interface FirstChatSettingsDialogProps {
  opened: boolean
  onClose: () => void
  characterName: string
  onConfirm: (useGlobal: boolean) => void
}

/**
 * 首次对话设置选择弹窗
 * 让用户选择是使用全局设定还是为角色创建专属设定
 */
export default function FirstChatSettingsDialog({
  opened,
  onClose,
  characterName,
  onConfirm
}: FirstChatSettingsDialogProps) {
  const { t } = useTranslation()
  const [useGlobal, setUseGlobal] = useState(true) // 默认勾选全局设定

  const handleConfirm = () => {
    onConfirm(useGlobal)
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <IconSettings size={20} />
          <Text fw={600}>{t('chat.firstSettings.title')}</Text>
        </Group>
      }
      centered
      size="md"
    >
      <Stack gap="lg">
        <Text size="sm" c="dimmed">
          {t('chat.firstSettings.description', { characterName })}
        </Text>

        <Stack gap="md">
          <Checkbox
            checked={useGlobal}
            onChange={(e) => setUseGlobal(e.currentTarget.checked)}
            label={
              <Stack gap={4}>
                <Group gap="xs">
                  <IconUser size={16} />
                  <Text size="sm" fw={500}>{t('chat.firstSettings.useGlobal')}</Text>
                </Group>
                <Text size="xs" c="dimmed" pl={24}>
                  {t('chat.firstSettings.useGlobalDesc')}
                </Text>
              </Stack>
            }
            styles={{
              label: { cursor: 'pointer', width: '100%' },
              body: { alignItems: 'flex-start' }
            }}
          />

          {!useGlobal && (
            <Stack gap="xs" p="md" style={{
              backgroundColor: 'var(--mantine-color-gray-light)',
              borderRadius: 'var(--mantine-radius-md)',
              border: '1px solid var(--mantine-color-gray-3)'
            }}>
              <Text size="sm" fw={500}>
                {t('chat.firstSettings.createSpecific')}
              </Text>
              <Text size="xs" c="dimmed">
                {t('chat.firstSettings.createSpecificDesc')}
              </Text>
            </Stack>
          )}
        </Stack>

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
            variant="gradient"
          >
            {t('common.confirm')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

