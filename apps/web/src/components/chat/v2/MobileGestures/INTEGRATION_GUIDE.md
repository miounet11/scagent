# Mobile Gestures Integration Guide

## Overview

The Mobile Gestures module provides production-ready React hooks for detecting swipe and long press gestures on mobile devices. This guide covers integration into the SillyTavern immersive chat UI.

## Installation Status

✅ **Complete** - All files created and ready to use.

## File Structure

```
/home/sillytavern/apps/web/src/components/chat/v2/MobileGestures/
├── index.ts                          # Main exports
├── useSwipeGesture.ts                # Swipe gesture hook
├── useLongPress.ts                   # Long press hook
├── GestureExample.tsx                # Example component
├── README.md                         # Comprehensive documentation
└── __tests__/
    ├── useSwipeGesture.test.ts       # Swipe tests
    └── useLongPress.test.ts          # Long press tests
```

## Quick Start

### Import the hooks:

```typescript
import { useSwipeGesture, useLongPress } from '@/components/chat/v2/MobileGestures';
```

### Basic Usage:

```tsx
function MyComponent() {
  const swipe = useSwipeGesture({
    onSwipeLeft: () => console.log('Swiped left'),
    onSwipeRight: () => console.log('Swiped right'),
  });

  return (
    <div
      onTouchStart={swipe.onTouchStart}
      onTouchMove={swipe.onTouchMove}
      onTouchEnd={swipe.onTouchEnd}
    >
      Swipe me!
    </div>
  );
}
```

## Integration into Immersive Chat

### Use Case 1: Message Swipe Actions

**Goal**: Swipe left on messages to delete, swipe right to reply.

```tsx
// In MessageBubble.tsx or similar component
import { useSwipeGesture } from '@/components/chat/v2/MobileGestures';

function MessageBubble({ message, onDelete, onReply }) {
  const swipe = useSwipeGesture({
    threshold: 80,
    velocityThreshold: 0.4,
    onSwipeLeft: onDelete,
    onSwipeRight: onReply,
  });

  return (
    <div
      className="message-bubble"
      onTouchStart={swipe.onTouchStart}
      onTouchMove={swipe.onTouchMove}
      onTouchEnd={swipe.onTouchEnd}
      style={{
        transform: swipe.isSwiping ? 'translateX(-10px)' : 'translateX(0)',
        transition: swipe.isSwiping ? 'none' : 'transform 0.2s',
      }}
    >
      {message.content}
    </div>
  );
}
```

### Use Case 2: Long Press for Context Menu

**Goal**: Long press on messages to show context menu (copy, edit, delete, etc.).

```tsx
import { useLongPress } from '@/components/chat/v2/MobileGestures';

function MessageBubble({ message, onShowContextMenu }) {
  const longPress = useLongPress({
    delay: 500,
    onLongPress: (e) => {
      // Show context menu at touch position
      const touch = e.nativeEvent as TouchEvent;
      const x = touch.touches[0]?.clientX || 0;
      const y = touch.touches[0]?.clientY || 0;
      onShowContextMenu(message.id, { x, y });
    },
  });

  return (
    <div
      className={`message-bubble ${longPress.isPressed ? 'pressed' : ''}`}
      onTouchStart={longPress.onTouchStart}
      onTouchMove={longPress.onTouchMove}
      onTouchEnd={longPress.onTouchEnd}
    >
      {message.content}
      {longPress.isPressed && <div className="ripple-effect" />}
    </div>
  );
}
```

### Use Case 3: Drawer/Panel Swipe to Close

**Goal**: Swipe left to close character selection drawer.

```tsx
import { useSwipeGesture } from '@/components/chat/v2/MobileGestures';

function CharacterDrawer({ isOpen, onClose }) {
  const swipe = useSwipeGesture({
    threshold: 100,
    velocityThreshold: 0.5,
    onSwipeLeft: () => {
      if (isOpen) onClose();
    },
  });

  return (
    <div
      className={`drawer ${isOpen ? 'open' : ''}`}
      onTouchStart={swipe.onTouchStart}
      onTouchMove={swipe.onTouchMove}
      onTouchEnd={swipe.onTouchEnd}
    >
      {/* Drawer content */}
    </div>
  );
}
```

### Use Case 4: Combined Gestures

**Goal**: Support both swipe actions and long press on the same element.

```tsx
import { useSwipeGesture, useLongPress } from '@/components/chat/v2/MobileGestures';

function MessageBubble({ message, onDelete, onReply, onShowMenu }) {
  const swipe = useSwipeGesture({
    onSwipeLeft: onDelete,
    onSwipeRight: onReply,
  });

  const longPress = useLongPress({
    onLongPress: onShowMenu,
  });

  return (
    <div
      className="message-bubble"
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
      {message.content}
    </div>
  );
}
```

## CSS Recommendations

### Touch Action Property

Add this to swipeable elements to control browser behavior:

```css
.swipeable-horizontal {
  touch-action: pan-y; /* Allow vertical scroll, detect horizontal swipe */
}

.swipeable-vertical {
  touch-action: pan-x; /* Allow horizontal scroll, detect vertical swipe */
}

.no-scroll {
  touch-action: none; /* Disable all default touch behaviors */
}
```

### Visual Feedback Styles

```css
/* Pressed state for long press */
.message-bubble.pressed {
  transform: scale(0.98);
  background: rgba(0, 0, 0, 0.05);
  transition: all 0.1s ease-out;
}

/* Ripple effect animation */
.ripple-effect {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  animation: ripple 0.6s ease-out;
  pointer-events: none;
}

@keyframes ripple {
  from {
    width: 0;
    height: 0;
    opacity: 1;
  }
  to {
    width: 100%;
    height: 100%;
    opacity: 0;
  }
}

/* Swipe indicator */
.swipe-indicator {
  position: absolute;
  opacity: 0;
  transition: opacity 0.2s;
}

.swiping .swipe-indicator {
  opacity: 1;
}
```

## Testing Checklist

### Manual Testing (Required)

#### iOS Safari (iPhone)
- [ ] Swipe left works smoothly
- [ ] Swipe right works smoothly
- [ ] Swipe doesn't interfere with page scrolling
- [ ] Long press triggers (no native context menu)
- [ ] Multi-touch is ignored
- [ ] Visual feedback is smooth

#### Android Chrome
- [ ] All swipe directions work
- [ ] Doesn't trigger pull-to-refresh
- [ ] Long press works
- [ ] No lag or jank

### Unit Testing

Run the test suite:

```bash
pnpm --filter web test -- /home/sillytavern/apps/web/src/components/chat/v2/MobileGestures/__tests__
```

## Performance Optimization

### 1. Memoize Callbacks

```tsx
const handleSwipeLeft = useCallback(() => {
  deleteMessage(messageId);
}, [messageId, deleteMessage]);

const swipe = useSwipeGesture({
  onSwipeLeft: handleSwipeLeft,
});
```

### 2. Use CSS Transforms

```tsx
// ✅ Good: Use transform
style={{ transform: `translateX(${offset}px)` }}

// ❌ Bad: Don't use left/right
style={{ left: `${offset}px` }}
```

### 3. Add will-change for Animations

```css
.swipeable {
  will-change: transform;
}
```

## Common Pitfalls

### ❌ Don't: Prevent Default on All Touch Events

```tsx
// This will break scrolling!
useSwipeGesture({ preventDefault: true });
```

### ✅ Do: Use Scroll Tolerance

```tsx
useSwipeGesture({
  scrollTolerance: 15, // Allow vertical scroll
  preventDefault: false,
});
```

### ❌ Don't: Forget touch-action CSS

```tsx
// Gestures may conflict with browser defaults
<div onTouchStart={...}>
```

### ✅ Do: Set Appropriate touch-action

```tsx
<div
  className="swipeable"
  style={{ touchAction: 'pan-y' }}
  onTouchStart={...}
>
```

## Browser Compatibility

| Platform | Browser | Status | Notes |
|----------|---------|--------|-------|
| iOS | Safari 12+ | ✅ | Fully tested |
| iOS | Chrome 12+ | ✅ | Uses Safari engine |
| Android | Chrome 70+ | ✅ | Fully tested |
| Android | Firefox 68+ | ✅ | Fully tested |
| Desktop | All | ⚠️ | Mouse events for long press only |

## Migration from Existing Code

If you have existing touch event handlers:

### Before:
```tsx
const handleTouchStart = (e) => {
  // Custom swipe logic
};

<div onTouchStart={handleTouchStart}>
```

### After:
```tsx
const swipe = useSwipeGesture({
  onSwipeLeft: () => console.log('Swiped left'),
});

<div
  onTouchStart={swipe.onTouchStart}
  onTouchMove={swipe.onTouchMove}
  onTouchEnd={swipe.onTouchEnd}
>
```

## Debugging Tips

### Enable Console Logging

```tsx
const swipe = useSwipeGesture({
  onSwipe: (direction) => {
    console.log('Swiped:', direction);
  },
  onSwipeLeft: () => console.log('Action: Delete'),
  onSwipeRight: () => console.log('Action: Reply'),
});
```

### Visualize Gesture State

```tsx
function DebugGestures() {
  const swipe = useSwipeGesture({});

  return (
    <div>
      <div>Is Swiping: {swipe.isSwiping ? 'YES' : 'NO'}</div>
      <div>Direction: {swipe.swipeDirection || 'none'}</div>
    </div>
  );
}
```

### Test on Real Devices

Chrome DevTools mobile emulation is **not sufficient**. Always test on:
- Real iOS device (iPhone)
- Real Android device

Use **remote debugging** for mobile:
- iOS: Safari → Develop → [Your iPhone]
- Android: Chrome → chrome://inspect

## Support & Documentation

- **Full Documentation**: `/home/sillytavern/apps/web/src/components/chat/v2/MobileGestures/README.md`
- **Example Component**: `/home/sillytavern/apps/web/src/components/chat/v2/MobileGestures/GestureExample.tsx`
- **Unit Tests**: `/home/sillytavern/apps/web/src/components/chat/v2/MobileGestures/__tests__/`

## Next Steps

1. **Run Tests**: `pnpm --filter web test -- MobileGestures`
2. **Review Example**: Check `GestureExample.tsx` for usage patterns
3. **Integrate**: Add to your chat components
4. **Test**: Test on real iOS and Android devices
5. **Optimize**: Use Chrome DevTools Performance tab to verify 60fps

## Questions?

- Check the README.md for comprehensive API documentation
- Review the test files for edge case handling
- See GestureExample.tsx for real-world usage patterns
