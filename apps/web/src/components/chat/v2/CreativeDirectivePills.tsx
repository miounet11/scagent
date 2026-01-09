'use client'

/**
 * CreativeDirectivePills v1.0 - Inline Creative Directive Display
 *
 * Theater Soul Experience 内联创意指令显示组件
 *
 * Features:
 * - Inline display of active creative directives as pills/badges
 * - Shows preset badge if active (e.g., [🎭 沉浸模式])
 * - Shows up to 3 individual directive pills with X to remove
 * - "+N" badge if more than 3 directives active
 * - "Configure" button to open full panel
 * - Smooth animations on add/remove
 * - Mobile-friendly compact mode
 *
 * v1.0 - 2025-12-28
 * Initial implementation for Theater Soul Experience directive visualization
 */

import { memo } from 'react'
import { Badge, Group, ActionIcon, Tooltip, Button } from '@mantine/core'
import { IconX, IconSettings } from '@tabler/icons-react'
import { useReducedMotion } from '@mantine/hooks'
import {
  type DirectivePreset,
  PRESET_METADATA,
  DIRECTIVE_METADATA,
} from '@/stores/creativeStore'

// ==================== Types ====================

export type DirectiveKey = keyof typeof DIRECTIVE_METADATA

interface CreativeDirectivePillsProps {
  /** Active preset type */
  activePreset: DirectivePreset
  /** Array of active directive keys */
  activeDirectives: DirectiveKey[]
  /** Callback when removing a directive */
  onRemoveDirective: (key: DirectiveKey) => void
  /** Callback to open configuration panel */
  onOpenPanel: () => void
  /** Compact mode for mobile */
  compact?: boolean
  /** Custom className */
  className?: string
  /** Disabled state */
  disabled?: boolean
}

// ==================== Constants ====================

/** Maximum pills to show before "+N" badge */
const MAX_VISIBLE_PILLS = 3

/** Directive category icons */
const CATEGORY_ICONS: Record<string, string> = {
  richness: '📝',
  interaction: '💬',
  pacing: '⏱️',
  special: '✨',
  original: '⚡',
}

/** Directive to emoji mapping (for individual pills) */
const DIRECTIVE_ICONS: Record<DirectiveKey, string> = {
  // Content richness
  detailedDescription: '📝',
  psychologyFocus: '🧠',
  actionFocus: '😊',
  environmentFocus: '🌲',
  appearanceFocus: '👤',
  // Interaction
  interactiveChoices: '🎯',
  emotionTagging: '🏷️',
  // Pacing
  slowPacing: '🐢',
  fastPacing: '🐇',
  // Special effects (one-time)
  cliffhangerOnce: '⏳',
  flashbackOnce: '⏪',
  innerMonologueOnce: '💭',
  romanticMomentOnce: '💕',
  // Original
  storyAdvance: '⚡',
  povMode: '👁️',
  sceneTransitionOnce: '🎬',
}

// ==================== Component ====================

function CreativeDirectivePills({
  activePreset,
  activeDirectives,
  onRemoveDirective,
  onOpenPanel,
  compact = false,
  className = '',
  disabled = false,
}: CreativeDirectivePillsProps) {
  const reduceMotion = useReducedMotion()

  // Filter out deprecated directives (like interactiveChoices)
  const validDirectives = activeDirectives.filter(
    (key) => !DIRECTIVE_METADATA[key]?.deprecated
  )

  // Check if we have a preset active
  const hasPreset = activePreset !== 'none'
  const presetMeta = hasPreset ? PRESET_METADATA[activePreset] : null

  // Calculate visible and overflow directives
  const visibleDirectives = validDirectives.slice(0, MAX_VISIBLE_PILLS)
  const overflowCount = validDirectives.length - MAX_VISIBLE_PILLS

  // Nothing to show
  if (!hasPreset && validDirectives.length === 0) {
    return (
      <Group gap={6} className={className}>
        <Button
          variant="subtle"
          size="compact-xs"
          color="gray"
          onClick={onOpenPanel}
          disabled={disabled}
          leftSection={<IconSettings size={14} />}
          styles={{
            root: {
              height: compact ? '24px' : '26px',
              fontSize: compact ? '0.65rem' : '0.7rem',
            },
          }}
        >
          {compact ? '配置' : '配置创意指令'}
        </Button>
      </Group>
    )
  }

  return (
    <Group
      gap={6}
      className={className}
      wrap="nowrap"
      style={{
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {/* Preset Badge (if active) */}
      {hasPreset && presetMeta && (
        <Badge
          variant="gradient"
          gradient={{ from: 'violet', to: 'purple', deg: 135 }}
          size={compact ? 'sm' : 'md'}
          leftSection={<span style={{ fontSize: '0.9em' }}>{presetMeta.icon}</span>}
          style={{
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.25)',
            transition: reduceMotion ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {presetMeta.name}
        </Badge>
      )}

      {/* Individual Directive Pills (up to 3) */}
      {visibleDirectives.map((key) => {
        const meta = DIRECTIVE_METADATA[key]
        const icon = DIRECTIVE_ICONS[key] || CATEGORY_ICONS[meta?.category] || '⚙️'
        const isOneShot = meta?.isOneShot

        return (
          <Tooltip
            key={key}
            label={`${meta?.name || key}${isOneShot ? ' (单次)' : ''}`}
            position="top"
            withArrow
          >
            <Badge
              variant="light"
              color="violet"
              size={compact ? 'sm' : 'md'}
              leftSection={<span style={{ fontSize: '0.85em' }}>{icon}</span>}
              rightSection={
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="violet"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveDirective(key)
                  }}
                  disabled={disabled}
                  style={{
                    marginLeft: 2,
                    opacity: 0.7,
                    transition: reduceMotion ? 'none' : 'opacity 0.2s ease',
                  }}
                  styles={{
                    root: {
                      '&:hover': {
                        opacity: 1,
                      },
                    },
                  }}
                >
                  <IconX size={10} />
                </ActionIcon>
              }
              style={{
                background: 'rgba(139, 92, 246, 0.12)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                fontWeight: 500,
                textTransform: 'none',
                paddingRight: 4,
                transition: reduceMotion
                  ? 'none'
                  : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: reduceMotion ? 'none' : 'fadeIn 0.3s ease',
              }}
            >
              {meta?.name || key}
            </Badge>
          </Tooltip>
        )
      })}

      {/* Overflow Badge (+N) */}
      {overflowCount > 0 && (
        <Tooltip
          label={`还有 ${overflowCount} 个指令启用中`}
          position="top"
          withArrow
        >
          <Badge
            variant="light"
            color="violet"
            size={compact ? 'sm' : 'md'}
            style={{
              background: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: reduceMotion ? 'none' : 'all 0.2s ease',
            }}
            onClick={onOpenPanel}
            styles={{
              root: {
                '&:hover': {
                  background: 'rgba(139, 92, 246, 0.15)',
                },
              },
            }}
          >
            +{overflowCount}
          </Badge>
        </Tooltip>
      )}

      {/* Configure Button */}
      <Button
        variant="subtle"
        size="compact-xs"
        color="violet"
        onClick={onOpenPanel}
        disabled={disabled}
        leftSection={<IconSettings size={14} />}
        styles={{
          root: {
            height: compact ? '24px' : '26px',
            fontSize: compact ? '0.65rem' : '0.7rem',
            opacity: 0.8,
            transition: reduceMotion ? 'none' : 'all 0.2s ease',
            '&:hover': {
              opacity: 1,
              background: 'rgba(139, 92, 246, 0.12)',
            },
          },
        }}
      >
        {compact ? '配置' : '配置'}
      </Button>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        }
      `}</style>
    </Group>
  )
}

export default memo(CreativeDirectivePills)
