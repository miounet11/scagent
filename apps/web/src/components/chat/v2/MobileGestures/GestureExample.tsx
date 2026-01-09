/**
 * Example component demonstrating mobile gesture utilities
 *
 * This component shows how to use useSwipeGesture and useLongPress
 * together in a real-world scenario, such as a message bubble in a chat UI.
 *
 * Features:
 * - Swipe left to delete
 * - Swipe right to reply
 * - Long press to show context menu
 * - Visual feedback during gestures
 */

import React, { useState, useCallback } from 'react';
import { useSwipeGesture, useLongPress } from './index';

interface GestureExampleProps {
  content: string;
  onDelete?: () => void;
  onReply?: () => void;
  onShowMenu?: () => void;
}

export function GestureExample({
  content,
  onDelete,
  onReply,
  onShowMenu,
}: GestureExampleProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showRipple, setShowRipple] = useState(false);

  // Swipe gesture for left/right actions
  const swipe = useSwipeGesture({
    threshold: 80,
    velocityThreshold: 0.4,
    scrollTolerance: 15,
    onSwipeLeft: useCallback(() => {
      console.log('Swiped left - Delete');
      onDelete?.();
      setSwipeOffset(0);
    }, [onDelete]),
    onSwipeRight: useCallback(() => {
      console.log('Swiped right - Reply');
      onReply?.();
      setSwipeOffset(0);
    }, [onReply]),
  });

  // Long press for context menu
  const longPress = useLongPress({
    delay: 500,
    movementThreshold: 10,
    onPressStart: useCallback(() => {
      setShowRipple(true);
    }, []),
    onLongPress: useCallback(() => {
      console.log('Long pressed - Show menu');
      onShowMenu?.();
      setShowRipple(false);
    }, [onShowMenu]),
    onPressEnd: useCallback(() => {
      setShowRipple(false);
    }, []),
    onCancel: useCallback(() => {
      setShowRipple(false);
    }, []),
  });

  // Update visual offset during swipe
  React.useEffect(() => {
    if (swipe.isSwiping) {
      if (swipe.swipeDirection === 'left') {
        setSwipeOffset(-20);
      } else if (swipe.swipeDirection === 'right') {
        setSwipeOffset(20);
      }
    } else {
      setSwipeOffset(0);
    }
  }, [swipe.isSwiping, swipe.swipeDirection]);

  return (
    <div className="gesture-example-container">
      <div
        className={`message-bubble ${longPress.isPressed ? 'pressed' : ''} ${longPress.isLongPressed ? 'long-pressed' : ''}`}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipe.isSwiping ? 'none' : 'transform 0.2s ease-out',
        }}
        // Combine all gesture handlers
        onTouchStart={(e) => {
          swipe.onTouchStart(e);
          longPress.onTouchStart(e);
        }}
        onTouchMove={(e) => {
          swipe.onTouchMove(e);
          longPress.onTouchMove(e);
        }}
        onTouchEnd={(e) => {
          swipe.onTouchEnd(e);
          longPress.onTouchEnd(e);
        }}
        // Mouse support for desktop testing
        onMouseDown={longPress.onMouseDown}
        onMouseMove={longPress.onMouseMove}
        onMouseUp={longPress.onMouseUp}
        onMouseLeave={longPress.onMouseLeave}
      >
        {showRipple && <div className="ripple-effect" />}

        <div className="message-content">{content}</div>

        {/* Swipe indicators */}
        {swipe.swipeDirection === 'left' && swipe.isSwiping && (
          <div className="swipe-indicator left">
            <span>🗑️ Delete</span>
          </div>
        )}
        {swipe.swipeDirection === 'right' && swipe.isSwiping && (
          <div className="swipe-indicator right">
            <span>↩️ Reply</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .gesture-example-container {
          position: relative;
          margin: 8px 0;
        }

        .message-bubble {
          position: relative;
          padding: 12px 16px;
          background: #f0f0f0;
          border-radius: 16px;
          user-select: none;
          -webkit-user-select: none;
          touch-action: pan-y; /* Allow vertical scroll, detect horizontal swipe */
          cursor: pointer;
          overflow: hidden;
        }

        .message-bubble.pressed {
          background: #e0e0e0;
          scale: 0.98;
        }

        .message-bubble.long-pressed {
          background: #d0d0d0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .message-content {
          position: relative;
          z-index: 1;
        }

        .ripple-effect {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.1);
          transform: translate(-50%, -50%);
          animation: ripple 0.6s ease-out forwards;
          pointer-events: none;
        }

        @keyframes ripple {
          to {
            width: 300px;
            height: 300px;
            opacity: 0;
          }
        }

        .swipe-indicator {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 8px;
          font-size: 14px;
          pointer-events: none;
          animation: fadeIn 0.2s ease-out;
        }

        .swipe-indicator.left {
          right: 16px;
        }

        .swipe-indicator.right {
          left: 16px;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Interactive test page component
 */
export function GestureTestPage() {
  const [log, setLog] = useState<string[]>([]);
  const [messages, setMessages] = useState([
    { id: 1, content: 'Swipe me left to delete!' },
    { id: 2, content: 'Swipe me right to reply!' },
    { id: 3, content: 'Long press to show menu!' },
    { id: 4, content: 'Try combining gestures!' },
  ]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLog((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };

  const handleDelete = (id: number) => {
    addLog(`Deleted message ${id}`);
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const handleReply = (id: number) => {
    addLog(`Replying to message ${id}`);
  };

  const handleShowMenu = (id: number) => {
    addLog(`Showing menu for message ${id}`);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>Mobile Gesture Test Page</h1>

      <div
        style={{
          background: '#f9f9f9',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <h3>Instructions:</h3>
        <ul>
          <li>📱 <strong>Swipe left</strong> on a message to delete</li>
          <li>📱 <strong>Swipe right</strong> on a message to reply</li>
          <li>📱 <strong>Long press</strong> to show context menu</li>
          <li>🖱️ <strong>Desktop users</strong>: Long press works with mouse too!</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Messages:</h3>
        {messages.map((msg) => (
          <GestureExample
            key={msg.id}
            content={msg.content}
            onDelete={() => handleDelete(msg.id)}
            onReply={() => handleReply(msg.id)}
            onShowMenu={() => handleShowMenu(msg.id)}
          />
        ))}

        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            All messages deleted! Refresh to reset.
          </div>
        )}
      </div>

      <div
        style={{
          background: '#000',
          color: '#0f0',
          padding: '12px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '12px',
          maxHeight: '300px',
          overflow: 'auto',
        }}
      >
        <h3 style={{ color: '#0f0', marginTop: 0 }}>Event Log:</h3>
        {log.map((entry, i) => (
          <div key={i}>{entry}</div>
        ))}
        {log.length === 0 && (
          <div style={{ color: '#666' }}>Waiting for gestures...</div>
        )}
      </div>

      <div
        style={{
          marginTop: '20px',
          padding: '16px',
          background: '#fff3cd',
          borderRadius: '8px',
          border: '1px solid #ffc107',
        }}
      >
        <strong>Note:</strong> For best experience, test on a real mobile device
        (iOS Safari or Android Chrome). Desktop mouse events are supported for
        long press only.
      </div>
    </div>
  );
}
