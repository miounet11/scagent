# Mobile Gestures Module

Comprehensive mobile gesture detection hooks for React applications, optimized for iOS Safari and Android Chrome.

## Features

### ✨ Swipe Gesture Detection
- **Four-directional swipes**: left, right, up, down
- **Configurable thresholds**: distance and velocity
- **Scroll conflict handling**: intelligent detection to avoid interfering with page scrolling
- **Multi-touch filtering**: ignores multi-touch gestures
- **Real-time feedback**: `isSwiping` and `swipeDirection` states

### 🖱️ Long Press Detection
- **Cross-platform**: Works with both touch and mouse events
- **Customizable delay**: default 500ms
- **Movement tolerance**: cancels if finger/cursor moves too much
- **Visual feedback states**: `isPressed` and `isLongPressed`
- **Callbacks**: onPressStart, onLongPress, onPressEnd, onCancel

## Installation

The module is already part of the project. Import from:

```typescript
import { useSwipeGesture, useLongPress } from '@/components/chat/v2/MobileGestures';
```

## API Reference

### `useSwipeGesture`

#### Options

```typescript
interface SwipeGestureOptions {
  threshold?: number;              // Min distance in px (default: 50)
  velocityThreshold?: number;      // Min velocity in px/ms (default: 0.3)
  scrollTolerance?: number;        // Vertical scroll tolerance (default: 10)
  preventDefault?: boolean;        // Prevent default behavior (default: false)

  // Callbacks
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipe?: (direction: SwipeDirection) => void;
}
```

#### Return Value

```typescript
interface SwipeGestureHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  swipeDirection: 'left' | 'right' | 'up' | 'down' | null;
  isSwiping: boolean;
}
```

#### Example Usage

```tsx
// Basic swipe detection
function SwipeableCard() {
  const { onTouchStart, onTouchMove, onTouchEnd, swipeDirection } = useSwipeGesture({
    threshold: 100,
    onSwipeLeft: () => console.log('Next card'),
    onSwipeRight: () => console.log('Previous card'),
  });

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={swipeDirection ? `swiping-${swipeDirection}` : ''}
    >
      Swipe me!
    </div>
  );
}

// Advanced: Drawer with swipe to close
function Drawer({ isOpen, onClose }) {
  const { onTouchStart, onTouchMove, onTouchEnd, isSwiping, swipeDirection } = useSwipeGesture({
    threshold: 80,
    velocityThreshold: 0.5,
    onSwipeLeft: () => {
      if (isOpen) onClose();
    },
  });

  return (
    <div
      className={`drawer ${isOpen ? 'open' : ''} ${isSwiping ? 'dragging' : ''}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        transform: swipeDirection === 'left' && isSwiping
          ? 'translateX(-20px)'
          : 'translateX(0)',
      }}
    >
      Drawer content
    </div>
  );
}
```

### `useLongPress`

#### Options

```typescript
interface LongPressOptions {
  delay?: number;                  // Duration in ms (default: 500)
  movementThreshold?: number;      // Max movement in px (default: 10)
  preventDefault?: boolean;        // Prevent context menu (default: true)
  detectMouse?: boolean;           // Enable mouse events (default: true)
  detectTouch?: boolean;           // Enable touch events (default: true)

  // Callbacks
  onLongPress?: (event: React.TouchEvent | React.MouseEvent) => void;
  onPressStart?: (event: React.TouchEvent | React.MouseEvent) => void;
  onPressEnd?: (event: React.TouchEvent | React.MouseEvent) => void;
  onCancel?: () => void;
}
```

#### Return Value

```typescript
interface LongPressHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  isPressed: boolean;
  isLongPressed: boolean;
}
```

#### Example Usage

```tsx
// Basic long press
function LongPressButton() {
  const {
    onTouchStart,
    onTouchEnd,
    onMouseDown,
    onMouseUp,
    isPressed,
  } = useLongPress({
    delay: 600,
    onLongPress: () => console.log('Long pressed!'),
  });

  return (
    <button
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      className={isPressed ? 'pressed' : ''}
    >
      Long press me!
    </button>
  );
}

// Advanced: Message with ripple effect
function Message({ content }) {
  const {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    isPressed,
    isLongPressed,
  } = useLongPress({
    delay: 500,
    onLongPress: () => {
      // Show context menu
      showMessageMenu();
    },
    onPressStart: () => {
      // Start ripple animation
      startRipple();
    },
  });

  return (
    <div
      className={`message ${isPressed ? 'pressed' : ''} ${isLongPressed ? 'long-pressed' : ''}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {isPressed && <div className="ripple-effect" />}
      {content}
    </div>
  );
}
```

## Combining Gestures

You can use both hooks on the same element:

```tsx
function InteractiveCard() {
  const swipe = useSwipeGesture({
    onSwipeLeft: () => console.log('Next'),
    onSwipeRight: () => console.log('Previous'),
  });

  const longPress = useLongPress({
    onLongPress: () => console.log('Show menu'),
  });

  return (
    <div
      // Swipe handlers
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
      // Mouse handlers for long press
      onMouseDown={longPress.onMouseDown}
      onMouseUp={longPress.onMouseUp}
      className={longPress.isPressed ? 'pressed' : ''}
    >
      Swipe or long press me!
    </div>
  );
}
```

## Edge Cases & Considerations

### Scroll Conflicts

The `useSwipeGesture` hook includes intelligent scroll detection:

```typescript
const swipe = useSwipeGesture({
  scrollTolerance: 10, // Pixels of vertical movement to tolerate
  // If vertical scroll > 10px, horizontal swipe is cancelled
});
```

**Recommendation**: Set `preventDefault: false` (default) to allow normal scrolling.

### Multi-touch

Both hooks automatically ignore multi-touch gestures:
- Swipe: Only tracks single-finger swipes
- Long press: Cancels if additional fingers touch the screen

### iOS Safari Quirks

**Context Menu**: iOS shows a context menu on long press. The hook prevents this by default:

```typescript
const longPress = useLongPress({
  preventDefault: true, // Default: prevents iOS context menu
});
```

**Passive Event Listeners**: Touch events use passive listeners by default for better scroll performance. Set `preventDefault: true` only when necessary.

### Android Chrome Quirks

**Pull-to-refresh**: Vertical swipes near the top of the page may trigger pull-to-refresh. Consider:

```typescript
const swipe = useSwipeGesture({
  onSwipeDown: () => {
    // Only enable on non-scrollable containers
  },
});
```

## Testing Guide

### Manual Testing Checklist

#### iOS Safari
- [ ] Single swipe left/right works
- [ ] Single swipe up/down works
- [ ] Swipe doesn't interfere with vertical scrolling
- [ ] Long press shows custom action (not context menu)
- [ ] Multi-touch is ignored
- [ ] Swipe velocity threshold works
- [ ] Long press cancels on finger movement

#### Android Chrome
- [ ] All swipe directions work
- [ ] Swipe doesn't trigger pull-to-refresh
- [ ] Long press works
- [ ] Multi-touch is ignored
- [ ] Gesture works in scrollable containers

### Test Cases

```tsx
// Test component
function GestureTestCard() {
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const swipe = useSwipeGesture({
    threshold: 50,
    velocityThreshold: 0.3,
    onSwipeLeft: () => addLog('SWIPE LEFT'),
    onSwipeRight: () => addLog('SWIPE RIGHT'),
    onSwipeUp: () => addLog('SWIPE UP'),
    onSwipeDown: () => addLog('SWIPE DOWN'),
  });

  const longPress = useLongPress({
    delay: 500,
    onLongPress: () => addLog('LONG PRESS'),
    onPressStart: () => addLog('Press started'),
    onPressEnd: () => addLog('Press ended'),
    onCancel: () => addLog('Press cancelled'),
  });

  return (
    <div className="test-container">
      <div
        className="gesture-area"
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
      >
        <div>Swipe Direction: {swipe.swipeDirection || 'none'}</div>
        <div>Is Swiping: {swipe.isSwiping ? 'yes' : 'no'}</div>
        <div>Is Pressed: {longPress.isPressed ? 'yes' : 'no'}</div>
        <div>Is Long Pressed: {longPress.isLongPressed ? 'yes' : 'no'}</div>
      </div>

      <div className="log">
        {log.map((entry, i) => (
          <div key={i}>{entry}</div>
        ))}
      </div>
    </div>
  );
}
```

## Performance Considerations

### Optimization Tips

1. **Memoize callbacks**: Use `useCallback` for gesture callbacks to prevent re-renders

```tsx
const handleSwipeLeft = useCallback(() => {
  // Your logic
}, [dependencies]);

const swipe = useSwipeGesture({
  onSwipeLeft: handleSwipeLeft,
});
```

2. **Throttle visual updates**: For smooth animations, consider throttling state updates

```tsx
const [position, setPosition] = useState(0);
const throttledSetPosition = useThrottledCallback(setPosition, 16); // 60fps
```

3. **Cleanup**: Both hooks automatically cleanup timers and event listeners

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| iOS Safari | 12+ | ✅ Fully supported |
| Android Chrome | 70+ | ✅ Fully supported |
| iOS Chrome | 12+ | ✅ Fully supported |
| Android Firefox | 68+ | ✅ Fully supported |
| Desktop Chrome | Any | ✅ Mouse events supported |
| Desktop Safari | Any | ✅ Mouse events supported |

## Troubleshooting

### Swipe not triggering

**Problem**: Swipe gestures don't fire

**Solutions**:
1. Check threshold values (lower = more sensitive)
2. Check velocity threshold (lower = more sensitive)
3. Ensure element has touch-action CSS property:
   ```css
   .swipeable {
     touch-action: pan-y; /* Allow vertical scroll, detect horizontal swipe */
   }
   ```

### Long press conflicts with scrolling

**Problem**: Long press triggers while scrolling

**Solution**: Increase movement threshold:
```typescript
useLongPress({
  movementThreshold: 15, // More tolerant of finger drift
});
```

### Performance issues

**Problem**: Janky animations during gestures

**Solutions**:
1. Use CSS transforms instead of position changes
2. Add `will-change: transform` to animated elements
3. Memoize callback functions
4. Consider using `requestAnimationFrame` for updates

## License

Part of SillyTavern Web - Internal use only
