'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  Stack,
  Text,
  Group,
  Box,
  Badge,
  Button,
  ActionIcon,
  Tooltip,
  ScrollArea,
  Divider,
  Loader,
} from '@mantine/core'
import {
  IconGitBranch,
  IconTrash,
  IconCheck,
  IconClock,
  IconMessageCircle,
  IconArchive,
} from '@tabler/icons-react'
import { useChatStore } from '@/stores/chatStore'
import { chatService } from '@/services/chatService'
import toast from 'react-hot-toast'
import { useTranslation, getLocale } from '@/lib/i18n'

interface BranchHistoryViewProps {
  opened: boolean
  onClose: () => void
  characterId?: string
}

export default function BranchHistoryView({
  opened,
  onClose,
  characterId
}: BranchHistoryViewProps) {
  const { t } = useTranslation()
  const { currentChat, setCurrentChat, character } = useChatStore()
  const [branchChats, setBranchChats] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (opened && characterId) {
      loadBranchChats()
    }
  }, [opened, characterId])

  const loadBranchChats = async () => {
    if (!characterId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/chats?characterId=${characterId}`)
      const data = await response.json()

      // Sort by creation date
      const sorted = (data.chats || []).sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      setBranchChats(sorted)
    } catch (error) {
      console.error('Failed to load branch chats:', error)
      toast.error(t('chat.error.failedLoadBranches') || '加载分支历史失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwitchToBranch = async (chat: any) => {
    try {
      setCurrentChat(chat)

      // 重新加载该聊天的角色和消息
      if (chat.characterId) {
        // 加载角色数据
        const charResponse = await fetch(`/api/characters/${chat.characterId}`)
        if (charResponse.ok) {
          const characterData = await charResponse.json()
          useChatStore.getState().setCharacter(characterData)
        }

        // 加载该聊天的消息
        const messagesResponse = await fetch(`/api/chats/${chat.id}/messages`)
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json()
          const loadedMessages = messagesData.messages || []

          // 清空现有消息并添加新消息
          useChatStore.getState().clearMessages()
          loadedMessages.forEach((msg: any) => {
            useChatStore.getState().addMessage(msg)
          })
        }
      }

      toast.success(t('chat.success.switchedBranch') || `已切换到: ${chat.title}`)
      onClose()
    } catch (error) {
      console.error('Failed to switch branch:', error)
      toast.error(t('chat.error.failedSwitchBranch') || '切换分支失败')
    }
  }

  const handleDeleteBranch = async (chatId: string) => {
    if (!confirm(t('chat.branch.deleteConfirm'))) return

    try {
      await chatService.deleteChat(chatId)
      toast.success(t('chat.success.branchDeleted') || '分支已删除')
      await loadBranchChats()

      // If deleted current chat, switch to another
      if (currentChat?.id === chatId && branchChats.length > 1) {
        const nextChat = branchChats.find(c => c.id !== chatId)
        if (nextChat) {
          setCurrentChat(nextChat)
        }
      }
    } catch (error) {
      console.error('Failed to delete branch:', error)
      toast.error(t('chat.error.failedDeleteBranch') || '删除分支失败')
    }
  }

  const getCompressionInfo = (chat: any) => {
    try {
      const metadata = chat.metadata ? JSON.parse(chat.metadata) : {}
      return metadata.compressionHistory || []
    } catch {
      return []
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString(getLocale(), {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <IconGitBranch size={24} />
          <div>
            <Text size="lg" fw={600}>{t('chat.branch.title')}</Text>
            {character && (
              <Text size="xs" c="dimmed">
                {t('chat.branch.allBranches', { name: character.name })}
              </Text>
            )}
          </div>
        </Group>
      }
      size="lg"
      centered
    >
      <ScrollArea h={500}>
        {isLoading ? (
          <Stack align="center" justify="center" h={200}>
            <Loader size="md" />
            <Text size="sm" c="dimmed">{t('chat.status.loading')}</Text>
          </Stack>
        ) : branchChats.length === 0 ? (
          <Stack align="center" justify="center" h={200}>
            <IconGitBranch size={48} opacity={0.3} />
            <Text size="sm" c="dimmed">{t('chat.branch.noBranches')}</Text>
          </Stack>
        ) : (
          <Stack gap="md">
            {branchChats.map((chat, index) => {
              const compressionHistory = getCompressionInfo(chat)
              const isActive = currentChat?.id === chat.id

              return (
                <Box
                  key={chat.id}
                  p="md"
                  style={{
                    border: `2px solid ${isActive ? 'var(--accent-gold-hex)' : 'var(--mantine-color-dark-5)'}`,
                    borderRadius: '8px',
                    background: isActive ? 'rgba(249, 200, 109, 0.1)' : 'transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <Group justify="space-between" mb="sm">
                    <Group gap="xs">
                      {index === 0 ? (
                        <Badge size="sm" variant="light" color="blue">
                          {t('chat.status.mainThread')}
                        </Badge>
                      ) : (
                        <Badge size="sm" variant="light" color="grape">
                          {t('chat.status.branch')}
                        </Badge>
                      )}
                      {isActive && (
                        <Badge size="sm" variant="filled" color="yellow" leftSection={<IconCheck size={12} />}>
                          {t('chat.status.current')}
                        </Badge>
                      )}
                    </Group>
                    <Group gap="xs">
                      {!isActive && (
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() => handleSwitchToBranch(chat)}
                        >
                          {t('chat.branch.switch')}
                        </Button>
                      )}
                      <Tooltip label={t('chat.branch.deleteBranch')}>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          onClick={() => handleDeleteBranch(chat.id)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>

                  <Text size="sm" fw={500} mb="xs">
                    {chat.title}
                  </Text>

                  <Group gap="md" mb="xs">
                    <Group gap={4}>
                      <IconMessageCircle size={14} />
                      <Text size="xs" c="dimmed">
                        {t('chat.branch.messagesCount', { count: chat.messageCount || 0 })}
                      </Text>
                    </Group>
                    <Group gap={4}>
                      <IconClock size={14} />
                      <Text size="xs" c="dimmed">
                        {formatDate(chat.createdAt)}
                      </Text>
                    </Group>
                  </Group>

                  {compressionHistory.length > 0 && (
                    <>
                      <Divider my="xs" />
                      <Stack gap={4}>
                        <Group gap={4}>
                          <IconArchive size={14} color="var(--mantine-color-blue-6)" />
                          <Text size="xs" fw={500} c="blue">
                            {t('chat.branch.compressionHistory')}
                          </Text>
                        </Group>
                        {compressionHistory.map((comp: any, idx: number) => (
                          <Text key={idx} size="xs" c="dimmed" pl="md">
                            • {t('chat.branch.compressionRecord', {
                              originalCount: comp.originalCount,
                              compressedCount: comp.compressedCount,
                              strategy: comp.strategy === 'llm' ? t('chat.branch.aiSummary') : t('chat.branch.truncated'),
                              date: formatDate(comp.date)
                            })}
                          </Text>
                        ))}
                      </Stack>
                    </>
                  )}
                </Box>
              )
            })}
          </Stack>
        )}
      </ScrollArea>
    </Modal>
  )
}

