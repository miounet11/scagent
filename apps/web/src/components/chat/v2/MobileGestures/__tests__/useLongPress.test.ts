/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useLongPress } from '../useLongPress';

describe('useLongPress', () => {
  // Helper to create mock touch events
  const createTouchEvent = (type: string, clientX: number, clientY: number) => {
    return {
      type,
      touches: [{ clientX, clientY }],
      changedTouches: [{ clientX, clientY }],
      preventDefault: jest.fn(),
    } as unknown as React.TouchEvent;
  };

  // Helper to create mock mouse events
  const createMouseEvent = (type: string, clientX: number, clientY: number, button = 0) => {
    return {
      type,
      button,
      clientX,
      clientY,
      preventDefault: jest.fn(),
    } as unknown as React.MouseEvent;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Touch Events', () => {
    it('should trigger onLongPress after delay', async () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ delay: 500, onLongPress })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', 100, 100));
      });

      expect(result.current.isPressed).toBe(true);
      expect(onLongPress).not.toHaveBeenCalled();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).toHaveBeenCalledTimes(1);
      expect(result.current.isLongPressed).toBe(true);
    });

    it('should not trigger if released before delay', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ delay: 500, onLongPress })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', 100, 100));
      });

      // Release after 300ms (before 500ms threshold)
      act(() => {
        jest.advanceTimersByTime(300);
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', 100, 100));
      });

      expect(onLongPress).not.toHaveBeenCalled();
      expect(result.current.isPressed).toBe(false);
    });

    it('should cancel if finger moves beyond threshold', () => {
      const onLongPress = jest.fn();
      const onCancel = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({
          delay: 500,
          onLongPress,
          onCancel,
          movementThreshold: 10,
        })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', 100, 100));
      });

      // Move finger 15px (beyond 10px threshold)
      act(() => {
        result.current.onTouchMove(createTouchEvent('touchmove', 115, 100));
      });

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(result.current.isPressed).toBe(false);

      // Even if time passes, long press shouldn't trigger
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('should allow small movements within threshold', () => {
      const onLongPress = jest.fn();
      const onCancel = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({
          delay: 500,
          onLongPress,
          onCancel,
          movementThreshold: 10,
        })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', 100, 100));
      });

      // Move finger 5px (within 10px threshold)
      act(() => {
        result.current.onTouchMove(createTouchEvent('touchmove', 105, 100));
      });

      expect(onCancel).not.toHaveBeenCalled();
      expect(result.current.isPressed).toBe(true);

      // Long press should still trigger
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).toHaveBeenCalledTimes(1);
    });

    it('should ignore multi-touch', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ delay: 500, onLongPress })
      );

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

      expect(result.current.isPressed).toBe(false);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).not.toHaveBeenCalled();
    });
  });

  describe('Mouse Events', () => {
    it('should trigger onLongPress with mouse events', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ delay: 500, onLongPress })
      );

      act(() => {
        result.current.onMouseDown(createMouseEvent('mousedown', 100, 100));
      });

      expect(result.current.isPressed).toBe(true);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).toHaveBeenCalledTimes(1);
      expect(result.current.isLongPressed).toBe(true);
    });

    it('should only respond to left click', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ delay: 500, onLongPress })
      );

      // Right click (button = 2)
      act(() => {
        result.current.onMouseDown(createMouseEvent('mousedown', 100, 100, 2));
      });

      expect(result.current.isPressed).toBe(false);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('should cancel on mouse leave', () => {
      const onLongPress = jest.fn();
      const onCancel = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ delay: 500, onLongPress, onCancel })
      );

      act(() => {
        result.current.onMouseDown(createMouseEvent('mousedown', 100, 100));
      });

      expect(result.current.isPressed).toBe(true);

      act(() => {
        result.current.onMouseLeave(createMouseEvent('mouseleave', 150, 150));
      });

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(result.current.isPressed).toBe(false);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('should cancel if mouse moves beyond threshold', () => {
      const onLongPress = jest.fn();
      const onCancel = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({
          delay: 500,
          onLongPress,
          onCancel,
          movementThreshold: 10,
        })
      );

      act(() => {
        result.current.onMouseDown(createMouseEvent('mousedown', 100, 100));
      });

      // Move mouse 15px
      act(() => {
        result.current.onMouseMove(createMouseEvent('mousemove', 115, 100));
      });

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(result.current.isPressed).toBe(false);
    });
  });

  describe('Configuration Options', () => {
    it('should use custom delay', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ delay: 1000, onLongPress })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', 100, 100));
      });

      // Should not trigger at 500ms
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).not.toHaveBeenCalled();

      // Should trigger at 1000ms
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).toHaveBeenCalledTimes(1);
    });

    it('should use custom movement threshold', () => {
      const onLongPress = jest.fn();
      const onCancel = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({
          delay: 500,
          onLongPress,
          onCancel,
          movementThreshold: 20,
        })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', 100, 100));
      });

      // Move 15px (below 20px threshold)
      act(() => {
        result.current.onTouchMove(createTouchEvent('touchmove', 115, 100));
      });

      expect(onCancel).not.toHaveBeenCalled();

      // Move 25px total (above 20px threshold)
      act(() => {
        result.current.onTouchMove(createTouchEvent('touchmove', 125, 100));
      });

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call preventDefault when enabled', () => {
      const { result } = renderHook(() =>
        useLongPress({ preventDefault: true })
      );

      const event = createTouchEvent('touchstart', 100, 100);

      act(() => {
        result.current.onTouchStart(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not call preventDefault when disabled', () => {
      const { result } = renderHook(() =>
        useLongPress({ preventDefault: false })
      );

      const event = createTouchEvent('touchstart', 100, 100);

      act(() => {
        result.current.onTouchStart(event);
      });

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should disable touch detection when detectTouch is false', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ delay: 500, onLongPress, detectTouch: false })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', 100, 100));
      });

      expect(result.current.isPressed).toBe(false);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('should disable mouse detection when detectMouse is false', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ delay: 500, onLongPress, detectMouse: false })
      );

      act(() => {
        result.current.onMouseDown(createMouseEvent('mousedown', 100, 100));
      });

      expect(result.current.isPressed).toBe(false);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).not.toHaveBeenCalled();
    });
  });

  describe('Callback Lifecycle', () => {
    it('should call onPressStart when press begins', () => {
      const onPressStart = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ onPressStart })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', 100, 100));
      });

      expect(onPressStart).toHaveBeenCalledTimes(1);
    });

    it('should call onPressEnd when released before long press', () => {
      const onPressEnd = jest.fn();
      const onLongPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ delay: 500, onPressEnd, onLongPress })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', 100, 100));
      });

      act(() => {
        jest.advanceTimersByTime(300);
      });

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', 100, 100));
      });

      expect(onPressEnd).toHaveBeenCalledTimes(1);
      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('should not call onPressEnd if long press triggers', () => {
      const onPressEnd = jest.fn();
      const onLongPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ delay: 500, onPressEnd, onLongPress })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', 100, 100));
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', 100, 100));
      });

      expect(onPressEnd).not.toHaveBeenCalled();
    });

    it('should call onCancel when cancelled', () => {
      const onCancel = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ delay: 500, onCancel, movementThreshold: 10 })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', 100, 100));
      });

      act(() => {
        result.current.onTouchMove(createTouchEvent('touchmove', 120, 100));
      });

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('State Management', () => {
    it('should update isPressed state correctly', () => {
      const { result } = renderHook(() =>
        useLongPress({ delay: 500 })
      );

      expect(result.current.isPressed).toBe(false);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', 100, 100));
      });

      expect(result.current.isPressed).toBe(true);

      act(() => {
        result.current.onTouchEnd(createTouchEvent('touchend', 100, 100));
      });

      expect(result.current.isPressed).toBe(false);
    });

    it('should update isLongPressed state correctly', () => {
      const { result } = renderHook(() =>
        useLongPress({ delay: 500 })
      );

      expect(result.current.isLongPressed).toBe(false);

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', 100, 100));
      });

      expect(result.current.isLongPressed).toBe(false);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current.isLongPressed).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup timer on unmount', () => {
      const onLongPress = jest.fn();
      const { result, unmount } = renderHook(() =>
        useLongPress({ delay: 500, onLongPress })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', 100, 100));
      });

      unmount();

      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should not trigger after unmount
      expect(onLongPress).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid press and release', () => {
      const onLongPress = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ delay: 500, onLongPress })
      );

      // Press and release immediately
      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', 100, 100));
        result.current.onTouchEnd(createTouchEvent('touchend', 100, 100));
      });

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onLongPress).not.toHaveBeenCalled();
      expect(result.current.isPressed).toBe(false);
    });

    it('should handle diagonal movement correctly', () => {
      const onCancel = jest.fn();
      const { result } = renderHook(() =>
        useLongPress({ delay: 500, onCancel, movementThreshold: 10 })
      );

      act(() => {
        result.current.onTouchStart(createTouchEvent('touchstart', 100, 100));
      });

      // Move diagonally 7px in each direction (total distance ~10px)
      act(() => {
        result.current.onTouchMove(createTouchEvent('touchmove', 107, 107));
      });

      // Should be on the edge, likely triggers cancel due to Pythagorean distance
      // sqrt(7^2 + 7^2) ≈ 9.9px (just under threshold)
      // Let's move a bit more to ensure cancel
      act(() => {
        result.current.onTouchMove(createTouchEvent('touchmove', 108, 108));
      });

      expect(onCancel).toHaveBeenCalled();
    });
  });
});
