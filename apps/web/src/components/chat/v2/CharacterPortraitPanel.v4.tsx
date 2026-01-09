'use client'

/**
 * CharacterPortraitPanel v4 - Enhanced Portrait with Asset Integration
 *
 * v4 新功能:
 * - 场景/背景快速切换
 * - 表情差分快速预览
 * - CG 解锁徽章提示
 * - 素材库快捷入口
 * - 更好的视觉层次
 */

import { useState, useCallback, memo, useMemo } from 'react'
import {
  Box,
  Text,
  Avatar,
  Progress,
  Tooltip,
  ActionIcon,
  Stack,
  Group,
  Badge,
  ScrollArea,
} from '@mantine/core'
import { useReducedMotion } from '@mantine/hooks'
import {
  IconChevronLeft,
  IconChevronRight,
  IconSparkles,
  IconPhoto,
  IconMoodSmile,
  IconStar,
  IconMovie,
} from '@tabler/icons-react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { theaterColors } from '../utils/theaterColors'
import { EMOTION_COLORS, type EmotionType } from '../utils/emotionColors'
import { EMOTION_THEME_MAP, type EmotionType as AtmosphereEmotionType } from '../EmotionAtmosphere'
import type { CharacterAsset } from '@/hooks/useCharacterAssets'

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
]

interface CharacterPortraitPanelV4Props {
  /** Character name */
  characterName: string
  /** Portrait image URL (800×1200) */
  portraitUrl?: string
  /** Avatar URL (fallback) */
  avatarUrl?: string
  /** Current emotion */
  currentEmotion?: string
  /** Bond experience points */
  bondExp?: number
  /** Is panel collapsed */
  isCollapsed?: boolean
  /** Collapse toggle callback */
  onToggleCollapse?: () => void
  /** Portrait click callback (open gallery) */
  onPortraitClick?: () => void
  /** Panel width when expanded */
  expandedWidth?: number
  /** Panel width when collapsed */
  collapsedWidth?: number
  /** Is mobile view */
  isMobile?: boolean
  // ===== v4 新增属性 =====
  /** 场景素材列表 */
  sceneAssets?: CharacterAsset[]
  /** 当前选中的场景 */
  currentScene?: CharacterAsset | null
  /** 场景切换回调 */
  onSceneChange?: (scene: CharacterAsset) => void
  /** AI 推荐的场景 */
  suggestedScene?: CharacterAsset | null
  /** 表情差分素材 */
  expressionAssets?: CharacterAsset[]
  /** 表情切换回调 */
  onExpressionChange?: (expression: CharacterAsset) => void
  /** CG 素材列表 */
  cgAssets?: CharacterAsset[]
  /** 新解锁的 CG 数量 */
  newCGCount?: number
  /** 打开素材库回调 */
  onOpenAssetGallery?: (tab?: 'all' | 'expression' | 'scene' | 'cg') => void
  /** 素材统计 */
  assetStats?: {
    expressions: number
    scenes: number
    cgs: number
    total: number
  }
}

function CharacterPortraitPanelV4({
  characterName,
  portraitUrl,
  avatarUrl,
  currentEmotion = 'neutral',
  bondExp = 0,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  onPortraitClick,
  expandedWidth = 300,
  collapsedWidth = 52,
  isMobile = false,
  // v4 新增
  sceneAssets = [],
  currentScene,
  onSceneChange,
  suggestedScene,
  expressionAssets = [],
  onExpressionChange,
  cgAssets = [],
  newCGCount = 0,
  onOpenAssetGallery,
  assetStats,
}: CharacterPortraitPanelV4Props) {
  const reduceMotion = useReducedMotion()
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const [showScenes, setShowScenes] = useState(false)
  const [showExpressions, setShowExpressions] = useState(false)

  // Controlled or uncontrolled collapse state
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed
  const toggleCollapse = useCallback(() => {
    if (onToggleCollapse) {
      onToggleCollapse()
    } else {
      setInternalCollapsed((prev) => !prev)
    }
  }, [onToggleCollapse])

  // Get emotion colors
  const emotionKey = (currentEmotion?.toLowerCase() || 'neutral') as EmotionType
  const emotionColors = EMOTION_COLORS[emotionKey] || EMOTION_COLORS.neutral

  // Get enhanced glow from EmotionAtmosphere theme
  const atmosphereTheme = useMemo(() => {
    const key = (currentEmotion?.toLowerCase() || 'neutral') as AtmosphereEmotionType
    return EMOTION_THEME_MAP[key] || EMOTION_THEME_MAP.neutral
  }, [currentEmotion])

  // Calculate bond level
  const bondLevel = useMemo(() => {
    for (let i = BOND_LEVELS.length - 1; i >= 0; i--) {
      if (bondExp >= BOND_LEVELS[i].minExp) {
        return BOND_LEVELS[i]
      }
    }
    return BOND_LEVELS[0]
  }, [bondExp])

  // Calculate progress to next level
  const progress = useMemo(() => {
    const currentIndex = BOND_LEVELS.findIndex((l) => l.level === bondLevel.level)
    const next = BOND_LEVELS[currentIndex + 1]
    if (!next) return 100
    const expInLevel = bondExp - bondLevel.minExp
    const expNeeded = next.minExp - bondLevel.minExp
    return Math.min(100, Math.round((expInLevel / expNeeded) * 100))
  }, [bondExp, bondLevel])

  const displayImage = portraitUrl || avatarUrl

  // Unlocked assets
  const unlockedScenes = useMemo(() => sceneAssets.filter((s) => s.isUnlocked), [sceneAssets])
  const unlockedExpressions = useMemo(
    () => expressionAssets.filter((e) => e.isUnlocked),
    [expressionAssets]
  )
  const unlockedCGs = useMemo(() => cgAssets.filter((c) => c.isUnlocked), [cgAssets])

  // Animation variants
  const panelVariants: Variants = {
    expanded: {
      width: expandedWidth,
      transition: { duration: reduceMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] },
    },
    collapsed: {
      width: collapsedWidth,
      transition: { duration: reduceMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] },
    },
  }

  // Mobile: Don't render panel
  if (isMobile) {
    return null
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
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: `1px solid ${emotionColors.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: `
            4px 0 32px rgba(0, 0, 0, 0.4),
            inset -1px 0 0 rgba(255, 255, 255, 0.05)
          `,
        }}
      >
        <AnimatePresence mode="wait">
          {isCollapsed ? (
            // ===== Collapsed State =====
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
                  style={{ color: theaterColors.spotlightGold }}
                >
                  <IconChevronRight size={18} />
                </ActionIcon>
              </Tooltip>

              {/* Mini Avatar */}
              <Tooltip label={characterName} position="right">
                <Avatar
                  src={avatarUrl || portraitUrl}
                  alt={characterName}
                  size={36}
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

              {/* Quick Asset Buttons */}
              {unlockedScenes.length > 0 && (
                <Tooltip label={`${unlockedScenes.length} 个场景`} position="right">
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    onClick={() => onOpenAssetGallery?.('scene')}
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    <IconMovie size={16} />
                  </ActionIcon>
                </Tooltip>
              )}

              {newCGCount > 0 && (
                <Tooltip label={`${newCGCount} 个新 CG`} position="right">
                  <Box style={{ position: 'relative' }}>
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      onClick={() => onOpenAssetGallery?.('cg')}
                      style={{ color: '#f472b6' }}
                    >
                      <IconStar size={16} />
                    </ActionIcon>
                    <Badge
                      size="xs"
                      color="pink"
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        minWidth: 14,
                        height: 14,
                        padding: 0,
                      }}
                    >
                      {newCGCount}
                    </Badge>
                  </Box>
                </Tooltip>
              )}
            </motion.div>
          ) : (
            // ===== Expanded State =====
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
                    style={{ color: 'rgba(255, 255, 255, 0.6)' }}
                  >
                    <IconChevronLeft size={18} />
                  </ActionIcon>
                </Tooltip>
              </Box>

              {/* Scrollable Content */}
              <ScrollArea style={{ flex: 1 }} scrollbarSize={4}>
                <Stack gap="md" p="md">
                  {/* Portrait Image */}
                  <Box
                    onClick={onPortraitClick}
                    style={{
                      width: '100%',
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
                    <style>{`
                      @keyframes portrait-glow-pulse {
                        0%, 100% { box-shadow: 0 0 30px ${atmosphereTheme.glow}, 0 0 60px ${atmosphereTheme.glow}40, 0 8px 32px rgba(0, 0, 0, 0.5); }
                        50% { box-shadow: 0 0 40px ${atmosphereTheme.glow}, 0 0 80px ${atmosphereTheme.glow}60, 0 8px 32px rgba(0, 0, 0, 0.5); }
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

                    {/* Gradient overlay */}
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

                    {/* Asset stats overlay */}
                    {assetStats && assetStats.total > 0 && (
                      <Box
                        style={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          background: 'rgba(0, 0, 0, 0.6)',
                          backdropFilter: 'blur(8px)',
                          borderRadius: 8,
                          padding: '4px 8px',
                        }}
                      >
                        <Group gap={6}>
                          <IconPhoto size={12} style={{ color: 'rgba(255,255,255,0.7)' }} />
                          <Text size="xs" c="dimmed">
                            {assetStats.total}
                          </Text>
                        </Group>
                      </Box>
                    )}
                  </Box>

                  {/* Expression Quick Switch */}
                  {unlockedExpressions.length > 1 && (
                    <Box>
                      <Group justify="space-between" mb="xs">
                        <Group gap="xs">
                          <IconMoodSmile size={14} style={{ color: 'rgba(255,255,255,0.6)' }} />
                          <Text size="xs" c="dimmed">
                            表情差分
                          </Text>
                        </Group>
                        <ActionIcon
                          variant="subtle"
                          size="xs"
                          onClick={() => setShowExpressions(!showExpressions)}
                        >
                          {showExpressions ? (
                            <IconChevronLeft size={12} />
                          ) : (
                            <IconChevronRight size={12} />
                          )}
                        </ActionIcon>
                      </Group>

                      <AnimatePresence>
                        {showExpressions && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                          >
                            <ScrollArea scrollbarSize={4}>
                              <Group gap="xs" wrap="nowrap" pb={4}>
                                {unlockedExpressions.slice(0, 6).map((exp) => (
                                  <Tooltip key={exp.id} label={exp.category || '表情'}>
                                    <Box
                                      onClick={() => onExpressionChange?.(exp)}
                                      style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        border:
                                          exp.url === portraitUrl
                                            ? '2px solid #f9c86d'
                                            : '2px solid transparent',
                                        flexShrink: 0,
                                      }}
                                    >
                                      <img
                                        src={exp.thumbnail || exp.url}
                                        alt={exp.category || 'expression'}
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'cover',
                                        }}
                                      />
                                    </Box>
                                  </Tooltip>
                                ))}
                              </Group>
                            </ScrollArea>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  )}

                  {/* Scene Quick Switch */}
                  {unlockedScenes.length > 0 && (
                    <Box>
                      <Group justify="space-between" mb="xs">
                        <Group gap="xs">
                          <IconMovie size={14} style={{ color: 'rgba(255,255,255,0.6)' }} />
                          <Text size="xs" c="dimmed">
                            背景场景
                          </Text>
                          {suggestedScene && suggestedScene.id !== currentScene?.id && (
                            <Badge
                              size="xs"
                              color="yellow"
                              variant="light"
                              leftSection={<IconSparkles size={8} />}
                            >
                              AI推荐
                            </Badge>
                          )}
                        </Group>
                        <ActionIcon
                          variant="subtle"
                          size="xs"
                          onClick={() => setShowScenes(!showScenes)}
                        >
                          {showScenes ? <IconChevronLeft size={12} /> : <IconChevronRight size={12} />}
                        </ActionIcon>
                      </Group>

                      <AnimatePresence>
                        {showScenes && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                          >
                            <Box
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: 8,
                              }}
                            >
                              {unlockedScenes.slice(0, 6).map((scene) => (
                                <Tooltip key={scene.id} label={scene.category || '场景'}>
                                  <Box
                                    onClick={() => onSceneChange?.(scene)}
                                    style={{
                                      aspectRatio: '16 / 9',
                                      borderRadius: 8,
                                      overflow: 'hidden',
                                      cursor: 'pointer',
                                      border:
                                        scene.id === currentScene?.id
                                          ? '2px solid #f9c86d'
                                          : scene.id === suggestedScene?.id
                                            ? '2px solid rgba(251, 191, 36, 0.5)'
                                            : '2px solid transparent',
                                      position: 'relative',
                                    }}
                                  >
                                    <img
                                      src={scene.thumbnail || scene.url}
                                      alt={scene.category || 'scene'}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                      }}
                                    />
                                    {scene.id === suggestedScene?.id && scene.id !== currentScene?.id && (
                                      <Box
                                        style={{
                                          position: 'absolute',
                                          top: 2,
                                          right: 2,
                                          width: 14,
                                          height: 14,
                                          borderRadius: '50%',
                                          background: 'rgba(251, 191, 36, 0.9)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                        }}
                                      >
                                        <IconSparkles size={8} color="#000" />
                                      </Box>
                                    )}
                                  </Box>
                                </Tooltip>
                              ))}
                            </Box>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  )}

                  {/* CG Preview */}
                  {unlockedCGs.length > 0 && (
                    <Box
                      onClick={() => onOpenAssetGallery?.('cg')}
                      style={{
                        background: 'rgba(244, 114, 182, 0.1)',
                        border: '1px solid rgba(244, 114, 182, 0.3)',
                        borderRadius: 12,
                        padding: 12,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      className="hover:bg-[rgba(244,114,182,0.15)]"
                    >
                      <Group justify="space-between">
                        <Group gap="xs">
                          <IconStar size={16} style={{ color: '#f472b6' }} />
                          <Text size="sm" fw={500} c="white">
                            CG 画廊
                          </Text>
                        </Group>
                        <Group gap="xs">
                          {newCGCount > 0 && (
                            <Badge size="sm" color="pink" variant="filled">
                              +{newCGCount} 新
                            </Badge>
                          )}
                          <Text size="xs" c="dimmed">
                            {unlockedCGs.length} 张
                          </Text>
                        </Group>
                      </Group>

                      {/* CG Preview Strip */}
                      <Group gap={4} mt="xs">
                        {unlockedCGs.slice(0, 4).map((cg) => (
                          <Box
                            key={cg.id}
                            style={{
                              width: 48,
                              height: 32,
                              borderRadius: 6,
                              overflow: 'hidden',
                              border: '1px solid rgba(244, 114, 182, 0.3)',
                            }}
                          >
                            <img
                              src={cg.thumbnail || cg.url}
                              alt="CG"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          </Box>
                        ))}
                        {unlockedCGs.length > 4 && (
                          <Box
                            style={{
                              width: 48,
                              height: 32,
                              borderRadius: 6,
                              background: 'rgba(244, 114, 182, 0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text size="xs" c="dimmed">
                              +{unlockedCGs.length - 4}
                            </Text>
                          </Box>
                        )}
                      </Group>
                    </Box>
                  )}
                </Stack>
              </ScrollArea>

              {/* Bond Section */}
              <Box
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(0, 0, 0, 0.3)',
                }}
              >
                <Stack gap="xs">
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs">
                      <Text size="lg">{bondLevel.icon}</Text>
                      <div>
                        <Text size="xs" c="dimmed">
                          羁绊等级
                        </Text>
                        <Text size="sm" fw={600} style={{ color: bondLevel.color }}>
                          Lv.{bondLevel.level} {bondLevel.name}
                        </Text>
                      </div>
                    </Group>
                    <Text size="sm" fw={500} style={{ color: bondLevel.color }}>
                      {progress}%
                    </Text>
                  </Group>

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
  )
}

export default memo(CharacterPortraitPanelV4)
