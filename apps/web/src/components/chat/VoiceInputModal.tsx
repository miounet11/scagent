/**
 * VoiceInputModal - 语音输入模态框组件
 *
 * 提供优化的语音输入体验：
 * - 实时录音状态显示
 * - 可编辑的识别结果
 * - 快捷键支持
 * - 一键发送或填入
 */

'use client'

import { useRef, useCallback } from 'react'
import {
  Modal,
  Stack,
  Group,
  Button,
  Text,
  Badge,
  Box,
  Textarea,
} from '@mantine/core'
import {
  IconMicrophone,
  IconMicrophoneOff,
  IconSend,
} from '@tabler/icons-react'
import { useTranslation } from '@/lib/i18n'

// ====== Types ======
export interface VoiceInputModalProps {
  opened: boolean
  onClose: () => void
  isRecording: boolean
  recordingTime: number
  interimTranscript: string
  finalTranscript: string
  editableTranscript: string
  onEditableChange: (text: string) => void
  onStopRecording: () => void
  onRestartRecording: () => void
  onConfirm: () => void // 填入输入框
  onSend: () => void // 直接发送
  formatRecordingTime: (seconds: number) => string
}

// ====== Component ======
export default function VoiceInputModal({
  opened,
  onClose,
  isRecording,
  recordingTime,
  interimTranscript,
  finalTranscript,
  editableTranscript,
  onEditableChange,
  onStopRecording,
  onRestartRecording,
  onConfirm,
  onSend,
  formatRecordingTime,
}: VoiceInputModalProps) {
  const { t } = useTranslation()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Get display text
  const getDisplayText = useCallback((): string => {
    if (isRecording) {
      const base = finalTranscript
      const interim = interimTranscript
      return base + (interim ? (base ? ' ' : '') + interim : '')
    }
    return editableTranscript || finalTranscript || ''
  }, [isRecording, finalTranscript, interimTranscript, editableTranscript])

  // Check if has content
  const hasContent = Boolean(editableTranscript || finalTranscript || interimTranscript)

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Escape - 取消
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }

    // Enter (无修饰键) - 直接发送
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !isRecording) {
      e.preventDefault()
      onSend()
      return
    }

    // Ctrl/Cmd + Enter - 填入输入框
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !isRecording) {
      e.preventDefault()
      onConfirm()
      return
    }

    // Space - 录音时停止，停止时开始（仅当焦点不在文本框时）
    if (e.key === ' ' && e.target === e.currentTarget) {
      e.preventDefault()
      if (isRecording) {
        onStopRecording()
      } else {
        onRestartRecording()
      }
      return
    }
  }, [isRecording, onClose, onSend, onConfirm, onStopRecording, onRestartRecording])

  // Handle textarea keydown
  const handleTextareaKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isRecording) return

    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      onSend()
      return
    }

    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      onConfirm()
      return
    }
  }, [isRecording, onSend, onConfirm])

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={null}
      centered
      size="md"
      onKeyDown={handleKeyDown}
      withCloseButton={false}
      styles={{
        content: {
          backgroundColor: 'var(--glass-bg)',
          backdropFilter: 'blur(var(--blur-xl))',
          WebkitBackdropFilter: 'blur(var(--blur-xl))',
          border: '1px solid var(--glass-border)',
        },
        body: {
          padding: '1.25rem',
        },
      }}
    >
      <Stack gap="md">
        {/* 顶部状态栏 */}
        <Group justify="space-between" align="center">
          <Group gap="sm">
            {isRecording ? (
              <>
                <Box
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: 'rgb(239, 68, 68)',
                    animation: 'pulse 1.5s infinite',
                  }}
                />
                <Text size="sm" fw={600} c="red.5">
                  {t('chat.labels.recording') || '录音中'}
                </Text>
                <Badge size="sm" variant="light" color="red" style={{ fontFamily: 'monospace' }}>
                  {formatRecordingTime(recordingTime)}
                </Badge>
              </>
            ) : (
              <>
                <IconMicrophone size={18} style={{ opacity: 0.6 }} />
                <Text size="sm" c="dimmed">
                  {t('chat.voice.input') || '语音输入'}
                </Text>
              </>
            )}
          </Group>

          {/* 录音控制按钮 */}
          {isRecording ? (
            <Button
              variant="light"
              color="red"
              size="xs"
              onClick={onStopRecording}
              leftSection={<IconMicrophoneOff size={14} />}
            >
              {t('chat.labels.stop') || '停止'}
            </Button>
          ) : (
            <Button
              variant="light"
              color="blue"
              size="xs"
              onClick={onRestartRecording}
              leftSection={<IconMicrophone size={14} />}
            >
              {t('chat.labels.record') || '录音'}
            </Button>
          )}
        </Group>

        {/* 识别文本区域 - 可编辑 */}
        <Box>
          <Textarea
            ref={textareaRef}
            value={getDisplayText()}
            onChange={(e) => !isRecording && onEditableChange(e.currentTarget.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder={
              isRecording
                ? (t('chat.labels.pleaseSpeak') || '请开始说话...')
                : (t('chat.placeholder.voiceRecognitionResult') || '识别结果将显示在这里...')
            }
            minRows={4}
            maxRows={6}
            autosize
            readOnly={isRecording}
            styles={{
              input: {
                backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.03)' : 'rgba(255, 255, 255, 0.02)',
                border: isRecording ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '1rem',
                lineHeight: 1.75,
                transition: 'all 0.2s',
              },
            }}
          />
          {isRecording && interimTranscript && (
            <Text size="xs" c="dimmed" mt={4} style={{ fontStyle: 'italic' }}>
              {t('chat.labels.recognizing') || '识别中...'}
            </Text>
          )}
        </Box>

        {/* 底部操作栏 */}
        <Group justify="space-between">
          <Button
            variant="subtle"
            color="gray"
            size="sm"
            onClick={onClose}
          >
            {t('common.cancel') || '取消'}
          </Button>

          <Group gap="sm">
            <Button
              variant="light"
              color="gray"
              size="sm"
              onClick={onConfirm}
              disabled={isRecording || !hasContent}
            >
              {t('chat.buttons.fillIn') || '填入输入框'}
            </Button>
            <Button
              variant="gradient"
              gradient={{ from: 'var(--accent-gold-hex)', to: '#e8d7b0', deg: 90 }}
              size="sm"
              onClick={onSend}
              leftSection={<IconSend size={14} />}
              disabled={isRecording || !hasContent}
              styles={{
                root: {
                  color: '#1c1c1c',
                  fontWeight: 600,
                },
              }}
            >
              {t('chat.buttons.send') || '发送'}
            </Button>
          </Group>
        </Group>

        {/* 快捷键提示 */}
        <Group gap="md" justify="center" style={{ opacity: 0.6 }}>
          <Text size="xs" c="dimmed">
            <Badge size="xs" variant="light" color="gray" mr={4}>Enter</Badge>
            {t('chat.labels.sendDirectly') || '发送'}
          </Text>
          <Text size="xs" c="dimmed">
            <Badge size="xs" variant="light" color="gray" mr={4}>Esc</Badge>
            {t('chat.labels.exitCancel') || '取消'}
          </Text>
        </Group>
      </Stack>

      {/* Pulse animation style */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </Modal>
  )
}
