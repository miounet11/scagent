'use client'

/**
 * RadialMenu v1.0 - Persona 5-style Radial Menu
 *
 * Features:
 * - SVG-based concentric ring layout
 * - Outer ring: 18 quick actions (intimate gestures)
 * - Inner ring: 10 emotional attitudes
 * - Center: Close button
 * - Elastic bounce animation (backOut easing)
 * - Staggered entrance (30ms per item)
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Touch-friendly (60px diameter per item)
 * - Theater color palette
 *
 * @example
 * <RadialMenu
 *   isOpen={true}
 *   onClose={() => {}}
 *   onSelectAction={(action) => console.log(action)}
 *   onSelectEmotion={(emotion) => console.log(emotion)}
 * />
 */

import { useEffect, useCallback, useRef, useState, memo } from 'react'
import { Overlay } from '@mantine/core'
import { useReducedMotion } from '@mantine/hooks'
import type { QuickAction } from '@/lib/rpg/interactionTypes'

// ==================== Type Definitions ====================

interface RadialMenuProps {
  /** Whether the menu is open */
  isOpen: boolean
  /** Close callback */
  onClose: () => void
  /** Action selection callback */
  onSelectAction: (action: QuickAction) => void
  /** Emotion selection callback */
  onSelectEmotion: (emotion: string) => void
  /** Center position (defaults to viewport center) */
  centerPosition?: { x: number; y: number }
}

interface MenuItem {
  id: string
  label: string
  emoji: string
  angle: number
  radius: number
}

// ==================== Constants ====================

// Quick Actions (Outer Ring - 18 items)
const QUICK_ACTIONS: Omit<QuickAction, 'promptTemplate' | 'category'>[] = [
  { id: 'hug', text: '拥抱', emoji: '🤗' },
  { id: 'hold_hand', text: '牵手', emoji: '🤝' },
  { id: 'kiss', text: '亲吻', emoji: '💋' },
  { id: 'pat_head', text: '摸头', emoji: '🖐️' },
  { id: 'touch_face', text: '抚脸', emoji: '✋' },
  { id: 'approach', text: '靠近', emoji: '🚶' },
  { id: 'back_hug', text: '背后抱', emoji: '🫂' },
  { id: 'gaze', text: '凝视', emoji: '👀' },
  { id: 'smile', text: '微笑', emoji: '😊' },
  { id: 'sigh', text: '叹息', emoji: '😮‍💨' },
  { id: 'blush', text: '脸红', emoji: '😳' },
  { id: 'wink', text: '眨眼', emoji: '😉' },
  { id: 'pout', text: '撅嘴', emoji: '😗' },
  { id: 'whisper', text: '耳语', emoji: '👂' },
  { id: 'tease', text: '调侃', emoji: '😏' },
  { id: 'comfort', text: '安慰', emoji: '🤲' },
  { id: 'praise', text: '夸奖', emoji: '👍' },
  { id: 'ask', text: '询问', emoji: '❓' },
]

// Emotional Attitudes (Inner Ring - 10 items)
const EMOTIONS = [
  { id: 'gentle', label: '温柔', emoji: '🌸', modifier: '温柔地' },
  { id: 'playful', label: '调皮', emoji: '😜', modifier: '调皮地' },
  { id: 'shy', label: '害羞', emoji: '😳', modifier: '害羞地' },
  { id: 'dominant', label: '霸道', emoji: '😤', modifier: '霸道地' },
  { id: 'cold', label: '冷淡', emoji: '😐', modifier: '冷淡地' },
  { id: 'passionate', label: '热情', emoji: '🔥', modifier: '热情地' },
  { id: 'mysterious', label: '神秘', emoji: '🎭', modifier: '神秘地' },
  { id: 'worried', label: '担忧', emoji: '😟', modifier: '担忧地' },
  { id: 'excited', label: '兴奋', emoji: '🤩', modifier: '兴奋地' },
  { id: 'serious', label: '认真', emoji: '🧐', modifier: '认真地' },
]

// Layout constants
const OUTER_RADIUS = 240 // px
const INNER_RADIUS = 140 // px
const ITEM_SIZE = 60 // px (touch-friendly)
const CENTER_SIZE = 80 // px

// Animation constants
const ANIMATION_DURATION = 300 // ms
const STAGGER_DELAY = 30 // ms per item
const BOUNCE_EASE = 'cubic-bezier(0.34, 1.56, 0.64, 1)' // backOut easing

// Theater color palette
const COLORS = {
  backdrop: 'rgba(0, 0, 0, 0.75)',
  itemBg: 'rgba(30, 30, 35, 0.95)',
  itemHover: 'rgba(99, 102, 241, 0.15)',
  itemBorder: 'rgba(255, 255, 255, 0.2)',
  itemBorderHover: 'rgba(99, 102, 241, 0.6)',
  centerBg: 'rgba(239, 68, 68, 0.9)',
  centerHover: 'rgba(239, 68, 68, 1)',
  text: '#ffffff',
  textDim: 'rgba(255, 255, 255, 0.7)',
  shadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
  glow: '0 0 20px rgba(99, 102, 241, 0.3)',
}

// ==================== Helper Functions ====================

/**
 * Calculate position on a circle
 */
function getCirclePosition(angle: number, radius: number): { x: number; y: number } {
  const radian = (angle - 90) * (Math.PI / 180)
  return {
    x: Math.cos(radian) * radius,
    y: Math.sin(radian) * radius,
  }
}

/**
 * Create menu items with calculated positions
 */
function createMenuItems(items: any[], radius: number, startAngle = 0): MenuItem[] {
  const angleStep = 360 / items.length
  return items.map((item, index) => ({
    ...item,
    angle: startAngle + index * angleStep,
    radius,
  }))
}

// ==================== Main Component ====================

function RadialMenu({
  isOpen,
  onClose,
  onSelectAction,
  onSelectEmotion,
  centerPosition,
}: RadialMenuProps) {
  const reduceMotion = useReducedMotion()
  const menuRef = useRef<HTMLDivElement>(null)

  // Navigation state
  const [selectedRing, setSelectedRing] = useState<'outer' | 'inner' | 'center'>('outer')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Menu items
  const outerItems = createMenuItems(QUICK_ACTIONS, OUTER_RADIUS)
  const innerItems = createMenuItems(EMOTIONS, INNER_RADIUS)

  // Calculate viewport center
  const center = centerPosition || {
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 400,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
  }

  // ==================== Event Handlers ====================

  const handleSelectAction = useCallback((action: Omit<QuickAction, 'promptTemplate' | 'category'>) => {
    const fullAction: QuickAction = {
      ...action,
      category: 'physical',
      promptTemplate: `*${action.text}*`,
    }
    onSelectAction(fullAction)
    onClose()
  }, [onSelectAction, onClose])

  const handleSelectEmotion = useCallback((emotion: typeof EMOTIONS[0]) => {
    onSelectEmotion(emotion.modifier)
    onClose()
  }, [onSelectEmotion, onClose])

  // ==================== Keyboard Navigation ====================

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentItems = selectedRing === 'outer' ? outerItems : selectedRing === 'inner' ? innerItems : []
      const maxIndex = currentItems.length - 1

      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          onClose()
          break

        case 'Enter':
        case ' ':
          e.preventDefault()
          if (selectedRing === 'center') {
            onClose()
          } else if (selectedRing === 'outer') {
            handleSelectAction(QUICK_ACTIONS[selectedIndex])
          } else if (selectedRing === 'inner') {
            handleSelectEmotion(EMOTIONS[selectedIndex])
          }
          break

        case 'ArrowRight':
          e.preventDefault()
          if (selectedRing === 'center') {
            setSelectedRing('outer')
            setSelectedIndex(0)
          } else {
            setSelectedIndex((prev) => (prev + 1) % currentItems.length)
          }
          break

        case 'ArrowLeft':
          e.preventDefault()
          if (selectedRing === 'center') {
            setSelectedRing('inner')
            setSelectedIndex(0)
          } else {
            setSelectedIndex((prev) => (prev - 1 + currentItems.length) % currentItems.length)
          }
          break

        case 'ArrowUp':
          e.preventDefault()
          if (selectedRing === 'outer') {
            setSelectedRing('inner')
            setSelectedIndex(Math.min(selectedIndex, innerItems.length - 1))
          } else if (selectedRing === 'inner') {
            setSelectedRing('center')
          }
          break

        case 'ArrowDown':
          e.preventDefault()
          if (selectedRing === 'center') {
            setSelectedRing('inner')
            setSelectedIndex(0)
          } else if (selectedRing === 'inner') {
            setSelectedRing('outer')
            setSelectedIndex(Math.min(selectedIndex, outerItems.length - 1))
          }
          break

        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedRing, selectedIndex, outerItems, innerItems, onClose, handleSelectAction, handleSelectEmotion])

  // ==================== Render ====================

  if (!isOpen) return null

  const animationDuration = reduceMotion ? 0 : ANIMATION_DURATION
  const staggerDelay = reduceMotion ? 0 : STAGGER_DELAY

  return (
    <>
      {/* Backdrop */}
      <Overlay
        opacity={0.75}
        color="#000"
        zIndex={1000}
        onClick={onClose}
        style={{
          transition: `opacity ${animationDuration}ms ease`,
        }}
      />

      {/* Radial Menu */}
      <div
        ref={menuRef}
        role="menu"
        aria-label="Radial interaction menu"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1001,
          pointerEvents: 'none',
        }}
      >
        <svg
          width="100%"
          height="100%"
          style={{
            overflow: 'visible',
          }}
        >
          {/* Outer Ring - Quick Actions */}
          {outerItems.map((item, index) => {
            const pos = getCirclePosition(item.angle, item.radius)
            const isSelected = selectedRing === 'outer' && selectedIndex === index

            return (
              <g
                key={item.id}
                transform={`translate(${center.x + pos.x}, ${center.y + pos.y})`}
                style={{
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  animation: reduceMotion
                    ? 'none'
                    : `radialMenuItemEnter ${animationDuration}ms ${BOUNCE_EASE} ${index * staggerDelay}ms both`,
                }}
                onClick={() => handleSelectAction(QUICK_ACTIONS[index])}
                onMouseEnter={() => {
                  setSelectedRing('outer')
                  setSelectedIndex(index)
                }}
              >
                {/* Background Circle */}
                <circle
                  r={ITEM_SIZE / 2}
                  fill={COLORS.itemBg}
                  stroke={isSelected ? COLORS.itemBorderHover : COLORS.itemBorder}
                  strokeWidth={isSelected ? 2 : 1}
                  style={{
                    filter: isSelected ? `drop-shadow(${COLORS.glow})` : `drop-shadow(${COLORS.shadow})`,
                    transition: 'all 0.2s ease',
                  }}
                />

                {/* Emoji */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="24"
                  y={-8}
                  style={{
                    userSelect: 'none',
                  }}
                >
                  {item.emoji}
                </text>

                {/* Label */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10"
                  y={12}
                  fill={isSelected ? COLORS.text : COLORS.textDim}
                  style={{
                    userSelect: 'none',
                    fontWeight: isSelected ? 600 : 400,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {item.label}
                </text>
              </g>
            )
          })}

          {/* Inner Ring - Emotions */}
          {innerItems.map((item, index) => {
            const pos = getCirclePosition(item.angle, item.radius)
            const isSelected = selectedRing === 'inner' && selectedIndex === index

            return (
              <g
                key={item.id}
                transform={`translate(${center.x + pos.x}, ${center.y + pos.y})`}
                style={{
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  animation: reduceMotion
                    ? 'none'
                    : `radialMenuItemEnter ${animationDuration}ms ${BOUNCE_EASE} ${(outerItems.length + index) * staggerDelay}ms both`,
                }}
                onClick={() => handleSelectEmotion(EMOTIONS[index])}
                onMouseEnter={() => {
                  setSelectedRing('inner')
                  setSelectedIndex(index)
                }}
              >
                {/* Background Circle */}
                <circle
                  r={ITEM_SIZE / 2}
                  fill={COLORS.itemBg}
                  stroke={isSelected ? COLORS.itemBorderHover : COLORS.itemBorder}
                  strokeWidth={isSelected ? 2 : 1}
                  style={{
                    filter: isSelected ? `drop-shadow(${COLORS.glow})` : `drop-shadow(${COLORS.shadow})`,
                    transition: 'all 0.2s ease',
                  }}
                />

                {/* Emoji */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="20"
                  y={-6}
                  style={{
                    userSelect: 'none',
                  }}
                >
                  {item.emoji}
                </text>

                {/* Label */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="11"
                  y={10}
                  fill={isSelected ? COLORS.text : COLORS.textDim}
                  style={{
                    userSelect: 'none',
                    fontWeight: isSelected ? 600 : 400,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {item.label}
                </text>
              </g>
            )
          })}

          {/* Center - Close Button */}
          <g
            transform={`translate(${center.x}, ${center.y})`}
            style={{
              cursor: 'pointer',
              pointerEvents: 'auto',
              animation: reduceMotion
                ? 'none'
                : `radialMenuCenterEnter ${animationDuration}ms ${BOUNCE_EASE} ${(outerItems.length + innerItems.length) * staggerDelay}ms both`,
            }}
            onClick={onClose}
            onMouseEnter={() => setSelectedRing('center')}
          >
            {/* Background Circle */}
            <circle
              r={CENTER_SIZE / 2}
              fill={selectedRing === 'center' ? COLORS.centerHover : COLORS.centerBg}
              style={{
                filter: `drop-shadow(${COLORS.shadow})`,
                transition: 'all 0.2s ease',
              }}
            />

            {/* X Icon */}
            <line
              x1={-12}
              y1={-12}
              x2={12}
              y2={12}
              stroke={COLORS.text}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <line
              x1={12}
              y1={-12}
              x2={-12}
              y2={12}
              stroke={COLORS.text}
              strokeWidth={3}
              strokeLinecap="round"
            />

            {/* Label */}
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="11"
              y={28}
              fill={COLORS.text}
              style={{
                userSelect: 'none',
                fontWeight: 600,
              }}
            >
              关闭
            </text>
          </g>
        </svg>

        {/* Animations */}
        <style jsx global>{`
          @keyframes radialMenuItemEnter {
            0% {
              opacity: 0;
              transform: scale(0);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes radialMenuCenterEnter {
            0% {
              opacity: 0;
              transform: scale(0) rotate(-180deg);
            }
            100% {
              opacity: 1;
              transform: scale(1) rotate(0deg);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            [style*="radialMenuItemEnter"],
            [style*="radialMenuCenterEnter"] {
              animation: none !important;
            }
          }
        `}</style>
      </div>
    </>
  )
}

export default memo(RadialMenu)
