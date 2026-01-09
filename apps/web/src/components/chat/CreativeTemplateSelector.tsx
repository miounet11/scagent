/**
 * 创意模板选择器组件
 * 用于选择剧情推进、视角设计、场景过渡的预设模板
 */

import { useState, useEffect } from 'react'
import { Box, Stack, Text, UnstyledButton, Group, Popover, ActionIcon } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import type { CreativeTemplate } from '@/config/creativeTemplates'

interface CreativeTemplateSelectorProps {
  templates: CreativeTemplate[]
  opened: boolean
  onClose: () => void
  onSelect: (template: CreativeTemplate) => void
  target: React.ReactNode
  title?: string
}

export default function CreativeTemplateSelector({
  templates,
  opened,
  onClose,
  onSelect,
  target,
  title = '选择模板'
}: CreativeTemplateSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)

  // 键盘快捷键支持
  useEffect(() => {
    if (!opened) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // 数字键 1-5 选择对应模板
      if (e.key >= '1' && e.key <= '5') {
        const index = parseInt(e.key) - 1
        if (index < templates.length) {
          handleSelect(templates[index])
        }
        e.preventDefault()
      }
      // 上下箭头键导航
      else if (e.key === 'ArrowDown') {
        setSelectedIndex(prev => 
          prev < templates.length - 1 ? prev + 1 : prev
        )
        e.preventDefault()
      }
      else if (e.key === 'ArrowUp') {
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev)
        e.preventDefault()
      }
      // Enter 确认选择
      else if (e.key === 'Enter' && selectedIndex >= 0) {
        handleSelect(templates[selectedIndex])
        e.preventDefault()
      }
      // Escape 关闭
      else if (e.key === 'Escape') {
        onClose()
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [opened, templates, selectedIndex, onClose])

  const handleSelect = (template: CreativeTemplate) => {
    onSelect(template)
    onClose()
  }

  return (
    <Popover 
      opened={opened} 
      onClose={onClose}
      position="top"
      width={360}
      shadow="md"
      withinPortal
    >
      <Popover.Target>
        {target}
      </Popover.Target>
      
      <Popover.Dropdown p="xs">
        <Stack gap="xs">
          {/* 标题和关闭按钮 */}
          <Group justify="space-between" px="xs" py="4px">
            <Group gap="xs">
              <Text size="sm" fw={600} c="dimmed">
                {title}
              </Text>
              <Text size="xs" c="dimmed">
                按 1-5 快速选择
              </Text>
            </Group>
            <ActionIcon 
              variant="subtle" 
              color="gray" 
              size="sm"
              onClick={onClose}
              style={{ flexShrink: 0 }}
            >
              <IconX size={14} />
            </ActionIcon>
          </Group>

          {/* 模板列表 */}
          <Stack gap={4}>
            {templates.map((template, index) => (
              <UnstyledButton
                key={template.id}
                onClick={() => handleSelect(template)}
                onMouseEnter={() => setSelectedIndex(index)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--mantine-radius-md)',
                  backgroundColor: selectedIndex === index 
                    ? 'rgba(99, 102, 241, 0.1)' 
                    : 'transparent',
                  border: selectedIndex === index
                    ? '1px solid rgba(99, 102, 241, 0.3)'
                    : '1px solid transparent',
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                <Group gap="xs" wrap="nowrap">
                  {/* 序号和图标 */}
                  <Box
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: selectedIndex === index
                        ? 'rgba(99, 102, 241, 0.15)'
                        : 'rgba(var(--mantine-color-gray-light-rgb), 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {template.icon ? (
                      <Text size="lg">{template.icon}</Text>
                    ) : (
                      <Text size="sm" fw={600} c={selectedIndex === index ? 'indigo' : 'dimmed'}>
                        {index + 1}
                      </Text>
                    )}
                  </Box>

                  {/* 标题和描述 */}
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text 
                      size="sm" 
                      fw={500} 
                      c={selectedIndex === index ? 'indigo' : undefined}
                      style={{ lineHeight: 1.3 }}
                    >
                      {template.title}
                    </Text>
                    <Text 
                      size="xs" 
                      c="dimmed" 
                      lineClamp={2}
                      style={{ lineHeight: 1.4, marginTop: '2px' }}
                    >
                      {template.description}
                    </Text>
                  </Box>
                </Group>
              </UnstyledButton>
            ))}
          </Stack>

          {/* 提示文本 */}
          <Box pt="xs" style={{ borderTop: '1px solid var(--border-muted)' }}>
            <Text size="xs" c="dimmed" ta="center">
              系统消息将直接插入对话，对AI有更强约束力
            </Text>
            <Text size="xs" c="dimmed" ta="center" mt="xs" style={{ opacity: 0.7 }}>
              按 Esc 或点击 × 关闭
            </Text>
          </Box>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  )
}

