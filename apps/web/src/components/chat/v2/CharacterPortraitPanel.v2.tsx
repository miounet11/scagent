'use client';

import { useState } from 'react';
import { Box, Paper, Avatar, Modal, Text } from '@mantine/core';
import { useHover } from '@mantine/hooks';
import { theaterColors } from '../utils/theaterColors';
import { EMOTION_COLORS, type EmotionType } from '../utils/emotionColors';

interface CharacterPortraitPanelProps {
  characterName: string;
  avatarUrl?: string;
  currentEmotion?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

/**
 * Enhanced character portrait panel for immersive chat mode
 * Features glass morphism, emotion-based glows, and responsive sizing
 */
export function CharacterPortraitPanel({
  characterName,
  avatarUrl,
  currentEmotion,
  isExpanded: controlledExpanded,
  onToggleExpand,
  className,
}: CharacterPortraitPanelProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const { hovered, ref: hoverRef } = useHover();

  // Use controlled or uncontrolled expansion state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const toggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  // Get emotion colors, fallback to neutral
  const emotionKey = (currentEmotion?.toLowerCase() || 'neutral') as EmotionType;
  const emotionColors = EMOTION_COLORS[emotionKey] || EMOTION_COLORS.neutral;

  return (
    <>
      {/* Main Portrait Panel */}
      <Box
        ref={hoverRef}
        className={className}
        style={{
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: hovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        }}
        onClick={toggleExpand}
      >
        <Paper
          style={{
            background: theaterColors.glassBackground,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${emotionColors.border}`,
            borderRadius: '16px',
            padding: '12px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `
              0 0 20px ${emotionColors.glow},
              0 8px 32px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.1)
            `,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Ambient glow background effect */}
          <Box
            style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              right: '-50%',
              bottom: '-50%',
              background: `radial-gradient(circle at center, ${emotionColors.glow} 0%, transparent 70%)`,
              opacity: hovered ? 0.6 : 0.3,
              transition: 'opacity 0.4s ease',
              pointerEvents: 'none',
              animation: 'pulse 3s ease-in-out infinite',
            }}
          />

          {/* Portrait Container */}
          <Box
            style={{
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Avatar */}
            <Avatar
              src={avatarUrl}
              alt={characterName}
              size="100%"
              radius="md"
              style={{
                border: `2px solid ${emotionColors.border}`,
                boxShadow: `0 0 15px ${emotionColors.glow}`,
                transition: 'all 0.3s ease',
              }}
            >
              {!avatarUrl && (
                <Text
                  size="xl"
                  fw={600}
                  style={{ color: theaterColors.spotlightGold }}
                >
                  {(characterName || '?').charAt(0).toUpperCase()}
                </Text>
              )}
            </Avatar>

            {/* Character name overlay (desktop only) */}
            <Box
              className="hidden md:block"
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(26, 20, 41, 0.95), transparent)',
                padding: '8px 4px 4px',
                borderBottomLeftRadius: '12px',
                borderBottomRightRadius: '12px',
              }}
            >
              <Text
                size="xs"
                fw={500}
                ta="center"
                style={{
                  color: theaterColors.spotlightGold,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {characterName}
              </Text>
            </Box>

            {/* Emotion indicator dot */}
            {currentEmotion && (
              <Box
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: emotionColors.primary,
                  boxShadow: `0 0 10px ${emotionColors.glow}`,
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
            )}
          </Box>
        </Paper>
      </Box>

      {/* Fullscreen Modal */}
      <Modal
        opened={isExpanded}
        onClose={toggleExpand}
        size="auto"
        centered
        withCloseButton
        overlayProps={{
          opacity: 0.7,
          blur: 8,
        }}
        styles={{
          content: {
            background: theaterColors.voidDark,
            border: `1px solid ${emotionColors.border}`,
            borderRadius: '24px',
            boxShadow: `0 0 40px ${emotionColors.glow}`,
            maxWidth: '90vw',
            maxHeight: '90vh',
          },
          header: {
            background: 'transparent',
          },
          close: {
            color: theaterColors.spotlightGold,
            '&:hover': {
              background: theaterColors.glassBorder,
            },
          },
        }}
      >
        <Box style={{ padding: '20px' }}>
          {/* Large avatar */}
          <Avatar
            src={avatarUrl}
            alt={characterName}
            size={400}
            radius="md"
            style={{
              border: `3px solid ${emotionColors.border}`,
              boxShadow: `0 0 40px ${emotionColors.glow}`,
              margin: '0 auto',
              display: 'block',
            }}
          >
            {!avatarUrl && (
              <Text
                size="120px"
                fw={700}
                style={{ color: theaterColors.spotlightGold }}
              >
                {(characterName || '?').charAt(0).toUpperCase()}
              </Text>
            )}
          </Avatar>

          {/* Character name */}
          <Text
            size="xl"
            fw={600}
            ta="center"
            mt="xl"
            style={{
              color: theaterColors.spotlightGold,
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
            }}
          >
            {characterName}
          </Text>

          {/* Current emotion */}
          {currentEmotion && (
            <Text
              size="sm"
              ta="center"
              mt="xs"
              style={{
                color: emotionColors.primary,
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.6)',
              }}
            >
              {currentEmotion}
            </Text>
          )}
        </Box>
      </Modal>

      {/* Pulse animation styles */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
      `}</style>
    </>
  );
}
