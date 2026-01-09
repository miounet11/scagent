'use client'
/**
 * MobileRelationDrawer - 移动端关系抽屉组件
 *
 * 特性：
 * - 底部抽屉形式
 * - 上滑展开
 * - 显示关系进度、故事、设置三个Tab
 * - 单手操作友好
 */

import { memo, useState } from 'react'
import { Box, Text, Group, Stack, Progress, Badge, Tabs, ScrollArea } from '@mantine/core'
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion'
import {
  IconHeart,
  IconBook,
  IconSettings,
  IconChevronUp,
  IconSparkles,
  IconHistory,
} from '@tabler/icons-react'

// 羁绊等级配置
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

interface RecentInteraction {
  id: string
  content: string
  timestamp: string
  emotion?: string
}

interface MobileRelationDrawerProps {
  /** 是否展开 */
  isOpen: boolean
  /** 切换展开状态 */
  onToggle: () => void
  /** 关闭回调 */
  onClose: () => void
  /** 角色名称 */
  characterName?: string
  /** 羁绊经验值 */
  bondExp?: number
  /** 当前情绪 */
  currentEmotion?: string
  /** 最近互动记录 */
  recentInteractions?: RecentInteraction[]
  /** 打开设置回调 */
  onOpenSettings?: () => void
}

function MobileRelationDrawer({
  isOpen,
  onToggle,
  onClose,
  characterName = '角色',
  bondExp = 0,
  currentEmotion = 'neutral',
  recentInteractions = [],
  onOpenSettings,
}: MobileRelationDrawerProps) {
  const [activeTab, setActiveTab] = useState<string>('progress')
  const dragControls = useDragControls()

  // 计算当前羁绊等级
  const getCurrentBondLevel = () => {
    for (let i = BOND_LEVELS.length - 1; i >= 0; i--) {
      if (bondExp >= BOND_LEVELS[i].minExp) {
        return BOND_LEVELS[i]
      }
    }
    return BOND_LEVELS[0]
  }

  // 计算下一等级进度
  const getProgress = () => {
    const current = getCurrentBondLevel()
    const currentIndex = BOND_LEVELS.findIndex(l => l.level === current.level)
    const next = BOND_LEVELS[currentIndex + 1]

    if (!next) return 100 // Max level

    const expInLevel = bondExp - current.minExp
    const expNeeded = next.minExp - current.minExp
    return Math.min(100, Math.round((expInLevel / expNeeded) * 100))
  }

  const bondLevel = getCurrentBondLevel()
  const progress = getProgress()

  // 处理拖拽结束
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100) {
      onClose()
    }
  }

  return (
    <>
      {/* 上滑手柄 - 始终显示 */}
      {!isOpen && (
        <motion.div
          onClick={onToggle}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent)',
            cursor: 'pointer',
            zIndex: 90,
          }}
        >
          <Box
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.3)',
              marginBottom: 4,
            }}
          />
          <Group gap={4}>
            <IconChevronUp size={12} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
            <Text size="xs" c="dimmed">关系面板</Text>
          </Group>
        </motion.div>
      )}

      {/* 抽屉内容 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 背景遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 99,
              }}
            />

            {/* 抽屉面板 */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              drag="y"
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                maxHeight: '70vh',
                background: 'rgba(15, 15, 20, 0.98)',
                backdropFilter: 'blur(20px)',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              {/* 拖拽手柄 */}
              <Box
                onPointerDown={(e) => dragControls.start(e)}
                style={{
                  padding: '12px 0 8px',
                  display: 'flex',
                  justifyContent: 'center',
                  cursor: 'grab',
                }}
              >
                <Box
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.3)',
                  }}
                />
              </Box>

              {/* Tab 导航 */}
              <Box px="md" pb="xs">
                <Tabs value={activeTab} onChange={(val) => setActiveTab(val || 'progress')}>
                  <Tabs.List grow>
                    <Tabs.Tab
                      value="progress"
                      leftSection={<IconHeart size={14} />}
                      style={{ fontSize: 13 }}
                    >
                      进度
                    </Tabs.Tab>
                    <Tabs.Tab
                      value="story"
                      leftSection={<IconBook size={14} />}
                      style={{ fontSize: 13 }}
                    >
                      故事
                    </Tabs.Tab>
                    <Tabs.Tab
                      value="settings"
                      leftSection={<IconSettings size={14} />}
                      style={{ fontSize: 13 }}
                    >
                      设置
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs>
              </Box>

              {/* Tab 内容 */}
              <ScrollArea style={{ height: 'calc(70vh - 100px)' }} px="md" pb="xl">
                {/* 进度 Tab */}
                {activeTab === 'progress' && (
                  <Stack gap="md">
                    {/* 羁绊等级卡片 */}
                    <Box
                      style={{
                        padding: '16px',
                        borderRadius: '14px',
                        background: `linear-gradient(135deg, ${bondLevel.color}20, transparent)`,
                        border: `1px solid ${bondLevel.color}40`,
                      }}
                    >
                      <Group justify="space-between" mb="md">
                        <Group gap="sm">
                          <Text style={{ fontSize: 32 }}>{bondLevel.icon}</Text>
                          <div>
                            <Text size="xs" c="dimmed">与 {characterName} 的羁绊</Text>
                            <Text size="lg" fw={700} style={{ color: bondLevel.color }}>
                              {bondLevel.name}
                            </Text>
                          </div>
                        </Group>
                        <Badge
                          size="lg"
                          variant="light"
                          color={bondLevel.color}
                          leftSection={<IconSparkles size={12} />}
                        >
                          Lv.{bondLevel.level}
                        </Badge>
                      </Group>

                      {/* 进度条 */}
                      <Box>
                        <Group justify="space-between" mb={4}>
                          <Text size="xs" c="dimmed">升级进度</Text>
                          <Text size="xs" fw={500} style={{ color: bondLevel.color }}>
                            {progress}%
                          </Text>
                        </Group>
                        <Progress
                          value={progress}
                          size="md"
                          radius="xl"
                          styles={{
                            root: { background: 'rgba(255, 255, 255, 0.1)' },
                            section: {
                              background: `linear-gradient(90deg, ${bondLevel.color}, ${bondLevel.color}dd)`,
                            },
                          }}
                        />
                        <Text size="xs" c="dimmed" ta="center" mt="xs">
                          {bondExp.toLocaleString()} / {BOND_LEVELS[bondLevel.level]?.minExp.toLocaleString() || '∞'} EXP
                        </Text>
                      </Box>
                    </Box>

                    {/* 最近互动 */}
                    <Box>
                      <Group gap="xs" mb="sm">
                        <IconHistory size={14} style={{ color: '#9ca3af' }} />
                        <Text size="sm" fw={500} c="dimmed">最近互动</Text>
                      </Group>
                      {recentInteractions.length > 0 ? (
                        <Stack gap="xs">
                          {recentInteractions.slice(0, 3).map((interaction) => (
                            <Box
                              key={interaction.id}
                              style={{
                                padding: '10px 12px',
                                borderRadius: '8px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                              }}
                            >
                              <Text size="xs" lineClamp={2} c="gray.4">
                                {interaction.content}
                              </Text>
                              <Text size="xs" c="dimmed" mt={4}>
                                {interaction.timestamp}
                              </Text>
                            </Box>
                          ))}
                        </Stack>
                      ) : (
                        <Text size="xs" c="dimmed" ta="center" py="md">
                          暂无互动记录
                        </Text>
                      )}
                    </Box>
                  </Stack>
                )}

                {/* 故事 Tab */}
                {activeTab === 'story' && (
                  <Stack gap="md">
                    <Text size="sm" c="dimmed" ta="center" py="xl">
                      故事里程碑功能即将推出...
                    </Text>
                  </Stack>
                )}

                {/* 设置 Tab */}
                {activeTab === 'settings' && (
                  <Stack gap="md">
                    <Box
                      onClick={onOpenSettings}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: 'pointer',
                      }}
                    >
                      <Group justify="space-between">
                        <Group gap="sm">
                          <IconSettings size={18} style={{ color: '#9ca3af' }} />
                          <Text size="sm" c="white">打开完整设置</Text>
                        </Group>
                        <Text size="xs" c="dimmed">→</Text>
                      </Group>
                    </Box>
                  </Stack>
                )}
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default memo(MobileRelationDrawer)
