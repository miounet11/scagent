'use client'

/**
 * MessageContextMenu v1.1 - Floating Action Toolbar
 *
 * Features:
 * - Glass morphism toolbar appearing on message hover
 * - Actions: Copy, Edit, Regenerate, Delete, TTS (play audio)
 * - Theater Soul Experience aesthetic with spotlight-gold accents
 * - Smooth fade-in animation (200ms) with context-menu-appear class
 * - Enhanced hover effects with scale and ripple animations
 * - Copy success feedback animation
 * - Positions above message bubble
 * - WCAG AA accessible (aria-labels, keyboard navigation)
 * - Respects prefers-reduced-motion
 */

import { memo, useState, useCallback } from 'react'
import { Group, ActionIcon, Tooltip, Transition } from '@mantine/core'
import { useReducedMotion } from '@mantine/hooks'
import {
  IconCopy,
  IconEdit,
  IconRefresh,
  IconTrash,
  IconVolume,
  IconPlayerStop,
  IconCheck,
} from '@tabler/icons-react'

// Theater Soul Experience color palette
const theaterColors = {
  spotlightGold: '#f5c542',
  voidDark: 'rgba(26, 20, 41, 0.95)',
  glassBorder: 'rgba(245, 197, 66, 0.15)',
  glassGlow: 'rgba(245, 197, 66, 0.1)',
  actionHover: 'rgba(245, 197, 66, 0.12)',
  dangerRed: 'rgba(239, 68, 68, 0.9)',
  dangerHover: 'rgba(239, 68, 68, 0.12)',
}

export interface MessageContextMenuProps {
  /** Callback for copy action */
  onCopy: () => void
  /** Callback for edit action */
  onEdit: () => void
  /** Callback for regenerate action */
  onRegenerate: () => void
  /** Callback for delete action */
  onDelete: () => void
  /** Callback for TTS play action (optional) */
  onPlayTTS?: () => void
  /** Whether TTS is currently playing */
  isPlaying?: boolean
  /** Controls visibility of the menu */
  visible: boolean
  /** Additional class name */
  className?: string
}

function MessageContextMenu({
  onCopy,
  onEdit,
  onRegenerate,
  onDelete,
  onPlayTTS,
  isPlaying = false,
  visible = false,
  className = '',
}: MessageContextMenuProps) {
  const reduceMotion = useReducedMotion()
  const [copySuccess, setCopySuccess] = useState(false)

  // Handle copy with success feedback
  const handleCopy = useCallback(() => {
    onCopy()
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 1500)
  }, [onCopy])

  return (
    <Transition
      mounted={visible}
      transition={reduceMotion ? 'fade' : 'slide-down'}
      duration={reduceMotion ? 0 : 200}
      timingFunction="cubic-bezier(0.4, 0, 0.2, 1)"
    >
      {(styles) => (
        <div
          style={{
            ...styles,
            position: 'absolute',
            top: '-48px',
            right: '8px',
            zIndex: 10,
          }}
          className={`message-context-menu context-menu-appear ${className}`}
          role="toolbar"
          aria-label="Message actions"
        >
          <Group
            gap={4}
            wrap="nowrap"
            style={{
              background: theaterColors.voidDark,
              backdropFilter: 'blur(12px)',
              border: `1px solid ${theaterColors.glassBorder}`,
              borderRadius: '8px',
              padding: '6px',
              boxShadow: `
                0 4px 16px rgba(0, 0, 0, 0.4),
                0 0 24px ${theaterColors.glassGlow},
                inset 0 1px 0 rgba(255, 255, 255, 0.05)
              `,
            }}
          >
            {/* Copy Button */}
            <Tooltip
              label={copySuccess ? "Copied!" : "Copy message"}
              position="top"
              withArrow
              transitionProps={{ duration: reduceMotion ? 0 : 150 }}
              opened={copySuccess ? true : undefined}
            >
              <ActionIcon
                variant="subtle"
                size="md"
                onClick={handleCopy}
                aria-label="Copy message to clipboard"
                className={`action-btn-hover action-btn-ripple ${copySuccess ? 'action-btn-copy-success' : ''}`}
                style={{
                  color: copySuccess
                    ? '#22c55e'
                    : 'rgba(255, 255, 255, 0.85)',
                  transition: reduceMotion ? 'none' : 'all 0.15s ease',
                }}
                styles={{
                  root: {
                    '&:hover': {
                      backgroundColor: theaterColors.actionHover,
                      color: copySuccess ? '#22c55e' : theaterColors.spotlightGold,
                    },
                    '&:active': {
                      transform: reduceMotion ? 'none' : 'scale(0.95)',
                    },
                  },
                }}
              >
                {copySuccess ? (
                  <IconCheck size={18} stroke={1.5} />
                ) : (
                  <IconCopy size={18} stroke={1.5} />
                )}
              </ActionIcon>
            </Tooltip>

            {/* Edit Button */}
            <Tooltip
              label="Edit message"
              position="top"
              withArrow
              transitionProps={{ duration: reduceMotion ? 0 : 150 }}
            >
              <ActionIcon
                variant="subtle"
                size="md"
                onClick={onEdit}
                aria-label="Edit this message"
                className="action-btn-hover action-btn-ripple"
                style={{
                  color: 'rgba(255, 255, 255, 0.85)',
                  transition: reduceMotion ? 'none' : 'all 0.15s ease',
                }}
                styles={{
                  root: {
                    '&:hover': {
                      backgroundColor: theaterColors.actionHover,
                      color: theaterColors.spotlightGold,
                    },
                    '&:active': {
                      transform: reduceMotion ? 'none' : 'scale(0.95)',
                    },
                  },
                }}
              >
                <IconEdit size={18} stroke={1.5} />
              </ActionIcon>
            </Tooltip>

            {/* Regenerate Button */}
            <Tooltip
              label="Regenerate response"
              position="top"
              withArrow
              transitionProps={{ duration: reduceMotion ? 0 : 150 }}
            >
              <ActionIcon
                variant="subtle"
                size="md"
                onClick={onRegenerate}
                aria-label="Regenerate this response"
                className="action-btn-hover action-btn-ripple"
                style={{
                  color: 'rgba(255, 255, 255, 0.85)',
                  transition: reduceMotion ? 'none' : 'all 0.15s ease',
                }}
                styles={{
                  root: {
                    '&:hover': {
                      backgroundColor: theaterColors.actionHover,
                      color: theaterColors.spotlightGold,
                    },
                    '&:active': {
                      transform: reduceMotion ? 'none' : 'scale(0.95)',
                    },
                  },
                }}
              >
                <IconRefresh size={18} stroke={1.5} />
              </ActionIcon>
            </Tooltip>

            {/* TTS Play/Stop Button (conditional) */}
            {onPlayTTS && (
              <Tooltip
                label={isPlaying ? 'Stop audio' : 'Play audio'}
                position="top"
                withArrow
                transitionProps={{ duration: reduceMotion ? 0 : 150 }}
              >
                <ActionIcon
                  variant="subtle"
                  size="md"
                  onClick={onPlayTTS}
                  aria-label={isPlaying ? 'Stop text-to-speech playback' : 'Play text-to-speech'}
                  aria-pressed={isPlaying}
                  className="action-btn-hover action-btn-ripple"
                  style={{
                    color: isPlaying
                      ? theaterColors.spotlightGold
                      : 'rgba(255, 255, 255, 0.85)',
                    transition: reduceMotion ? 'none' : 'all 0.15s ease',
                  }}
                  styles={{
                    root: {
                      '&:hover': {
                        backgroundColor: theaterColors.actionHover,
                        color: theaterColors.spotlightGold,
                      },
                      '&:active': {
                        transform: reduceMotion ? 'none' : 'scale(0.95)',
                      },
                    },
                  }}
                >
                  {isPlaying ? (
                    <IconPlayerStop size={18} stroke={1.5} />
                  ) : (
                    <IconVolume size={18} stroke={1.5} />
                  )}
                </ActionIcon>
              </Tooltip>
            )}

            {/* Divider */}
            <div
              style={{
                width: '1px',
                height: '20px',
                background: theaterColors.glassBorder,
                margin: '0 2px',
              }}
              aria-hidden="true"
            />

            {/* Delete Button */}
            <Tooltip
              label="Delete message"
              position="top"
              withArrow
              transitionProps={{ duration: reduceMotion ? 0 : 150 }}
            >
              <ActionIcon
                variant="subtle"
                size="md"
                onClick={onDelete}
                aria-label="Delete this message"
                className="action-btn-hover action-btn-ripple action-btn-danger"
                style={{
                  color: 'rgba(255, 255, 255, 0.75)',
                  transition: reduceMotion ? 'none' : 'all 0.15s ease',
                }}
                styles={{
                  root: {
                    '&:hover': {
                      backgroundColor: theaterColors.dangerHover,
                      color: theaterColors.dangerRed,
                    },
                    '&:active': {
                      transform: reduceMotion ? 'none' : 'scale(0.95)',
                    },
                  },
                }}
              >
                <IconTrash size={18} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          </Group>

          {/* Global styles for enhanced accessibility */}
          <style jsx global>{`
            .message-context-menu {
              /* Ensure keyboard focus is visible */
              button:focus-visible {
                outline: 2px solid ${theaterColors.spotlightGold};
                outline-offset: 2px;
                border-radius: 4px;
              }

              /* High contrast mode support */
              @media (prefers-contrast: high) {
                button {
                  border: 1px solid currentColor;
                }
              }

              /* Respect reduced motion */
              @media (prefers-reduced-motion: reduce) {
                * {
                  animation: none !important;
                  transition: none !important;
                }
              }
            }

            /* Keyboard navigation enhancement */
            .message-context-menu button {
              position: relative;
            }

            .message-context-menu button::after {
              content: '';
              position: absolute;
              inset: -2px;
              border-radius: 6px;
              opacity: 0;
              background: ${theaterColors.actionHover};
              transition: opacity 0.15s ease;
              pointer-events: none;
            }

            .message-context-menu button:focus-visible::after {
              opacity: 1;
            }
          `}</style>
        </div>
      )}
    </Transition>
  )
}

export default memo(MessageContextMenu)
