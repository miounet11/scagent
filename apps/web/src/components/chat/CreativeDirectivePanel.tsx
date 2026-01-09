/**
 * 创意指令面板组件
 *
 * v15.0 新增
 * 提供创意指令的快捷预设和详细配置
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  Paper,
  Group,
  Stack,
  Text,
  Button,
  ActionIcon,
  Tooltip,
  Collapse,
  Badge,
  SegmentedControl,
  Switch,
  Divider,
  Box,
  rem,
} from '@mantine/core'
import {
  IconSparkles,
  IconChevronDown,
  IconChevronUp,
  IconX,
  IconBrain,
  IconWalk,
  IconMountain,
  IconShirt,
  // 🎬 v20.5: IconMessageCircle 已移除（interactiveChoices 废弃）
  IconMoodHappy,
  IconPlayerPause,
  IconPlayerPlay,
  IconQuestionMark,
  IconArrowBack,
  IconHeart,
} from '@tabler/icons-react'
import {
  useCreativeStore,
  type DirectivePreset,
  type CreativeDirectives,
  PRESET_METADATA,
  DIRECTIVE_METADATA,
} from '@/stores/creativeStore'

interface CreativeDirectivePanelProps {
  /** 是否使用紧凑模式 */
  compact?: boolean
  /** 语言 */
  locale?: string
}

/**
 * 预设按钮组件
 */
function PresetButton({
  preset,
  isActive,
  onClick,
  locale,
}: {
  preset: DirectivePreset
  isActive: boolean
  onClick: () => void
  locale?: string
}) {
  const meta = PRESET_METADATA[preset]
  const isZh = locale?.startsWith('zh') ?? true

  return (
    <Tooltip label={isZh ? meta.description : meta.descriptionEn} position="top">
      <Button
        variant={isActive ? 'filled' : 'light'}
        color={isActive ? 'blue' : 'gray'}
        size="xs"
        leftSection={<span>{meta.icon}</span>}
        onClick={onClick}
      >
        {isZh ? meta.name : meta.nameEn}
      </Button>
    </Tooltip>
  )
}

/**
 * 指令开关组件
 */
function DirectiveSwitch({
  directiveKey,
  value,
  onChange,
  locale,
}: {
  directiveKey: keyof CreativeDirectives
  value: boolean
  onChange: (v: boolean) => void
  locale?: string
}) {
  const meta = DIRECTIVE_METADATA[directiveKey]
  const isZh = locale?.startsWith('zh') ?? true

  // 图标映射
  const iconMap: Record<string, React.ReactNode> = {
    psychologyFocus: <IconBrain size={16} />,
    actionFocus: <IconWalk size={16} />,
    environmentFocus: <IconMountain size={16} />,
    appearanceFocus: <IconShirt size={16} />,
    // 🎬 v20.5: interactiveChoices 已移除
    emotionTagging: <IconMoodHappy size={16} />,
    slowPacing: <IconPlayerPause size={16} />,
    fastPacing: <IconPlayerPlay size={16} />,
    cliffhangerOnce: <IconQuestionMark size={16} />,
    flashbackOnce: <IconArrowBack size={16} />,
    innerMonologueOnce: <IconBrain size={16} />,
    romanticMomentOnce: <IconHeart size={16} />,
  }

  return (
    <Group justify="space-between" wrap="nowrap">
      <Group gap="xs" wrap="nowrap">
        {iconMap[directiveKey] || <IconSparkles size={16} />}
        <Box>
          <Text size="sm" fw={500}>
            {isZh ? meta.name : meta.nameEn}
            {meta.isOneShot && (
              <Badge size="xs" color="orange" ml={4}>
                {isZh ? '单次' : 'Once'}
              </Badge>
            )}
          </Text>
          <Text size="xs" c="dimmed">
            {isZh ? meta.description : meta.descriptionEn}
          </Text>
        </Box>
      </Group>
      <Switch
        checked={value}
        onChange={(e) => onChange(e.currentTarget.checked)}
        size="sm"
      />
    </Group>
  )
}

/**
 * 创意指令面板
 */
export function CreativeDirectivePanel({
  compact = false,
  locale,
}: CreativeDirectivePanelProps) {
  const [expanded, setExpanded] = useState(false)
  const isZh = locale?.startsWith('zh') ?? true

  // Store state
  const {
    activePreset,
    applyPreset,
    // 内容丰富度
    detailedDescription,
    setDetailedDescription,
    psychologyFocus,
    setPsychologyFocus,
    actionFocus,
    setActionFocus,
    environmentFocus,
    setEnvironmentFocus,
    appearanceFocus,
    setAppearanceFocus,
    // 互动模式
    // 🎬 v20.5: interactiveChoices 已移除，由 Director 系统处理
    emotionTagging,
    setEmotionTagging,
    // 节奏控制
    slowPacing,
    setSlowPacing,
    fastPacing,
    setFastPacing,
    // 特殊效果
    cliffhangerOnce,
    setCliffhangerOnce,
    flashbackOnce,
    setFlashbackOnce,
    innerMonologueOnce,
    setInnerMonologueOnce,
    romanticMomentOnce,
    setRomanticMomentOnce,
    // 通用
    clearAll,
    getActiveDirectives,
  } = useCreativeStore()

  // 计算启用的指令数量
  const activeCount = useMemo(() => {
    const directives = getActiveDirectives()
    return Object.keys(directives).length
  }, [
    detailedDescription,
    psychologyFocus,
    actionFocus,
    environmentFocus,
    appearanceFocus,
    // 🎬 v20.5: interactiveChoices 已移除
    emotionTagging,
    slowPacing,
    fastPacing,
    cliffhangerOnce,
    flashbackOnce,
    innerMonologueOnce,
    romanticMomentOnce,
    getActiveDirectives,
  ])

  // 预设列表
  const presets: DirectivePreset[] = ['none', 'immersive', 'dramatic', 'romantic', 'action', 'mystery']

  if (compact) {
    // 紧凑模式：只显示预设按钮
    return (
      <Paper p="xs" withBorder radius="md">
        <Group gap="xs" wrap="wrap">
          <Tooltip label={isZh ? '创意指令' : 'Creative Directives'}>
            <ActionIcon variant="subtle" color="blue">
              <IconSparkles size={16} />
            </ActionIcon>
          </Tooltip>
          {presets.slice(1).map((preset) => (
            <PresetButton
              key={preset}
              preset={preset}
              isActive={activePreset === preset}
              onClick={() => applyPreset(preset)}
              locale={locale}
            />
          ))}
          {activeCount > 0 && (
            <Badge color="blue" variant="light">
              {activeCount}
            </Badge>
          )}
        </Group>
      </Paper>
    )
  }

  return (
    <Paper p="sm" withBorder radius="md">
      <Stack gap="sm">
        {/* 标题行 */}
        <Group justify="space-between">
          <Group gap="xs">
            <IconSparkles size={18} color="var(--mantine-color-blue-6)" />
            <Text fw={600} size="sm">
              {isZh ? '创意指令' : 'Creative Directives'}
            </Text>
            {activeCount > 0 && (
              <Badge color="blue" variant="light" size="sm">
                {activeCount} {isZh ? '个启用' : 'active'}
              </Badge>
            )}
          </Group>
          <Group gap="xs">
            {activeCount > 0 && (
              <Tooltip label={isZh ? '清除全部' : 'Clear All'}>
                <ActionIcon variant="subtle" color="gray" size="sm" onClick={clearAll}>
                  <IconX size={14} />
                </ActionIcon>
              </Tooltip>
            )}
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
            </ActionIcon>
          </Group>
        </Group>

        {/* 预设按钮 */}
        <Group gap="xs" wrap="wrap">
          {presets.map((preset) => (
            <PresetButton
              key={preset}
              preset={preset}
              isActive={activePreset === preset}
              onClick={() => applyPreset(preset)}
              locale={locale}
            />
          ))}
        </Group>

        {/* 展开的详细设置 */}
        <Collapse in={expanded}>
          <Stack gap="md" mt="sm">
            {/* 内容丰富度 */}
            <Box>
              <Text size="xs" c="dimmed" fw={500} mb="xs">
                {isZh ? '📝 内容丰富度' : '📝 Content Richness'}
              </Text>
              <Stack gap="xs">
                <DirectiveSwitch
                  directiveKey="detailedDescription"
                  value={detailedDescription}
                  onChange={setDetailedDescription}
                  locale={locale}
                />
                <DirectiveSwitch
                  directiveKey="psychologyFocus"
                  value={psychologyFocus}
                  onChange={setPsychologyFocus}
                  locale={locale}
                />
                <DirectiveSwitch
                  directiveKey="actionFocus"
                  value={actionFocus}
                  onChange={setActionFocus}
                  locale={locale}
                />
                <DirectiveSwitch
                  directiveKey="environmentFocus"
                  value={environmentFocus}
                  onChange={setEnvironmentFocus}
                  locale={locale}
                />
                <DirectiveSwitch
                  directiveKey="appearanceFocus"
                  value={appearanceFocus}
                  onChange={setAppearanceFocus}
                  locale={locale}
                />
              </Stack>
            </Box>

            <Divider />

            {/* 互动模式 */}
            <Box>
              <Text size="xs" c="dimmed" fw={500} mb="xs">
                {isZh ? '💬 互动模式' : '💬 Interaction Mode'}
              </Text>
              <Stack gap="xs">
                {/* 🎬 v20.5: interactiveChoices 已移除，由 Director 系统处理 */}
                <DirectiveSwitch
                  directiveKey="emotionTagging"
                  value={emotionTagging}
                  onChange={setEmotionTagging}
                  locale={locale}
                />
              </Stack>
            </Box>

            <Divider />

            {/* 节奏控制 */}
            <Box>
              <Text size="xs" c="dimmed" fw={500} mb="xs">
                {isZh ? '⏱️ 节奏控制' : '⏱️ Pacing Control'}
              </Text>
              <Stack gap="xs">
                <DirectiveSwitch
                  directiveKey="slowPacing"
                  value={slowPacing}
                  onChange={setSlowPacing}
                  locale={locale}
                />
                <DirectiveSwitch
                  directiveKey="fastPacing"
                  value={fastPacing}
                  onChange={setFastPacing}
                  locale={locale}
                />
              </Stack>
            </Box>

            <Divider />

            {/* 特殊效果 */}
            <Box>
              <Text size="xs" c="dimmed" fw={500} mb="xs">
                {isZh ? '✨ 特殊效果（单次生效）' : '✨ Special Effects (One-time)'}
              </Text>
              <Stack gap="xs">
                <DirectiveSwitch
                  directiveKey="cliffhangerOnce"
                  value={cliffhangerOnce}
                  onChange={setCliffhangerOnce}
                  locale={locale}
                />
                <DirectiveSwitch
                  directiveKey="flashbackOnce"
                  value={flashbackOnce}
                  onChange={setFlashbackOnce}
                  locale={locale}
                />
                <DirectiveSwitch
                  directiveKey="innerMonologueOnce"
                  value={innerMonologueOnce}
                  onChange={setInnerMonologueOnce}
                  locale={locale}
                />
                <DirectiveSwitch
                  directiveKey="romanticMomentOnce"
                  value={romanticMomentOnce}
                  onChange={setRomanticMomentOnce}
                  locale={locale}
                />
              </Stack>
            </Box>
          </Stack>
        </Collapse>
      </Stack>
    </Paper>
  )
}

/**
 * 创意指令快捷按钮（用于聊天输入区域）
 */
export function CreativeDirectiveQuickButton({
  locale,
  onClick,
}: {
  locale?: string
  onClick?: () => void
}) {
  const isZh = locale?.startsWith('zh') ?? true
  const { getActiveDirectives, activePreset } = useCreativeStore()

  const activeCount = useMemo(() => {
    const directives = getActiveDirectives()
    return Object.keys(directives).length
  }, [getActiveDirectives])

  const meta = PRESET_METADATA[activePreset]

  return (
    <Tooltip
      label={
        activePreset !== 'none'
          ? `${isZh ? meta.name : meta.nameEn}: ${isZh ? meta.description : meta.descriptionEn}`
          : isZh
          ? '点击配置创意指令'
          : 'Click to configure creative directives'
      }
      position="top"
    >
      <Button
        variant={activeCount > 0 ? 'light' : 'subtle'}
        color={activeCount > 0 ? 'blue' : 'gray'}
        size="xs"
        leftSection={<IconSparkles size={14} />}
        rightSection={
          activeCount > 0 ? (
            <Badge size="xs" variant="filled" color="blue">
              {activeCount}
            </Badge>
          ) : null
        }
        onClick={onClick}
      >
        {activePreset !== 'none' ? (
          <>
            <span>{meta.icon}</span>
            <Text size="xs" ml={4}>
              {isZh ? meta.name : meta.nameEn}
            </Text>
          </>
        ) : (
          <Text size="xs">{isZh ? '创意指令' : 'Directives'}</Text>
        )}
      </Button>
    </Tooltip>
  )
}

export default CreativeDirectivePanel
