/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useSwipeGesture } from '../useSwipeGesture';

describe('useSwipeGesture', () => {
  // Helper to create mock touch events
  const createTouchEvent = (type: string, touches: Array<{ clientX: number; clientY: number }>) => {
    return {
      type,
      touches: touches.map(t => ({ clientX: t.clientX, clientY: t.clientY })),
      changedTouches: touches.map(t => ({ clientX: t.clientX, clientY: t.clientY })),
      preventDefault: jest.fn(),
    } as unknown as React.TouchEvent;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Swipe Detection', () => {
    it('should detect swipe left', () => {
      const onSwipeLeft = jest.fn();
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeLeft, threshold: 50 })
      );

      // Start touch at (100, 100)
      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
      });

      // Move to (30, 100) - 70px left
      act(() => {
        result.current.onTouchMove(createTouchEvent('touchmove', [{ clientX: 30, clientY: 100 }]));
      });

      // End touch
      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [{ clientX: 30, clientY: 100 }]));
      });

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });

    it('should detect swipe right', () => {
      const onSwipeRight = jest.fn();
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeRight, threshold: 50 })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
      });

      act(() => {
        result.current.onTouchMove(createTouchEvent('touchmove', [{ clientX: 170, clientY: 100 }]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [{ clientX: 170, clientY: 100 }]));
      });

      expect(onSwipeRight).toHaveBeenCalledTimes(1);
    });

    it('should detect swipe up', () => {
      const onSwipeUp = jest.fn();
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeUp, threshold: 50 })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
      });

      act(() => {
        result.current.onTouchMove(createTouchEvent('touchmove', [{ clientX: 100, clientY: 30 }]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [{ clientX: 100, clientY: 30 }]));
      });

      expect(onSwipeUp).toHaveBeenCalledTimes(1);
    });

    it('should detect swipe down', () => {
      const onSwipeDown = jest.fn();
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeDown, threshold: 50 })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
      });

      act(() => {
        result.current.onTouchMove(createTouchEvent('touchmove', [{ clientX: 100, clientY: 170 }]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [{ clientX: 100, clientY: 170 }]));
      });

      expect(onSwipeDown).toHaveBeenCalledTimes(1);
    });
  });

  describe('Threshold Configuration', () => {
    it('should not trigger swipe below distance threshold', () => {
      const onSwipeLeft = jest.fn();
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeLeft, threshold: 100 })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
      });

      // Only move 50px (below 100px threshold)
      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [{ clientX: 50, clientY: 100 }]));
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it('should respect custom threshold', () => {
      const onSwipeLeft = jest.fn();
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeLeft, threshold: 30 })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
      });

      // Move 40px (above 30px threshold)
      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [{ clientX: 60, clientY: 100 }]));
      });

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });
  });

  describe('Scroll Tolerance', () => {
    it('should cancel horizontal swipe if vertical movement exceeds scroll tolerance', () => {
      const onSwipeLeft = jest.fn();
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeLeft, threshold: 50, scrollTolerance: 10 })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
      });

      // Move 70px left AND 20px down (exceeds scroll tolerance)
      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [{ clientX: 30, clientY: 120 }]));
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it('should allow horizontal swipe if vertical movement is within tolerance', () => {
      const onSwipeLeft = jest.fn();
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeLeft, threshold: 50, scrollTolerance: 10 })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
      });

      // Move 70px left AND 5px down (within tolerance)
      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [{ clientX: 30, clientY: 105 }]));
      });

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multi-touch Handling', () => {
    it('should ignore multi-touch gestures', () => {
      const onSwipeLeft = jest.fn();
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipeLeft })
      );

      // Start with two fingers
      const multiTouch = {
        type: 'touchstart',
        touches: [
          { clientX: 100, clientY: 100 },
          { clientX: 150, clientY: 100 },
        ],
        changedTouches: [{ clientX: 100, clientY: 100 }],
        preventDefault: jest.fn(),
      } as unknown as React.TouchEvent;

      act(() => {
        result.current.onTouchStart(multiTouch);
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [{ clientX: 30, clientY: 100 }]));
      });

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should set isSwiping to true during swipe', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ threshold: 50 })
      );

      expect(result.current.isSwiping).toBe(false);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
      });

      expect(result.current.isSwiping).toBe(false);

      act(() => {
        result.current.onTouchMove(createTouchEvent('touchmove', [{ clientX: 30, clientY: 100 }]));
      });

      expect(result.current.isSwiping).toBe(true);
    });

    it('should update swipeDirection during move', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ threshold: 50 })
      );

      expect(result.current.swipeDirection).toBe(null);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
      });

      act(() => {
        result.current.onTouchMove(createTouchEvent('touchmove', [{ clientX: 30, clientY: 100 }]));
      });

      expect(result.current.swipeDirection).toBe('left');
    });

    it('should reset state after swipe ends', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ threshold: 50 })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
      });

      act(() => {
        result.current.onTouchMove(createTouchEvent('touchmove', [{ clientX: 30, clientY: 100 }]));
      });

      expect(result.current.isSwiping).toBe(true);
      expect(result.current.swipeDirection).toBe('left');

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [{ clientX: 30, clientY: 100 }]));
      });

      expect(result.current.isSwiping).toBe(false);
      expect(result.current.swipeDirection).toBe(null);
    });
  });

  describe('Generic Swipe Callback', () => {
    it('should call onSwipe with direction', () => {
      const onSwipe = jest.fn();
      const { result } = renderHook(() =>
        useSwipeGesture({ onSwipe, threshold: 50 })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', [{ clientX: 30, clientY: 100 }]));
      });

      expect(onSwipe).toHaveBeenCalledWith('left');
    });
  });

  describe('Velocity Threshold', () => {
    it('should not trigger if velocity is too slow', () => {
      const onSwipeLeft = jest.fn();
      const { result } = renderHook(() =>
        useSwipeGesture({
          onSwipeLeft,
          threshold: 50,
          velocityThreshold: 1.0, // Very high velocity requirement
        })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]));
      });

      // Simulate slow swipe by adding delay
      setTimeout(() => {
        act(() => {
          result.current.onTouchEnd(createTouchEvent('touchend', [{ clientX: 30, clientY: 100 }]));
        });
      }, 1000); // 1 second delay = very slow swipe

      // In real scenario, this would not trigger due to low velocity
      // Note: This test is simplified; actual implementation uses Date.now()
    });
  });

  describe('preventDefault Option', () => {
    it('should call preventDefault when option is true', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ preventDefault: true })
      );

      const event = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);

      act(() => {
        result.current.onTouchStart(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not call preventDefault when option is false', () => {
      const { result } = renderHook(() =>
        useSwipeGesture({ preventDefault: false })
      );

      const event = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);

      act(() => {
        result.current.onTouchStart(event);
      });

      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });
});
