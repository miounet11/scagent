'use client'

/**
 * 🎉 羁绊通知组件
 *
 * 显示各种羁绊系统事件通知：
 * - 等级提升
 * - 成就解锁
 * - 随机惊喜
 * - 签到奖励
 */

import { useState, useEffect, useCallback, memo } from 'react'
import {
  Heart,
  Star,
  Crown,
  Gift,
  Trophy,
  Sparkles,
  X,
  ChevronRight,
} from 'lucide-react'
import type {
  BondLevel,
  Reward,
  Achievement,
} from '@/lib/bondSystem'

// ==================== 类型定义 ====================

interface BondNotificationProps {
  /** 通知类型 */
  type: 'level_up' | 'achievement' | 'surprise' | 'check_in' | 'reward'
  /** 标题 */
  title: string
  /** 描述 */
  description?: string
  /** 奖励列表 */
  rewards?: Reward[]
  /** 新等级（升级时） */
  newLevel?: BondLevel
  /** 成就信息（成就解锁时） */
  achievement?: Achievement
  /** 显示时长（毫秒），0为不自动关闭 */
  duration?: number
  /** 关闭回调 */
  onClose?: () => void
  /** 查看详情回调 */
  onViewDetails?: () => void
  /** 语言 */
  language?: 'zh' | 'en'
}

// ==================== 配置常量 ====================

const LEVEL_TITLES: Record<BondLevel, { zh: string; en: string }> = {
  stranger: { zh: '陌生人', en: 'Stranger' },
  acquaintance: { zh: '初识', en: 'Acquaintance' },
  friend: { zh: '朋友', en: 'Friend' },
  close_friend: { zh: '密友', en: 'Close Friend' },
  crush: { zh: '心动', en: 'Crush' },
  lover: { zh: '恋人', en: 'Lover' },
  soulmate: { zh: '灵魂伴侣', en: 'Soulmate' },
  eternal: { zh: '命定之人', en: 'Eternal' },
}

const LEVEL_COLORS: Record<BondLevel, string> = {
  stranger: '#6b7280',
  acquaintance: '#94a3b8',
  friend: '#60a5fa',
  close_friend: '#34d399',
  crush: '#f472b6',
  lover: '#ec4899',
  soulmate: '#a855f7',
  eternal: '#fbbf24',
}

const TYPE_CONFIG = {
  level_up: {
    icon: Crown,
    gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    titleZh: '羁绊升级！',
    titleEn: 'Level Up!',
  },
  achievement: {
    icon: Trophy,
    gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)',
    titleZh: '成就解锁！',
    titleEn: 'Achievement Unlocked!',
  },
  surprise: {
    icon: Sparkles,
    gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
    titleZh: '惊喜时刻！',
    titleEn: 'Surprise!',
  },
  check_in: {
    icon: Gift,
    gradient: 'linear-gradient(135deg, #34d399, #10b981)',
    titleZh: '签到成功！',
    titleEn: 'Check-in Complete!',
  },
  reward: {
    icon: Star,
    gradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
    titleZh: '获得奖励！',
    titleEn: 'Reward Received!',
  },
}

const RARITY_COLORS = {
  common: '#9ca3af',
  rare: '#60a5fa',
  epic: '#a855f7',
  legendary: '#fbbf24',
}

// ==================== 组件实现 ====================

function BondNotification({
  type,
  title,
  description,
  rewards,
  newLevel,
  achievement,
  duration = 5000,
  onClose,
  onViewDetails,
  language = 'zh',
}: BondNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)

  const config = TYPE_CONFIG[type]
  const Icon = config.icon

  // 自动关闭
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = useCallback(() => {
    setIsAnimatingOut(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300)
  }, [onClose])

  if (!isVisible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: `translateX(-50%) ${isAnimatingOut ? 'translateY(-20px)' : 'translateY(0)'}`,
        opacity: isAnimatingOut ? 0 : 1,
        transition: 'all 0.3s ease',
        zIndex: 10000,
        maxWidth: '400px',
        width: '90%',
      }}
    >
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* 顶部渐变条 */}
        <div
          style={{
            height: '4px',
            background: config.gradient,
          }}
        />

        <div style={{ padding: '16px' }}>
          {/* 头部 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            {/* 图标 */}
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: config.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
              }}
            >
              <Icon size={24} color="white" />
            </div>

            {/* 标题区域 */}
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
                {title || (language === 'zh' ? config.titleZh : config.titleEn)}
              </div>
              {description && (
                <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', marginTop: '2px' }}>
                  {description}
                </div>
              )}
            </div>

            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* 升级特殊显示 */}
          {type === 'level_up' && newLevel && (
            <div
              style={{
                background: `linear-gradient(135deg, ${LEVEL_COLORS[newLevel]}20, ${LEVEL_COLORS[newLevel]}40)`,
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                marginBottom: '12px',
                border: `1px solid ${LEVEL_COLORS[newLevel]}40`,
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                💕
              </div>
              <div
                style={{
                  color: LEVEL_COLORS[newLevel],
                  fontWeight: 'bold',
                  fontSize: '20px',
                }}
              >
                {LEVEL_TITLES[newLevel][language]}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginTop: '4px' }}>
                {language === 'zh' ? '关系更进一步了！' : 'Your bond grows stronger!'}
              </div>
            </div>
          )}

          {/* 成就特殊显示 */}
          {type === 'achievement' && achievement && (
            <div
              style={{
                background: 'rgba(168, 85, 247, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                marginBottom: '12px',
                border: '1px solid rgba(168, 85, 247, 0.3)',
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>
                {achievement.icon || '🏆'}
              </div>
              <div
                style={{
                  color: '#a855f7',
                  fontWeight: 'bold',
                  fontSize: '18px',
                }}
              >
                {achievement.name}
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginTop: '4px' }}>
                {achievement.description}
              </div>
            </div>
          )}

          {/* 奖励列表 */}
          {rewards && rewards.length > 0 && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '12px',
              }}
            >
              <div
                style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                {language === 'zh' ? '获得奖励' : 'Rewards'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {rewards.map((reward, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: `1px solid ${RARITY_COLORS[reward.rarity] || RARITY_COLORS.common}40`,
                    }}
                  >
                    {reward.type === 'bond_exp' && <Heart size={12} color="#ec4899" />}
                    {reward.type === 'title' && <Crown size={12} color="#fbbf24" />}
                    {reward.type === 'cg' && <Sparkles size={12} color="#a855f7" />}
                    <span
                      style={{
                        color: RARITY_COLORS[reward.rarity] || 'white',
                        fontSize: '12px',
                        fontWeight: reward.rarity === 'legendary' ? 'bold' : 'normal',
                      }}
                    >
                      {reward.description}
                      {reward.type === 'bond_exp' && ` +${reward.value}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 查看详情按钮 */}
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              style={{
                width: '100%',
                marginTop: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                color: 'white',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              {language === 'zh' ? '查看详情' : 'View Details'}
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== 通知管理器 ====================

interface NotificationItem extends BondNotificationProps {
  id: string
}

interface NotificationManagerState {
  notifications: NotificationItem[]
}

let notificationId = 0
const notificationCallbacks: ((notification: NotificationItem) => void)[] = []

export function showBondNotification(props: Omit<BondNotificationProps, 'onClose'>) {
  const notification: NotificationItem = {
    ...props,
    id: `bond-notification-${++notificationId}`,
  }
  notificationCallbacks.forEach(cb => cb(notification))
}

export function useBondNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  useEffect(() => {
    const callback = (notification: NotificationItem) => {
      setNotifications(prev => [...prev, notification])
    }
    notificationCallbacks.push(callback)

    return () => {
      const index = notificationCallbacks.indexOf(callback)
      if (index > -1) {
        notificationCallbacks.splice(index, 1)
      }
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return { notifications, removeNotification }
}

export function BondNotificationContainer() {
  const { notifications, removeNotification } = useBondNotifications()

  return (
    <>
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            position: 'fixed',
            top: `${20 + index * 10}px`,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000 - index,
          }}
        >
          <BondNotification
            {...notification}
            onClose={() => removeNotification(notification.id)}
          />
        </div>
      ))}
    </>
  )
}

export default memo(BondNotification)
