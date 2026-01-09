import { useCallback, useRef, useState, useEffect } from 'react';

/**
 * Long press configuration options
 */
export interface LongPressOptions {
  /**
   * Duration in milliseconds to trigger long press
   * @default 500
   */
  delay?: number;

  /**
   * Callback fired when long press is triggered
   */
  onLongPress?: (event: React.TouchEvent | React.MouseEvent) => void;

  /**
   * Callback fired when press starts
   */
  onPressStart?: (event: React.TouchEvent | React.MouseEvent) => void;

  /**
   * Callback fired when press ends (before long press triggers)
   */
  onPressEnd?: (event: React.TouchEvent | React.MouseEvent) => void;

  /**
   * Callback fired when long press is cancelled (e.g., finger moved)
   */
  onCancel?: () => void;

  /**
   * Maximum movement distance (in pixels) allowed during press
   * Exceeding this will cancel the long press
   * @default 10
   */
  movementThreshold?: number;

  /**
   * Whether to prevent default behavior (e.g., context menu)
   * @default true
   */
  preventDefault?: boolean;

  /**
   * Whether to detect long press from mouse events
   * @default true
   */
  detectMouse?: boolean;

  /**
   * Whether to detect long press from touch events
   * @default true
   */
  detectTouch?: boolean;
}

/**
 * Position coordinates for tracking movement
 */
interface Position {
  x: number;
  y: number;
}

/**
 * Long press hook return value
 */
export interface LongPressHandlers {
  /**
   * Touch start event handler
   */
  onTouchStart: (e: React.TouchEvent) => void;

  /**
   * Touch move event handler
   */
  onTouchMove: (e: React.TouchEvent) => void;

  /**
   * Touch end event handler
   */
  onTouchEnd: (e: React.TouchEvent) => void;

  /**
   * Mouse down event handler
   */
  onMouseDown: (e: React.MouseEvent) => void;

  /**
   * Mouse move event handler
   */
  onMouseMove: (e: React.MouseEvent) => void;

  /**
   * Mouse up event handler
   */
  onMouseUp: (e: React.MouseEvent) => void;

  /**
   * Mouse leave event handler (to cancel long press)
   */
  onMouseLeave: (e: React.MouseEvent) => void;

  /**
   * Whether the element is currently being pressed
   */
  isPressed: boolean;

  /**
   * Whether the long press has been triggered
   */
  isLongPressed: boolean;
}

/**
 * Custom hook for detecting long press gestures on both touch and mouse devices
 *
 * @example
 * ```tsx
 * const { onTouchStart, onTouchEnd, onMouseDown, onMouseUp, isPressed } = useLongPress({
 *   delay: 500,
 *   onLongPress: () => console.log('Long pressed!'),
 * });
 *
 * return (
 *   <div
 *     onTouchStart={onTouchStart}
 *     onTouchEnd={onTouchEnd}
 *     onMouseDown={onMouseDown}
 *     onMouseUp={onMouseUp}
 *     className={isPressed ? 'pressed' : ''}
 *   >
 *     Long press me!
 *   </div>
 * );
 * ```
 *
 * @param options - Configuration options for long press detection
 * @returns Long press handlers and state
 */
export function useLongPress(options: LongPressOptions = {}): LongPressHandlers {
  const {
    delay = 500,
    onLongPress,
    onPressStart,
    onPressEnd,
    onCancel,
    movementThreshold = 10,
    preventDefault = true,
    detectMouse = true,
    detectTouch = true,
  } = options;

  const [isPressed, setIsPressed] = useState(false);
  const [isLongPressed, setIsLongPressed] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startPositionRef = useRef<Position | null>(null);
  const eventRef = useRef<React.TouchEvent | React.MouseEvent | null>(null);
  const isPressActiveRef = useRef(false);

  /**
   * Clear the long press timer
   */
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * Start the long press detection
   */
  const startPress = useCallback(
    (event: React.TouchEvent | React.MouseEvent, position: Position) => {
      if (preventDefault) {
        event.preventDefault();
      }

      isPressActiveRef.current = true;
      startPositionRef.current = position;
      eventRef.current = event;

      setIsPressed(true);
      setIsLongPressed(false);
      onPressStart?.(event);

      // Start timer for long press detection
      clearTimer();
      timerRef.current = setTimeout(() => {
        if (isPressActiveRef.current) {
          setIsLongPressed(true);
          onLongPress?.(event);
        }
      }, delay);
    },
    [delay, onLongPress, onPressStart, preventDefault, clearTimer]
  );

  /**
   * End the press (before long press triggers)
   */
  const endPress = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      if (!isPressActiveRef.current) {
        return;
      }

      clearTimer();
      isPressActiveRef.current = false;
      startPositionRef.current = null;
      eventRef.current = null;

      const wasLongPressed = isLongPressed;

      setIsPressed(false);

      if (!wasLongPressed) {
        onPressEnd?.(event);
      }

      // Reset long press state after a short delay to allow for visual feedback
      setTimeout(() => {
        setIsLongPressed(false);
      }, 100);
    },
    [clearTimer, isLongPressed, onPressEnd]
  );

  /**
   * Cancel the long press (e.g., due to movement)
   */
  const cancelPress = useCallback(() => {
    if (!isPressActiveRef.current) {
      return;
    }

    clearTimer();
    isPressActiveRef.current = false;
    startPositionRef.current = null;
    eventRef.current = null;

    setIsPressed(false);
    setIsLongPressed(false);
    onCancel?.();
  }, [clearTimer, onCancel]);

  /**
   * Check if movement exceeds threshold
   */
  const checkMovement = useCallback(
    (currentPosition: Position): boolean => {
      if (!startPositionRef.current) {
        return false;
      }

      const deltaX = Math.abs(currentPosition.x - startPositionRef.current.x);
      const deltaY = Math.abs(currentPosition.y - startPositionRef.current.y);

      return deltaX > movementThreshold || deltaY > movementThreshold;
    },
    [movementThreshold]
  );

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!detectTouch || e.touches.length !== 1) {
        return;
      }

      const touch = e.touches[0];
      startPress(e, { x: touch.clientX, y: touch.clientY });
    },
    [detectTouch, startPress]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!detectTouch || !isPressActiveRef.current || e.touches.length !== 1) {
        return;
      }

      const touch = e.touches[0];
      const currentPosition = { x: touch.clientX, y: touch.clientY };

      if (checkMovement(currentPosition)) {
        cancelPress();
      }
    },
    [detectTouch, checkMovement, cancelPress]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!detectTouch) {
        return;
      }

      endPress(e);
    },
    [detectTouch, endPress]
  );

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only respond to left click
      if (!detectMouse || e.button !== 0) {
        return;
      }

      startPress(e, { x: e.clientX, y: e.clientY });
    },
    [detectMouse, startPress]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!detectMouse || !isPressActiveRef.current) {
        return;
      }

      const currentPosition = { x: e.clientX, y: e.clientY };

      if (checkMovement(currentPosition)) {
        cancelPress();
      }
    },
    [detectMouse, checkMovement, cancelPress]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!detectMouse) {
        return;
      }

      endPress(e);
    },
    [detectMouse, endPress]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent) => {
      if (!detectMouse) {
        return;
      }

      cancelPress();
    },
    [detectMouse, cancelPress]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  // Cleanup on component blur (safety net)
  useEffect(() => {
    const handleBlur = () => {
      if (isPressActiveRef.current) {
        cancelPress();
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [cancelPress]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
    isPressed,
    isLongPressed,
  };
}
