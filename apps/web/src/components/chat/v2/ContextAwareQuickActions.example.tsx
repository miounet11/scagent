/**
 * ContextAwareQuickActions - Usage Example
 *
 * This file demonstrates how to integrate the ContextAwareQuickActions component
 * into a chat interface.
 */

'use client'

import { useState } from 'react'
import { Stack, Text, Box, Paper } from '@mantine/core'
import ContextAwareQuickActions, { type QuickAction, type Message } from './ContextAwareQuickActions'

export default function ContextAwareQuickActionsExample() {
  // Example messages for demonstration
  const [messages, setMessages] = useState<Message[]>([
    { role: 'user', content: '你好呀，今天心情怎么样？' },
    { role: 'assistant', content: '见到你我很开心！今天天气真好，想和你一起出去走走。' },
    { role: 'user', content: '我也很喜欢和你在一起，感觉很温暖。' },
  ])

  const [selectedAction, setSelectedAction] = useState<QuickAction | null>(null)
  const [radialMenuOpen, setRadialMenuOpen] = useState(false)

  // Handle action selection
  const handleActionSelect = (action: QuickAction) => {
    console.log('Selected action:', action)
    setSelectedAction(action)

    // In a real implementation, you would:
    // 1. Insert the action into the message input
    // 2. Or send it directly as a message
    // 3. Or combine it with user text

    // Example: Adding to messages
    const newMessage: Message = {
      role: 'user',
      content: `*${action.label}*`,
    }
    setMessages([...messages, newMessage])
  }

  // Handle "More" button click
  const handleOpenRadialMenu = () => {
    console.log('Opening radial menu...')
    setRadialMenuOpen(true)
    // In a real implementation, this would open your RadialMenu component
  }

  return (
    <Stack gap="lg" p="md">
      <Paper p="md" withBorder>
        <Text size="lg" fw={600} mb="md">
          ContextAwareQuickActions Demo
        </Text>

        {/* Messages Display */}
        <Stack gap="xs" mb="md">
          <Text size="sm" c="dimmed">
            Current Conversation:
          </Text>
          {messages.map((msg, i) => (
            <Box
              key={i}
              p="xs"
              style={{
                background: msg.role === 'user' ? 'rgba(96, 165, 250, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                borderRadius: '8px',
                borderLeft: `3px solid ${msg.role === 'user' ? 'rgba(96, 165, 250, 0.6)' : 'rgba(251, 191, 36, 0.6)'}`,
              }}
            >
              <Text size="xs" c="dimmed" fw={600} mb={4}>
                {msg.role === 'user' ? 'User' : 'Character'}
              </Text>
              <Text size="sm">{msg.content}</Text>
            </Box>
          ))}
        </Stack>

        {/* Quick Actions Component */}
        <Box
          p="md"
          style={{
            background: 'rgba(26, 20, 41, 0.5)',
            borderRadius: '12px',
            border: '1px solid rgba(245, 197, 66, 0.2)',
          }}
        >
          <Text size="sm" c="dimmed" mb="md">
            AI-Recommended Quick Actions:
          </Text>
          <ContextAwareQuickActions
            messages={messages}
            onActionSelect={handleActionSelect}
            onOpenRadialMenu={handleOpenRadialMenu}
            disabled={false}
            maxActions={6}
            showCategories={true}
          />
        </Box>

        {/* Debug Info */}
        {selectedAction && (
          <Box mt="md" p="xs" style={{ background: 'rgba(0, 255, 0, 0.1)', borderRadius: '8px' }}>
            <Text size="xs" c="green" fw={600}>
              Last Selected Action:
            </Text>
            <Text size="xs" c="dimmed">
              {selectedAction.emoji} {selectedAction.label} ({selectedAction.category})
            </Text>
          </Box>
        )}

        {radialMenuOpen && (
          <Box mt="md" p="xs" style={{ background: 'rgba(255, 165, 0, 0.1)', borderRadius: '8px' }}>
            <Text size="xs" c="orange" fw={600}>
              RadialMenu would open here
            </Text>
          </Box>
        )}
      </Paper>

      {/* Example Scenarios */}
      <Paper p="md" withBorder>
        <Text size="md" fw={600} mb="md">
          Example Scenarios
        </Text>

        <Stack gap="md">
          {/* Scenario 1: Romantic conversation */}
          <Box>
            <Text size="sm" fw={500} mb="xs">
              Scenario 1: Romantic Conversation
            </Text>
            <Text size="xs" c="dimmed" mb="sm">
              Messages contain: "喜欢", "温柔", "心动"
            </Text>
            <ContextAwareQuickActions
              messages={[
                { role: 'user', content: '我真的很喜欢你，和你在一起感觉很温柔。' },
                { role: 'assistant', content: '我的心也在为你心动...' },
              ]}
              onActionSelect={(action) => console.log('Scenario 1:', action)}
              onOpenRadialMenu={() => console.log('More clicked')}
              maxActions={4}
            />
          </Box>

          {/* Scenario 2: Comforting conversation */}
          <Box>
            <Text size="sm" fw={500} mb="xs">
              Scenario 2: Comforting Conversation
            </Text>
            <Text size="xs" c="dimmed" mb="sm">
              Messages contain: "难过", "担心", "哭"
            </Text>
            <ContextAwareQuickActions
              messages={[
                { role: 'user', content: '今天发生了很多事，我有点难过...' },
                { role: 'assistant', content: '别担心，我在这里陪着你。' },
              ]}
              onActionSelect={(action) => console.log('Scenario 2:', action)}
              onOpenRadialMenu={() => console.log('More clicked')}
              maxActions={4}
            />
          </Box>

          {/* Scenario 3: Curious conversation */}
          <Box>
            <Text size="sm" fw={500} mb="xs">
              Scenario 3: Curious Conversation
            </Text>
            <Text size="xs" c="dimmed" mb="sm">
              Messages contain: "为什么", "好奇", "问题"
            </Text>
            <ContextAwareQuickActions
              messages={[
                { role: 'user', content: '为什么会这样呢？我很好奇。' },
                { role: 'assistant', content: '这是个好问题，让我解释一下。' },
              ]}
              onActionSelect={(action) => console.log('Scenario 3:', action)}
              onOpenRadialMenu={() => console.log('More clicked')}
              maxActions={4}
            />
          </Box>

          {/* Scenario 4: Empty state */}
          <Box>
            <Text size="sm" fw={500} mb="xs">
              Scenario 4: Empty State (No Messages)
            </Text>
            <Text size="xs" c="dimmed" mb="sm">
              Shows default balanced actions
            </Text>
            <ContextAwareQuickActions
              messages={[]}
              onActionSelect={(action) => console.log('Scenario 4:', action)}
              onOpenRadialMenu={() => console.log('More clicked')}
              maxActions={6}
            />
          </Box>
        </Stack>
      </Paper>

      {/* Integration Guide */}
      <Paper p="md" withBorder>
        <Text size="md" fw={600} mb="md">
          Integration Guide
        </Text>

        <Stack gap="sm">
          <Box>
            <Text size="sm" fw={500}>
              1. Import the component:
            </Text>
            <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace', marginTop: 4 }}>
              {`import ContextAwareQuickActions from '@/components/chat/v2/ContextAwareQuickActions'`}
            </Text>
          </Box>

          <Box>
            <Text size="sm" fw={500}>
              2. Pass last 3 messages from your chat:
            </Text>
            <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace', marginTop: 4 }}>
              {`const recentMessages = messages.slice(-3)`}
            </Text>
          </Box>

          <Box>
            <Text size="sm" fw={500}>
              3. Handle action selection:
            </Text>
            <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace', marginTop: 4 }}>
              {`onActionSelect={(action) => insertIntoInput(action.label)}`}
            </Text>
          </Box>

          <Box>
            <Text size="sm" fw={500}>
              4. Connect to RadialMenu:
            </Text>
            <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace', marginTop: 4 }}>
              {`onOpenRadialMenu={() => setRadialMenuOpen(true)}`}
            </Text>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  )
}
