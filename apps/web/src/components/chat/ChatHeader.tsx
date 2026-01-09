'use client'

/**
 * ChatHeader v22.0 - Enhanced Theater Hall Experience
 *
 * Design: "Soul Theater" immersive chat header with enhanced UX
 * - Spotlight ambient effects around character avatar
 * - Glass morphism with theater void background
 * - Smooth auto-hide in RPG mode
 * - Mobile-optimized touch targets and gestures
 * - Character presence indicators with animated glow effects
 * - Enhanced online status indicator with pulse animation
 * - Improved typography and spacing
 * - Better hover effects for action buttons
 * - Breadcrumb-style navigation
 */

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Chat, Character } from '@sillytavern-clone/shared'
import toast from 'react-hot-toast'
import { ActionIcon, Avatar, Badge, Box, Group, Menu, Text, Tooltip, Transition } from '@mantine/core'
import {
  IconArrowLeft,
  IconDotsVertical,
  IconDownload,
  IconGitBranch,
  IconMessagePlus,
  IconSparkles,
  IconSettings,
  IconShare2,
  IconStar,
  IconTheater,
  IconTrash,
  IconUsers,
  IconWorld,
  IconChevronLeft,
  IconChevronRight,
  IconHome,
} from '@tabler/icons-react'
import { useChatStore } from '@/stores/chatStore'
import { useTranslation } from '@/lib/i18n'
import { useRPGModeStore } from '@/stores/rpgModeStore'
import PresetSelector from './PresetSelector'
import CharacterDetailModal from '@/components/character/CharacterDetailModal'

interface ChatHeaderProps {
  className?: string
  chat?: Chat | null
  character?: Character | null
  onBack?: () => void
  onNewChat?: (mode?: 'preserve' | 'reset' | 'branch') => void
  onViewCharacter?: () => void
  onOpenNPCPanel?: () => void
  onOpenStoryTracking?: () => void
  onOpenDirectorPanel?: () => void
  isLeftSidebarOpen?: boolean
  isRightSidebarOpen?: boolean
  onToggleLeftSidebar?: () => void
  onToggleRightSidebar?: () => void
}

// Theater color palette
const theaterColors = {
  spotlightGold: 'rgba(245, 197, 66, 0.8)',
  spotlightGoldDim: 'rgba(245, 197, 66, 0.3)',
  spotlightGoldBright: 'rgba(245, 197, 66, 1)',
  moonlight: 'rgba(196, 181, 253, 0.6)',
  moonlightBright: 'rgba(196, 181, 253, 0.9)',
  voidDark: 'rgba(26, 20, 41, 0.95)',
  glassBorder: 'rgba(245, 197, 66, 0.15)',
  glassBorderHover: 'rgba(245, 197, 66, 0.35)',
  onlineGreen: '#22c55e',
  onlineGreenGlow: 'rgba(34, 197, 94, 0.5)',
  textPrimary: 'rgba(255, 255, 255, 0.95)',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.5)',
}

// CSS keyframes for animations (injected once)
const injectStyles = () => {
  if (typeof document === 'undefined') return
  if (document.getElementById('chat-header-styles')) return

  const style = document.createElement('style')
  style.id = 'chat-header-styles'
  style.textContent = `
    @keyframes online-pulse {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 ${theaterColors.onlineGreenGlow};
      }
      50% {
        transform: scale(1.1);
        box-shadow: 0 0 8px 4px ${theaterColors.onlineGreenGlow};
      }
    }

    @keyframes typing-dot {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.4;
      }
      30% {
        transform: translateY(-4px);
        opacity: 1;
      }
    }

    @keyframes spotlight-pulse {
      0%, 100% {
        opacity: 0.25;
      }
      50% {
        opacity: 0.5;
      }
    }

    @keyframes avatar-ring-rotate {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    .chat-header-action-btn {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }

    .chat-header-action-btn:hover {
      transform: translateY(-1px);
      background: rgba(255, 255, 255, 0.08) !important;
    }

    .chat-header-action-btn:active {
      transform: translateY(0) scale(0.95);
    }

    .breadcrumb-item {
      transition: all 0.2s ease;
    }

    .breadcrumb-item:hover {
      color: ${theaterColors.spotlightGoldBright} !important;
    }
  `
  document.head.appendChild(style)
}

export default function ChatHeader({
  className = '',
  chat,
  character,
  onBack,
  onNewChat,
  onViewCharacter,
  onOpenNPCPanel,
  onOpenStoryTracking,
  onOpenDirectorPanel,
  isLeftSidebarOpen,
  isRightSidebarOpen,
  onToggleLeftSidebar,
  onToggleRightSidebar,
}: ChatHeaderProps) {
  const router = useRouter()
  const { deleteChat, exportChat, isGenerating } = useChatStore()
  const { isRPGMode, toggleRPGMode } = useRPGModeStore()
  const { t } = useTranslation()

  const [isMobile, setIsMobile] = useState(false)
  const [showCharacterDetail, setShowCharacterDetail] = useState(false)
  const [immersiveVisible, setImmersiveVisible] = useState(true)
  const [isAvatarHovered, setIsAvatarHovered] = useState(false)
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)
  const hideTimerRef = useRef<number | null>(null)
  const touchStartX = useRef<number>(0)
  const headerRef = useRef<HTMLDivElement>(null)

  const currentChat = chat || null
  const currentCharacter = character || null

  // Inject CSS animations on mount
  useEffect(() => {
    injectStyles()
  }, [])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const showImmersiveTemporarily = useCallback((ms: number) => {
    setImmersiveVisible(true)
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
    hideTimerRef.current = window.setTimeout(() => setImmersiveVisible(false), ms)
  }, [])

  useEffect(() => {
    if (!isRPGMode) {
      setImmersiveVisible(true)
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
      return
    }

    showImmersiveTemporarily(2500)

    const onActivity = () => showImmersiveTemporarily(2200)
    const onScroll = () => showImmersiveTemporarily(1200)

    window.addEventListener('pointermove', onActivity, { passive: true })
    window.addEventListener('touchstart', onActivity, { passive: true })
    window.addEventListener('keydown', onActivity)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('pointermove', onActivity)
      window.removeEventListener('touchstart', onActivity)
      window.removeEventListener('keydown', onActivity)
      window.removeEventListener('scroll', onScroll)
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }, [isRPGMode, showImmersiveTemporarily])

  // Mobile swipe-back gesture
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX
    const deltaX = touchEndX - touchStartX.current

    // Swipe right from left edge to go back
    if (touchStartX.current < 50 && deltaX > 80) {
      handleBack()
    }
  }, [])

  const handleBack = useCallback(() => {
    if (onBack) return onBack()
    if (currentCharacter?.id) return router.push(`/characters?characterId=${currentCharacter.id}`)
    router.push('/characters')
  }, [onBack, currentCharacter?.id, router])

  const handleDeleteChat = async () => {
    if (!currentChat) return

    const confirmMessage = t('chat.deleteConfirm', { name: currentCharacter?.name || 'AI' })
    if (!confirm(confirmMessage)) return

    try {
      const success = await deleteChat(currentChat.id)
      if (success) {
        toast.success(t('chat.deleted'))
        handleBack()
      }
    } catch {
      toast.error(t('chat.deleteFailed'))
    }
  }

  const handleExportChat = async () => {
    if (!currentChat) return

    try {
      const exportData = await exportChat(currentChat.id)
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
      const exportFileDefaultName = `${currentCharacter?.name || 'chat'}_${new Date().toISOString().split('T')[0]}.json`

      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      linkElement.click()

      toast.success(t('chat.chatHeader.success.exported'))
    } catch {
      toast.error(t('chat.errors.exportFailed') || t('chat.chatHeader.error.operationFailed'))
    }
  }

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return window.location.href
  }, [])

  const handleShareChat = async () => {
    if (!currentChat) return

    try {
      if (navigator.share) {
        await navigator.share({
          title: t('chat.chatHeader.shareTitle', { name: currentCharacter?.name || 'AI' }),
          text: t('chat.chatHeader.shareText'),
          url: shareUrl || window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(shareUrl || window.location.href)
        toast.success(t('chat.chatHeader.success.shareLinkCopied'))
      }
    } catch {
      toast.error(t('chat.chatHeader.error.shareFailed'))
    }
  }

  const handleToggleFavorite = async () => {
    if (!currentChat) return

    try {
      const response = await fetch(`/api/chats/${currentChat.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !currentChat.isFavorite }),
      })

      if (!response.ok) throw new Error('Failed to toggle favorite')
      toast.success(currentChat.isFavorite ? t('chat.unfavorited') : t('chat.favorited'))
    } catch {
      toast.error(t('chat.chatHeader.error.operationFailed'))
    }
  }

  const headerOpacity = isRPGMode ? (immersiveVisible ? 1 : 0.12) : 1

  // Helper function for action button styling
  const getActionButtonStyle = (buttonId: string, isActive?: boolean) => ({
    color: isActive ? theaterColors.moonlightBright : hoveredButton === buttonId ? theaterColors.textPrimary : theaterColors.textMuted,
    background: hoveredButton === buttonId ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
    transform: hoveredButton === buttonId ? 'translateY(-1px)' : 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  })

  return (
    <>
      <Box
        ref={headerRef}
        className={`${className} mobile-safe-container chat-header-theater`}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1.25rem',
          opacity: headerOpacity,
          transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',

          // Theater glass morphism
          background: `linear-gradient(135deg, ${theaterColors.voidDark} 0%, rgba(13, 17, 23, 0.92) 100%)`,
          backdropFilter: isRPGMode ? (immersiveVisible ? 'blur(20px)' : 'blur(8px)') : 'blur(20px)',
          borderBottom: `1px solid ${theaterColors.glassBorder}`,

          // Subtle spotlight ambient glow from above
          boxShadow: isRPGMode
            ? 'none'
            : `0 1px 0 ${theaterColors.glassBorder}, 0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)`,
        }}
      >
        {/* Ambient spotlight effect - enhanced */}
        {!isRPGMode && (
          <Box
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '280px',
              height: '3px',
              background: `linear-gradient(90deg, transparent 0%, ${theaterColors.spotlightGoldDim} 30%, ${theaterColors.spotlightGold} 50%, ${theaterColors.spotlightGoldDim} 70%, transparent 100%)`,
              pointerEvents: 'none',
              animation: 'spotlight-pulse 3s ease-in-out infinite',
            }}
          />
        )}

        <Group justify="space-between" align="center" wrap="nowrap" style={{ width: '100%', position: 'relative' }}>
          {/* Left section: Navigation and Character Info */}
          <Group gap={isMobile ? 'xs' : 'md'} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
            {/* Breadcrumb Navigation */}
            <Group gap={4} wrap="nowrap" align="center">
              {/* Back/Home button with enhanced styling */}
              <Tooltip label={t('common.back') || '返回'} position="bottom" withArrow>
                <ActionIcon
                  size={isMobile ? 'md' : 'lg'}
                  variant="subtle"
                  onClick={handleBack}
                  className="chat-header-action-btn touch-target"
                  onMouseEnter={() => setHoveredButton('back')}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={{
                    color: hoveredButton === 'back' ? theaterColors.spotlightGoldBright : theaterColors.spotlightGold,
                    background: hoveredButton === 'back' ? 'rgba(245, 197, 66, 0.1)' : 'transparent',
                    borderRadius: '10px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <IconChevronLeft size={isMobile ? 20 : 22} strokeWidth={2.5} />
                </ActionIcon>
              </Tooltip>

              {/* Breadcrumb separator and home link - desktop only */}
              {!isMobile && (
                <>
                  <IconChevronRight size={14} style={{ color: theaterColors.textMuted, opacity: 0.5 }} />
                  <Text
                    size="xs"
                    className="breadcrumb-item"
                    style={{
                      color: theaterColors.textMuted,
                      cursor: 'pointer',
                      padding: '4px 8px',
                      borderRadius: '6px',
                    }}
                    onClick={() => router.push('/characters')}
                  >
                    {t('nav.characters') || '角色'}
                  </Text>
                  <IconChevronRight size={14} style={{ color: theaterColors.textMuted, opacity: 0.5 }} />
                </>
              )}
            </Group>

            {/* Left sidebar toggle - desktop only */}
            {onToggleLeftSidebar && !isMobile && (
              <Tooltip label={isLeftSidebarOpen ? '收起设置' : '打开设置'} position="bottom" withArrow>
                <ActionIcon
                  size="lg"
                  variant="subtle"
                  onClick={onToggleLeftSidebar}
                  className="chat-header-action-btn touch-target"
                  onMouseEnter={() => setHoveredButton('leftSidebar')}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={getActionButtonStyle('leftSidebar', isLeftSidebarOpen)}
                >
                  <IconSettings size={20} />
                </ActionIcon>
              </Tooltip>
            )}

            {/* Character avatar with enhanced spotlight effect */}
            <Tooltip label={t('chat.labels.viewCharacterDetails')} position="bottom" withArrow>
              <Box
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  marginLeft: isMobile ? '4px' : '8px',
                }}
                onMouseEnter={() => setIsAvatarHovered(true)}
                onMouseLeave={() => setIsAvatarHovered(false)}
                onClick={() => {
                  setShowCharacterDetail(true)
                  onViewCharacter?.()
                }}
              >
                {/* Outer glow ring - animated when generating */}
                <Box
                  style={{
                    position: 'absolute',
                    inset: '-6px',
                    borderRadius: '50%',
                    background: isGenerating
                      ? `conic-gradient(from 0deg, ${theaterColors.spotlightGold}, ${theaterColors.moonlight}, ${theaterColors.spotlightGold})`
                      : `radial-gradient(circle, ${theaterColors.spotlightGold} 0%, transparent 70%)`,
                    opacity: isAvatarHovered || isGenerating ? 0.7 : 0.3,
                    transition: 'opacity 0.3s ease',
                    animation: isGenerating ? 'avatar-ring-rotate 2s linear infinite' : 'none',
                    pointerEvents: 'none',
                    filter: 'blur(2px)',
                  }}
                />

                {/* Inner spotlight glow */}
                <Box
                  style={{
                    position: 'absolute',
                    inset: '-3px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${theaterColors.spotlightGold} 0%, transparent 60%)`,
                    opacity: isAvatarHovered ? 0.5 : 0.2,
                    transition: 'opacity 0.3s ease',
                    pointerEvents: 'none',
                  }}
                />

                <Avatar
                  src={(currentCharacter as any)?.coverUrl || currentCharacter?.avatar}
                  size={isMobile ? 40 : 46}
                  radius="xl"
                  style={{
                    flexShrink: 0,
                    border: `2.5px solid ${isAvatarHovered ? theaterColors.spotlightGoldBright : theaterColors.glassBorderHover}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isAvatarHovered
                      ? `0 0 24px ${theaterColors.spotlightGoldDim}, 0 4px 12px rgba(0, 0, 0, 0.3)`
                      : '0 2px 8px rgba(0, 0, 0, 0.2)',
                    transform: isAvatarHovered ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  <IconUsers size={20} style={{ color: theaterColors.textMuted }} />
                </Avatar>

                {/* Online status indicator - always visible with pulse animation */}
                <Box
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: isGenerating ? '14px' : '12px',
                    height: isGenerating ? '14px' : '12px',
                    borderRadius: '50%',
                    background: isGenerating
                      ? `linear-gradient(135deg, ${theaterColors.onlineGreen} 0%, #4ade80 100%)`
                      : theaterColors.onlineGreen,
                    border: `2.5px solid ${theaterColors.voidDark}`,
                    animation: 'online-pulse 2s ease-in-out infinite',
                    boxShadow: `0 0 8px ${theaterColors.onlineGreenGlow}`,
                    transition: 'all 0.3s ease',
                  }}
                />
              </Box>
            </Tooltip>

            {/* Character name and status - improved typography */}
            <Box style={{ flex: 1, minWidth: 0, marginLeft: isMobile ? '8px' : '12px' }}>
              <Text
                size={isMobile ? 'sm' : 'md'}
                fw={700}
                truncate
                style={{
                  color: theaterColors.spotlightGoldBright,
                  textShadow: `0 0 24px ${theaterColors.spotlightGoldDim}`,
                  letterSpacing: '0.03em',
                  lineHeight: 1.3,
                }}
              >
                {currentCharacter?.name || 'AI Assistant'}
              </Text>

              {/* Status line with typing indicator or subtitle */}
              <Box style={{ marginTop: '2px' }}>
                {isGenerating ? (
                  <Group gap={6} align="center" wrap="nowrap">
                    <Text
                      size="xs"
                      style={{
                        color: theaterColors.moonlightBright,
                        fontWeight: 500,
                      }}
                    >
                      {t('chat.typingIndicator') || '正在输入'}
                    </Text>
                    {/* Animated typing dots */}
                    <Group gap={3}>
                      {[0, 1, 2].map((i) => (
                        <Box
                          key={i}
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: theaterColors.moonlightBright,
                            animation: 'typing-dot 1.4s ease-in-out infinite',
                            animationDelay: `${i * 0.15}s`,
                          }}
                        />
                      ))}
                    </Group>
                  </Group>
                ) : (
                  <Text
                    size="xs"
                    truncate
                    style={{
                      color: theaterColors.textSecondary,
                      fontWeight: 400,
                      letterSpacing: '0.01em',
                    }}
                  >
                    {currentChat?.title || t('chat.labels.clickAvatarForDetails') || '点击头像查看详情'}
                  </Text>
                )}
              </Box>
            </Box>
          </Group>

          {/* Right section: Action buttons */}
          <Group gap={isMobile ? 4 : 8} wrap="nowrap" style={{ flexShrink: 0 }}>
            {/* Preset selector - desktop only */}
            {currentChat && !isMobile && (
              <Group gap={8} wrap="nowrap" visibleFrom="sm" style={{ marginRight: '8px' }}>
                <Badge
                  size="sm"
                  variant="outline"
                  style={{
                    borderColor: theaterColors.glassBorderHover,
                    color: theaterColors.textSecondary,
                    fontWeight: 500,
                    padding: '0 10px',
                  }}
                >
                  {t('chat.labels.preset')}
                </Badge>
                <PresetSelector chatId={currentChat.id} currentPresetId={currentChat.presetId} />
              </Group>
            )}

            {/* RPG/Immersive mode toggle - enhanced */}
            <Tooltip label={isRPGMode ? '退出沉浸模式' : '沉浸模式'} position="bottom" withArrow>
              <ActionIcon
                size={isMobile ? 'md' : 'lg'}
                variant={isRPGMode ? 'filled' : 'subtle'}
                onClick={toggleRPGMode}
                className="chat-header-action-btn touch-target"
                onMouseEnter={() => setHoveredButton('rpg')}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  background: isRPGMode
                    ? `linear-gradient(135deg, ${theaterColors.moonlight} 0%, rgba(139, 92, 246, 0.8) 100%)`
                    : hoveredButton === 'rpg' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  color: isRPGMode ? '#fff' : hoveredButton === 'rpg' ? theaterColors.textPrimary : theaterColors.textMuted,
                  boxShadow: isRPGMode ? `0 0 20px ${theaterColors.moonlight}` : 'none',
                  borderRadius: '10px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: hoveredButton === 'rpg' && !isRPGMode ? 'translateY(-1px)' : 'none',
                }}
              >
                <IconTheater size={isMobile ? 18 : 20} />
              </ActionIcon>
            </Tooltip>

            {/* Settings toggle - desktop only */}
            {onToggleRightSidebar && !isMobile && (
              <Tooltip label="设置中心" position="bottom" withArrow>
                <ActionIcon
                  size="lg"
                  variant="subtle"
                  onClick={onToggleRightSidebar}
                  className="chat-header-action-btn touch-target"
                  onMouseEnter={() => setHoveredButton('rightSidebar')}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={getActionButtonStyle('rightSidebar', isRightSidebarOpen)}
                >
                  <IconSettings size={20} />
                </ActionIcon>
              </Tooltip>
            )}

            {/* More options menu - enhanced */}
            <Menu position="bottom-end" shadow="xl" withinPortal offset={8}>
              <Menu.Target>
                <ActionIcon
                  size={isMobile ? 'md' : 'lg'}
                  variant="subtle"
                  className="chat-header-action-btn touch-target"
                  onMouseEnter={() => setHoveredButton('menu')}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={{
                    color: hoveredButton === 'menu' ? theaterColors.textPrimary : theaterColors.textMuted,
                    background: hoveredButton === 'menu' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                    borderRadius: '10px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <IconDotsVertical size={isMobile ? 18 : 20} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown
                style={{
                  background: theaterColors.voidDark,
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${theaterColors.glassBorderHover}`,
                  borderRadius: '12px',
                  padding: '6px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                }}
              >
                {onNewChat && (
                  <>
                    <Menu.Label style={{ color: theaterColors.spotlightGold }}>
                      {t('chat.chatHeader.newChat')}
                    </Menu.Label>
                    <Menu.Item
                      leftSection={<IconMessagePlus size={16} />}
                      onClick={() => onNewChat('preserve')}
                    >
                      {t('chat.branch.mainThread') || '主线继续'}
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconTrash size={16} />}
                      onClick={() => onNewChat('reset')}
                    >
                      {t('chat.branch.resetThread') || '重置对话'}
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<IconGitBranch size={16} />}
                      onClick={() => onNewChat('branch')}
                    >
                      {t('chat.branch.newBranch') || '新建分支'}
                    </Menu.Item>
                    <Menu.Divider />
                  </>
                )}

                {currentChat && (
                  <Menu.Item
                    leftSection={
                      <IconStar
                        size={16}
                        style={{ color: currentChat.isFavorite ? theaterColors.spotlightGold : undefined }}
                      />
                    }
                    onClick={handleToggleFavorite}
                  >
                    {currentChat.isFavorite ? t('chat.chatHeader.unfavoriteChat') : t('chat.chatHeader.favoriteChat')}
                  </Menu.Item>
                )}

                {onOpenNPCPanel && (
                  <Menu.Item leftSection={<IconUsers size={16} />} onClick={onOpenNPCPanel}>
                    场景角色
                  </Menu.Item>
                )}

                {onOpenStoryTracking && (
                  <Menu.Item leftSection={<IconWorld size={16} />} onClick={onOpenStoryTracking}>
                    剧情追踪
                  </Menu.Item>
                )}

                {onOpenDirectorPanel && (
                  <Menu.Item leftSection={<IconSparkles size={16} />} onClick={onOpenDirectorPanel}>
                    剧情导演
                  </Menu.Item>
                )}

                <Menu.Item
                  leftSection={<IconDownload size={16} />}
                  onClick={handleExportChat}
                  disabled={!currentChat}
                >
                  {t('chat.chatHeader.exportChat')}
                </Menu.Item>

                <Menu.Item
                  leftSection={<IconShare2 size={16} />}
                  onClick={handleShareChat}
                  disabled={!currentChat}
                >
                  {t('chat.chatHeader.shareChat')}
                </Menu.Item>

                <Menu.Divider />

                <Menu.Item
                  leftSection={<IconTrash size={16} />}
                  onClick={handleDeleteChat}
                  disabled={!currentChat}
                  color="red"
                >
                  {t('chat.deleteChat')}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Box>

      <CharacterDetailModal
        isOpen={showCharacterDetail}
        onClose={() => setShowCharacterDetail(false)}
        character={currentCharacter}
        variant="full"
      />
    </>
  )
}
