import { useCallback, useRef, useState } from 'react';

/**
 * Swipe direction types
 */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null;

/**
 * Touch position coordinates
 */
interface TouchPosition {
  x: number;
  y: number;
  time: number;
}

/**
 * Swipe gesture configuration options
 */
export interface SwipeGestureOptions {
  /**
   * Minimum distance (in pixels) to trigger a swipe
   * @default 50
   */
  threshold?: number;

  /**
   * Minimum velocity (in px/ms) to trigger a swipe
   * @default 0.3
   */
  velocityThreshold?: number;

  /**
   * Callback fired when user swipes left
   */
  onSwipeLeft?: () => void;

  /**
   * Callback fired when user swipes right
   */
  onSwipeRight?: () => void;

  /**
   * Callback fired when user swipes up
   */
  onSwipeUp?: () => void;

  /**
   * Callback fired when user swipes down
   */
  onSwipeDown?: () => void;

  /**
   * Callback fired on any swipe with direction
   */
  onSwipe?: (direction: SwipeDirection) => void;

  /**
   * Whether to prevent default touch behavior
   * Use with caution as it may interfere with scrolling
   * @default false
   */
  preventDefault?: boolean;

  /**
   * Minimum vertical scroll delta to disable horizontal swipes
   * Helps prevent accidental swipes while scrolling
   * @default 10
   */
  scrollTolerance?: number;
}

/**
 * Swipe gesture hook return value
 */
export interface SwipeGestureHandlers {
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
   * Current swipe direction (only valid during touch)
   */
  swipeDirection: SwipeDirection;

  /**
   * Whether a swipe is currently in progress
   */
  isSwiping: boolean;
}

/**
 * Custom hook for detecting swipe gestures on touch devices
 *
 * @example
 * ```tsx
 * const { onTouchStart, onTouchMove, onTouchEnd, swipeDirection } = useSwipeGesture({
 *   threshold: 100,
 *   onSwipeLeft: () => console.log('Swiped left'),
 *   onSwipeRight: () => console.log('Swiped right'),
 * });
 *
 * return (
 *   <div
 *     onTouchStart={onTouchStart}
 *     onTouchMove={onTouchMove}
 *     onTouchEnd={onTouchEnd}
 *   >
 *     Swipe me!
 *   </div>
 * );
 * ```
 *
 * @param options - Configuration options for swipe detection
 * @returns Swipe gesture handlers and state
 */
export function useSwipeGesture(options: SwipeGestureOptions = {}): SwipeGestureHandlers {
  const {
    threshold = 50,
    velocityThreshold = 0.3,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipe,
    preventDefault = false,
    scrollTolerance = 10,
  } = options;

  const touchStart = useRef<TouchPosition | null>(null);
  const touchEnd = useRef<TouchPosition | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  /**
   * Calculate swipe direction and velocity from touch positions
   */
  const calculateSwipe = useCallback(
    (start: TouchPosition, end: TouchPosition): SwipeDirection => {
      const deltaX = end.x - start.x;
      const deltaY = end.y - start.y;
      const deltaTime = end.time - start.time;

      // Calculate absolute distances
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Calculate velocity (px/ms)
      const velocityX = absX / deltaTime;
      const velocityY = absY / deltaTime;

      // Check if movement exceeds threshold
      if (absX < threshold && absY < threshold) {
        return null;
      }

      // Check if velocity is sufficient
      if (velocityX < velocityThreshold && velocityY < velocityThreshold) {
        return null;
      }

      // Determine primary direction (horizontal or vertical)
      if (absX > absY) {
        // Horizontal swipe - but check for vertical scroll interference
        if (absY > scrollTolerance) {
          // User is likely scrolling, not swiping
          return null;
        }
        return deltaX > 0 ? 'right' : 'left';
      } else {
        // Vertical swipe
        return deltaY > 0 ? 'down' : 'up';
      }
    },
    [threshold, velocityThreshold, scrollTolerance]
  );

  /**
   * Handle touch start event
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only track single touch (ignore multi-touch)
    if (e.touches.length !== 1) {
      touchStart.current = null;
      return;
    }

    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    touchEnd.current = null;
    setSwipeDirection(null);
    setIsSwiping(false);

    if (preventDefault) {
      e.preventDefault();
    }
  }, [preventDefault]);

  /**
   * Handle touch move event
   */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current || e.touches.length !== 1) {
      return;
    }

    const touch = e.touches[0];
    const currentPos: TouchPosition = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    // Calculate current swipe direction for visual feedback
    const direction = calculateSwipe(touchStart.current, currentPos);

    if (direction) {
      setIsSwiping(true);
      setSwipeDirection(direction);
    }

    // Only prevent default for horizontal swipes to allow vertical scrolling
    if (preventDefault && (direction === 'left' || direction === 'right')) {
      e.preventDefault();
    }
  }, [calculateSwipe, preventDefault]);

  /**
   * Handle touch end event
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) {
      return;
    }

    // Use changedTouches to get the touch that was released
    const touch = e.changedTouches[0];
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    // Calculate final swipe direction
    const direction = calculateSwipe(touchStart.current, touchEnd.current);

    if (direction) {
      // Fire appropriate callback
      switch (direction) {
        case 'left':
          onSwipeLeft?.();
          break;
        case 'right':
          onSwipeRight?.();
          break;
        case 'up':
          onSwipeUp?.();
          break;
        case 'down':
          onSwipeDown?.();
          break;
      }

      // Fire generic swipe callback
      onSwipe?.(direction);
    }

    // Reset state
    touchStart.current = null;
    touchEnd.current = null;
    setSwipeDirection(null);
    setIsSwiping(false);

    if (preventDefault) {
      e.preventDefault();
    }
  }, [calculateSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onSwipe, preventDefault]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    swipeDirection,
    isSwiping,
  };
}
