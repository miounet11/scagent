'use client';

import { Box, Text, UnstyledButton, useMantineTheme } from '@mantine/core';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface FloatingActionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  actions: Array<{
    id: string;
    emoji: string;
    label: string;
    onClick: () => void;
  }>;
  emotions?: Array<{
    id: string;
    emoji: string;
    label: string;
    color: string;
    onClick: () => void;
  }>;
}

export function FloatingActionDrawer({
  isOpen,
  onClose,
  actions,
  emotions = [],
}: FloatingActionDrawerProps) {
  const theme = useMantineTheme();
  const controls = useAnimation();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Theater Soul color palette
  const colors = {
    backdrop: 'rgba(10, 10, 15, 0.7)',
    drawerBg: theme.colors.dark[8],
    borderColor: theme.colors.dark[5],
    handleBg: theme.colors.dark[4],
    actionBg: theme.colors.dark[7],
    actionHover: theme.colors.dark[6],
    textPrimary: theme.colors.gray[1],
    textSecondary: theme.colors.gray[5],
  };

  useEffect(() => {
    if (isOpen) {
      controls.start('visible');
    } else {
      controls.start('hidden');
    }
  }, [isOpen, controls]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    // Close if dragged down significantly or with high downward velocity
    if (offset > threshold || velocity > 500) {
      onClose();
    } else {
      // Snap back to open position
      controls.start('visible');
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const drawerVariants = {
    hidden: {
      y: '100%',
      transition: {
        type: 'spring' as const,
        damping: 30,
        stiffness: 300,
      },
    },
    visible: {
      y: 0,
      transition: {
        type: 'spring' as const,
        damping: 30,
        stiffness: 300,
      },
    },
  };

  if (!isOpen && controls) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial="hidden"
        animate={controls}
        variants={backdropVariants}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.backdrop,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 100,
          touchAction: 'none',
        }}
      />

      {/* Drawer */}
      <motion.div
        ref={drawerRef}
        initial="hidden"
        animate={controls}
        variants={drawerVariants}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={handleDragEnd}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: '60vh',
          backgroundColor: colors.drawerBg,
          borderTopLeftRadius: theme.radius.xl,
          borderTopRightRadius: theme.radius.xl,
          borderTop: `1px solid ${colors.borderColor}`,
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Handle bar */}
        <Box
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '12px 0 8px 0',
            cursor: 'grab',
            touchAction: 'none',
          }}
        >
          <Box
            style={{
              width: '40px',
              height: '4px',
              backgroundColor: colors.handleBg,
              borderRadius: theme.radius.xl,
            }}
          />
        </Box>

        {/* Content */}
        <Box
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 16px 16px 16px',
          }}
        >
          {/* Quick Actions Grid */}
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              marginBottom: emotions.length > 0 ? '16px' : 0,
            }}
          >
            {actions.map((action) => (
              <UnstyledButton
                key={action.id}
                onClick={() => {
                  action.onClick();
                  onClose();
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '16px 8px',
                  backgroundColor: colors.actionBg,
                  borderRadius: theme.radius.md,
                  border: `1px solid ${colors.borderColor}`,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.actionHover;
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.actionBg;
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.backgroundColor = colors.actionHover;
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.backgroundColor = colors.actionBg;
                }}
              >
                <Text
                  size="xl"
                  style={{
                    fontSize: '28px',
                    lineHeight: 1,
                  }}
                >
                  {action.emoji}
                </Text>
                <Text
                  size="xs"
                  style={{
                    color: colors.textSecondary,
                    textAlign: 'center',
                    lineHeight: 1.2,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {action.label}
                </Text>
              </UnstyledButton>
            ))}
          </Box>

          {/* Emotions Horizontal Scroll */}
          {emotions.length > 0 && (
            <Box>
              <Text
                size="sm"
                fw={600}
                style={{
                  color: colors.textPrimary,
                  marginBottom: '12px',
                }}
              >
                Quick Emotions
              </Text>
              <Box
                style={{
                  display: 'flex',
                  gap: '8px',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  paddingBottom: '8px',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${colors.borderColor} transparent`,
                }}
              >
                {emotions.map((emotion) => (
                  <UnstyledButton
                    key={emotion.id}
                    onClick={() => {
                      emotion.onClick();
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '12px 16px',
                      backgroundColor: colors.actionBg,
                      borderRadius: theme.radius.md,
                      border: `1px solid ${emotion.color}20`,
                      minWidth: '80px',
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${emotion.color}15`;
                      e.currentTarget.style.borderColor = `${emotion.color}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colors.actionBg;
                      e.currentTarget.style.borderColor = `${emotion.color}20`;
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.style.backgroundColor = `${emotion.color}15`;
                    }}
                    onTouchEnd={(e) => {
                      e.currentTarget.style.backgroundColor = colors.actionBg;
                    }}
                  >
                    <Text
                      size="xl"
                      style={{
                        fontSize: '24px',
                        lineHeight: 1,
                      }}
                    >
                      {emotion.emoji}
                    </Text>
                    <Text
                      size="xs"
                      style={{
                        color: emotion.color,
                        textAlign: 'center',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {emotion.label}
                    </Text>
                  </UnstyledButton>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </motion.div>
    </>
  );
}
