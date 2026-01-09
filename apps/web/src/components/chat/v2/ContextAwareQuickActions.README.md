# ContextAwareQuickActions Component

**Version:** 1.0
**Location:** `/home/sillytavern/apps/web/src/components/chat/v2/ContextAwareQuickActions.tsx`

AI-powered quick action recommendation component with Theater Soul Experience styling.

---

## Features

- ✨ **AI Recommendation Engine**: Analyzes last 3 messages for contextually relevant actions
- 🎯 **Smart Keyword Matching**: Client-side matching with 20+ keywords per category
- 🎨 **Theater Soul Styling**: Glassmorphism with category-based color coding
- 🔄 **Smooth Transitions**: Fade animations when recommendations update
- 📱 **Responsive Design**: Mobile-optimized with touch-friendly targets
- ♿ **Accessible**: WCAG AA compliant with ARIA labels and keyboard support

---

## Quick Start

```tsx
import ContextAwareQuickActions from '@/components/chat/v2/ContextAwareQuickActions'

function ChatInterface() {
  const [messages, setMessages] = useState([...])

  return (
    <ContextAwareQuickActions
      messages={messages.slice(-3)} // Last 3 messages
      onActionSelect={(action) => {
        // Insert action into input or send directly
        console.log(`Selected: ${action.emoji} ${action.label}`)
      }}
      onOpenRadialMenu={() => {
        // Open full action menu
        setRadialMenuOpen(true)
      }}
      disabled={isGenerating}
      maxActions={6}
      showCategories={false}
    />
  )
}
```

---

## API Reference

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `messages` | `Message[]` | ✅ | - | Last 3 messages for context analysis |
| `onActionSelect` | `(action: QuickAction) => void` | ✅ | - | Callback when action is clicked |
| `onOpenRadialMenu` | `() => void` | ✅ | - | Callback when "More" button is clicked |
| `disabled` | `boolean` | ❌ | `false` | Disable all actions |
| `maxActions` | `number` | ❌ | `6` | Max actions to display (4-8 recommended) |
| `showCategories` | `boolean` | ❌ | `false` | Show category legend badges |

### Types

```typescript
// Message structure
interface Message {
  role: string        // 'user' | 'assistant'
  content: string     // Message text
}

// Quick action definition
interface QuickAction {
  id: string                              // Unique identifier
  label: string                           // Display name (Chinese)
  emoji: string                           // Visual emoji
  category: QuickActionCategory           // Action category
  keywords: string[]                      // Trigger keywords
}

type QuickActionCategory = 'intimate' | 'expression' | 'verbal'
```

---

## AI Recommendation Logic

### How It Works

1. **Message Analysis**: Extracts text from last 3 messages
2. **Keyword Matching**: Counts keyword occurrences in combined text
3. **Recency Boost**: Last message keywords get 1.5x weight
4. **Score Sorting**: Actions sorted by total keyword match score
5. **Smart Fallback**: Returns balanced defaults if no matches found

### Keyword Categories

#### 亲密动作 (Intimate)
- **Actions**: 拥抱, 牵手, 亲吻, 摸头, 抚脸, 紧抱, 依偎, 耳语
- **Keywords**: 温柔, 爱, 喜欢, 心动, 安慰, 想念, 难过, 哭, 一起, 陪伴, 想你, 深情, 可爱, 乖, 害羞, 不舍, 离别, 重逢, 温暖, 安全, 困, 秘密, 悄悄, 轻声, 亲密, 靠近

#### 情感表达 (Expression)
- **Actions**: 微笑, 脸红, 凝视, 叹息, 大笑, 哭泣, 嘟嘴, 惊讶, 点头, 摇头
- **Keywords**: 开心, 高兴, 快乐, 愉快, 满意, 害羞, 尴尬, 紧张, 心动, 表白, 认真, 深情, 专注, 观察, 注视, 难过, 无奈, 疲惫, 失望, 复杂, 有趣, 好笑, 欢乐, 伤心, 委屈, 感动, 痛苦, 生气, 不满, 撒娇, 惊讶, 吃惊, 意外, 震惊, 不敢相信, 同意, 理解, 认可, 好的, 嗯, 不同意, 拒绝, 不, 否定

#### 语言互动 (Verbal)
- **Actions**: 询问, 安慰, 夸奖, 调侃, 道歉, 感谢, 鼓励, 解释
- **Keywords**: 问题, 疑问, 好奇, 不明白, 为什么, 怎么, 担心, 害怕, 不开心, 厉害, 棒, 优秀, 成功, 做到了, 好, 开玩笑, 逗, 玩, 对不起, 抱歉, 错了, 不好意思, 愧疚, 谢谢, 感谢, 辛苦, 帮助, 帮忙, 加油, 努力, 坚持, 相信, 可以的, 因为, 所以, 原因, 说明, 困惑

### Example Scenarios

```typescript
// Scenario 1: Romantic conversation
messages = [
  { role: 'user', content: '我真的很喜欢你，和你在一起感觉很温柔。' },
  { role: 'assistant', content: '我的心也在为你心动...' }
]
// Recommendations: 拥抱, 牵手, 亲吻, 摸头, 微笑, 凝视

// Scenario 2: Comforting
messages = [
  { role: 'user', content: '今天发生了很多事，我有点难过...' },
  { role: 'assistant', content: '别担心，我在这里陪着你。' }
]
// Recommendations: 拥抱, 安慰, 摸头, 微笑, 叹息, 询问

// Scenario 3: Curious/Questioning
messages = [
  { role: 'user', content: '为什么会这样呢？我很好奇。' },
  { role: 'assistant', content: '这是个好问题，让我解释一下。' }
]
// Recommendations: 询问, 解释, 点头, 思考, 凝视, 微笑
```

---

## Styling

### Theater Soul Color System

```typescript
const theaterColors = {
  spotlightGold: '#f5c542',           // Primary accent
  spotlightGoldDim: 'rgba(245, 197, 66, 0.3)',
  moonlight: 'rgba(196, 181, 253, 0.6)',
  emotionRose: 'rgba(232, 72, 106, 0.6)',
  voidDark: 'rgba(26, 20, 41, 0.95)', // Background
  glassBorder: 'rgba(245, 197, 66, 0.15)',
  glassBackground: 'rgba(26, 20, 41, 0.85)',
}

const categoryColors = {
  intimate: 'rgba(236, 72, 153, 0.6)',    // Rose/Pink
  expression: 'rgba(251, 191, 36, 0.6)',  // Gold/Yellow
  verbal: 'rgba(96, 165, 250, 0.6)',      // Blue
}
```

### Visual States

- **Default**: Glass background with category-colored border
- **Hover**: Glow effect + translateY(-2px)
- **Active**: Reset translateY(0)
- **Disabled**: 50% opacity, muted border
- **Loading**: Pulsing AI analysis badge

---

## Component States

### Empty State
- Shows when `recommendedActions.length === 0` and not analyzing
- Displays placeholder message: "开始对话后将显示智能推荐动作"

### Analyzing State
- Brief 150ms delay for smooth UX
- Shows loader + "AI分析中..." badge
- Prevents jarring instant updates

### Loaded State
- Displays 4-6 recommended actions
- Each action has category-colored border
- "More" button with spotlight gold accent

---

## Performance

- **Memoized**: Component uses `memo()` for re-render optimization
- **Lazy Analysis**: 150ms debounce prevents over-analysis
- **Client-Side**: No API calls, instant recommendations
- **Lightweight**: ~50KB including all 25+ actions

---

## Accessibility

- **Keyboard Navigation**: All buttons focusable
- **Screen Readers**: ARIA labels on all interactive elements
- **Color Contrast**: WCAG AA compliant (4.5:1 minimum)
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **Touch Targets**: Minimum 44x44px on mobile

---

## Integration Examples

### Basic Usage

```tsx
<ContextAwareQuickActions
  messages={chatMessages.slice(-3)}
  onActionSelect={(action) => {
    setInputValue(prev => `${prev} *${action.label}*`)
  }}
  onOpenRadialMenu={() => setRadialMenuOpen(true)}
/>
```

### With Message Input

```tsx
function ChatInput() {
  const { messages } = useChatStore()
  const [input, setInput] = useState('')

  return (
    <Stack>
      <ContextAwareQuickActions
        messages={messages.slice(-3)}
        onActionSelect={(action) => {
          // Insert at cursor or append
          setInput(prev => `${prev} *${action.label}*`)
        }}
        onOpenRadialMenu={() => {
          // Open full action menu
        }}
      />
      <Textarea value={input} onChange={(e) => setInput(e.target.value)} />
    </Stack>
  )
}
```

### With Character Context

```tsx
<ContextAwareQuickActions
  messages={messages.slice(-3)}
  onActionSelect={(action) => {
    // Format with character name
    const characterName = currentCharacter.name
    const formatted = `*对${characterName}${action.label}*`
    sendMessage(formatted)
  }}
  onOpenRadialMenu={() => {
    openRadialMenu(currentCharacter)
  }}
  disabled={isGenerating}
/>
```

---

## Advanced Usage

### Custom Action Database

```typescript
import { AIRecommendationEngine, type QuickAction } from './ContextAwareQuickActions'

const customActions: QuickAction[] = [
  {
    id: 'custom_1',
    label: '递水',
    emoji: '💧',
    category: 'verbal',
    keywords: ['渴', '喝', '水', '口渴']
  },
  // ... more custom actions
]

const engine = new AIRecommendationEngine(customActions)
const recommendations = engine.recommend(messages, 6)
```

### Manual Recommendation

```typescript
import { AIRecommendationEngine, QUICK_ACTIONS } from './ContextAwareQuickActions'

const engine = new AIRecommendationEngine(QUICK_ACTIONS)

// Get recommendations
const recommended = engine.recommend(
  [
    { role: 'user', content: '我有点难过...' },
    { role: 'assistant', content: '别担心，我在这里。' }
  ],
  4 // Get top 4 actions
)

console.log(recommended)
// [{ id: 'hug', label: '拥抱', ... }, ...]
```

---

## Testing

### Unit Test Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import ContextAwareQuickActions from './ContextAwareQuickActions'

describe('ContextAwareQuickActions', () => {
  it('recommends intimate actions for romantic messages', () => {
    const messages = [
      { role: 'user', content: '我喜欢你' },
      { role: 'assistant', content: '我也爱你' }
    ]

    const onSelect = jest.fn()

    render(
      <ContextAwareQuickActions
        messages={messages}
        onActionSelect={onSelect}
        onOpenRadialMenu={() => {}}
      />
    )

    // Should show intimate actions
    expect(screen.getByText('拥抱')).toBeInTheDocument()

    // Click action
    fireEvent.click(screen.getByText('拥抱'))
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ label: '拥抱' })
    )
  })
})
```

---

## Known Limitations

1. **Chinese-Only Keywords**: Current keyword database is Chinese-only
2. **Simple Matching**: Uses basic substring matching (no NLP/ML)
3. **No Context History**: Only analyzes last 3 messages, no long-term context
4. **Fixed Action Set**: 25 predefined actions (extensible via custom actions)
5. **Client-Side Only**: No server-side recommendation API

---

## Future Enhancements

- [ ] Multi-language keyword support (English, Japanese)
- [ ] User-customizable action database
- [ ] Machine learning-based recommendations
- [ ] Long-term context memory (10+ message analysis)
- [ ] A/B testing framework for recommendation quality
- [ ] Analytics integration (track most-used actions)
- [ ] Voice/audio context analysis
- [ ] Sentiment analysis integration

---

## Related Components

- **RadialMenu**: Full action selection menu (to be connected via `onOpenRadialMenu`)
- **EmotionTransitionBadge**: Emotion display system
- **MessageInput**: Main chat input component
- **RPGQuickActions**: Legacy quick actions (v1)

---

## Changelog

### v1.0 (2025-12-28)
- ✨ Initial release
- ✨ AI recommendation engine with keyword matching
- ✨ 25 predefined actions across 3 categories
- ✨ Theater Soul Experience styling
- ✨ Smooth fade transitions
- ✨ Empty state and loading states
- ✨ Full TypeScript support
- ✨ Accessibility compliance (WCAG AA)

---

## Credits

**Design System**: Theater Soul Experience
**Author**: SillyTavern Team
**License**: MIT

---

## Support

For issues or feature requests, please contact the development team or file an issue in the repository.
