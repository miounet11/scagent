"use client"

import { Button, ActionIcon, Stack, Text, Group, Box, ScrollArea, Divider, Tooltip, Badge, ThemeIcon } from '@mantine/core'
import {
  IconArrowLeft,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconGitBranch,
  IconFileText,
  IconBook,
  IconSettings,
  IconWand,
  IconCode,
  IconFileCode,
  IconAdjustments,
  IconUser,
  IconWorld,
  IconHistory,
  IconBroadcast,
  IconBolt,
  IconInfoCircle,
  IconChevronRight
} from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useTranslation, getLocale } from '@/lib/i18n'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useChatStore } from '@/stores/chatStore'
import { useSettingsUIStore } from '@/stores/settingsUIStore'

interface ChatSettingsPanelProps {
  isOpen: boolean
  onToggle: () => void
  onOpenWorldInfo: () => void
  onOpenExternalPrompts?: () => void
  onOpenTemplateVariables?: () => void
  onOpenRegexEditor?: () => void
  onOpenPresetEditor?: () => void
  onOpenBranchView?: () => void
  onOpenCharacterTune?: () => void
  characterName?: string
  hideOverlay?: boolean
  isMobile?: boolean
  isDesktop?: boolean
  /** Overlay mode - sidebar floats on top of content instead of pushing it (for immersive mode) */
  overlayMode?: boolean
}

// Simple token estimation (rough approximation: ~4 characters per token)
const estimateTokens = (text: string): number => {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}

export default function ChatSettingsPanel({
  isOpen,
  onToggle,
  onOpenWorldInfo,
  onOpenExternalPrompts,
  onOpenTemplateVariables,
  onOpenRegexEditor,
  onOpenPresetEditor,
  onOpenBranchView,
  onOpenCharacterTune,
  characterName,
  hideOverlay = false,
  isMobile = false,
  isDesktop = false,
  overlayMode = false
}: ChatSettingsPanelProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const { messages } = useChatStore()
  const { openSettings } = useSettingsUIStore()

  // Calculate stats
  const messageCount = messages.length
  const totalTokens = messages.reduce((sum, msg) => {
    return sum + estimateTokens(msg.content || '')
  }, 0)
  const formattedTokenCount = totalTokens > 0 ? totalTokens.toLocaleString(getLocale()) : '0'

  // 通用按钮组件 - 只显示标题，不显示描述（避免遮挡）
  const SettingButton = ({
    onClick,
    icon: Icon,
    title,
    description,
    color = 'gray',
    badge,
    disabled = false
  }: {
    onClick?: () => void
    icon: React.ElementType
    title: string
    description?: string
    color?: string
    badge?: string
    disabled?: boolean
  }) => (
    <Button
      onClick={onClick}
      variant="subtle"
      fullWidth
      size={isMobile ? 'md' : 'md'}
      justify="flex-start"
      disabled={disabled}
      className="min-h-[40px] md:min-h-[40px]"
      styles={{
        root: {
          padding: '0.5rem 0.75rem',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '0.5rem',
          transition: 'all 0.2s',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          },
        },
        inner: {
          justifyContent: 'flex-start',
          width: '100%',
        },
        label: {
          width: '100%',
        },
      }}
    >
      <Group gap="sm" wrap="nowrap" style={{ width: '100%' }}>
        <ThemeIcon
          size="md"
          variant="light"
          color={color}
          style={{ flexShrink: 0 }}
        >
          <Icon size={16} />
        </ThemeIcon>
        <Group gap="xs" justify="space-between" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={500} truncate>
            {title}
          </Text>
          {badge && (
            <Badge size="xs" variant="light" color={color}>
              {badge}
            </Badge>
          )}
        </Group>
        <IconChevronRight size={14} style={{ opacity: 0.4, flexShrink: 0 }} />
      </Group>
    </Button>
  )

  // 分组标题组件
  const SectionTitle = ({ icon: Icon, title, color = 'blue' }: { icon: React.ElementType; title: string; color?: string }) => (
    <Group gap="xs" mt="md" mb="xs">
      <ThemeIcon size="xs" variant="transparent" color={color}>
        <Icon size={12} />
      </ThemeIcon>
      <Text size="xs" fw={600} c="dimmed" tt="uppercase">
        {title}
      </Text>
    </Group>
  )

  // Desktop: Fixed sidebar content
  const sidebarContent = (
    <div
      className="bg-gray-900 border-r border-gray-800 flex flex-col"
      style={{
        position: isDesktop ? 'fixed' : 'sticky',
        top: isDesktop ? (isMobile ? 0 : 'var(--nav-height)') : 0,
        left: isDesktop ? 0 : undefined,
        width: isDesktop ? '280px' : '100%',
        height: isMobile ? '100vh' : 'calc(100vh - var(--nav-height))',
        maxHeight: isMobile ? '100vh' : 'calc(100vh - var(--nav-height))',
        zIndex: 40
      }}
    >
      {/* Header */}
      <Box p={isMobile ? 'sm' : 'md'} style={{ borderBottom: '1px solid var(--mantine-color-dark-5)' }}>
        <Group justify="space-between" mb={isMobile ? 'xs' : 'sm'}>
          <Text size={isMobile ? 'sm' : 'md'} fw={700} style={{ color: 'var(--accent-gold-hex)' }}>
            {t('chat.settingsPanel.title')}
          </Text>
          <ActionIcon
            onClick={onToggle}
            variant="subtle"
            size={isMobile ? 'sm' : 'sm'}
            title={t('chat.settingsPanel.collapseSidebar') || 'Collapse sidebar'}
          >
            <IconLayoutSidebarLeftCollapse size={isMobile ? 16 : 18} />
          </ActionIcon>
        </Group>

        {characterName && (
          <Group gap="xs">
            <Text size="xs" c="dimmed">{t('chat.settingsPanel.currentCharacter')}:</Text>
            <Badge size="sm" variant="light" color="teal">
              {characterName}
            </Badge>
          </Group>
        )}
      </Box>

      {/* Navigation Buttons - 重新分组 */}
      <ScrollArea style={{ flex: 1 }} p={isMobile ? 'sm' : 'md'} className="pb-20 md:pb-0">
        <Stack gap="xs">
          {/* 📌 导航 */}
          <SettingButton
            onClick={() => router.push('/characters')}
            icon={IconArrowLeft}
            title={t('chat.settingsPanel.backToCharacters')}
            color="gray"
          />

          {/* 🎭 角色设定 */}
          <SectionTitle icon={IconUser} title={t('chat.settingsPanel.sections.characterSettings') || '角色设定'} color="teal" />

          <SettingButton
            onClick={onOpenCharacterTune}
            icon={IconAdjustments}
            title={t('chat.settingsPanel.characterTune.title') || '角色微调'}
            description={t('chat.settingsPanel.characterTune.description') || '调整角色行为和用户人设'}
            color="teal"
          />

          <SettingButton
            onClick={onOpenWorldInfo}
            icon={IconWorld}
            title={t('chat.settingsPanel.worldInfo.title')}
            description={t('chat.settingsPanel.worldInfo.description') || '添加角色知识背景（技能、地点、物品）'}
            color="teal"
          />

          {/* 📖 故事管理 */}
          <SectionTitle icon={IconHistory} title={t('chat.settingsPanel.sections.storyManagement') || '故事管理'} color="violet" />

          <SettingButton
            onClick={onOpenBranchView}
            icon={IconGitBranch}
            title={t('chat.settingsPanel.branches.title')}
            description={t('chat.settingsPanel.branches.description') || '查看和切换对话分支'}
            color="violet"
          />

          {/* 🔧 对话设置 */}
          <SectionTitle icon={IconBroadcast} title={t('chat.settingsPanel.sections.chatSettings') || '对话设置'} color="yellow" />

          <SettingButton
            onClick={() => openSettings('models')}
            icon={IconSettings}
            title={t('chat.settingsPanel.advancedSettings.title')}
            description={t('chat.settingsPanel.advancedSettings.description') || '模型配置、API 设置'}
            color="yellow"
          />

          <SettingButton
            onClick={() => openSettings('advanced-tools')}
            icon={IconBolt}
            title={t('chat.settingsPanel.advancedTools.title') || '高级功能'}
            description={t('chat.settingsPanel.advancedTools.description') || '预设、模板、正则、外部提示'}
            color="orange"
          />
        </Stack>
      </ScrollArea>

      {/* Footer Info */}
      <Box p={isMobile ? 'sm' : 'md'} style={{ borderTop: '1px solid var(--mantine-color-dark-5)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
        <Stack gap={isMobile ? 2 : 4}>
          <Group justify="space-between">
            <Text size="xs" c="dimmed">{t('chat.settingsPanel.stats.messageCount')}:</Text>
            <Badge size="xs" variant="light" color="gray">{messageCount}</Badge>
          </Group>
          <Group justify="space-between">
            <Text size="xs" c="dimmed">{t('chat.settingsPanel.stats.tokenUsage')}:</Text>
            <Badge size="xs" variant="light" color="gray">{formattedTokenCount}</Badge>
          </Group>
        </Stack>
      </Box>
    </div>
  )

  // Desktop: Render as fixed sidebar OR overlay mode for immersive experience
  if (isDesktop) {
    // Overlay mode: Floating panel on top of content (for immersive mode)
    if (overlayMode) {
      return (
        <>
          {/* Floating button when closed */}
          {!isOpen && (
            <ActionIcon
              onClick={onToggle}
              size="lg"
              variant="filled"
              style={{
                position: 'fixed',
                left: '1rem',
                top: '5rem',
                zIndex: 1002,
                background: 'rgba(30, 30, 35, 0.9)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              title={t('chat.settingsPanel.expandSidebar')}
            >
              <IconLayoutSidebarLeftExpand size={20} />
            </ActionIcon>
          )}

          {/* Overlay backdrop + floating panel */}
          {isOpen && (
            <>
              {/* Semi-transparent backdrop */}
              <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[45] cursor-pointer"
                onClick={onToggle}
                style={{ transition: 'opacity 0.3s ease' }}
              />
              {/* Floating sidebar panel */}
              <div
                className="fixed z-[50] bg-gray-900/95 backdrop-blur-lg border border-white/10 shadow-2xl rounded-xl overflow-hidden flex flex-col"
                style={{
                  left: '1rem',
                  top: '5rem',
                  bottom: '1rem',
                  width: '280px',
                  animation: 'slideInLeft 0.3s ease',
                }}
              >
                {/* Header */}
                <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-dark-5)' }}>
                  <Group justify="space-between" mb="sm">
                    <Text size="md" fw={700} style={{ color: 'var(--accent-gold-hex)' }}>
                      {t('chat.settingsPanel.title')}
                    </Text>
                    <ActionIcon
                      onClick={onToggle}
                      variant="subtle"
                      size="sm"
                      title={t('chat.settingsPanel.collapseSidebar') || 'Close panel'}
                    >
                      <IconLayoutSidebarLeftCollapse size={18} />
                    </ActionIcon>
                  </Group>

                  {characterName && (
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">{t('chat.settingsPanel.currentCharacter')}:</Text>
                      <Badge size="sm" variant="light" color="teal">
                        {characterName}
                      </Badge>
                    </Group>
                  )}
                </Box>

                {/* Navigation Buttons */}
                <ScrollArea style={{ flex: 1 }} p="md">
                  <Stack gap="xs">
                    <SettingButton
                      onClick={() => router.push('/characters')}
                      icon={IconArrowLeft}
                      title={t('chat.settingsPanel.backToCharacters')}
                      color="gray"
                    />

                    <SectionTitle icon={IconUser} title={t('chat.settingsPanel.sections.characterSettings') || '角色设定'} color="teal" />

                    <SettingButton
                      onClick={onOpenCharacterTune}
                      icon={IconAdjustments}
                      title={t('chat.settingsPanel.characterTune.title') || '角色微调'}
                      color="teal"
                    />

                    <SettingButton
                      onClick={onOpenWorldInfo}
                      icon={IconWorld}
                      title={t('chat.settingsPanel.worldInfo.title')}
                      color="teal"
                    />

                    <SectionTitle icon={IconHistory} title={t('chat.settingsPanel.sections.storyManagement') || '故事管理'} color="violet" />

                    <SettingButton
                      onClick={onOpenBranchView}
                      icon={IconGitBranch}
                      title={t('chat.settingsPanel.branches.title')}
                      color="violet"
                    />

                    <SectionTitle icon={IconBroadcast} title={t('chat.settingsPanel.sections.chatSettings') || '对话设置'} color="yellow" />

                    <SettingButton
                      onClick={() => openSettings('models')}
                      icon={IconSettings}
                      title={t('chat.settingsPanel.advancedSettings.title')}
                      color="yellow"
                    />

                    <SettingButton
                      onClick={() => openSettings('advanced-tools')}
                      icon={IconBolt}
                      title={t('chat.settingsPanel.advancedTools.title') || '高级功能'}
                      color="orange"
                    />
                  </Stack>
                </ScrollArea>

                {/* Footer Info */}
                <Box p="md" style={{ borderTop: '1px solid var(--mantine-color-dark-5)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
                  <Stack gap={4}>
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">{t('chat.settingsPanel.stats.messageCount')}:</Text>
                      <Badge size="xs" variant="light" color="gray">{messageCount}</Badge>
                    </Group>
                    <Group justify="space-between">
                      <Text size="xs" c="dimmed">{t('chat.settingsPanel.stats.tokenUsage')}:</Text>
                      <Badge size="xs" variant="light" color="gray">{formattedTokenCount}</Badge>
                    </Group>
                  </Stack>
                </Box>
              </div>
            </>
          )}
        </>
      )
    }

    // Normal desktop mode: Fixed sidebar that pushes content
    return (
      <>
        {/* Floating button when closed */}
        {!isOpen && (
          <ActionIcon
            onClick={onToggle}
            size="lg"
            variant="filled"
            color="dark"
            style={{
              position: 'fixed',
              left: '1rem',
              top: '5rem',
              zIndex: 1002
            }}
            title={t('chat.settingsPanel.expandSidebar')}
          >
            <IconLayoutSidebarLeftExpand size={20} />
          </ActionIcon>
        )}

        {/* Fixed sidebar */}
        {isOpen && sidebarContent}
      </>
    )
  }

  // Mobile: Render as drawer (侧边栏按钮已移至header)
  return (
    <>
      {/* Drawer Sheet for mobile */}
      <Sheet open={isOpen} onOpenChange={onToggle}>
        <SheetContent side="left" className="w-[85%] sm:w-[320px] md:w-[340px] p-0 flex flex-col" hideOverlay={hideOverlay}>
          {/* Accessibility titles for screen readers */}
          <SheetTitle className="sr-only">{t('chat.settingsPanel.title')}</SheetTitle>
          <SheetDescription className="sr-only">
            {t('chat.settingsPanel.description') || 'Chat settings and navigation panel'}
          </SheetDescription>

          {/* Header */}
          <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-dark-5)' }}>
            <Group justify="space-between" mb="sm">
              <Text size="sm" fw={700} style={{ color: 'var(--accent-gold-hex)' }}>
                {t('chat.settingsPanel.title')}
              </Text>
            </Group>

            {characterName && (
              <Group gap="xs">
                <Text size="xs" c="dimmed">{t('chat.settingsPanel.currentCharacter')}:</Text>
                <Badge size="sm" variant="light" color="teal">
                  {characterName}
                </Badge>
              </Group>
            )}
          </Box>

          {/* Navigation Buttons - 使用相同的组件结构 */}
          <ScrollArea style={{ flex: 1 }} p="md" className="pb-20 md:pb-0">
            <Stack gap="xs">
              {/* 📌 导航 */}
              <SettingButton
                onClick={() => router.push('/characters')}
                icon={IconArrowLeft}
                title={t('chat.settingsPanel.backToCharacters')}
                color="gray"
              />

              {/* 🎭 角色设定 */}
              <SectionTitle icon={IconUser} title={t('chat.settingsPanel.sections.characterSettings') || '角色设定'} color="teal" />

              <SettingButton
                onClick={onOpenCharacterTune}
                icon={IconAdjustments}
                title={t('chat.settingsPanel.characterTune.title') || '角色微调'}
                description={t('chat.settingsPanel.characterTune.description') || '调整角色行为和用户人设'}
                color="teal"
              />

              <SettingButton
                onClick={onOpenWorldInfo}
                icon={IconWorld}
                title={t('chat.settingsPanel.worldInfo.title')}
                description={t('chat.settingsPanel.worldInfo.description') || '添加角色知识背景'}
                color="teal"
              />

              {/* 📖 故事管理 */}
              <SectionTitle icon={IconHistory} title={t('chat.settingsPanel.sections.storyManagement') || '故事管理'} color="violet" />

              <SettingButton
                onClick={onOpenBranchView}
                icon={IconGitBranch}
                title={t('chat.settingsPanel.branches.title')}
                description={t('chat.settingsPanel.branches.description') || '查看和切换对话分支'}
                color="violet"
              />

              {/* 🔧 对话设置 */}
              <SectionTitle icon={IconBroadcast} title={t('chat.settingsPanel.sections.chatSettings') || '对话设置'} color="yellow" />

              <SettingButton
                onClick={() => openSettings('models')}
                icon={IconSettings}
                title={t('chat.settingsPanel.advancedSettings.title')}
                description={t('chat.settingsPanel.advancedSettings.description') || '模型配置、API 设置'}
                color="yellow"
              />

              <SettingButton
                onClick={() => openSettings('advanced-tools')}
                icon={IconBolt}
                title={t('chat.settingsPanel.advancedTools.title') || '高级功能'}
                description={t('chat.settingsPanel.advancedTools.description') || '预设、模板、正则、外部提示'}
                color="orange"
              />
            </Stack>
          </ScrollArea>

          {/* Footer Info */}
          <Box p="md" style={{ borderTop: '1px solid var(--mantine-color-dark-5)', backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
            <Stack gap={4}>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">{t('chat.settingsPanel.stats.messageCount')}:</Text>
                <Badge size="xs" variant="light" color="gray">{messageCount}</Badge>
              </Group>
              <Group justify="space-between">
                <Text size="xs" c="dimmed">{t('chat.settingsPanel.stats.tokenUsage')}:</Text>
                <Badge size="xs" variant="light" color="gray">{formattedTokenCount}</Badge>
              </Group>
            </Stack>
          </Box>
        </SheetContent>
      </Sheet>
    </>
  )
}
