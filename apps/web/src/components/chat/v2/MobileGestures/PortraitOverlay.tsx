'use client';

import { Box, Text, Image, Overlay } from '@mantine/core';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useState } from 'react';

interface PortraitOverlayProps {
  characterName: string;
  avatarUrl?: string;
  isExpanded: boolean;
  onToggle: () => void;
  currentEmotion?: string;
}

export function PortraitOverlay({
  characterName,
  avatarUrl,
  isExpanded,
  onToggle,
  currentEmotion,
}: PortraitOverlayProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);

    // Swipe right to expand (when collapsed)
    if (!isExpanded && info.offset.x > 50) {
      onToggle();
      return;
    }

    // Swipe left to close (when expanded)
    if (isExpanded && info.offset.x < -50) {
      onToggle();
      return;
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleTap = () => {
    if (!isDragging) {
      onToggle();
    }
  };

  return (
    <>
      {/* Expanded Overlay */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Backdrop */}
            <Overlay
              onClick={onToggle}
              opacity={0.95}
              blur={8}
              color="#000"
              style={{
                cursor: 'pointer',
              }}
            />

            {/* Portrait Container */}
            <motion.div
              layoutId="portrait"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onTap={handleTap}
              style={{
                position: 'relative',
                zIndex: 10000,
                maxWidth: '90vw',
                maxHeight: '85vh',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              {/* Character Name Header */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ delay: 0.1 }}
                style={{
                  marginBottom: '1rem',
                  textAlign: 'center',
                }}
              >
                <Text
                  size="xl"
                  fw={600}
                  style={{
                    color: '#d4af37',
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
                    fontFamily: 'Cinzel, serif',
                    letterSpacing: '0.05em',
                  }}
                >
                  {characterName}
                </Text>
                {currentEmotion && (
                  <Text
                    size="sm"
                    style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginTop: '0.25rem',
                      fontStyle: 'italic',
                    }}
                  >
                    {currentEmotion}
                  </Text>
                )}
              </motion.div>

              {/* Portrait Image */}
              <Box
                style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(212, 175, 55, 0.3), 0 0 0 2px rgba(212, 175, 55, 0.2)',
                  maxWidth: '100%',
                  maxHeight: '70vh',
                }}
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={characterName}
                    fit="contain"
                    style={{
                      maxHeight: '70vh',
                      width: 'auto',
                      display: 'block',
                    }}
                  />
                ) : (
                  <Box
                    style={{
                      width: '300px',
                      height: '400px',
                      background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(139, 69, 19, 0.1))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text size="lg" c="dimmed">
                      暂无立绘
                    </Text>
                  </Box>
                )}
              </Box>

              {/* Swipe Hint */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  marginTop: '1rem',
                }}
              >
                <Text
                  size="xs"
                  c="dimmed"
                  style={{
                    textAlign: 'center',
                    fontStyle: 'italic',
                  }}
                >
                  左滑或点击关闭
                </Text>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Thumbnail */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            layoutId="portrait"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.3}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onTap={handleTap}
            style={{
              position: 'fixed',
              bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
              right: '20px',
              width: '64px',
              height: '96px',
              zIndex: 1000,
              cursor: 'pointer',
              touchAction: 'none',
            }}
          >
            <Box
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(212, 175, 55, 0.3)',
                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(139, 69, 19, 0.1))',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                position: 'relative',
              }}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={characterName}
                  fit="cover"
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                />
              ) : (
                <Box
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(139, 69, 19, 0.2))',
                  }}
                >
                  <Text size="xs" c="dimmed" ta="center" px={4}>
                    {(characterName || '?').charAt(0).toUpperCase()}
                  </Text>
                </Box>
              )}

              {/* Subtle pulse animation hint */}
              <motion.div
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  border: '2px solid rgba(212, 175, 55, 0.5)',
                  borderRadius: '12px',
                  pointerEvents: 'none',
                }}
              />
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
