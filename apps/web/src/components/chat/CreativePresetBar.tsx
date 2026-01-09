/**
 * 创意控制栏组件
 *
 * v15.2 重构
 * 直接展示细粒度的创意指令开关，让用户一目了然地配置AI输出
 *
 * 分组：
 * 1. 📝 内容丰富度：详细描写、心理、动作、场景、样貌
 * 2. 💬 互动模式：交互选项、情绪标签
 * 3. ⏱️ 节奏控制：慢节奏、快节奏
 * 4. ✨ 特殊效果：悬念结尾、回忆闪回（单次）
 * 5. ⚡ 原有三按钮：剧情推进、视角设计、场景过渡
 */

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Box,
  Group,
  Button,
  Text,
  Badge,
  Tooltip,
  ActionIcon,
  Paper,
  Collapse,
  Popover,
  Stack,
  Switch,
  Divider,
  SegmentedControl,
  ThemeIcon,
} from '@mantine/core'
import {
  IconSparkles,
  IconX,
  IconInfoCircle,
  IconChevronDown,
  IconChevronUp,
  IconPencil,
  IconBrain,
  IconMoodSmile,
  IconTrees,
  IconUser,
  IconMessageCircle,
  IconTags,
  IconPlayerPause,
  IconPlayerPlay,
  IconWand,
  IconArrowBack,
  IconBolt,
  IconEye,
  IconMovie,
  IconSettings,
} from '@tabler/icons-react'
import {
  useCreativeStore,
  type PovMode,
  DIRECTIVE_METADATA,
} from '@/stores/creativeStore'
import { useTranslation } from '@/lib/i18n'

interface CreativePresetBarProps {
  /** 是否禁用 */
  disabled?: boolean
  /** 语言 */
  locale?: string
}

const GUIDE_STORAGE_KEY = 'creative_bar_guide_dismissed_v2'

// 指令分组配置
const DIRECTIVE_GROUPS = {
  richness: {
    key: 'richness',
    icon: IconPencil,
    label: '内容丰富度',
    labelEn: 'Content',
    color: 'blue',
    directives: [
      { key: 'detailedDescription', icon: '📝', label: '详细', labelEn: 'Detail' },
      { key: 'psychologyFocus', icon: '🧠', label: '心理', labelEn: 'Mind' },
      { key: 'actionFocus', icon: '😊', label: '动作', labelEn: 'Action' },
      { key: 'environmentFocus', icon: '🌲', label: '场景', labelEn: 'Scene' },
      { key: 'appearanceFocus', icon: '👤', label: '样貌', labelEn: 'Look' },
    ],
  },
  interaction: {
    key: 'interaction',
    icon: IconMessageCircle,
    label: '互动模式',
    labelEn: 'Interact',
    color: 'teal',
    directives: [
      // 🎬 v20.5: interactiveChoices 已废弃，由 Director 系统处理
      { key: 'emotionTagging', icon: '🏷️', label: '情绪', labelEn: 'Emotion' },
    ],
  },
  pacing: {
    key: 'pacing',
    icon: IconPlayerPause,
    label: '节奏',
    labelEn: 'Pace',
    color: 'orange',
    directives: [
      { key: 'slowPacing', icon: '🐢', label: '慢', labelEn: 'Slow' },
      { key: 'fastPacing', icon: '🐇', label: '快', labelEn: 'Fast' },
    ],
  },
  special: {
    key: 'special',
    icon: IconWand,
    label: '特效',
    labelEn: 'Effect',
    color: 'violet',
    directives: [
      { key: 'cliffhangerOnce', icon: '⏳', label: '悬念', labelEn: 'Suspense' },
      { key: 'flashbackOnce', icon: '⏪', label: '闪回', labelEn: 'Flashback' },
      { key: 'innerMonologueOnce', icon: '💭', label: '独白', labelEn: 'Mono' },
      { key: 'romanticMomentOnce', icon: '💕', label: '浪漫', labelEn: 'Romance' },
    ],
  },
}

// 原有的三个按钮配置
const STORY_CONTROLS = [
  {
    key: 'storyAdvance',
    icon: IconBolt,
    label: '剧情推进',
    labelEn: 'Story',
    color: 'yellow',
    description: '主动推进故事发展',
    descriptionEn: 'Advance the story',
  },
  {
    key: 'povMode',
    icon: IconEye,
    label: '视角设计',
    labelEn: 'POV',
    color: 'teal',
    description: '切换叙述视角',
    descriptionEn: 'Change POV',
    options: [
      { value: 'protagonist', label: '主角视角', labelEn: 'Protagonist' },
      { value: 'novel', label: '小说视角', labelEn: 'Novel' },
    ],
  },
  {
    key: 'sceneTransitionOnce',
    icon: IconMovie,
    label: '场景过渡',
    labelEn: 'Scene',
    color: 'violet',
    description: '平滑过渡到新场景（单次）',
    descriptionEn: 'Transition to new scene',
    isOneShot: true,
  },
]

export default function CreativePresetBar({
  disabled = false,
  locale,
}: CreativePresetBarProps) {
  const { t } = useTranslation()
  const isZh = locale?.startsWith('zh') ?? true

  // Store state
  const store = useCreativeStore()
  const {
    storyAdvance,
    povMode,
    sceneTransitionOnce,
    detailedDescription,
    psychologyFocus,
    actionFocus,
    environmentFocus,
    appearanceFocus,
    interactiveChoices,
    emotionTagging,
    slowPacing,
    fastPacing,
    cliffhangerOnce,
    flashbackOnce,
    innerMonologueOnce,
    romanticMomentOnce,
    setStoryAdvance,
    setPovMode,
    setSceneTransitionOnce,
    setDetailedDescription,
    setPsychologyFocus,
    setActionFocus,
    setEnvironmentFocus,
    setAppearanceFocus,
    setInteractiveChoices,
    setEmotionTagging,
    setSlowPacing,
    setFastPacing,
    setCliffhangerOnce,
    setFlashbackOnce,
    setInnerMonologueOnce,
    setRomanticMomentOnce,
    getActiveDirectives,
  } = store

  // 首次使用引导状态
  const [showGuide, setShowGuide] = useState(false)
  // 展开的分组
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  // 检查是否需要显示引导
  useEffect(() => {
    if (typeof window === 'undefined') return
    const dismissed = localStorage.getItem(GUIDE_STORAGE_KEY)
    if (!dismissed) {
      setShowGuide(true)
    }
  }, [])

  // 关闭引导
  const dismissGuide = () => {
    setShowGuide(false)
    localStorage.setItem(GUIDE_STORAGE_KEY, 'true')
  }

  // 获取指令值
  const getDirectiveValue = useCallback((key: string): boolean => {
    switch (key) {
      case 'detailedDescription': return detailedDescription
      case 'psychologyFocus': return psychologyFocus
      case 'actionFocus': return actionFocus
      case 'environmentFocus': return environmentFocus
      case 'appearanceFocus': return appearanceFocus
      case 'interactiveChoices': return interactiveChoices
      case 'emotionTagging': return emotionTagging
      case 'slowPacing': return slowPacing
      case 'fastPacing': return fastPacing
      case 'cliffhangerOnce': return cliffhangerOnce
      case 'flashbackOnce': return flashbackOnce
      case 'innerMonologueOnce': return innerMonologueOnce
      case 'romanticMomentOnce': return romanticMomentOnce
      default: return false
    }
  }, [detailedDescription, psychologyFocus, actionFocus, environmentFocus, appearanceFocus,
      interactiveChoices, emotionTagging, slowPacing, fastPacing,
      cliffhangerOnce, flashbackOnce, innerMonologueOnce, romanticMomentOnce])

  // 设置指令值
  const setDirectiveValue = useCallback((key: string, value: boolean) => {
    switch (key) {
      case 'detailedDescription': setDetailedDescription(value); break
      case 'psychologyFocus': setPsychologyFocus(value); break
      case 'actionFocus': setActionFocus(value); break
      case 'environmentFocus': setEnvironmentFocus(value); break
      case 'appearanceFocus': setAppearanceFocus(value); break
      case 'interactiveChoices': setInteractiveChoices(value); break
      case 'emotionTagging': setEmotionTagging(value); break
      case 'slowPacing': setSlowPacing(value); break
      case 'fastPacing': setFastPacing(value); break
      case 'cliffhangerOnce': setCliffhangerOnce(value); break
      case 'flashbackOnce': setFlashbackOnce(value); break
      case 'innerMonologueOnce': setInnerMonologueOnce(value); break
      case 'romanticMomentOnce': setRomanticMomentOnce(value); break
    }
  }, [setDetailedDescription, setPsychologyFocus, setActionFocus, setEnvironmentFocus, setAppearanceFocus,
      setInteractiveChoices, setEmotionTagging, setSlowPacing, setFastPacing,
      setCliffhangerOnce, setFlashbackOnce, setInnerMonologueOnce, setRomanticMomentOnce])

  // 计算每个分组激活数量
  const getGroupActiveCount = useCallback((groupKey: string) => {
    const group = DIRECTIVE_GROUPS[groupKey as keyof typeof DIRECTIVE_GROUPS]
    if (!group) return 0
    return group.directives.filter(d => getDirectiveValue(d.key)).length
  }, [getDirectiveValue])

  // 计算总激活数量
  const totalActiveCount = useMemo(() => {
    const directives = getActiveDirectives()
    return Object.keys(directives).length
  }, [getActiveDirectives])

  // 渲染分组弹出面板
  const renderGroupPopover = (groupKey: string) => {
    const group = DIRECTIVE_GROUPS[groupKey as keyof typeof DIRECTIVE_GROUPS]
    if (!group) return null
    const activeCount = getGroupActiveCount(groupKey)
    const GroupIcon = group.icon

    return (
      <Popover
        key={groupKey}
        position="bottom"
        withArrow
        shadow="md"
        opened={expandedGroup === groupKey}
        onChange={(opened) => setExpandedGroup(opened ? groupKey : null)}
      >
        <Popover.Target>
          <Button
            variant={activeCount > 0 ? 'light' : 'subtle'}
            color={activeCount > 0 ? group.color : 'gray'}
            size="compact-xs"
            disabled={disabled}
            onClick={() => setExpandedGroup(expandedGroup === groupKey ? null : groupKey)}
            leftSection={<GroupIcon size={14} />}
            rightSection={
              activeCount > 0 ? (
                <Badge size="xs" circle variant="filled" color={group.color}>
                  {activeCount}
                </Badge>
              ) : null
            }
            styles={{
              root: {
                height: '26px',
                paddingLeft: '6px',
                paddingRight: activeCount > 0 ? '4px' : '8px',
                border: activeCount > 0 ? `1px solid rgba(var(--mantine-color-${group.color}-5), 0.3)` : '1px solid transparent',
              },
              label: {
                fontSize: '0.7rem',
              },
            }}
          >
            {isZh ? group.label : group.labelEn}
          </Button>
        </Popover.Target>
        <Popover.Dropdown
          style={{
            background: 'rgba(28, 28, 28, 0.98)',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Stack gap="xs">
            <Text size="xs" fw={600} c="dimmed">
              {isZh ? group.label : group.labelEn}
            </Text>
            {group.directives.map((directive) => {
              const isActive = getDirectiveValue(directive.key)
              const meta = DIRECTIVE_METADATA[directive.key as keyof typeof DIRECTIVE_METADATA]
              return (
                <Group key={directive.key} justify="space-between" wrap="nowrap" gap="md">
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm">{directive.icon}</Text>
                    <div>
                      <Text size="sm" fw={500}>
                        {isZh ? meta?.name || directive.label : meta?.nameEn || directive.labelEn}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {isZh ? meta?.description : meta?.descriptionEn}
                      </Text>
                    </div>
                  </Group>
                  <Switch
                    size="xs"
                    checked={isActive}
                    onChange={(e) => setDirectiveValue(directive.key, e.currentTarget.checked)}
                    disabled={disabled}
                    color={group.color}
                  />
                </Group>
              )
            })}
          </Stack>
        </Popover.Dropdown>
      </Popover>
    )
  }

  // 渲染视角选择弹出
  const renderPovPopover = () => {
    const ctrl = STORY_CONTROLS.find(c => c.key === 'povMode')!
    const CtrlIcon = ctrl.icon
    const isActive = povMode !== null

    return (
      <Popover position="bottom" withArrow shadow="md">
        <Popover.Target>
          <Button
            variant={isActive ? 'light' : 'subtle'}
            color={isActive ? ctrl.color : 'gray'}
            size="compact-xs"
            disabled={disabled}
            leftSection={<CtrlIcon size={14} />}
            styles={{
              root: {
                height: '26px',
                paddingLeft: '6px',
                paddingRight: '8px',
                border: isActive ? `1px solid rgba(45, 212, 191, 0.2)` : '1px solid transparent',
              },
              label: {
                fontSize: '0.7rem',
              },
            }}
          >
            {isZh ? ctrl.label : ctrl.labelEn}
            {povMode && (
              <Text span size="xs" ml={4} c="dimmed">
                ({povMode === 'protagonist' ? (isZh ? '主角' : 'Prot') : (isZh ? '小说' : 'Novel')})
              </Text>
            )}
          </Button>
        </Popover.Target>
        <Popover.Dropdown
          style={{
            background: 'rgba(28, 28, 28, 0.98)',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <Stack gap="xs">
            <Text size="xs" fw={600} c="dimmed">
              {isZh ? '选择视角' : 'Select POV'}
            </Text>
            <SegmentedControl
              size="xs"
              value={povMode || ''}
              onChange={(value) => setPovMode(value === '' ? null : value as PovMode)}
              data={[
                { value: '', label: isZh ? '关闭' : 'Off' },
                { value: 'protagonist', label: isZh ? '主角视角' : 'Protagonist' },
                { value: 'novel', label: isZh ? '小说视角' : 'Novel' },
              ]}
            />
            <Text size="xs" c="dimmed">
              {isZh
                ? '主角视角：以"你"为主角描写；小说视角：第三人称全知叙述'
                : 'Protagonist: "You" as main character; Novel: Third-person omniscient'}
            </Text>
          </Stack>
        </Popover.Dropdown>
      </Popover>
    )
  }

  return (
    <Box style={{ position: 'relative', width: '100%' }}>
      {/* 首次使用引导 */}
      <Collapse in={showGuide}>
        <Paper
          p="sm"
          mb="xs"
          radius="md"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          <Group justify="space-between" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              <IconInfoCircle size={20} style={{ color: 'rgb(147, 197, 253)', flexShrink: 0 }} />
              <Text size="sm" style={{ color: 'rgb(219, 234, 254)' }}>
                {isZh
                  ? '点击各分组配置AI输出：内容丰富度(心理/动作/场景)、互动选项、节奏控制、特殊效果'
                  : 'Configure AI output: Content richness, Interactions, Pacing, Special effects'}
              </Text>
            </Group>
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={dismissGuide}>
              <IconX size={14} />
            </ActionIcon>
          </Group>
        </Paper>
      </Collapse>

      {/* 主控制栏 */}
      <Paper
        px="sm"
        py="xs"
        radius="md"
        style={{
          background: totalActiveCount > 0
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)'
            : 'rgba(255, 255, 255, 0.02)',
          border: totalActiveCount > 0
            ? '1px solid rgba(99, 102, 241, 0.25)'
            : '1px solid rgba(55, 65, 81, 0.3)',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* 分组按钮行 */}
        <Group gap={6} wrap="nowrap" style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
          {/* 内容丰富度分组 */}
          {renderGroupPopover('richness')}

          {/* 互动模式分组 */}
          {renderGroupPopover('interaction')}

          {/* 节奏控制分组 */}
          {renderGroupPopover('pacing')}

          {/* 特殊效果分组 */}
          {renderGroupPopover('special')}

          <Divider orientation="vertical" style={{ height: '20px', alignSelf: 'center' }} />

          {/* 剧情推进按钮 */}
          <Tooltip label={isZh ? '主动推进故事发展' : 'Advance the story'} position="bottom">
            <Button
              variant={storyAdvance ? 'light' : 'subtle'}
              color={storyAdvance ? 'yellow' : 'gray'}
              size="compact-xs"
              disabled={disabled}
              onClick={() => setStoryAdvance(!storyAdvance)}
              leftSection={<IconBolt size={14} />}
              styles={{
                root: {
                  height: '26px',
                  paddingLeft: '6px',
                  paddingRight: '8px',
                  border: storyAdvance ? '1px solid rgba(251, 191, 36, 0.2)' : '1px solid transparent',
                },
                label: {
                  fontSize: '0.7rem',
                },
              }}
            >
              {isZh ? '剧情推进' : 'Story'}
            </Button>
          </Tooltip>

          {/* 视角设计 */}
          {renderPovPopover()}

          {/* 场景过渡 */}
          <Tooltip label={isZh ? '平滑过渡到新场景（单次）' : 'Scene transition (once)'} position="bottom">
            <Button
              variant={sceneTransitionOnce ? 'light' : 'subtle'}
              color={sceneTransitionOnce ? 'violet' : 'gray'}
              size="compact-xs"
              disabled={disabled}
              onClick={() => setSceneTransitionOnce(!sceneTransitionOnce)}
              leftSection={<IconMovie size={14} />}
              rightSection={
                <Badge size="xs" variant="light" color="violet" style={{ fontSize: '0.6rem' }}>
                  {isZh ? '单次' : '1x'}
                </Badge>
              }
              styles={{
                root: {
                  height: '26px',
                  paddingLeft: '6px',
                  paddingRight: '4px',
                  border: sceneTransitionOnce ? '1px solid rgba(168, 85, 247, 0.2)' : '1px solid transparent',
                },
                label: {
                  fontSize: '0.7rem',
                },
              }}
            >
              {isZh ? '场景过渡' : 'Scene'}
            </Button>
          </Tooltip>

          {/* 总状态指示 */}
          {totalActiveCount > 0 && (
            <Badge
              size="sm"
              variant="dot"
              color="blue"
              style={{ marginLeft: 'auto', flexShrink: 0 }}
            >
              {totalActiveCount} {isZh ? '项启用' : 'active'}
            </Badge>
          )}
        </Group>
      </Paper>
    </Box>
  )
}
