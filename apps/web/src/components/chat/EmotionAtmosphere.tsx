/**
 * EmotionAtmosphere - 情绪氛围系统
 *
 * 根据对话内容自动检测情绪，并联动多个视觉元素响应：
 * - 立绘表情切换
 * - 背景色调渐变
 * - 光晕颜色变化
 * - 微粒效果（可选）
 *
 * 模式支持：
 * - 普通模式：轻度背景渐变 + 头像光晕
 * - 沉浸模式：完整效果（背景 + 光晕 + 气泡样式 + 粒子）
 */

'use client'

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react'
import { detectEmotionFromContent, type EmotionType } from '@/components/effects'

// ==================== 情绪主题配置 ====================
export interface EmotionTheme {
  primary: string       // 主色调
  glow: string          // 光晕颜色
  bg: string            // 背景渐变
  particle: 'sparkle' | 'rain' | 'heart' | 'fire' | 'star' | 'ghost' | null  // 粒子类型
  expression: string    // 表情类型（用于立绘切换）
}

export const EMOTION_THEME_MAP: Record<EmotionType, EmotionTheme> = {
  happy: {
    primary: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.5)',
    bg: 'linear-gradient(135deg, rgba(254, 243, 199, 0.15) 0%, rgba(253, 230, 138, 0.15) 100%)',
    particle: 'sparkle',
    expression: 'smile',
  },
  sad: {
    primary: '#60a5fa',
    glow: 'rgba(96, 165, 250, 0.5)',
    bg: 'linear-gradient(135deg, rgba(219, 234, 254, 0.12) 0%, rgba(191, 219, 254, 0.12) 100%)',
    particle: 'rain',
    expression: 'cry',
  },
  shy: {
    primary: '#f472b6',
    glow: 'rgba(244, 114, 182, 0.5)',
    bg: 'linear-gradient(135deg, rgba(252, 231, 243, 0.15) 0%, rgba(251, 207, 232, 0.15) 100%)',
    particle: 'heart',
    expression: 'blush',
  },
  angry: {
    primary: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.5)',
    bg: 'linear-gradient(135deg, rgba(254, 202, 202, 0.15) 0%, rgba(252, 165, 165, 0.15) 100%)',
    particle: 'fire',
    expression: 'angry',
  },
  surprised: {
    primary: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.5)',
    bg: 'linear-gradient(135deg, rgba(243, 232, 255, 0.15) 0%, rgba(233, 213, 255, 0.15) 100%)',
    particle: 'star',
    expression: 'shocked',
  },
  love: {
    primary: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.5)',
    bg: 'linear-gradient(135deg, rgba(253, 242, 248, 0.18) 0%, rgba(252, 231, 243, 0.18) 100%)',
    particle: 'heart',
    expression: 'love',
  },
  scared: {
    primary: '#6366f1',
    glow: 'rgba(99, 102, 241, 0.5)',
    bg: 'linear-gradient(135deg, rgba(224, 231, 255, 0.15) 0%, rgba(199, 210, 254, 0.15) 100%)',
    particle: 'ghost',
    expression: 'scared',
  },
  neutral: {
    primary: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.3)',
    bg: 'linear-gradient(135deg, rgba(241, 245, 249, 0.08) 0%, rgba(226, 232, 240, 0.08) 100%)',
    particle: null,
    expression: 'default',
  },
  // 扩展情绪类型（复用主要情绪的主题）
  joy: {
    primary: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.5)',
    bg: 'linear-gradient(135deg, rgba(254, 243, 199, 0.15) 0%, rgba(253, 230, 138, 0.15) 100%)',
    particle: 'sparkle',
    expression: 'smile',
  },
  affection: {
    primary: '#ec4899',
    glow: 'rgba(236, 72, 153, 0.5)',
    bg: 'linear-gradient(135deg, rgba(253, 242, 248, 0.18) 0%, rgba(252, 231, 243, 0.18) 100%)',
    particle: 'heart',
    expression: 'love',
  },
  embarrassed: {
    primary: '#f472b6',
    glow: 'rgba(244, 114, 182, 0.5)',
    bg: 'linear-gradient(135deg, rgba(252, 231, 243, 0.15) 0%, rgba(251, 207, 232, 0.15) 100%)',
    particle: 'heart',
    expression: 'blush',
  },
  melancholy: {
    primary: '#60a5fa',
    glow: 'rgba(96, 165, 250, 0.5)',
    bg: 'linear-gradient(135deg, rgba(219, 234, 254, 0.12) 0%, rgba(191, 219, 254, 0.12) 100%)',
    particle: 'rain',
    expression: 'cry',
  },
  shocked: {
    primary: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.5)',
    bg: 'linear-gradient(135deg, rgba(243, 232, 255, 0.15) 0%, rgba(233, 213, 255, 0.15) 100%)',
    particle: 'star',
    expression: 'shocked',
  },
  excited: {
    primary: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.5)',
    bg: 'linear-gradient(135deg, rgba(254, 243, 199, 0.15) 0%, rgba(253, 230, 138, 0.15) 100%)',
    particle: 'star',
    expression: 'smile',
  },
  energetic: {
    primary: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.5)',
    bg: 'linear-gradient(135deg, rgba(254, 243, 199, 0.15) 0%, rgba(253, 230, 138, 0.15) 100%)',
    particle: 'sparkle',
    expression: 'smile',
  },
  smug: {
    primary: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.4)',
    bg: 'linear-gradient(135deg, rgba(243, 232, 255, 0.12) 0%, rgba(233, 213, 255, 0.12) 100%)',
    particle: null,
    expression: 'smug',
  },
  confident: {
    primary: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.4)',
    bg: 'linear-gradient(135deg, rgba(237, 233, 254, 0.12) 0%, rgba(221, 214, 254, 0.12) 100%)',
    particle: null,
    expression: 'confident',
  },
  thinking: {
    primary: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.3)',
    bg: 'linear-gradient(135deg, rgba(241, 245, 249, 0.08) 0%, rgba(226, 232, 240, 0.08) 100%)',
    particle: null,
    expression: 'thinking',
  },
  curious: {
    primary: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.3)',
    bg: 'linear-gradient(135deg, rgba(241, 245, 249, 0.08) 0%, rgba(226, 232, 240, 0.08) 100%)',
    particle: null,
    expression: 'curious',
  },
  frustrated: {
    primary: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.5)',
    bg: 'linear-gradient(135deg, rgba(254, 202, 202, 0.15) 0%, rgba(252, 165, 165, 0.15) 100%)',
    particle: 'fire',
    expression: 'angry',
  },
  anxious: {
    primary: '#6366f1',
    glow: 'rgba(99, 102, 241, 0.5)',
    bg: 'linear-gradient(135deg, rgba(224, 231, 255, 0.15) 0%, rgba(199, 210, 254, 0.15) 100%)',
    particle: 'ghost',
    expression: 'scared',
  },
}

// ==================== Context ====================
interface EmotionContextValue {
  currentEmotion: EmotionType
  setEmotion: (emotion: EmotionType) => void
  theme: EmotionTheme
  confidence: number
  isEnabled: boolean
  isImmersiveMode: boolean
  enableParticles: boolean
}

const EmotionContext = createContext<EmotionContextValue | null>(null)

// ==================== Hook: useEmotionAtmosphere ====================
export function useEmotionAtmosphere(message: string | null): {
  emotion: EmotionType
  theme: EmotionTheme
  confidence: number
} {
  const [emotion, setEmotion] = useState<EmotionType>('neutral')
  const [confidence, setConfidence] = useState(0)

  useEffect(() => {
    if (!message || typeof message !== 'string') {
      setEmotion('neutral')
      setConfidence(0)
      return
    }

    // 复用现有的情绪检测逻辑
    const detectedEmotion = detectEmotionFromContent(message)

    // 计算置信度（基于消息长度和关键词密度）
    const messageLength = message.length
    const hasEmotionKeywords = /开心|高兴|难过|伤心|害羞|生气|愤怒|惊讶|喜欢|爱|紧张|担心|😊|😄|😢|😭|😳|🙈|😠|😡|❤️|💕/.test(message)

    let calculatedConfidence = 0.5 // 基础置信度

    if (hasEmotionKeywords) {
      calculatedConfidence += 0.3
    }

    if (messageLength > 50) {
      calculatedConfidence += 0.2
    }

    // 限制在 0-1 范围
    calculatedConfidence = Math.min(1, Math.max(0, calculatedConfidence))

    setEmotion(detectedEmotion)
    setConfidence(calculatedConfidence)
  }, [message])

  const theme = useMemo(() => EMOTION_THEME_MAP[emotion] || EMOTION_THEME_MAP.neutral, [emotion])

  return {
    emotion,
    theme,
    confidence,
  }
}

// ==================== Context Hook ====================
export function useEmotionContext(): EmotionContextValue {
  const context = useContext(EmotionContext)
  if (!context) {
    throw new Error('useEmotionContext must be used within EmotionAtmosphereProvider')
  }
  return context
}

// ==================== Provider ====================
interface EmotionAtmosphereProviderProps {
  children: ReactNode
  isImmersiveMode?: boolean
  enabled?: boolean
  enableParticles?: boolean
}

export function EmotionAtmosphereProvider({
  children,
  isImmersiveMode = false,
  enabled = true,
  enableParticles = false,
}: EmotionAtmosphereProviderProps) {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('neutral')

  const theme = useMemo(() => EMOTION_THEME_MAP[currentEmotion] || EMOTION_THEME_MAP.neutral, [currentEmotion])

  const value = useMemo<EmotionContextValue>(
    () => ({
      currentEmotion,
      setEmotion: setCurrentEmotion,
      theme,
      confidence: 1,
      isEnabled: enabled,
      isImmersiveMode,
      enableParticles,
    }),
    [currentEmotion, theme, enabled, isImmersiveMode, enableParticles]
  )

  return <EmotionContext.Provider value={value}>{children}</EmotionContext.Provider>
}

// ==================== 背景渐变组件 ====================
interface EmotionBackgroundProps {
  intensity?: 'light' | 'medium' | 'strong'
  className?: string
}

export function EmotionBackground({ intensity = 'medium', className = '' }: EmotionBackgroundProps) {
  const { theme, isEnabled, isImmersiveMode } = useEmotionContext()

  if (!isEnabled) {
    return null
  }

  // 根据模式和强度调整透明度
  const getOpacity = () => {
    if (!isImmersiveMode) {
      // 普通模式：轻度效果
      return 0.3
    }

    // 沉浸模式：根据强度调整
    switch (intensity) {
      case 'light':
        return 0.5
      case 'medium':
        return 0.7
      case 'strong':
        return 1
      default:
        return 0.7
    }
  }

  return (
    <div
      className={`emotion-background ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        background: theme.bg,
        opacity: getOpacity(),
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  )
}

// ==================== 光晕组件 ====================
interface EmotionGlowProps {
  size: number
  intensity?: number
  className?: string
  children?: ReactNode
}

export function EmotionGlow({ size, intensity = 1, className = '', children }: EmotionGlowProps) {
  const { theme, isEnabled, isImmersiveMode } = useEmotionContext()

  if (!isEnabled) {
    return <>{children}</>
  }

  // 根据模式调整光晕强度
  const effectiveIntensity = isImmersiveMode ? intensity : intensity * 0.5

  return (
    <div
      className={`emotion-glow ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
      }}
    >
      {/* 光晕效果 */}
      <div
        style={{
          position: 'absolute',
          inset: -size / 4,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`,
          opacity: effectiveIntensity,
          transition: 'all 0.3s ease',
          pointerEvents: 'none',
          filter: 'blur(8px)',
          animation: 'pulse-glow 2s ease-in-out infinite',
        }}
        aria-hidden="true"
      />
      {/* 内容 */}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>

      {/* CSS 动画 */}
      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            opacity: ${effectiveIntensity * 0.6};
            transform: scale(1);
          }
          50% {
            opacity: ${effectiveIntensity};
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  )
}

// ==================== 粒子效果组件 ====================
type ParticleType = 'sparkle' | 'rain' | 'heart' | 'fire' | 'star' | 'ghost'

interface EmotionParticlesProps {
  type: ParticleType | null
  count?: number
  className?: string
}

export function EmotionParticles({ type, count = 20, className = '' }: EmotionParticlesProps) {
  const { isEnabled, isImmersiveMode, enableParticles } = useEmotionContext()
  const [isMobile, setIsMobile] = useState(false)
  const [isLowEnd, setIsLowEnd] = useState(false)

  // 检测设备性能
  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768)

      // 检测低端设备
      if (typeof navigator !== 'undefined' && 'hardwareConcurrency' in navigator) {
        setIsLowEnd((navigator.hardwareConcurrency as number) < 4)
      }
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  // 移动端或低端设备自动禁用粒子
  if (!isEnabled || !enableParticles || !isImmersiveMode || !type || isMobile || isLowEnd) {
    return null
  }

  // 根据粒子类型生成不同的符号
  const getParticleSymbol = (particleType: ParticleType): string => {
    switch (particleType) {
      case 'sparkle':
        return '✨'
      case 'rain':
        return '💧'
      case 'heart':
        return '💗'
      case 'fire':
        return '🔥'
      case 'star':
        return '⭐'
      case 'ghost':
        return '👻'
      default:
        return '✨'
    }
  }

  const particleSymbol = getParticleSymbol(type)

  // 生成随机粒子
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${5 + Math.random() * 5}s`,
    size: 0.8 + Math.random() * 0.4, // 0.8 - 1.2
  }))

  return (
    <div
      className={`emotion-particles ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 1,
      }}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            position: 'absolute',
            top: '-20px',
            left: particle.left,
            fontSize: `${particle.size}rem`,
            opacity: 0.6,
            animation: `fall-down ${particle.animationDuration} linear infinite`,
            animationDelay: particle.animationDelay,
            willChange: 'transform',
          }}
        >
          {particleSymbol}
        </div>
      ))}

      {/* CSS 动画 */}
      <style jsx>{`
        @keyframes fall-down {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

// ==================== 工具函数：获取情绪主题 ====================
export function getEmotionTheme(emotion: EmotionType): EmotionTheme {
  return EMOTION_THEME_MAP[emotion] || EMOTION_THEME_MAP.neutral
}

// ==================== 导出类型 ====================
export type { EmotionType, ParticleType }
