/**
 * Utility for combining multiple gesture handlers
 *
 * This helper makes it easier to use multiple gestures on the same element
 * without manually combining all the event handlers.
 *
 * @example
 * ```tsx
 * import { useSwipeGesture, useLongPress, combineGestures } from '@/components/chat/v2/MobileGestures';
 *
 * function MyComponent() {
 *   const swipe = useSwipeGesture({ onSwipeLeft: handleDelete });
 *   const longPress = useLongPress({ onLongPress: handleMenu });
 *
 *   const handlers = combineGestures(swipe, longPress);
 *
 *   return <div {...handlers}>Content</div>;
 * }
 * ```
 */

import type { SwipeGestureHandlers } from './useSwipeGesture';
import type { LongPressHandlers } from './useLongPress';

/**
 * Combined gesture handlers for easy spreading onto elements
 */
export interface CombinedGestureHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseMove?: (e: React.MouseEvent) => void;
  onMouseUp?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
}

/**
 * Combines multiple gesture handlers into a single set of event handlers
 *
 * @param handlers - Variable number of gesture handler objects (SwipeGestureHandlers, LongPressHandlers, etc.)
 * @returns Combined handlers that can be spread onto an element
 *
 * @example
 * ```tsx
 * const swipe = useSwipeGesture({ onSwipeLeft: () => {} });
 * const longPress = useLongPress({ onLongPress: () => {} });
 * const handlers = combineGestures(swipe, longPress);
 *
 * return <div {...handlers}>Content</div>;
 * ```
 */
export function combineGestures(
  ...handlers: Array<Partial<SwipeGestureHandlers> | Partial<LongPressHandlers>>
): CombinedGestureHandlers {
  return {
    onTouchStart: (e: React.TouchEvent) => {
      handlers.forEach((handler) => {
        handler.onTouchStart?.(e);
      });
    },

    onTouchMove: (e: React.TouchEvent) => {
      handlers.forEach((handler) => {
        handler.onTouchMove?.(e);
      });
    },

    onTouchEnd: (e: React.TouchEvent) => {
      handlers.forEach((handler) => {
        handler.onTouchEnd?.(e);
      });
    },

    onMouseDown: (e: React.MouseEvent) => {
      handlers.forEach((handler) => {
        if ('onMouseDown' in handler) {
          handler.onMouseDown?.(e);
        }
      });
    },

    onMouseMove: (e: React.MouseEvent) => {
      handlers.forEach((handler) => {
        if ('onMouseMove' in handler) {
          handler.onMouseMove?.(e);
        }
      });
    },

    onMouseUp: (e: React.MouseEvent) => {
      handlers.forEach((handler) => {
        if ('onMouseUp' in handler) {
          handler.onMouseUp?.(e);
        }
      });
    },

    onMouseLeave: (e: React.MouseEvent) => {
      handlers.forEach((handler) => {
        if ('onMouseLeave' in handler) {
          handler.onMouseLeave?.(e);
        }
      });
    },
  };
}

/**
 * Type guard to check if handlers include long press
 */
export function hasLongPress(handlers: unknown): handlers is LongPressHandlers {
  return (
    typeof handlers === 'object' &&
    handlers !== null &&
    'onMouseDown' in handlers &&
    'isPressed' in handlers
  );
}

/**
 * Type guard to check if handlers include swipe gesture
 */
export function hasSwipeGesture(handlers: unknown): handlers is SwipeGestureHandlers {
  return (
    typeof handlers === 'object' &&
    handlers !== null &&
    'swipeDirection' in handlers &&
    'isSwiping' in handlers
  );
}

/**
 * Creates a gesture state object for debugging and visual feedback
 *
 * @param handlers - Gesture handlers to extract state from
 * @returns Object containing all gesture states
 *
 * @example
 * ```tsx
 * const swipe = useSwipeGesture({});
 * const longPress = useLongPress({});
 * const state = getGestureState(swipe, longPress);
 *
 * console.log(state.isSwiping, state.isPressed);
 * ```
 */
export function getGestureState(
  ...handlers: Array<Partial<SwipeGestureHandlers> | Partial<LongPressHandlers>>
) {
  const state: {
    isSwiping?: boolean;
    swipeDirection?: string | null;
    isPressed?: boolean;
    isLongPressed?: boolean;
  } = {};

  handlers.forEach((handler) => {
    if (hasSwipeGesture(handler)) {
      state.isSwiping = handler.isSwiping;
      state.swipeDirection = handler.swipeDirection;
    }
    if (hasLongPress(handler)) {
      state.isPressed = handler.isPressed;
      state.isLongPressed = handler.isLongPressed;
    }
  });

  return state;
}
