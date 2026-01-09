'use client'

/**
 * TTSSettingsPopover - Voice Settings Popover for Immersive Mode
 * Shows TTS settings in a compact popover instead of opening the full settings center
 */

import { useState, useCallback } from 'react'
import {
  Box,
  Text,
  Stack,
  Group,
  Switch,
  Slider,
  Select,
  Popover,
  ActionIcon,
  Tooltip,
  SegmentedControl,
} from '@mantine/core'
import {
  IconVolume,
  IconVolumeOff,
  IconPlayerPlay,
  IconSettings,
} from '@tabler/icons-react'
import { useTTSStore, TTS_PLAY_MODES, type TTSPlayMode } from '@/stores/ttsStore'

// Common voice options
const VOICE_OPTIONS = [
  { value: 'zh-CN-XiaoxiaoNeural', label: '晓晓 (女声)' },
  { value: 'zh-CN-YunxiNeural', label: '云希 (男声)' },
  { value: 'zh-CN-XiaoyiNeural', label: '晓艺 (女声)' },
  { value: 'zh-CN-YunjianNeural', label: '云健 (男声)' },
  { value: 'zh-TW-HsiaoChenNeural', label: '曉臣 (女声·繁体)' },
  { value: 'ja-JP-NanamiNeural', label: 'Nanami (日语)' },
  { value: 'en-US-JennyNeural', label: 'Jenny (英语)' },
]

interface TTSSettingsPopoverProps {
  /** Whether TTS is currently enabled */
  ttsEnabled?: boolean
  /** Callback when TTS is toggled */
  onToggleTTS?: () => void
  /** Show as a standalone button or use children */
  children?: React.ReactNode
}

export default function TTSSettingsPopover({
  ttsEnabled,
  onToggleTTS,
  children,
}: TTSSettingsPopoverProps) {
  const [opened, setOpened] = useState(false)

  // Get TTS settings from store
  const {
    enabled,
    autoPlay,
    voiceType,
    speed,
    playMode,
    setEnabled,
    setAutoPlay,
    setVoiceType,
    setSpeed,
    setPlayMode,
  } = useTTSStore()

  // Use prop or store value
  const isEnabled = ttsEnabled !== undefined ? ttsEnabled : enabled

  const handleToggleEnabled = useCallback(() => {
    if (onToggleTTS) {
      onToggleTTS()
    } else {
      setEnabled(!enabled)
    }
  }, [onToggleTTS, setEnabled, enabled])

  const handleSpeedChange = useCallback((value: number) => {
    setSpeed(value)
  }, [setSpeed])

  const handleVoiceChange = useCallback((value: string | null) => {
    if (value) {
      setVoiceType(value)
    }
  }, [setVoiceType])

  const handlePlayModeChange = useCallback((value: string) => {
    setPlayMode(value as TTSPlayMode)
  }, [setPlayMode])

  const handleAutoPlayChange = useCallback((checked: boolean) => {
    setAutoPlay(checked)
  }, [setAutoPlay])

  // Default trigger button if no children provided
  const triggerButton = children || (
    <Tooltip label={isEnabled ? "Voice Settings (On)" : "Voice Settings (Off) - Click to enable"}>
      <Box
        component="button"
        onClick={() => setOpened(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 10px',
          borderRadius: '8px',
          border: `1px solid ${isEnabled ? 'rgba(251, 191, 36, 0.5)' : 'rgba(255, 255, 255, 0.3)'}`,
          background: isEnabled
            ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1))'
            : 'rgba(255, 255, 255, 0.08)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          flexShrink: 0,
        }}
        aria-label="Voice Settings"
        className="hover:border-amber-400/50 hover:bg-white/10"
      >
        {isEnabled ? (
          <IconVolume size={16} style={{ color: '#fbbf24' }} />
        ) : (
          <IconVolumeOff size={16} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
        )}
        <Text size="xs" style={{ color: isEnabled ? '#fbbf24' : 'rgba(255, 255, 255, 0.6)' }}>
          Voice
        </Text>
      </Box>
    </Tooltip>
  )

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="top"
      withArrow
      shadow="xl"
      radius="md"
      width={280}
    >
      <Popover.Target>
        <Box onClick={() => setOpened(o => !o)} style={{ cursor: 'pointer' }}>
          {triggerButton}
        </Box>
      </Popover.Target>

      <Popover.Dropdown
        style={{
          background: 'rgba(26, 20, 41, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(245, 197, 66, 0.2)',
        }}
      >
        <Stack gap="md">
          {/* Header */}
          <Group justify="space-between">
            <Group gap="xs">
              <IconSettings size={16} style={{ color: '#fbbf24' }} />
              <Text size="sm" fw={600} style={{ color: '#fff' }}>
                Voice Settings
              </Text>
            </Group>
            <Switch
              checked={isEnabled}
              onChange={handleToggleEnabled}
              size="sm"
              color="yellow"
            />
          </Group>

          {isEnabled && (
            <>
              {/* Voice Selection */}
              <Box>
                <Text size="xs" c="dimmed" mb={4}>Voice</Text>
                <Select
                  value={voiceType}
                  onChange={handleVoiceChange}
                  data={VOICE_OPTIONS}
                  size="xs"
                  styles={{
                    input: {
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                    },
                    dropdown: {
                      background: 'rgba(26, 20, 41, 0.98)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    },
                    option: {
                      color: '#fff',
                      '&[data-selected]': {
                        background: 'rgba(251, 191, 36, 0.2)',
                      },
                      '&[data-hovered]': {
                        background: 'rgba(255, 255, 255, 0.1)',
                      },
                    },
                  }}
                />
              </Box>

              {/* Speed */}
              <Box>
                <Group justify="space-between" mb={4}>
                  <Text size="xs" c="dimmed">Speed</Text>
                  <Text size="xs" c="dimmed">{speed.toFixed(1)}x</Text>
                </Group>
                <Slider
                  value={speed}
                  onChange={handleSpeedChange}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  size="sm"
                  color="yellow"
                  marks={[
                    { value: 0.5, label: '0.5' },
                    { value: 1.0, label: '1.0' },
                    { value: 2.0, label: '2.0' },
                  ]}
                  styles={{
                    markLabel: { fontSize: 10, color: 'rgba(255, 255, 255, 0.4)' },
                  }}
                />
              </Box>

              {/* Play Mode */}
              <Box>
                <Text size="xs" c="dimmed" mb={4}>Play Mode</Text>
                <SegmentedControl
                  value={playMode}
                  onChange={handlePlayModeChange}
                  size="xs"
                  fullWidth
                  data={[
                    { value: 'dialogue', label: `${TTS_PLAY_MODES.dialogue.icon} Dialogue` },
                    { value: 'all', label: `${TTS_PLAY_MODES.all.icon} All` },
                  ]}
                  styles={{
                    root: {
                      background: 'rgba(255, 255, 255, 0.05)',
                    },
                    label: {
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: 11,
                    },
                    indicator: {
                      background: 'rgba(251, 191, 36, 0.3)',
                    },
                  }}
                />
              </Box>

              {/* Auto-play toggle */}
              <Group justify="space-between">
                <Group gap="xs">
                  <IconPlayerPlay size={14} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                  <Text size="xs" c="dimmed">Auto-play new messages</Text>
                </Group>
                <Switch
                  checked={autoPlay}
                  onChange={(e) => handleAutoPlayChange(e.currentTarget.checked)}
                  size="xs"
                  color="yellow"
                />
              </Group>
            </>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}
