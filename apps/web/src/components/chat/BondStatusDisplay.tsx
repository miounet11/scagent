'use client'

/**
 * 🎮 羁绊状态显示组件
 *
 * 在聊天界面显示：
 * - 当前羁绊等级和进度条
 * - 角色当前情绪
 * - 连续互动天数
 * - 快速操作按钮
 */

import { useState, useMemo, useCallback, memo } from 'react'
import {
  Heart,
  Flame,
  Star,
  Crown,
  Sparkles,
  Gift,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Shirt,
  MapPin,
} from 'lucide-react'
import type {
  BondLevel,
  EmotionState,
  OutfitState,
  SceneState,
} from '@/lib/bondSystem'

// ==================== 类型定义 ====================

interface BondStatusDisplayProps {
  /** 羁绊等级 */
  bondLevel: BondLevel
  /** 羁绊经验 */
  bondExp: number
  /** 下一等级所需经验 */
  nextLevelExp: number
  /** 进度百分比 */
  progress: number
  /** 等级标题 */
  title: string
  /** 等级颜色 */
  color: string
  /** 当前情绪 */
  currentEmotion: EmotionState
  /** 当前服装 */
  currentOutfit: OutfitState
  /** 当前场景 */
  currentScene: SceneState
  /** 连续互动天数 */
  streak: number
  /** 总互动天数 */
  totalDays: number
  /** 是否可以签到 */
  canCheckIn: boolean
  /** 签到回调 */
  onCheckIn?: () => void
  /** 查看详情回调 */
  onViewDetails?: () => void
  /** 是否显示详细信息 */
  showDetails?: boolean
  /** 语言 */
  language?: 'zh' | 'en'
}

// ==================== 配置常量 ====================

const LEVEL_ICONS: Record<BondLevel, typeof Heart> = {
  stranger: Star,
  acquaintance: Star,
  friend: Heart,
  close_friend: Heart,
  crush: Sparkles,
  lover: Flame,
  soulmate: Crown,
  eternal: Crown,
}

const EMOTION_EMOJIS: Record<EmotionState, string> = {
  happy: '😊',
  excited: '🤩',
  love: '😍',
  shy: '😳',
  smug: '😏',
  peaceful: '😌',
  sad: '😢',
  crying: '😭',
  angry: '😠',
  furious: '🤬',
  scared: '😨',
  jealous: '😒',
  neutral: '😐',
  thinking: '🤔',
  confused: '😕',
  surprised: '😲',
  clingy: '🥺',
  tsundere: '😤',
  yandere: '🖤',
  dere: '💕',
}

const EMOTION_LABELS: Record<EmotionState, { zh: string; en: string }> = {
  happy: { zh: '开心', en: 'Happy' },
  excited: { zh: '兴奋', en: 'Excited' },
  love: { zh: '爱意', en: 'Loving' },
  shy: { zh: '害羞', en: 'Shy' },
  smug: { zh: '得意', en: 'Smug' },
  peaceful: { zh: '平静', en: 'Peaceful' },
  sad: { zh: '难过', en: 'Sad' },
  crying: { zh: '哭泣', en: 'Crying' },
  angry: { zh: '生气', en: 'Angry' },
  furious: { zh: '暴怒', en: 'Furious' },
  scared: { zh: '害怕', en: 'Scared' },
  jealous: { zh: '嫉妒', en: 'Jealous' },
  neutral: { zh: '平静', en: 'Neutral' },
  thinking: { zh: '思考', en: 'Thinking' },
  confused: { zh: '困惑', en: 'Confused' },
  surprised: { zh: '惊讶', en: 'Surprised' },
  clingy: { zh: '撒娇', en: 'Clingy' },
  tsundere: { zh: '傲娇', en: 'Tsundere' },
  yandere: { zh: '病娇', en: 'Yandere' },
  dere: { zh: '娇羞', en: 'Dere' },
}

const OUTFIT_LABELS: Record<OutfitState, { zh: string; en: string }> = {
  default: { zh: '日常', en: 'Default' },
  casual: { zh: '休闲', en: 'Casual' },
  formal: { zh: '正装', en: 'Formal' },
  sleepwear: { zh: '睡衣', en: 'Sleepwear' },
  swimsuit: { zh: '泳装', en: 'Swimsuit' },
  uniform: { zh: '制服', en: 'Uniform' },
  cosplay: { zh: 'Cos', en: 'Cosplay' },
  revealing: { zh: '性感', en: 'Revealing' },
  wedding: { zh: '婚纱', en: 'Wedding' },
  custom: { zh: '特别', en: 'Custom' },
}

const SCENE_LABELS: Record<SceneState, { zh: string; en: string }> = {
  home: { zh: '家中', en: 'Home' },
  bedroom: { zh: '卧室', en: 'Bedroom' },
  cafe: { zh: '咖啡厅', en: 'Cafe' },
  school: { zh: '学校', en: 'School' },
  office: { zh: '办公室', en: 'Office' },
  park: { zh: '公园', en: 'Park' },
  beach: { zh: '海边', en: 'Beach' },
  night_city: { zh: '夜景', en: 'Night City' },
  romantic_dinner: { zh: '晚餐', en: 'Dinner' },
  secret_place: { zh: '秘密基地', en: 'Secret' },
  memory_space: { zh: '回忆', en: 'Memory' },
}

// ==================== 组件实现 ====================

function BondStatusDisplay({
  bondLevel,
  bondExp,
  nextLevelExp,
  progress,
  title,
  color,
  currentEmotion,
  currentOutfit,
  currentScene,
  streak,
  totalDays,
  canCheckIn,
  onCheckIn,
  onViewDetails,
  showDetails = false,
  language = 'zh',
}: BondStatusDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(showDetails)

  const LevelIcon = LEVEL_ICONS[bondLevel] || Star
  const emotionEmoji = EMOTION_EMOJIS[currentEmotion] || '😐'
  const emotionLabel = EMOTION_LABELS[currentEmotion]?.[language] || currentEmotion
  const outfitLabel = OUTFIT_LABELS[currentOutfit]?.[language] || currentOutfit
  const sceneLabel = SCENE_LABELS[currentScene]?.[language] || currentScene

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  const handleCheckIn = useCallback(() => {
    if (onCheckIn && canCheckIn) {
      onCheckIn()
    }
  }, [onCheckIn, canCheckIn])

  return (
    <div
      className="bond-status-display"
      style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '12px',
        border: `1px solid ${color}40`,
        boxShadow: `0 4px 20px ${color}20`,
      }}
    >
      {/* 主要信息行 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* 等级图标 */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${color}, ${color}80)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 15px ${color}60`,
          }}
        >
          <LevelIcon size={20} color="white" />
        </div>

        {/* 等级和进度 */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ color, fontWeight: 'bold', fontSize: '14px' }}>
              {title}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
              {bondExp} / {nextLevelExp}
            </span>
          </div>

          {/* 进度条 */}
          <div
            style={{
              height: '6px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, progress)}%`,
                background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                borderRadius: '3px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>

        {/* 情绪显示 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '50px',
          }}
        >
          <span style={{ fontSize: '24px' }}>{emotionEmoji}</span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}>
            {emotionLabel}
          </span>
        </div>

        {/* 签到按钮 */}
        {canCheckIn && (
          <button
            onClick={handleCheckIn}
            style={{
              background: 'linear-gradient(135deg, #f472b6, #ec4899)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(244,114,182,0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <Gift size={14} />
            {language === 'zh' ? '签到' : 'Check In'}
          </button>
        )}

        {/* 展开/收起按钮 */}
        <button
          onClick={toggleExpand}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* 展开的详细信息 */}
      {isExpanded && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
          }}
        >
          {/* 连续互动 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Flame size={14} color="#f97316" />
              <span style={{ color: '#f97316', fontWeight: 'bold', fontSize: '16px' }}>
                {streak}
              </span>
            </div>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
              {language === 'zh' ? '连续天数' : 'Streak'}
            </span>
          </div>

          {/* 总天数 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Calendar size={14} color="#60a5fa" />
              <span style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '16px' }}>
                {totalDays}
              </span>
            </div>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
              {language === 'zh' ? '相识天数' : 'Days'}
            </span>
          </div>

          {/* 服装 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Shirt size={14} color="#a78bfa" />
              <span style={{ color: '#a78bfa', fontWeight: 'bold', fontSize: '12px' }}>
                {outfitLabel}
              </span>
            </div>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
              {language === 'zh' ? '穿着' : 'Outfit'}
            </span>
          </div>

          {/* 场景 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <MapPin size={14} color="#34d399" />
              <span style={{ color: '#34d399', fontWeight: 'bold', fontSize: '12px' }}>
                {sceneLabel}
              </span>
            </div>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
              {language === 'zh' ? '场景' : 'Scene'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(BondStatusDisplay)
