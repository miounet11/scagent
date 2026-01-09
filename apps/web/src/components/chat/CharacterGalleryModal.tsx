'use client'

/**
 * 角色相册弹窗
 *
 * 展示角色的所有素材：立绘、表情、场景、CG等
 * 支持按类型筛选、大图预览、解锁状态显示
 */

import { useState, useEffect, useMemo, memo } from 'react'
import {
  Modal,
  Box,
  Tabs,
  SimpleGrid,
  Image,
  Text,
  Badge,
  Group,
  ActionIcon,
  Loader,
  Stack,
  Paper,
  Tooltip,
} from '@mantine/core'
import { IconX, IconLock, IconHeart, IconPhoto, IconMoodSmile, IconMovie, IconStar } from '@tabler/icons-react'
import { useDynamicImage, type CharacterAsset } from '@/lib/dynamicImage/useDynamicImage'

interface CharacterGalleryModalProps {
  opened: boolean
  onClose: () => void
  characterId: string
  characterName: string
  charType?: 'character' | 'community'
  userId?: string
  intimacyLevel?: number
}

type AssetCategory = 'all' | 'expression' | 'scene' | 'cg'

function CharacterGalleryModal({
  opened,
  onClose,
  characterId,
  characterName,
  charType = 'community',
  userId,
  intimacyLevel = 0,
}: CharacterGalleryModalProps) {
  const [activeTab, setActiveTab] = useState<AssetCategory>('all')
  const [selectedImage, setSelectedImage] = useState<(CharacterAsset & { assetType: string }) | null>(null)

  // 获取角色素材
  const {
    availableExpressions,
    availableScenes,
    availableCGs,
    isLoading,
    hasAssets,
  } = useDynamicImage({
    characterId,
    charType,
    userId,
    enabled: opened,
  })

  // 按分类过滤素材
  const filteredAssets = useMemo(() => {
    const allAssets: (CharacterAsset & { assetType: string })[] = [
      ...availableExpressions.map(e => ({ ...e, assetType: 'expression' })),
      ...availableScenes.map(s => ({ ...s, assetType: 'scene' })),
      ...availableCGs.map(c => ({ ...c, assetType: 'cg' })),
    ]

    if (activeTab === 'all') return allAssets
    return allAssets.filter(a => a.assetType === activeTab)
  }, [availableExpressions, availableScenes, availableCGs, activeTab])

  // 检查是否已解锁
  const isUnlocked = (asset: CharacterAsset) => {
    const required = asset.intimacyRequired || 0
    return intimacyLevel >= required
  }

  // 获取分类数量
  const getCategoryCount = (category: AssetCategory) => {
    if (category === 'all') {
      return availableExpressions.length + availableScenes.length + availableCGs.length
    }
    if (category === 'expression') return availableExpressions.length
    if (category === 'scene') return availableScenes.length
    if (category === 'cg') return availableCGs.length
    return 0
  }

  // 获取类型图标
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'expression':
        return <IconMoodSmile size={14} />
      case 'scene':
        return <IconPhoto size={14} />
      case 'cg':
        return <IconStar size={14} />
      default:
        return <IconPhoto size={14} />
    }
  }

  // 获取类型颜色
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'expression':
        return 'blue'
      case 'scene':
        return 'green'
      case 'cg':
        return 'pink'
      default:
        return 'gray'
    }
  }

  return (
    <>
      {/* 主相册弹窗 */}
      <Modal
        opened={opened && !selectedImage}
        onClose={onClose}
        title={
          <Group gap="sm">
            <IconPhoto size={20} />
            <Text fw={600}>{characterName} 的相册</Text>
          </Group>
        }
        size="xl"
        padding="lg"
        styles={{
          content: {
            background: 'hsl(var(--bg-card))',
          },
          header: {
            background: 'hsl(var(--bg-card))',
            borderBottom: '1px solid hsl(var(--border-muted))',
          },
        }}
      >
        {/* 亲密度显示 */}
        <Paper p="sm" mb="md" withBorder radius="md" style={{ background: 'hsl(var(--bg-elevated))' }}>
          <Group justify="space-between">
            <Group gap="xs">
              <IconHeart size={16} style={{ color: '#ec4899' }} />
              <Text size="sm">当前亲密度</Text>
            </Group>
            <Badge color="pink" variant="light" size="lg">
              {intimacyLevel}
            </Badge>
          </Group>
        </Paper>

        {/* 分类标签页 */}
        <Tabs value={activeTab} onChange={value => setActiveTab((value || 'all') as AssetCategory)}>
          <Tabs.List mb="md">
            <Tabs.Tab value="all" leftSection={<IconPhoto size={14} />}>
              全部 ({getCategoryCount('all')})
            </Tabs.Tab>
            <Tabs.Tab value="expression" leftSection={<IconMoodSmile size={14} />}>
              表情 ({getCategoryCount('expression')})
            </Tabs.Tab>
            <Tabs.Tab value="scene" leftSection={<IconMovie size={14} />}>
              场景 ({getCategoryCount('scene')})
            </Tabs.Tab>
            <Tabs.Tab value="cg" leftSection={<IconStar size={14} />}>
              CG ({getCategoryCount('cg')})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value={activeTab}>
            {isLoading ? (
              <Box style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Loader size="lg" />
              </Box>
            ) : !hasAssets || filteredAssets.length === 0 ? (
              <Stack align="center" gap="md" py="xl">
                <IconPhoto size={48} style={{ opacity: 0.3 }} />
                <Text c="dimmed" size="sm">
                  {activeTab === 'all' ? '暂无素材' : `暂无${activeTab === 'expression' ? '表情' : activeTab === 'scene' ? '场景' : 'CG'}素材`}
                </Text>
              </Stack>
            ) : (
              <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="md">
                {filteredAssets.map((asset, index) => {
                  const unlocked = isUnlocked(asset)
                  const required = (asset as any).intimacyRequired || 0

                  return (
                    <Tooltip
                      key={asset.id || index}
                      label={unlocked ? asset.category : `需要亲密度 ${required}`}
                      position="top"
                    >
                      <Paper
                        radius="md"
                        style={{
                          overflow: 'hidden',
                          cursor: unlocked ? 'pointer' : 'not-allowed',
                          position: 'relative',
                          aspectRatio: '1',
                          background: 'hsl(var(--bg-elevated))',
                        }}
                        onClick={() => unlocked && setSelectedImage(asset)}
                      >
                        {/* 图片 */}
                        <Image
                          src={unlocked ? (asset.thumbnail || asset.url) : undefined}
                          alt={asset.category || '素材'}
                          fit="cover"
                          style={{
                            width: '100%',
                            height: '100%',
                            filter: unlocked ? 'none' : 'blur(10px) brightness(0.5)',
                          }}
                          fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23333' width='100' height='100'/%3E%3C/svg%3E"
                        />

                        {/* 锁定覆盖层 */}
                        {!unlocked && (
                          <Box
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(0, 0, 0, 0.6)',
                            }}
                          >
                            <IconLock size={24} style={{ color: '#9ca3af', marginBottom: 4 }} />
                            <Group gap={4}>
                              <IconHeart size={12} style={{ color: '#ec4899' }} />
                              <Text size="xs" c="dimmed">{required}</Text>
                            </Group>
                          </Box>
                        )}

                        {/* 类型标签 */}
                        <Badge
                          size="xs"
                          color={getTypeColor(asset.assetType)}
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                          }}
                          leftSection={getTypeIcon(asset.assetType)}
                        >
                          {asset.category || asset.assetType}
                        </Badge>
                      </Paper>
                    </Tooltip>
                  )
                })}
              </SimpleGrid>
            )}
          </Tabs.Panel>
        </Tabs>
      </Modal>

      {/* 大图预览弹窗 */}
      <Modal
        opened={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        size="auto"
        padding={0}
        withCloseButton={false}
        styles={{
          content: {
            background: 'transparent',
            boxShadow: 'none',
          },
          body: {
            padding: 0,
          },
        }}
      >
        <Box style={{ position: 'relative' }}>
          {/* 关闭按钮 */}
          <ActionIcon
            variant="filled"
            color="dark"
            size="lg"
            radius="xl"
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 10,
            }}
            onClick={() => setSelectedImage(null)}
          >
            <IconX size={18} />
          </ActionIcon>

          {/* 大图 */}
          {selectedImage && (
            <Image
              src={selectedImage.url}
              alt={selectedImage.category || '素材'}
              fit="contain"
              style={{
                maxWidth: '90vw',
                maxHeight: '85vh',
                borderRadius: 12,
              }}
            />
          )}

          {/* 图片信息 */}
          {selectedImage && (
            <Paper
              p="sm"
              radius="md"
              style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                right: 8,
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Group justify="space-between">
                <Text size="sm" fw={500} c="white">
                  {selectedImage.category || '素材'}
                </Text>
                {(selectedImage as any).intimacyRequired > 0 && (
                  <Group gap={4}>
                    <IconHeart size={14} style={{ color: '#ec4899' }} />
                    <Text size="xs" c="dimmed">
                      亲密度 {(selectedImage as any).intimacyRequired}
                    </Text>
                  </Group>
                )}
              </Group>
            </Paper>
          )}
        </Box>
      </Modal>
    </>
  )
}

export default memo(CharacterGalleryModal)
