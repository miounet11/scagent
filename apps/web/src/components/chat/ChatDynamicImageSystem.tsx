'use client'

/**
 * 聊天动态图片系统集成组件
 *
 * 封装了立绘面板、表情切换、CG解锁等功能，
 * 可以轻松集成到现有的 ChatInterface 中。
 */

import { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { Box } from '@mantine/core'
import toast from 'react-hot-toast'
import CharacterPortraitPanel from './CharacterPortraitPanel'
import CGUnlockModal from './CGUnlockModal'
import { useDynamicImage } from '@/lib/dynamicImage/useDynamicImage'
import { useIntimacy, INTIMACY_MILESTONES, getMilestoneDescription } from '@/lib/dynamicImage/useIntimacy'
import { detectEmotion, shouldTriggerCG } from '@/lib/dynamicImage/useEmotionDetection'
import type { EmotionType } from '@/lib/dynamicImage/config'

interface ChatDynamicImageSystemProps {
  // 必需属性
  characterId: string
  characterName: string
  userId: string

  // 可选属性
  charType?: 'character' | 'community'
  enabled?: boolean
  position?: 'left' | 'right'
  defaultCollapsed?: boolean

  // 消息相关
  latestAssistantMessage?: string
  onMessageSent?: () => void

  // 回调
  onIntimacyLevelUp?: (newLevel: number, milestone?: string) => void
  onCGUnlock?: (cgId: string, milestone: number) => void
  onViewGallery?: () => void

  // 🎭 v20.5: 聊天 ID，用于获取 NPC 列表
  chatId?: string
}

function ChatDynamicImageSystem({
  characterId,
  characterName,
  userId,
  charType = 'community',
  enabled = true,
  position = 'right',
  defaultCollapsed = false,
  latestAssistantMessage,
  onMessageSent,
  onIntimacyLevelUp,
  onCGUnlock,
  onViewGallery,
  chatId,
}: ChatDynamicImageSystemProps) {
  // CG弹窗状态
  const [cgModalOpen, setCgModalOpen] = useState(false)
  const [currentCG, setCurrentCG] = useState<{
    url: string
    milestone?: number
    title?: string
    description?: string
  } | null>(null)

  // 上一次亲密度，用于检测里程碑
  const [prevIntimacyLevel, setPrevIntimacyLevel] = useState(0)

  // 亲密度管理
  const {
    level: intimacyLevel,
    trackMessage,
    trackNewChat,
  } = useIntimacy({
    userId,
    characterId,
    charType,
    enabled,
    autoTrackMessages: true,
  })

  // 动态图片管理
  const {
    availableCGs,
    showCG,
    hideCG,
    currentCG: activeCG,
  } = useDynamicImage({
    characterId,
    charType,
    userId,
    enabled,
  })

  // 监听消息发送
  useEffect(() => {
    if (onMessageSent) {
      trackMessage().then(result => {
        if (result?.levelUp) {
          // 检查是否达到里程碑
          const milestone = INTIMACY_MILESTONES.find(m => m.level === result.newLevel)
          if (milestone) {
            onIntimacyLevelUp?.(result.newLevel, milestone.reward)

            // 显示里程碑提示
            toast.success(`🎉 亲密度提升! ${milestone.reward}`, {
              duration: 4000,
              className: 'milestone-unlock-toast',
            })

            // 如果解锁了CG，触发CG弹窗
            if (milestone.type === 'cg') {
              const unlockedCG = availableCGs.find(cg =>
                (cg.intimacyRequired || 0) === result.newLevel
              )
              if (unlockedCG) {
                setTimeout(() => {
                  setCurrentCG({
                    url: unlockedCG.url,
                    milestone: result.newLevel,
                    title: `亲密度 ${result.newLevel} 达成!`,
                    description: getMilestoneDescription(result.newLevel),
                  })
                  setCgModalOpen(true)
                  onCGUnlock?.(unlockedCG.id, result.newLevel)
                }, 1000)
              }
            }
          }
        }
      })
    }
  }, [onMessageSent])

  // 检测特殊场景触发CG
  useEffect(() => {
    if (!latestAssistantMessage || !enabled) return

    const trigger = shouldTriggerCG(latestAssistantMessage, intimacyLevel, prevIntimacyLevel)
    if (trigger) {
      // 查找可用的CG
      const matchingCG = availableCGs.find(cg => {
        if (trigger.trigger === 'milestone' && trigger.milestone) {
          return (cg.intimacyRequired || 0) <= trigger.milestone
        }
        return true
      })

      if (matchingCG) {
        setCurrentCG({
          url: matchingCG.url,
          milestone: trigger.milestone,
          title: trigger.trigger === 'milestone' ? `亲密度 ${trigger.milestone} 达成!` : '特别时刻',
        })
        setCgModalOpen(true)
      }
    }

    setPrevIntimacyLevel(intimacyLevel)
  }, [latestAssistantMessage, intimacyLevel, prevIntimacyLevel, availableCGs, enabled])

  // 处理CG弹窗关闭
  const handleCGClose = useCallback(() => {
    setCgModalOpen(false)
    setCurrentCG(null)
    hideCG()
  }, [hideCG])

  // 查看相册
  const handleViewGallery = useCallback(() => {
    if (onViewGallery) {
      onViewGallery()
    } else {
      toast('相册功能开发中', { icon: '🖼️' })
    }
  }, [onViewGallery])

  if (!enabled) return null

  return (
    <>
      {/* 角色立绘面板 */}
      <CharacterPortraitPanel
        characterId={characterId}
        characterName={characterName}
        charType={charType}
        userId={userId}
        latestMessage={latestAssistantMessage}
        intimacyLevel={intimacyLevel}
        onViewGallery={handleViewGallery}
        defaultCollapsed={defaultCollapsed}
        position={position}
        chatId={chatId}
      />

      {/* CG解锁弹窗 */}
      {currentCG && (
        <CGUnlockModal
          opened={cgModalOpen}
          onClose={handleCGClose}
          imageUrl={currentCG.url}
          characterName={characterName}
          milestone={currentCG.milestone}
          title={currentCG.title}
          description={currentCG.description}
        />
      )}
    </>
  )
}

export default memo(ChatDynamicImageSystem)

/**
 * 使用示例:
 *
 * 在 ChatInterface 中集成:
 *
 * ```tsx
 * import ChatDynamicImageSystem from './ChatDynamicImageSystem'
 *
 * function ChatInterface({ characterId }) {
 *   const { currentUser } = useAuth()
 *   const [messages, setMessages] = useState([])
 *
 *   // 获取最新的AI消息
 *   const latestAssistantMessage = useMemo(() => {
 *     const assistantMessages = messages.filter(m => m.role === 'assistant')
 *     return assistantMessages[assistantMessages.length - 1]?.content
 *   }, [messages])
 *
 *   return (
 *     <div className="flex h-full">
 *       {/* 消息区域 *\/}
 *       <div className="flex-1">
 *         <MessageList messages={messages} />
 *       </div>
 *
 *       {/* 动态图片系统 *\/}
 *       <ChatDynamicImageSystem
 *         characterId={characterId}
 *         characterName={character?.name || ''}
 *         userId={currentUser?.id || ''}
 *         latestAssistantMessage={latestAssistantMessage}
 *         onIntimacyLevelUp={(level, milestone) => {
 *           console.log('Level up!', level, milestone)
 *         }}
 *       />
 *     </div>
 *   )
 * }
 * ```
 */
