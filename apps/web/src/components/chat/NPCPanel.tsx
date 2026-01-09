"use client"

/**
 * NPCPanel - 聊天中的 NPC 管理面板
 *
 * 功能：
 * - 显示当前在场的 NPC
 * - 召唤/退场 NPC
 * - 查看可用的公共 NPC 库
 * - NPC 快速设置
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Drawer,
  Button,
  TextInput,
  ActionIcon,
  Stack,
  Group,
  Text,
  ScrollArea,
  Box,
  LoadingOverlay,
  Alert,
  Badge,
  Avatar,
  Card,
  Menu,
  Tooltip,
  Collapse,
  Divider,
  Tabs,
  Select,
} from '@mantine/core'
import {
  IconX,
  IconPlus,
  IconSearch,
  IconUser,
  IconUsers,
  IconDots,
  IconLogout,
  IconRefresh,
  IconChevronDown,
  IconChevronUp,
  IconAlertCircle,
  IconStar,
  IconCrown,
  IconGhost,
  IconHeart,
  IconMask,
  IconSparkles,
} from '@tabler/icons-react'
import { useTranslation } from '@/lib/i18n'
import type { NPCBasicInfo, NPCAppearanceInfo, NPCCategory } from '@/lib/npc/types'

interface NPCPanelProps {
  isOpen: boolean
  onClose: () => void
  chatId: string
  mainCharacterName: string
  onNPCActivated?: (npc: NPCBasicInfo) => void
  onNPCDismissed?: (npcId: string) => void
}

/** NPC 分类图标映射 */
const CATEGORY_ICONS: Record<NPCCategory, typeof IconUser> = {
  ordinary: IconUser,
  elite: IconCrown,
  villain: IconMask,
  fantasy: IconSparkles,
  relation: IconHeart,
  celebrity: IconStar,
}

/** NPC 分类标签 */
const CATEGORY_LABELS: Record<NPCCategory, string> = {
  ordinary: '日常',
  elite: '精英',
  villain: '反派',
  fantasy: '奇幻',
  relation: '关系',
  celebrity: '名人',
}

/** NPC 分类颜色 */
const CATEGORY_COLORS: Record<NPCCategory, string> = {
  ordinary: 'gray',
  elite: 'yellow',
  villain: 'red',
  fantasy: 'violet',
  relation: 'pink',
  celebrity: 'blue',
}

export default function NPCPanel({
  isOpen,
  onClose,
  chatId,
  mainCharacterName,
  onNPCActivated,
  onNPCDismissed,
}: NPCPanelProps) {
  const { t } = useTranslation()

  // 状态
  const [activeNPCs, setActiveNPCs] = useState<NPCAppearanceInfo[]>([])
  const [publicNPCs, setPublicNPCs] = useState<NPCBasicInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<NPCCategory | 'all'>('all')
  const [expandedNPCs, setExpandedNPCs] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<string | null>('active')

  // 加载在场 NPC
  const loadActiveNPCs = useCallback(async () => {
    if (!chatId) return

    try {
      const response = await fetch(`/api/npcs/chat/${chatId}`)
      if (response.ok) {
        const data = await response.json()
        setActiveNPCs(data.npcs || [])
      }
    } catch (err) {
      console.error('[NPCPanel] Failed to load active NPCs:', err)
    }
  }, [chatId])

  // 加载公共 NPC 库
  const loadPublicNPCs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ publicOnly: 'true', isActive: 'true' })
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory)
      }
      if (searchQuery) {
        params.set('search', searchQuery)
      }

      const response = await fetch(`/api/npcs?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setPublicNPCs(data.npcs || [])
      }
    } catch (err) {
      console.error('[NPCPanel] Failed to load public NPCs:', err)
    }
  }, [selectedCategory, searchQuery])

  // 初始加载
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      Promise.all([loadActiveNPCs(), loadPublicNPCs()])
        .finally(() => setLoading(false))
    }
  }, [isOpen, loadActiveNPCs, loadPublicNPCs])

  // 召唤 NPC
  const summonNPC = async (npc: NPCBasicInfo, entryReason?: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/npcs/chat/${chatId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          npcId: npc.id,
          entryReason: entryReason || '用户召唤',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '召唤失败')
      }

      await loadActiveNPCs()
      onNPCActivated?.(npc)
    } catch (err) {
      setError(err instanceof Error ? err.message : '召唤 NPC 失败')
    } finally {
      setLoading(false)
    }
  }

  // 让 NPC 退场
  const dismissNPC = async (npcId: string, reason?: string) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ npcId })
      if (reason) params.set('reason', reason)

      const response = await fetch(`/api/npcs/chat/${chatId}?${params.toString()}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '退场失败')
      }

      await loadActiveNPCs()
      onNPCDismissed?.(npcId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'NPC 退场失败')
    } finally {
      setLoading(false)
    }
  }

  // 切换 NPC 详情展开
  const toggleExpanded = (npcId: string) => {
    const newExpanded = new Set(expandedNPCs)
    if (newExpanded.has(npcId)) {
      newExpanded.delete(npcId)
    } else {
      newExpanded.add(npcId)
    }
    setExpandedNPCs(newExpanded)
  }

  // 过滤公共 NPC（排除已在场的）
  const availablePublicNPCs = publicNPCs.filter(
    (npc) => !activeNPCs.some((a) => a.npcId === npc.id)
  )

  // 渲染 NPC 卡片
  const renderNPCCard = (
    npc: NPCBasicInfo,
    appearance?: NPCAppearanceInfo,
    isActive: boolean = false
  ) => {
    const CategoryIcon = CATEGORY_ICONS[npc.category] || IconUser
    const isExpanded = expandedNPCs.has(npc.id)

    return (
      <Card key={npc.id} shadow="xs" padding="sm" radius="md" withBorder>
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            <Avatar src={npc.avatar} radius="xl" size="md">
              <CategoryIcon size={20} />
            </Avatar>
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Group gap={4}>
                <Text fw={500} size="sm" truncate>
                  {npc.name}
                </Text>
                {npc.alias && (
                  <Text size="xs" c="dimmed" truncate>
                    ({npc.alias})
                  </Text>
                )}
              </Group>
              <Group gap={4}>
                <Badge
                  size="xs"
                  variant="light"
                  color={CATEGORY_COLORS[npc.category]}
                >
                  {CATEGORY_LABELS[npc.category]}
                </Badge>
                {isActive && (
                  <Badge size="xs" variant="dot" color="green">
                    在场
                  </Badge>
                )}
              </Group>
            </Box>
          </Group>

          <Group gap={4}>
            <ActionIcon
              variant="subtle"
              size="sm"
              onClick={() => toggleExpanded(npc.id)}
            >
              {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            </ActionIcon>

            {isActive ? (
              <Menu shadow="md" width={140}>
                <Menu.Target>
                  <ActionIcon variant="subtle" size="sm">
                    <IconDots size={16} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconLogout size={14} />}
                    color="red"
                    onClick={() => dismissNPC(npc.id)}
                  >
                    让其退场
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Tooltip label="召唤到场景">
                <ActionIcon
                  variant="light"
                  color="blue"
                  size="sm"
                  onClick={() => summonNPC(npc)}
                >
                  <IconPlus size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>

        <Collapse in={isExpanded}>
          <Box mt="xs" pt="xs" style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
            <Text size="xs" c="dimmed" lineClamp={3}>
              {npc.description}
            </Text>
            {npc.personality && (
              <Text size="xs" mt={4}>
                <Text span fw={500}>性格：</Text>
                {npc.personality.substring(0, 100)}
                {npc.personality.length > 100 && '...'}
              </Text>
            )}
            {appearance?.relationToMain && (
              <Text size="xs" mt={4}>
                <Text span fw={500}>与 {mainCharacterName} 的关系：</Text>
                {appearance.relationToMain}
              </Text>
            )}
            {appearance?.entryReason && (
              <Text size="xs" mt={4} c="dimmed">
                <Text span fw={500}>出场原因：</Text>
                {appearance.entryReason}
              </Text>
            )}
          </Box>
        </Collapse>
      </Card>
    )
  }

  return (
    <Drawer
      opened={isOpen}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconUsers size={20} />
          <Text fw={600}>场景角色</Text>
        </Group>
      }
      position="right"
      size="md"
      padding="md"
    >
      <LoadingOverlay visible={loading} />

      {error && (
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="错误"
          color="red"
          withCloseButton
          onClose={() => setError(null)}
          mb="md"
        >
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="active" leftSection={<IconUser size={14} />}>
            在场 ({activeNPCs.length})
          </Tabs.Tab>
          <Tabs.Tab value="library" leftSection={<IconGhost size={14} />}>
            NPC 库
          </Tabs.Tab>
        </Tabs.List>

        {/* 在场 NPC */}
        <Tabs.Panel value="active" pt="md">
          <Stack gap="sm">
            {/* 主角色 */}
            <Card shadow="xs" padding="sm" radius="md" withBorder>
              <Group gap="sm">
                <Avatar radius="xl" size="md" color="blue">
                  <IconStar size={20} />
                </Avatar>
                <Box>
                  <Group gap={4}>
                    <Text fw={600} size="sm">
                      {mainCharacterName}
                    </Text>
                    <Badge size="xs" color="blue" variant="light">
                      主角色
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">
                    始终在场的主要角色
                  </Text>
                </Box>
              </Group>
            </Card>

            <Divider label="在场 NPC" labelPosition="center" />

            {activeNPCs.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="xl">
                当前没有 NPC 在场
                <br />
                <Text size="xs" c="dimmed">
                  去「NPC 库」召唤角色吧
                </Text>
              </Text>
            ) : (
              <Stack gap="xs">
                {activeNPCs.map((appearance) =>
                  appearance.npc
                    ? renderNPCCard(appearance.npc, appearance, true)
                    : null
                )}
              </Stack>
            )}
          </Stack>
        </Tabs.Panel>

        {/* NPC 库 */}
        <Tabs.Panel value="library" pt="md">
          <Stack gap="sm">
            {/* 搜索和筛选 */}
            <Group gap="xs">
              <TextInput
                placeholder="搜索 NPC..."
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1 }}
                size="sm"
              />
              <Select
                placeholder="分类"
                value={selectedCategory}
                onChange={(v) => setSelectedCategory((v as NPCCategory) || 'all')}
                data={[
                  { value: 'all', label: '全部' },
                  { value: 'ordinary', label: '日常' },
                  { value: 'elite', label: '精英' },
                  { value: 'villain', label: '反派' },
                  { value: 'fantasy', label: '奇幻' },
                  { value: 'relation', label: '关系' },
                  { value: 'celebrity', label: '名人' },
                ]}
                size="sm"
                w={100}
              />
              <ActionIcon
                variant="subtle"
                onClick={() => {
                  setLoading(true)
                  loadPublicNPCs().finally(() => setLoading(false))
                }}
              >
                <IconRefresh size={16} />
              </ActionIcon>
            </Group>

            {/* NPC 列表 */}
            <ScrollArea h={400}>
              {availablePublicNPCs.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                  {searchQuery || selectedCategory !== 'all'
                    ? '没有找到匹配的 NPC'
                    : '暂无可用的公共 NPC'}
                </Text>
              ) : (
                <Stack gap="xs">
                  {availablePublicNPCs.map((npc) => renderNPCCard(npc))}
                </Stack>
              )}
            </ScrollArea>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Drawer>
  )
}
