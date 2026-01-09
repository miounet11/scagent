'use client'

/**
 * CGReveal - CG 全屏展示组件
 *
 * 功能:
 * - 全屏展示 CG 图片
 * - 解锁动画效果
 * - 点击关闭或查看画廊
 * - 支持新解锁提示
 */

import { useState, useCallback, memo, useEffect } from 'react'
import { Box, Text, ActionIcon, Group, Button } from '@mantine/core'
import { IconX, IconPhoto, IconHeart, IconSparkles } from '@tabler/icons-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CharacterAsset } from '@/hooks/useCharacterAssets'

interface CGRevealProps {
  /** CG 素材 */
  cg: CharacterAsset | null
  /** 是否显示 */
  isOpen: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 查看画廊回调 */
  onOpenGallery?: () => void
  /** 是否为新解锁 */
  isNewUnlock?: boolean
  /** 角色名称 */
  characterName?: string
  /** 解锁原因 */
  unlockReason?: string
}

function CGReveal({
  cg,
  isOpen,
  onClose,
  onOpenGallery,
  isNewUnlock = false,
  characterName = '角色',
  unlockReason,
}: CGRevealProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  // Reset image loaded state when CG changes
  useEffect(() => {
    if (cg) {
      setImageLoaded(false)
    }
  }, [cg?.id])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleViewGallery = useCallback(() => {
    onClose()
    onOpenGallery?.()
  }, [onClose, onOpenGallery])

  if (!cg) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={handleClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          />

          {/* Sparkle particles for new unlock */}
          {isNewUnlock && (
            <UnlockSparkles />
          )}

          {/* CG Image Container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
              transition: {
                type: 'spring',
                damping: 25,
                stiffness: 300,
                delay: 0.1,
              },
            }}
            exit={{
              scale: 0.9,
              opacity: 0,
              transition: { duration: 0.2 },
            }}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '85vh',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: isNewUnlock
                ? '0 0 100px rgba(249, 200, 109, 0.5), 0 0 200px rgba(217, 70, 128, 0.3)'
                : '0 25px 80px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Loading skeleton */}
            {!imageLoaded && (
              <Box
                style={{
                  width: '80vw',
                  maxWidth: 800,
                  aspectRatio: '16 / 9',
                  background: 'linear-gradient(135deg, rgba(50,50,50,1) 0%, rgba(30,30,30,1) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <IconSparkles size={48} style={{ color: '#f9c86d' }} />
                </motion.div>
              </Box>
            )}

            {/* CG Image */}
            <motion.img
              src={cg.url}
              alt={cg.category || 'CG'}
              onLoad={() => setImageLoaded(true)}
              initial={{ filter: 'blur(20px) brightness(0.5)' }}
              animate={{
                filter: imageLoaded
                  ? 'blur(0px) brightness(1)'
                  : 'blur(20px) brightness(0.5)',
              }}
              transition={{ duration: 0.5 }}
              style={{
                maxWidth: '90vw',
                maxHeight: '85vh',
                objectFit: 'contain',
                display: imageLoaded ? 'block' : 'none',
              }}
            />

            {/* Glow border for new unlock */}
            {isNewUnlock && imageLoaded && (
              <motion.div
                animate={{
                  boxShadow: [
                    'inset 0 0 30px rgba(249, 200, 109, 0.3)',
                    'inset 0 0 50px rgba(249, 200, 109, 0.5)',
                    'inset 0 0 30px rgba(249, 200, 109, 0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  borderRadius: 16,
                }}
              />
            )}
          </motion.div>

          {/* Header - Close Button */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.2 }}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
            }}
          >
            <ActionIcon
              variant="subtle"
              color="gray"
              size="xl"
              radius="xl"
              onClick={handleClose}
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <IconX size={24} />
            </ActionIcon>
          </motion.div>

          {/* Footer - Info & Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.3 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '40px 20px 20px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
              {/* New Unlock Badge */}
              {isNewUnlock && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.4 }}
                  style={{ marginBottom: 12 }}
                >
                  <Group justify="center" gap="xs">
                    <IconHeart size={20} style={{ color: '#f472b6' }} />
                    <Text
                      size="sm"
                      fw={600}
                      style={{
                        background: 'linear-gradient(135deg, #f472b6 0%, #f9c86d 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      新 CG 解锁！
                    </Text>
                  </Group>
                </motion.div>
              )}

              {/* CG Info */}
              <Text size="lg" fw={600} c="white" mb={4}>
                {characterName} - {cg.category || 'Special CG'}
              </Text>

              {unlockReason && (
                <Text size="sm" c="dimmed" mb="md">
                  {unlockReason}
                </Text>
              )}

              {/* Actions */}
              <Group justify="center" gap="md">
                <Button
                  variant="subtle"
                  color="gray"
                  leftSection={<IconX size={16} />}
                  onClick={handleClose}
                >
                  关闭
                </Button>
                {onOpenGallery && (
                  <Button
                    variant="gradient"
                    gradient={{ from: '#d94680', to: '#f9c86d', deg: 135 }}
                    leftSection={<IconPhoto size={16} />}
                    onClick={handleViewGallery}
                  >
                    查看画廊
                  </Button>
                )}
              </Group>
            </Box>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 解锁粒子效果
function UnlockSparkles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
  }))

  return (
    <Box style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            y: [0, -100],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #f9c86d 0%, transparent 70%)',
            boxShadow: '0 0 10px #f9c86d',
          }}
        />
      ))}
    </Box>
  )
}

export default memo(CGReveal)
