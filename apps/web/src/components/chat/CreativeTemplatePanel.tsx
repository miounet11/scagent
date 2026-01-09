/**
 * CreativeTemplatePanel - 创意模板面板组件
 *
 * 提供统一的创意模板选择入口：
 * - 剧情推进
 * - 视角设计
 * - 场景过渡
 *
 * 支持桌面和移动端不同布局
 */

'use client'

import { useState } from 'react'
import {
  Group,
  Button,
  Badge,
  Stack,
  Drawer,
  Text,
} from '@mantine/core'
import {
  IconBolt,
  IconEye,
  IconMovie,
  IconSparkles,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react'
import { useTranslation } from '@/lib/i18n'
import CreativeTemplateSelector from './CreativeTemplateSelector'
import {
  storyAdvanceTemplates,
  povTemplates,
  sceneTransitionTemplates,
} from '@/config/creativeTemplates'

// ====== Types ======
export interface CreativeTemplatePanelProps {
  /** 是否可用（需要角色和 onInsertSystemMessage） */
  enabled: boolean
  /** 是否移动端模式 */
  isMobile: boolean
  /** 插入系统消息的回调 */
  onInsertSystemMessage: (template: { title: string; content: string }) => Promise<void>
  /** 是否默认展开（移动端可折叠） */
  defaultExpanded?: boolean
}

// ====== Styles ======
const BUTTON_STYLES = {
  plot: {
    color: 'yellow',
    borderColor: 'rgba(251, 191, 36, 0.2)',
    Icon: IconBolt,
  },
  pov: {
    color: 'teal',
    borderColor: 'rgba(45, 212, 191, 0.2)',
    Icon: IconEye,
  },
  scene: {
    color: 'violet',
    borderColor: 'rgba(168, 85, 247, 0.2)',
    Icon: IconMovie,
  },
} as const

// ====== Component ======
export default function CreativeTemplatePanel({
  enabled,
  isMobile,
  onInsertSystemMessage,
  defaultExpanded = false,
}: CreativeTemplatePanelProps) {
  const { t } = useTranslation()

  // Template selector states
  const [storyTemplateOpen, setStoryTemplateOpen] = useState(false)
  const [povTemplateOpen, setPovTemplateOpen] = useState(false)
  const [sceneTemplateOpen, setSceneTemplateOpen] = useState(false)

  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)

  if (!enabled) return null

  // Desktop layout - horizontal buttons
  if (!isMobile) {
    return (
      <Group gap={4} px="xs">
        {/* 剧情推进按钮 */}
        <CreativeTemplateSelector
          templates={storyAdvanceTemplates}
          opened={storyTemplateOpen}
          onClose={() => setStoryTemplateOpen(false)}
          onSelect={onInsertSystemMessage}
          title={t('chat.creative.selectPlotTemplate') || '选择剧情推进模板'}
          target={
            <Button
              variant="subtle"
              color={BUTTON_STYLES.plot.color}
              size="xs"
              onClick={() => setStoryTemplateOpen(true)}
              leftSection={<BUTTON_STYLES.plot.Icon size={14} />}
              styles={{
                root: {
                  border: `1px solid ${BUTTON_STYLES.plot.borderColor}`,
                  height: '26px',
                  padding: '0 0.5rem',
                  fontSize: '0.7rem',
                  fontWeight: 'var(--font-medium)',
                  transition: '0.3s',
                },
              }}
            >
              {t('chat.creative.plot') || '剧情推进'}
            </Button>
          }
        />

        {/* 视角设计按钮 */}
        <CreativeTemplateSelector
          templates={povTemplates}
          opened={povTemplateOpen}
          onClose={() => setPovTemplateOpen(false)}
          onSelect={onInsertSystemMessage}
          title={t('chat.creative.selectPovTemplate') || '选择视角设计模板'}
          target={
            <Button
              variant="subtle"
              color={BUTTON_STYLES.pov.color}
              size="xs"
              onClick={() => setPovTemplateOpen(true)}
              leftSection={<BUTTON_STYLES.pov.Icon size={14} />}
              styles={{
                root: {
                  border: `1px solid ${BUTTON_STYLES.pov.borderColor}`,
                  height: '26px',
                  padding: '0 0.5rem',
                  fontSize: '0.7rem',
                  fontWeight: 'var(--font-medium)',
                  transition: '0.3s',
                },
              }}
            >
              {t('chat.creative.pov') || '视角设计'}
            </Button>
          }
        />

        {/* 场景过渡按钮 */}
        <CreativeTemplateSelector
          templates={sceneTransitionTemplates}
          opened={sceneTemplateOpen}
          onClose={() => setSceneTemplateOpen(false)}
          onSelect={onInsertSystemMessage}
          title={t('chat.creative.selectSceneTemplate') || '选择场景过渡模板'}
          target={
            <Button
              variant="subtle"
              color={BUTTON_STYLES.scene.color}
              size="xs"
              onClick={() => setSceneTemplateOpen(true)}
              leftSection={<BUTTON_STYLES.scene.Icon size={14} />}
              styles={{
                root: {
                  border: `1px solid ${BUTTON_STYLES.scene.borderColor}`,
                  height: '26px',
                  padding: '0 0.5rem',
                  fontSize: '0.7rem',
                  fontWeight: 'var(--font-medium)',
                  transition: '0.3s',
                },
              }}
            >
              {t('chat.creative.scene') || '场景过渡'}
            </Button>
          }
        />
      </Group>
    )
  }

  // Mobile layout - Drawer trigger
  return (
    <>
      <Badge
        variant="outline"
        color="violet"
        className="cursor-pointer touch-target"
        onClick={() => setDrawerOpen(true)}
        style={{
          fontSize: '0.7rem',
          cursor: 'pointer',
          minHeight: '26px',
          padding: '0 6px',
        }}
      >
        <Group gap={3}>
          <IconSparkles size={12} />
          {t('chat.buttons.creative') || '创意'}
          <IconChevronDown size={10} />
        </Group>
      </Badge>

      <Drawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        position="bottom"
        size="auto"
        title={
          <Group gap={6}>
            <IconSparkles size={18} className="text-violet-400" />
            <Text fw={600}>{t('chat.creative.title') || '创意工具箱'}</Text>
          </Group>
        }
        styles={{
          content: {
            background: 'hsl(var(--bg-overlay))',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
          },
          header: {
            background: 'transparent',
            borderBottom: '1px solid var(--border-muted)',
          },
          body: {
            padding: '1rem',
          }
        }}
      >
        <Stack gap="md">
          <CreativeTemplateSelector
            templates={storyAdvanceTemplates}
            opened={storyTemplateOpen}
            onClose={() => setStoryTemplateOpen(false)}
            onSelect={(template) => {
              onInsertSystemMessage(template)
              setDrawerOpen(false)
            }}
            title={t('chat.creative.selectPlotTemplate') || '选择剧情推进模板'}
            target={
              <Button
                fullWidth
                variant="light"
                color={BUTTON_STYLES.plot.color}
                onClick={() => setStoryTemplateOpen(true)}
                leftSection={<BUTTON_STYLES.plot.Icon size={20} />}
                justify="space-between"
                rightSection={<IconChevronDown size={16} />}
                styles={{
                  root: { height: '48px' },
                  label: { fontSize: '1rem' }
                }}
              >
                {t('chat.creative.plot') || '剧情推进'}
              </Button>
            }
          />

          <CreativeTemplateSelector
            templates={povTemplates}
            opened={povTemplateOpen}
            onClose={() => setPovTemplateOpen(false)}
            onSelect={(template) => {
              onInsertSystemMessage(template)
              setDrawerOpen(false)
            }}
            title={t('chat.creative.selectPovTemplate') || '选择视角设计模板'}
            target={
              <Button
                fullWidth
                variant="light"
                color={BUTTON_STYLES.pov.color}
                onClick={() => setPovTemplateOpen(true)}
                leftSection={<BUTTON_STYLES.pov.Icon size={20} />}
                justify="space-between"
                rightSection={<IconChevronDown size={16} />}
                styles={{
                  root: { height: '48px' },
                  label: { fontSize: '1rem' }
                }}
              >
                {t('chat.creative.pov') || '视角设计'}
              </Button>
            }
          />

          <CreativeTemplateSelector
            templates={sceneTransitionTemplates}
            opened={sceneTemplateOpen}
            onClose={() => setSceneTemplateOpen(false)}
            onSelect={(template) => {
              onInsertSystemMessage(template)
              setDrawerOpen(false)
            }}
            title={t('chat.creative.selectSceneTemplate') || '选择场景过渡模板'}
            target={
              <Button
                fullWidth
                variant="light"
                color={BUTTON_STYLES.scene.color}
                onClick={() => setSceneTemplateOpen(true)}
                leftSection={<BUTTON_STYLES.scene.Icon size={20} />}
                justify="space-between"
                rightSection={<IconChevronDown size={16} />}
                styles={{
                  root: { height: '48px' },
                  label: { fontSize: '1rem' }
                }}
              >
                {t('chat.creative.scene') || '场景过渡'}
              </Button>
            }
          />
        </Stack>
      </Drawer>
    </>
  )
}
