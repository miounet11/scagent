'use client'

/**
 * SceneSelector - 场景/背景切换组件
 *
 * 功能:
 * - 显示可用的场景/背景缩略图
 * - 支持点击切换背景
 * - 显示当前选中的场景
 * - AI 自动推荐场景提示
 */

import { useState, useCallback, memo, useMemo } from 'react'
import { Box, Text, Tooltip, ActionIcon, ScrollArea, Badge, Group } from '@mantine/core'
import { IconPhoto, IconChevronDown, IconChevronUp, IconSparkles, IconCheck } from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CharacterAsset } from '@/hooks/useCharacterAssets'

interface SceneSelectorProps {
  /** 可用的场景素材 */
  scenes: CharacterAsset[]
  /** 当前选中的场景ID */
  currentSceneId?: string
  /** 场景切换回调 */
  onSceneChange: (scene: CharacterAsset) => void
  /** AI 推荐的场景ID */
  suggestedSceneId?: string
  /** 是否折叠 */
  isCollapsed?: boolean
  /** 折叠切换回调 */
  onToggleCollapse?: () => void
  /** 是否显示标签 */
  showLabels?: boolean
  /** 最大显示数量 */
  maxVisible?: number
  /** 样式变体 */
  variant?: 'horizontal' | 'vertical' | 'compact'
}

function SceneSelector({
  scenes,
  currentSceneId,
  onSceneChange,
  suggestedSceneId,
  isCollapsed = false,
  onToggleCollapse,
  showLabels = true,
  maxVisible = 6,
  variant = 'horizontal',
}: SceneSelectorProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // 过滤已解锁的场景
  const unlockedScenes = useMemo(() =>
    scenes.filter(s => s.isUnlocked).slice(0, maxVisible),
    [scenes, maxVisible]
  )

  const hasMore = scenes.filter(s => s.isUnlocked).length > maxVisible

  const handleSceneClick = useCallback((scene: CharacterAsset) => {
    onSceneChange(scene)
  }, [onSceneChange])

  if (unlockedScenes.length === 0) {
    return null
  }

  // Compact 变体 - 只显示图标按钮
  if (variant === 'compact') {
    return (
      <Box style={{ position: 'relative' }}>
        <Tooltip label="切换场景" position="top">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            onClick={onToggleCollapse}
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <IconPhoto size={20} />
            {unlockedScenes.length > 0 && (
              <Badge
                size="xs"
                color="pink"
                variant="filled"
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                }}
              >
                {unlockedScenes.length}
              </Badge>
            )}
          </ActionIcon>
        </Tooltip>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: 8,
                zIndex: 100,
              }}
            >
              <SceneThumbnailGrid
                scenes={unlockedScenes}
                currentSceneId={currentSceneId}
                suggestedSceneId={suggestedSceneId}
                onSceneClick={handleSceneClick}
                hoveredId={hoveredId}
                setHoveredId={setHoveredId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    )
  }

  // Horizontal 变体 - 横向滚动条
  if (variant === 'horizontal') {
    return (
      <Box
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(12px)',
          borderRadius: 12,
          padding: '8px 12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header */}
        <Group justify="space-between" mb="xs">
          <Group gap="xs">
            <IconPhoto size={14} style={{ color: 'rgba(255,255,255,0.6)' }} />
            <Text size="xs" c="dimmed">场景</Text>
            {suggestedSceneId && suggestedSceneId !== currentSceneId && (
              <Badge size="xs" color="yellow" variant="light" leftSection={<IconSparkles size={10} />}>
                AI推荐
              </Badge>
            )}
          </Group>
          {onToggleCollapse && (
            <ActionIcon variant="subtle" size="xs" onClick={onToggleCollapse}>
              {isCollapsed ? <IconChevronDown size={14} /> : <IconChevronUp size={14} />}
            </ActionIcon>
          )}
        </Group>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ScrollArea scrollbarSize={4} type="hover">
                <Group gap="sm" wrap="nowrap" style={{ paddingBottom: 4 }}>
                  {unlockedScenes.map((scene) => (
                    <SceneThumbnail
                      key={scene.id}
                      scene={scene}
                      isActive={scene.id === currentSceneId}
                      isSuggested={scene.id === suggestedSceneId}
                      isHovered={scene.id === hoveredId}
                      onClick={() => handleSceneClick(scene)}
                      onHover={(id) => setHoveredId(id)}
                      showLabel={showLabels}
                    />
                  ))}
                  {hasMore && (
                    <Box
                      style={{
                        width: 60,
                        height: 40,
                        borderRadius: 8,
                        background: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      <Text size="xs" c="dimmed">+{scenes.filter(s => s.isUnlocked).length - maxVisible}</Text>
                    </Box>
                  )}
                </Group>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    )
  }

  // Vertical 变体 - 垂直列表 (适合侧边栏)
  return (
    <Box
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(12px)',
        borderRadius: 12,
        padding: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Group justify="space-between" mb="sm">
        <Group gap="xs">
          <IconPhoto size={14} style={{ color: 'rgba(255,255,255,0.6)' }} />
          <Text size="xs" c="dimmed">背景场景</Text>
        </Group>
        <Badge size="xs" variant="light">{unlockedScenes.length}</Badge>
      </Group>

      <SceneThumbnailGrid
        scenes={unlockedScenes}
        currentSceneId={currentSceneId}
        suggestedSceneId={suggestedSceneId}
        onSceneClick={handleSceneClick}
        hoveredId={hoveredId}
        setHoveredId={setHoveredId}
      />
    </Box>
  )
}

// 场景缩略图组件
interface SceneThumbnailProps {
  scene: CharacterAsset
  isActive: boolean
  isSuggested: boolean
  isHovered: boolean
  onClick: () => void
  onHover: (id: string | null) => void
  showLabel?: boolean
}

function SceneThumbnail({
  scene,
  isActive,
  isSuggested,
  isHovered,
  onClick,
  onHover,
  showLabel = true,
}: SceneThumbnailProps) {
  const thumbnailUrl = scene.thumbnail || scene.url

  return (
    <Tooltip
      label={scene.category || '场景'}
      position="top"
      disabled={!showLabel}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'relative',
          width: 80,
          height: 50,
          borderRadius: 8,
          overflow: 'hidden',
          cursor: 'pointer',
          flexShrink: 0,
          border: isActive
            ? '2px solid #f9c86d'
            : isSuggested
              ? '2px solid rgba(251, 191, 36, 0.5)'
              : '2px solid transparent',
          boxShadow: isActive
            ? '0 0 12px rgba(249, 200, 109, 0.5)'
            : 'none',
        }}
        onClick={onClick}
        onMouseEnter={() => onHover(scene.id)}
        onMouseLeave={() => onHover(null)}
      >
        <img
          src={thumbnailUrl}
          alt={scene.category || 'scene'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: isHovered ? 'brightness(1.1)' : 'brightness(0.9)',
            transition: 'filter 0.2s',
          }}
        />

        {/* Active indicator */}
        {isActive && (
          <Box
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#f9c86d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconCheck size={12} color="#000" />
          </Box>
        )}

        {/* AI suggested indicator */}
        {isSuggested && !isActive && (
          <Box
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: 'rgba(251, 191, 36, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconSparkles size={10} color="#000" />
          </Box>
        )}

        {/* Gradient overlay */}
        <Box
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
      </motion.div>
    </Tooltip>
  )
}

// 场景缩略图网格
interface SceneThumbnailGridProps {
  scenes: CharacterAsset[]
  currentSceneId?: string
  suggestedSceneId?: string
  onSceneClick: (scene: CharacterAsset) => void
  hoveredId: string | null
  setHoveredId: (id: string | null) => void
}

function SceneThumbnailGrid({
  scenes,
  currentSceneId,
  suggestedSceneId,
  onSceneClick,
  hoveredId,
  setHoveredId,
}: SceneThumbnailGridProps) {
  return (
    <Box
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8,
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(12px)',
        borderRadius: 12,
        padding: 8,
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {scenes.map((scene) => (
        <SceneThumbnail
          key={scene.id}
          scene={scene}
          isActive={scene.id === currentSceneId}
          isSuggested={scene.id === suggestedSceneId}
          isHovered={scene.id === hoveredId}
          onClick={() => onSceneClick(scene)}
          onHover={setHoveredId}
          showLabel={true}
        />
      ))}
    </Box>
  )
}

export default memo(SceneSelector)
