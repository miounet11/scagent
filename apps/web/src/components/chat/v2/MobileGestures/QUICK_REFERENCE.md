# Mobile Gestures - Quick Reference

## Import

```tsx
import {
  useSwipeGesture,
  useLongPress,
  combineGestures,
} from '@/components/chat/v2/MobileGestures';
```

## Swipe Gesture

### Basic Usage
```tsx
const swipe = useSwipeGesture({
  threshold: 50,              // Min distance in px
  velocityThreshold: 0.3,     // Min velocity in px/ms
  onSwipeLeft: () => {},
  onSwipeRight: () => {},
  onSwipeUp: () => {},
  onSwipeDown: () => {},
});

<div
  onTouchStart={swipe.onTouchStart}
  onTouchMove={swipe.onTouchMove}
  onTouchEnd={swipe.onTouchEnd}
/>
```

### State
- `swipe.isSwiping: boolean` - Is currently swiping
- `swipe.swipeDirection: 'left' | 'right' | 'up' | 'down' | null`

### Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `threshold` | `number` | `50` | Min distance (px) |
| `velocityThreshold` | `number` | `0.3` | Min velocity (px/ms) |
| `scrollTolerance` | `number` | `10` | Vertical scroll tolerance |
| `preventDefault` | `boolean` | `false` | Prevent default behavior |

## Long Press

### Basic Usage
```tsx
const longPress = useLongPress({
  delay: 500,                 // Duration in ms
  movementThreshold: 10,      // Max movement in px
  onLongPress: () => {},
});

<div
  onTouchStart={longPress.onTouchStart}
  onTouchMove={longPress.onTouchMove}
  onTouchEnd={longPress.onTouchEnd}
  onMouseDown={longPress.onMouseDown}  // Desktop support
  onMouseUp={longPress.onMouseUp}
/>
```

### State
- `longPress.isPressed: boolean` - Is currently pressed
- `longPress.isLongPressed: boolean` - Long press triggered

### Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `delay` | `number` | `500` | Duration (ms) |
| `movementThreshold` | `number` | `10` | Max movement (px) |
| `preventDefault` | `boolean` | `true` | Prevent context menu |
| `detectMouse` | `boolean` | `true` | Enable mouse events |
| `detectTouch` | `boolean` | `true` | Enable touch events |

## Combine Gestures

### Easy Way
```tsx
const swipe = useSwipeGesture({ onSwipeLeft: () => {} });
const longPress = useLongPress({ onLongPress: () => {} });

const handlers = combineGestures(swipe, longPress);

return <div {...handlers}>Content</div>;
```

### Manual Way
```tsx
<div
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
/>
```

## CSS Essentials

```css
/* Allow vertical scroll, detect horizontal swipe */
.swipeable-horizontal {
  touch-action: pan-y;
}

/* Allow horizontal scroll, detect vertical swipe */
.swipeable-vertical {
  touch-action: pan-x;
}

/* Visual feedback */
.pressed {
  transform: scale(0.98);
  opacity: 0.9;
}
```

## Common Patterns

### Message Swipe Actions
```tsx
const swipe = useSwipeGesture({
  threshold: 80,
  onSwipeLeft: deleteMessage,
  onSwipeRight: replyMessage,
});
```

### Context Menu
```tsx
const longPress = useLongPress({
  delay: 500,
  onLongPress: showContextMenu,
});
```

### Drawer Close
```tsx
const swipe = useSwipeGesture({
  threshold: 100,
  onSwipeLeft: () => isOpen && onClose(),
});
```

## Debugging

```tsx
// Log all events
const swipe = useSwipeGesture({
  onSwipe: (direction) => console.log('Swiped:', direction),
  onSwipeLeft: () => console.log('Action: Delete'),
});

// Show state
console.log('Swiping:', swipe.isSwiping);
console.log('Direction:', swipe.swipeDirection);
console.log('Pressed:', longPress.isPressed);
```

## Testing

```bash
# Run unit tests
pnpm --filter web test -- MobileGestures

# Run specific test
pnpm --filter web test -- useSwipeGesture.test.ts
```

## Browser Support

| Platform | Browser | Status |
|----------|---------|--------|
| iOS | Safari 12+ | ✅ |
| Android | Chrome 70+ | ✅ |
| Desktop | All | ⚠️ Mouse only for long press |

## Performance Tips

1. **Memoize callbacks**: Use `useCallback` for handlers
2. **Use transforms**: Prefer `transform` over `left/right`
3. **Add will-change**: For animated elements
4. **Set touch-action**: Control browser behavior

## Files

- **Docs**: `MobileGestures/README.md`
- **Integration**: `MobileGestures/INTEGRATION_GUIDE.md`
- **Example**: `MobileGestures/GestureExample.tsx`
- **Tests**: `MobileGestures/__tests__/`

## Common Issues

### Swipe not working
- Check `threshold` (try lowering)
- Check `touch-action` CSS
- Verify not prevented by parent

### Conflicts with scroll
- Increase `scrollTolerance`
- Set `preventDefault: false`
- Use `touch-action: pan-y`

### Long press shows context menu
- Set `preventDefault: true`
- Add CSS: `-webkit-user-select: none`

### Performance issues
- Memoize callbacks
- Use CSS transforms
- Check for excessive re-renders
