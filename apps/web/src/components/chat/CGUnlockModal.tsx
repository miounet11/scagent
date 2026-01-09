'use client'

/**
 * CG解锁弹窗组件
 *
 * 当用户达到亲密度里程碑时展示解锁的CG图片
 */

import { useState, useEffect, useRef, memo } from 'react'
import { Modal, Box, Text, Button, Group, ActionIcon, Badge, Transition } from '@mantine/core'
import { IconX, IconHeart, IconDownload, IconShare, IconSparkles } from '@tabler/icons-react'
import { DYNAMIC_IMAGE_CONFIG } from '@/lib/dynamicImage/config'

interface CGUnlockModalProps {
  opened: boolean
  onClose: () => void
  imageUrl: string
  characterName: string
  milestone?: number
  title?: string
  description?: string
  onDownload?: () => void
  onShare?: () => void
}

function CGUnlockModal({
  opened,
  onClose,
  imageUrl,
  characterName,
  milestone,
  title,
  description,
  onDownload,
  onShare,
}: CGUnlockModalProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)

  // 重置状态当弹窗打开时
  useEffect(() => {
    if (opened) {
      setIsImageLoaded(false)
      setShowContent(false)
    }
  }, [opened])

  // 图片加载完成后显示内容
  useEffect(() => {
    if (isImageLoaded) {
      const timer = setTimeout(() => setShowContent(true), 200)
      return () => clearTimeout(timer)
    }
  }, [isImageLoaded])

  const handleImageLoad = () => {
    setIsImageLoaded(true)
  }

  const handleDownload = async () => {
    if (!imageUrl) return

    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${characterName}-cg-${milestone || 'special'}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      onDownload?.()
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      centered
      withCloseButton={false}
      padding={0}
      radius="lg"
      overlayProps={{
        backgroundOpacity: 0.85,
        blur: 8,
      }}
      transitionProps={{
        transition: 'scale',
        duration: DYNAMIC_IMAGE_CONFIG.cgUnlockAnimationMs,
      }}
      styles={{
        content: {
          background: 'transparent',
          boxShadow: 'none',
          overflow: 'visible',
        },
        body: {
          padding: 0,
        },
      }}
    >
      <Box
        style={{
          position: 'relative',
          borderRadius: 16,
          overflow: 'hidden',
          background: 'hsl(var(--bg-card))',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* 关闭按钮 */}
        <ActionIcon
          variant="filled"
          size="lg"
          radius="xl"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 20,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <IconX size={18} />
        </ActionIcon>

        {/* 解锁提示 - 顶部 */}
        <Transition mounted={showContent} transition="slide-down" duration={300}>
          {(styles) => (
            <Box
              style={{
                ...styles,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                padding: '16px 60px 16px 16px',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
                zIndex: 10,
              }}
            >
              <Group gap="xs">
                <IconSparkles size={20} style={{ color: '#fbbf24' }} />
                <Text size="lg" fw={700} c="white">
                  {title || `恭喜解锁新CG!`}
                </Text>
                {milestone && (
                  <Badge variant="filled" color="pink" size="sm">
                    亲密度 {milestone}
                  </Badge>
                )}
              </Group>
            </Box>
          )}
        </Transition>

        {/* CG图片 */}
        <Box
          style={{
            position: 'relative',
            width: '100%',
            maxHeight: '70vh',
            overflow: 'hidden',
          }}
        >
          {/* 加载动画 */}
          {!isImageLoaded && (
            <Box
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'hsl(var(--bg-primary))',
              }}
            >
              <Box className="cg-loading-animation">
                <IconHeart size={48} style={{ color: '#ec4899', animation: 'pulse 1.5s infinite' }} />
              </Box>
            </Box>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt={`${characterName} CG`}
            onLoad={handleImageLoad}
            style={{
              width: '100%',
              maxHeight: '70vh',
              objectFit: 'contain',
              opacity: isImageLoaded ? 1 : 0,
              transition: 'opacity 0.5s ease',
            }}
          />

          {/* 光效装饰 */}
          <Box
            className="cg-sparkle-overlay"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: 'radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.1) 0%, transparent 50%)',
              opacity: showContent ? 1 : 0,
              transition: 'opacity 0.5s ease',
            }}
          />
        </Box>

        {/* 底部信息区 */}
        <Transition mounted={showContent} transition="slide-up" duration={300}>
          {(styles) => (
            <Box
              style={{
                ...styles,
                padding: '16px 20px',
                background: 'hsl(var(--bg-card))',
                borderTop: '1px solid hsl(var(--border-muted))',
              }}
            >
              <Group justify="space-between" align="flex-start">
                <Box style={{ flex: 1 }}>
                  <Group gap="xs" mb={4}>
                    <IconHeart size={16} style={{ color: '#ec4899' }} fill="#ec4899" />
                    <Text size="sm" fw={600}>{characterName}</Text>
                  </Group>
                  {description && (
                    <Text size="xs" c="dimmed" lineClamp={2}>
                      {description}
                    </Text>
                  )}
                </Box>

                <Group gap="xs">
                  <ActionIcon
                    variant="light"
                    size="lg"
                    onClick={handleDownload}
                    title="下载图片"
                  >
                    <IconDownload size={18} />
                  </ActionIcon>
                  {onShare && (
                    <ActionIcon
                      variant="light"
                      size="lg"
                      onClick={onShare}
                      title="分享"
                    >
                      <IconShare size={18} />
                    </ActionIcon>
                  )}
                  <Button
                    variant="gradient"
                    gradient={{ from: 'pink', to: 'grape' }}
                    size="sm"
                    onClick={onClose}
                  >
                    继续对话
                  </Button>
                </Group>
              </Group>
            </Box>
          )}
        </Transition>
      </Box>

      {/* 粒子效果 */}
      {showContent && <SparkleParticles />}
    </Modal>
  )
}

// 粒子效果组件
function SparkleParticles() {
  return (
    <Box
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 1000,
      }}
    >
      {Array.from({ length: 20 }).map((_, i) => (
        <Box
          key={i}
          className="sparkle-particle"
          style={{
            position: 'absolute',
            width: 4 + Math.random() * 4,
            height: 4 + Math.random() * 4,
            background: `hsl(${330 + Math.random() * 30}, 80%, ${60 + Math.random() * 20}%)`,
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `sparkle-float ${2 + Math.random() * 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
            opacity: 0.6 + Math.random() * 0.4,
          }}
        />
      ))}
    </Box>
  )
}

export default memo(CGUnlockModal)

// 添加必要的CSS动画到globals.css中的样式
export const CG_UNLOCK_STYLES = `
@keyframes sparkle-float {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0;
  }
  50% {
    transform: translateY(-20px) scale(1.2);
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.cg-loading-animation {
  display: flex;
  align-items: center;
  justify-content: center;
}

.sparkle-particle {
  box-shadow: 0 0 6px currentColor;
}
`
