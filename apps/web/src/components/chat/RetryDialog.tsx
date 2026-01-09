/**
 * Retry Dialog Component
 * 显示超时或错误后的重试对话框
 */

'use client'

import { Modal, Button, Text, Stack, Alert, Group, ThemeIcon } from '@mantine/core'
import {
  IconAlertTriangle,
  IconRefresh,
  IconX,
  IconWifi,
  IconServer,
  IconClock
} from '@tabler/icons-react'
import { useTranslation } from '@/lib/i18n'

interface RetryDialogProps {
  isOpen: boolean
  errorType: 'timeout' | 'network' | 'server' | 'cancelled'
  errorMessage: string
  retryCount: number
  maxRetries: number
  onRetry: () => void
  onCancel: () => void
}

export default function RetryDialog({
  isOpen,
  errorType,
  errorMessage,
  retryCount,
  maxRetries,
  onRetry,
  onCancel,
}: RetryDialogProps) {
  const { t } = useTranslation()

  const getIcon = () => {
    switch (errorType) {
      case 'timeout':
        return <IconClock size={48} />
      case 'network':
        return <IconWifi size={48} />
      case 'server':
        return <IconServer size={48} />
      default:
        return <IconAlertTriangle size={48} />
    }
  }

  const getIconColor = () => {
    switch (errorType) {
      case 'timeout':
        return 'yellow'
      case 'network':
      case 'server':
        return 'red'
      default:
        return 'gray'
    }
  }

  const getTitle = () => {
    switch (errorType) {
      case 'timeout':
        return t('chat.retry.timeout')
      case 'network':
        return t('chat.retry.networkError')
      case 'server':
        return t('chat.retry.serverError')
      case 'cancelled':
        return t('chat.retry.cancelled')
      default:
        return t('chat.retry.error')
    }
  }

  const getDescription = () => {
    if (errorType === 'timeout') {
      return t('chat.retry.timeoutDesc')
    }
    return errorMessage
  }

  const canRetry = retryCount < maxRetries && errorType !== 'cancelled'

  return (
    <Modal
      opened={isOpen}
      onClose={onCancel}
      centered
      size="md"
      withCloseButton={false}
    >
      <Stack align="center" gap="lg">
        {/* Icon */}
        <ThemeIcon
          size={80}
          radius="xl"
          variant="light"
          color={getIconColor()}
        >
          {getIcon()}
        </ThemeIcon>

        {/* Title and Description */}
        <Stack align="center" gap="xs">
          <Text size="xl" fw={600}>
            {getTitle()}
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            {getDescription()}
          </Text>
        </Stack>

        {/* Retry Info */}
        {canRetry && retryCount > 0 && (
          <Alert
            variant="light"
            color="accent"
            title={t('chat.retry.retryInfo', { retryCount, maxRetries })}
            icon={null}
            styles={{
              root: {
                width: '100%',
                backgroundColor: 'rgba(249,200,109,0.10)',
                borderColor: 'rgba(249,200,109,0.3)',
                color: 'var(--accent-gold-hex)'
              },
            }}
          />
        )}

        {/* Actions */}
        <Group gap="sm" justify="center" w="100%">
          {canRetry ? (
            <>
              <Button
                variant="default"
                leftSection={<IconX size={16} />}
                onClick={onCancel}
                flex={1}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="filled"
                style={{ background: 'linear-gradient(135deg, var(--accent-gold-hex), #e8d7b0)' }}
                leftSection={<IconRefresh size={16} />}
                onClick={onRetry}
                flex={1}
              >
                {retryCount > 0 ? t('chat.retry.retryWithCount', { current: retryCount + 1, max: maxRetries }) : t('common.retry')}
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              onClick={onCancel}
              fullWidth
            >
              {t('common.close')}
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  )
}



