'use client';

/**
 * CharacterPortraitPanel v3.1 - Portrait-Centric Theater Mode
 *
 * v3.1 Updates:
 * - Enhanced emotion glow with EmotionAtmosphere theme integration
 * - Pulsing glow animation for active emotions
 * - Improved visual feedback on emotion changes
 *
 * Features:
 * - Positioned on LEFT side (more natural for LTR reading)
 * - LARGE portrait display (280px width, scaled 800×1200)
 * - Integrated bond/relationship indicator
 * - Collapsible with smooth animation
 * - Enhanced emotion-responsive glow effects
 */

import { useState, useCallback, memo, useMemo } from 'react';
import { Box, Text, Avatar, Progress, Tooltip, ActionIcon, Stack, Group } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import { IconChevronLeft, IconChevronRight, IconSparkles } from '@tabler/icons-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { theaterColors } from '../utils/theaterColors';
import { EMOTION_COLORS, type EmotionType } from '../utils/emotionColors';
import { EMOTION_THEME_MAP, type EmotionType as AtmosphereEmotionType } from '../EmotionAtmosphere';

// Bond level configuration
const BOND_LEVELS = [
  { level: 1, name: '陌生人', minExp: 0, color: '#6b7280', icon: '👤' },
  { level: 2, name: '相识', minExp: 100, color: '#9ca3af', icon: '🤝' },
  { level: 3, name: '朋友', minExp: 300, color: '#60a5fa', icon: '😊' },
  { level: 4, name: '密友', minExp: 600, color: '#a78bfa', icon: '💜' },
  { level: 5, name: '挚友', minExp: 1000, color: '#f472b6', icon: '💖' },
  { level: 6, name: '灵魂伴侣', minExp: 1500, color: '#fb7185', icon: '❤️' },
  { level: 7, name: '命定之人', minExp: 2100, color: '#f43f5e', icon: '💕' },
  { level: 8, name: '永恒', minExp: 2800, color: '#fbbf24', icon: '✨' },
];

interface CharacterPortraitPanelV3Props {
  /** Character name */
  characterName: string;
  /** Portrait image URL (800×1200) */
  portraitUrl?: string;
  /** Avatar URL (fallback) */
  avatarUrl?: string;
  /** Current emotion */
  currentEmotion?: string;
  /** Bond experience points */
  bondExp?: number;
  /** Is panel collapsed */
  isCollapsed?: boolean;
  /** Collapse toggle callback */
  onToggleCollapse?: () => void;
  /** Portrait click callback */
  onPortraitClick?: () => void;
  /** Panel width when expanded */
  expandedWidth?: number;
  /** Panel width when collapsed */
  collapsedWidth?: number;
  /** Is mobile view */
  isMobile?: boolean;
}

function CharacterPortraitPanelV3({
  characterName,
  portraitUrl,
  avatarUrl,
  currentEmotion = 'neutral',
  bondExp = 0,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  onPortraitClick,
  expandedWidth = 280,
  collapsedWidth = 48,
  isMobile = false,
}: CharacterPortraitPanelV3Props) {
  const reduceMotion = useReducedMotion();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // Controlled or uncontrolled collapse state
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const toggleCollapse = useCallback(() => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed(prev => !prev);
    }
  }, [onToggleCollapse]);

  // Get emotion colors
  const emotionKey = (currentEmotion?.toLowerCase() || 'neutral') as EmotionType;
  const emotionColors = EMOTION_COLORS[emotionKey] || EMOTION_COLORS.neutral;

  // 🎭 v3.1: Get enhanced glow from EmotionAtmosphere theme
  const atmosphereTheme = useMemo(() => {
    const key = (currentEmotion?.toLowerCase() || 'neutral') as AtmosphereEmotionType;
    return EMOTION_THEME_MAP[key] || EMOTION_THEME_MAP.neutral;
  }, [currentEmotion]);

  // Calculate bond level
  const getBondLevel = useCallback(() => {
    for (let i = BOND_LEVELS.length - 1; i >= 0; i--) {
      if (bondExp >= BOND_LEVELS[i].minExp) {
        return BOND_LEVELS[i];
      }
    }
    return BOND_LEVELS[0];
  }, [bondExp]);

  // Calculate progress to next level
  const getProgress = useCallback(() => {
    const current = getBondLevel();
    const currentIndex = BOND_LEVELS.findIndex(l => l.level === current.level);
    const next = BOND_LEVELS[currentIndex + 1];
    if (!next) return 100;
    const expInLevel = bondExp - current.minExp;
    const expNeeded = next.minExp - current.minExp;
    return Math.min(100, Math.round((expInLevel / expNeeded) * 100));
  }, [bondExp, getBondLevel]);

  const bondLevel = getBondLevel();
  const progress = getProgress();
  const displayImage = portraitUrl || avatarUrl;

  // Animation variants
  const panelVariants: Variants = {
    expanded: {
      width: expandedWidth,
      transition: { duration: reduceMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }
    },
    collapsed: {
      width: collapsedWidth,
      transition: { duration: reduceMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }
    }
  };

  // Mobile: Don't render panel, only show on-demand overlay
  if (isMobile) {
    return null;
  }

  return (
    <motion.div
      initial={false}
      animate={isCollapsed ? 'collapsed' : 'expanded'}
      variants={panelVariants}
      style={{
        position: 'relative',
        height: '100%',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      <Box
        style={{
          height: '100%',
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: `1px solid ${emotionColors.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: `
            4px 0 24px rgba(0, 0, 0, 0.3),
            inset -1px 0 0 rgba(255, 255, 255, 0.05)
          `,
        }}
      >
        <AnimatePresence mode="wait">
          {isCollapsed ? (
            // Collapsed State
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '12px 8px',
                gap: '12px',
              }}
            >
              {/* Expand Button */}
              <Tooltip label="展开角色面板" position="right">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={toggleCollapse}
                  aria-label="展开角色面板"
                  style={{
                    color: theaterColors.spotlightGold,
                  }}
                >
                  <IconChevronRight size={18} />
                </ActionIcon>
              </Tooltip>

              {/* Mini Avatar */}
              <Tooltip label={characterName} position="right">
                <Avatar
                  src={avatarUrl || portraitUrl}
                  alt={characterName}
                  size={32}
                  radius="md"
                  style={{
                    border: `2px solid ${emotionColors.border}`,
                    boxShadow: `0 0 12px ${emotionColors.glow}`,
                    cursor: 'pointer',
                  }}
                  onClick={onPortraitClick}
                >
                  {characterName?.charAt(0).toUpperCase()}
                </Avatar>
              </Tooltip>

              {/* Emotion Indicator */}
              <Tooltip label={currentEmotion} position="right">
                <Box
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: emotionColors.bg,
                    border: `2px solid ${emotionColors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 8px ${emotionColors.glow}`,
                  }}
                >
                  <Box
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: emotionColors.primary,
                    }}
                  />
                </Box>
              </Tooltip>

              {/* Bond Level Icon */}
              <Tooltip label={`${bondLevel.name} (${progress}%)`} position="right">
                <Text size="lg">{bondLevel.icon}</Text>
              </Tooltip>
            </motion.div>
          ) : (
            // Expanded State
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header */}
              <Box
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Group gap="xs">
                  <Text
                    size="sm"
                    fw={600}
                    style={{
                      color: theaterColors.spotlightGold,
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
                    }}
                  >
                    {characterName}
                  </Text>
                  {/* Emotion Badge */}
                  <Box
                    style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: emotionColors.bg,
                      border: `1px solid ${emotionColors.border}`,
                    }}
                  >
                    <Text size="xs" style={{ color: emotionColors.primary }}>
                      {currentEmotion}
                    </Text>
                  </Box>
                </Group>

                <Tooltip label="折叠面板" position="left">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    onClick={toggleCollapse}
                    aria-label="折叠角色面板"
                    style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                    }}
                  >
                    <IconChevronLeft size={18} />
                  </ActionIcon>
                </Tooltip>
              </Box>

              {/* Portrait Image */}
              <Box
                style={{
                  flex: 1,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}
              >
                <Box
                  onClick={onPortraitClick}
                  style={{
                    width: '100%',
                    maxWidth: 240,
                    aspectRatio: '2 / 3',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: `2px solid ${atmosphereTheme.primary}`,
                    boxShadow: `
                      0 0 30px ${atmosphereTheme.glow},
                      0 0 60px ${atmosphereTheme.glow}40,
                      0 8px 32px rgba(0, 0, 0, 0.5)
                    `,
                    transition: reduceMotion ? 'none' : 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    animation: reduceMotion ? 'none' : 'portrait-glow-pulse 3s ease-in-out infinite',
                  }}
                  className="hover:scale-[1.02] hover:shadow-2xl"
                >
                  {/* Pulsing glow animation */}
                  <style>{`
                    @keyframes portrait-glow-pulse {
                      0%, 100% {
                        box-shadow: 0 0 30px ${atmosphereTheme.glow}, 0 0 60px ${atmosphereTheme.glow}40, 0 8px 32px rgba(0, 0, 0, 0.5);
                      }
                      50% {
                        box-shadow: 0 0 40px ${atmosphereTheme.glow}, 0 0 80px ${atmosphereTheme.glow}60, 0 8px 32px rgba(0, 0, 0, 0.5);
                      }
                    }
                  `}</style>
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt={characterName}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'top center',
                      }}
                    />
                  ) : (
                    <Box
                      style={{
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(135deg, ${emotionColors.bg}, rgba(0,0,0,0.8))`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        size="72px"
                        fw={700}
                        style={{ color: theaterColors.spotlightGold, opacity: 0.5 }}
                      >
                        {characterName?.charAt(0).toUpperCase()}
                      </Text>
                    </Box>
                  )}

                  {/* Gradient overlay at bottom */}
                  <Box
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '40%',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                      pointerEvents: 'none',
                    }}
                  />
                </Box>
              </Box>

              {/* Bond Section - Integrated */}
              <Box
                style={{
                  padding: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(0, 0, 0, 0.3)',
                }}
              >
                <Stack gap="xs">
                  {/* Bond Level Header */}
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs">
                      <Text size="lg">{bondLevel.icon}</Text>
                      <div>
                        <Text size="xs" c="dimmed">羁绊等级</Text>
                        <Text size="sm" fw={600} style={{ color: bondLevel.color }}>
                          Lv.{bondLevel.level} {bondLevel.name}
                        </Text>
                      </div>
                    </Group>
                    <Text size="sm" fw={500} style={{ color: bondLevel.color }}>
                      {progress}%
                    </Text>
                  </Group>

                  {/* Progress Bar */}
                  <Progress
                    value={progress}
                    size="sm"
                    radius="xl"
                    styles={{
                      root: { background: 'rgba(255, 255, 255, 0.1)' },
                      section: {
                        background: `linear-gradient(90deg, ${bondLevel.color}, ${bondLevel.color}dd)`,
                        transition: reduceMotion ? 'none' : 'width 0.5s ease',
                      },
                    }}
                  />

                  {/* EXP Display */}
                  <Group justify="center" gap="xs">
                    <IconSparkles size={12} style={{ color: bondLevel.color }} />
                    <Text size="xs" c="dimmed">
                      {bondExp.toLocaleString()} EXP
                    </Text>
                  </Group>
                </Stack>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </motion.div>
  );
}

export default memo(CharacterPortraitPanelV3);
