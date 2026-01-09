/**
 * MessageContextMenu Usage Example
 *
 * This demonstrates how to integrate the MessageContextMenu into a message bubble component.
 */

'use client'

import { useState } from 'react'
import { Box, Text } from '@mantine/core'
import MessageContextMenu from './MessageContextMenu'
import toast from 'react-hot-toast'

export default function MessageBubbleExample() {
  const [isMenuVisible, setIsMenuVisible] = useState(false)
  const [isPlayingTTS, setIsPlayingTTS] = useState(false)

  // Example message data
  const messageContent = 'This is an example message with context menu actions!'

  // Handler functions
  const handleCopy = () => {
    navigator.clipboard.writeText(messageContent)
    toast.success('Message copied to clipboard')
  }

  const handleEdit = () => {
    toast('Edit functionality would be implemented here')
  }

  const handleRegenerate = () => {
    toast('Regenerate functionality would be implemented here')
  }

  const handleDelete = () => {
    toast.error('Delete functionality would be implemented here')
  }

  const handlePlayTTS = () => {
    setIsPlayingTTS(!isPlayingTTS)
    toast(isPlayingTTS ? 'TTS stopped' : 'TTS playing', {
      icon: isPlayingTTS ? '⏸️' : '🔊'
    })
  }

  return (
    <Box
      style={{
        position: 'relative',
        maxWidth: '600px',
        margin: '20px auto',
        padding: '16px',
        background: 'rgba(26, 20, 41, 0.6)',
        border: '1px solid rgba(245, 197, 66, 0.15)',
        borderRadius: '12px',
      }}
      onMouseEnter={() => setIsMenuVisible(true)}
      onMouseLeave={() => setIsMenuVisible(false)}
    >
      {/* Message Context Menu */}
      <MessageContextMenu
        visible={isMenuVisible}
        onCopy={handleCopy}
        onEdit={handleEdit}
        onRegenerate={handleRegenerate}
        onDelete={handleDelete}
        onPlayTTS={handlePlayTTS}
        isPlaying={isPlayingTTS}
      />

      {/* Message Content */}
      <Text size="sm" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
        {messageContent}
      </Text>

      {/* Instructions */}
      <Text size="xs" c="dimmed" mt="md">
        Hover over this message to see the context menu appear above
      </Text>
    </Box>
  )
}

/**
 * Integration Guide:
 *
 * 1. Import the component:
 *    import MessageContextMenu from '@/components/chat/v2/MessageContextMenu'
 *
 * 2. Add state for visibility:
 *    const [isMenuVisible, setIsMenuVisible] = useState(false)
 *    const [isPlayingTTS, setIsPlayingTTS] = useState(false)
 *
 * 3. Add hover handlers to your message container:
 *    onMouseEnter={() => setIsMenuVisible(true)}
 *    onMouseLeave={() => setIsMenuVisible(false)}
 *
 * 4. Position your message container relatively:
 *    style={{ position: 'relative' }}
 *
 * 5. Render the menu inside your message container:
 *    <MessageContextMenu
 *      visible={isMenuVisible}
 *      onCopy={handleCopy}
 *      onEdit={handleEdit}
 *      onRegenerate={handleRegenerate}
 *      onDelete={handleDelete}
 *      onPlayTTS={handlePlayTTS}  // Optional
 *      isPlaying={isPlayingTTS}    // Optional
 *    />
 *
 * 6. Implement your handler functions:
 *    - onCopy: Copy message text to clipboard
 *    - onEdit: Enter edit mode for the message
 *    - onRegenerate: Regenerate the AI response
 *    - onDelete: Delete the message (with confirmation)
 *    - onPlayTTS: Toggle text-to-speech playback (optional)
 *
 * Optional Features:
 * - Omit `onPlayTTS` prop to hide the TTS button
 * - Use `className` prop for custom styling
 * - Combine with mobile gesture handlers for touch devices
 *
 * Accessibility Notes:
 * - All actions have WCAG AA compliant aria-labels
 * - Keyboard navigation is fully supported (Tab to navigate, Enter to activate)
 * - Focus indicators are visible for keyboard users
 * - Respects prefers-reduced-motion for animations
 * - High contrast mode support included
 */
