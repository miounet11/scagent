/**
 * Mobile Gestures Module
 *
 * Provides custom React hooks for detecting mobile gestures including:
 * - Swipe gestures (left, right, up, down)
 * - Long press gestures
 *
 * These hooks are designed to work seamlessly on both iOS Safari and Android Chrome,
 * handling edge cases like scroll conflicts and multi-touch scenarios.
 *
 * @example Swipe Gesture
 * ```tsx
 * import { useSwipeGesture } from '@/components/chat/v2/MobileGestures';
 *
 * function MyComponent() {
 *   const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture({
 *     onSwipeLeft: () => console.log('Swiped left'),
 *     onSwipeRight: () => console.log('Swiped right'),
 *     threshold: 50,
 *   });
 *
 *   return (
 *     <div
 *       onTouchStart={onTouchStart}
 *       onTouchMove={onTouchMove}
 *       onTouchEnd={onTouchEnd}
 *     >
 *       Swipe me!
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Long Press Gesture
 * ```tsx
 * import { useLongPress } from '@/components/chat/v2/MobileGestures';
 *
 * function MyComponent() {
 *   const {
 *     onTouchStart,
 *     onTouchEnd,
 *     onMouseDown,
 *     onMouseUp,
 *     isPressed,
 *   } = useLongPress({
 *     onLongPress: () => console.log('Long pressed!'),
 *     delay: 500,
 *   });
 *
 *   return (
 *     <button
 *       onTouchStart={onTouchStart}
 *       onTouchEnd={onTouchEnd}
 *       onMouseDown={onMouseDown}
 *       onMouseUp={onMouseUp}
 *       className={isPressed ? 'pressed' : ''}
 *     >
 *       Long press me!
 *     </button>
 *   );
 * }
 * ```
 *
 * @module MobileGestures
 */

// Swipe Gesture Hook
export { useSwipeGesture } from './useSwipeGesture';
export type {
  SwipeDirection,
  SwipeGestureOptions,
  SwipeGestureHandlers,
} from './useSwipeGesture';

// Long Press Hook
export { useLongPress } from './useLongPress';
export type {
  LongPressOptions,
  LongPressHandlers,
} from './useLongPress';

// Utility Functions
export {
  combineGestures,
  getGestureState,
  hasLongPress,
  hasSwipeGesture,
} from './combineGestures';
export type { CombinedGestureHandlers } from './combineGestures';

// Mobile Components
export { FloatingActionDrawer } from './FloatingActionDrawer';
export { PortraitOverlay } from './PortraitOverlay';
export { default as SwipeIndicator, GestureHintToast } from './SwipeIndicator';
// Note: SwipeDirection already exported from useSwipeGesture
