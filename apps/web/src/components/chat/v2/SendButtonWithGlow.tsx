'use client';

import { ActionIcon } from '@mantine/core';
import { IconSend, IconCheck } from '@tabler/icons-react';
import { useCallback, useRef, useState, useEffect } from 'react';
import { theaterColors } from '../utils/theaterColors';

type SendState = 'idle' | 'sending' | 'success' | 'error';

interface SendButtonWithGlowProps {
  disabled?: boolean;
  isTyping?: boolean;
  onSend: () => void;
  onLongPress?: () => void; // triggers radial menu
  sendState?: SendState;
}

const LONG_PRESS_DURATION = 500; // ms

export function SendButtonWithGlow({
  disabled = false,
  isTyping = false,
  onSend,
  onLongPress,
  sendState = 'idle',
}: SendButtonWithGlowProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [localState, setLocalState] = useState<SendState>('idle');
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef(false);

  // Sync with external state or use local state
  const currentState = sendState !== 'idle' ? sendState : localState;

  // Reset local state after animation completes
  useEffect(() => {
    if (localState === 'success' || localState === 'error') {
      const timer = setTimeout(() => setLocalState('idle'), 600);
      return () => clearTimeout(timer);
    }
  }, [localState]);

  const handlePressStart = useCallback(() => {
    if (disabled || !onLongPress) return;

    setIsPressed(true);
    longPressTriggeredRef.current = false;

    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      onLongPress();
      setIsPressed(false);
    }, LONG_PRESS_DURATION);
  }, [disabled, onLongPress]);

  const handlePressEnd = useCallback(() => {
    setIsPressed(false);

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // Only trigger send if long press wasn't triggered
    if (!longPressTriggeredRef.current && !disabled) {
      // Trigger click animation
      setLocalState('sending');
      onSend();
    }
  }, [disabled, onSend]);

  const handlePressCancel = useCallback(() => {
    setIsPressed(false);

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    longPressTriggeredRef.current = false;
  }, []);

  // Determine animation class based on state
  const getAnimationClass = () => {
    if (currentState === 'sending') return 'send-btn-click';
    if (currentState === 'success') return 'send-btn-success';
    if (currentState === 'error') return 'send-btn-error';
    if (isTyping && !disabled) return 'send-button-pulse';
    return '';
  };

  return (
    <ActionIcon
      size="xl"
      radius="xl"
      disabled={disabled}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressCancel}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressCancel}
      className={`
        relative overflow-visible gpu-accelerated
        transition-all duration-200 ease-out
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${!disabled && 'hover:scale-110 active:scale-95'}
        ${!disabled ? 'send-button-glow' : ''}
        ${isPressed && !disabled ? 'send-button-pressed' : ''}
        ${getAnimationClass()}
      `}
      style={{
        backgroundColor: currentState === 'success'
          ? '#22c55e'
          : currentState === 'error'
          ? '#ef4444'
          : disabled
          ? '#666'
          : theaterColors.spotlightGold,
        color: '#1a1a1a',
        border: 'none',
        transition: 'background-color 0.2s ease-out',
      }}
      aria-label={onLongPress ? 'Send message or long press for options' : 'Send message'}
    >
      {currentState === 'success' ? (
        <IconCheck size={20} />
      ) : (
        <IconSend size={20} />
      )}

      <style jsx>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow:
              0 0 20px ${theaterColors.spotlightGold}40,
              0 0 40px ${theaterColors.spotlightGold}20,
              0 4px 12px rgba(0, 0, 0, 0.3);
          }
          50% {
            box-shadow:
              0 0 30px ${theaterColors.spotlightGold}60,
              0 0 60px ${theaterColors.spotlightGold}30,
              0 4px 12px rgba(0, 0, 0, 0.3);
          }
        }

        @keyframes intensify-glow {
          0% {
            box-shadow:
              0 0 20px ${theaterColors.spotlightGold}40,
              0 0 40px ${theaterColors.spotlightGold}20,
              0 4px 12px rgba(0, 0, 0, 0.3);
          }
          100% {
            box-shadow:
              0 0 40px ${theaterColors.spotlightGold}80,
              0 0 80px ${theaterColors.spotlightGold}40,
              0 6px 20px rgba(0, 0, 0, 0.4);
          }
        }

        :global(.send-button-glow) {
          box-shadow:
            0 0 20px ${theaterColors.spotlightGold}40,
            0 0 40px ${theaterColors.spotlightGold}20,
            0 4px 12px rgba(0, 0, 0, 0.3);
        }

        :global(.send-button-glow:hover:not(:disabled)) {
          animation: intensify-glow 0.3s ease-out forwards;
        }

        :global(.send-button-pulse) {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        :global(.send-button-pressed) {
          box-shadow:
            0 0 50px ${theaterColors.spotlightGold}90,
            0 0 100px ${theaterColors.spotlightGold}50,
            0 8px 24px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </ActionIcon>
  );
}
