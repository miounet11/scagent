# EmotionAtmosphere 集成指南

## 概述

`EmotionAtmosphere` 是一个轻量级情绪氛围系统，根据角色消息内容自动检测情绪，并联动多个视觉元素：

- ✨ **背景色调渐变** - 消息区域的半透明渐变叠加
- 💫 **光晕颜色变化** - 角色头像/立绘周围的动态光效
- 🎭 **立绘表情切换** - 调用现有 `setExpressionByEmotion`
- ✨ **微粒效果** - 可选，根据情绪类型展示不同粒子

## 快速开始

### 1. 在 ChatInterface 中集成 Provider

```tsx
// apps/web/src/components/chat/ChatInterface.tsx

import { EmotionAtmosphereProvider } from './EmotionAtmosphere'
import { useRPGModeStore } from '@/stores/rpgModeStore'

export default function ChatInterface({ ... }: ChatInterfaceProps) {
  const { isRPGMode } = useRPGModeStore()

  // 检测是否启用粒子效果（从用户设置中读取）
  const [enableParticles, setEnableParticles] = useState(false)

  useEffect(() => {
    try {
      const settings = localStorage.getItem('emotion_atmosphere_settings')
      if (settings) {
        const { particlesEnabled } = JSON.parse(settings)
        setEnableParticles(particlesEnabled ?? false)
      }
    } catch {}
  }, [])

  return (
    <EmotionAtmosphereProvider
      isImmersiveMode={isRPGMode}
      enabled={true}
      enableParticles={enableParticles}
    >
      {/* 现有的聊天界面内容 */}
      <div className="chat-interface">
        {/* ... */}
      </div>
    </EmotionAtmosphereProvider>
  )
}
```

### 2. 在 MessageList 中添加背景渐变

```tsx
// apps/web/src/components/chat/MessageList.tsx

import { EmotionBackground, useEmotionContext } from './EmotionAtmosphere'

export default function MessageList({ ... }: MessageListProps) {
  return (
    <Stack className="message-list" style={{ position: 'relative' }}>
      {/* 添加情绪背景 */}
      <EmotionBackground intensity="medium" />

      {/* 现有的消息列表 */}
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </Stack>
  )
}
```

### 3. 在消息渲染时更新情绪状态

```tsx
// apps/web/src/components/chat/MessageList.tsx

import { useEmotionAtmosphere, useEmotionContext } from './EmotionAtmosphere'

export default function MessageList({ ... }: MessageListProps) {
  const { setEmotion } = useEmotionContext()

  // 获取最新的助手消息
  const latestAssistantMessage = useMemo(() => {
    const assistantMessages = messages.filter(m => m.role === 'assistant')
    return assistantMessages[assistantMessages.length - 1]?.content || null
  }, [messages])

  // 检测情绪
  const { emotion, theme } = useEmotionAtmosphere(latestAssistantMessage)

  // 更新全局情绪状态
  useEffect(() => {
    if (emotion) {
      setEmotion(emotion)
    }
  }, [emotion, setEmotion])

  return (
    <Stack className="message-list">
      {/* ... */}
    </Stack>
  )
}
```

### 4. 在角色头像上添加光晕效果

```tsx
// apps/web/src/components/chat/MessageList.tsx

import { EmotionGlow } from './EmotionAtmosphere'

// 在渲染角色头像时
{!isUser && (
  <EmotionGlow size={40} intensity={0.8}>
    <Avatar
      size={40}
      radius="xl"
      src={character?.avatar}
    >
      {character?.name?.[0]}
    </Avatar>
  </EmotionGlow>
)}
```

### 5. 在立绘面板上添加光晕和粒子

```tsx
// apps/web/src/components/chat/CharacterPortraitPanel.tsx

import { EmotionGlow, EmotionParticles, useEmotionContext } from './EmotionAtmosphere'

export default function CharacterPortraitPanel({ ... }: CharacterPortraitPanelProps) {
  const { theme, currentEmotion } = useEmotionContext()

  return (
    <Box className="portrait-panel" style={{ position: 'relative' }}>
      {/* 添加粒子效果 */}
      <EmotionParticles type={theme.particle} count={20} />

      {/* 立绘头像带光晕 */}
      <EmotionGlow size={64} intensity={1}>
        <Avatar
          size={64}
          src={currentExpression?.url}
          style={{
            border: `2px solid ${theme.primary}`,
            boxShadow: `0 0 16px ${theme.glow}`,
          }}
        />
      </EmotionGlow>

      {/* 现有的立绘面板内容 */}
    </Box>
  )
}
```

### 6. 联动立绘表情切换

```tsx
// apps/web/src/components/chat/CharacterPortraitPanel.tsx

import { useEmotionContext } from './EmotionAtmosphere'
import { useDynamicImage } from '@/lib/dynamicImage/useDynamicImage'

export default function CharacterPortraitPanel({ ... }: CharacterPortraitPanelProps) {
  const { currentEmotion } = useEmotionContext()
  const { setExpressionByEmotion } = useDynamicImage({ ... })

  // 当情绪变化时切换表情
  useEffect(() => {
    if (currentEmotion && currentEmotion !== 'neutral') {
      setExpressionByEmotion(currentEmotion)
    }
  }, [currentEmotion, setExpressionByEmotion])

  return (
    // ...
  )
}
```

## 用户设置选项

### 添加设置面板

```tsx
// apps/web/src/components/settings/EmotionAtmosphereSettings.tsx

import { useState, useEffect } from 'react'
import { Switch, Stack, Text } from '@mantine/core'

export function EmotionAtmosphereSettings() {
  const [enabled, setEnabled] = useState(true)
  const [particlesEnabled, setParticlesEnabled] = useState(false)

  useEffect(() => {
    try {
      const settings = localStorage.getItem('emotion_atmosphere_settings')
      if (settings) {
        const parsed = JSON.parse(settings)
        setEnabled(parsed.enabled ?? true)
        setParticlesEnabled(parsed.particlesEnabled ?? false)
      }
    } catch {}
  }, [])

  const handleSave = (key: string, value: boolean) => {
    try {
      const settings = JSON.parse(localStorage.getItem('emotion_atmosphere_settings') || '{}')
      settings[key] = value
      localStorage.setItem('emotion_atmosphere_settings', JSON.stringify(settings))

      // 触发刷新
      window.dispatchEvent(new Event('emotion-settings-changed'))
    } catch {}
  }

  return (
    <Stack gap="md">
      <Switch
        label="启用情绪氛围效果"
        description="根据对话内容自动调整背景色调和光晕效果"
        checked={enabled}
        onChange={(e) => {
          setEnabled(e.currentTarget.checked)
          handleSave('enabled', e.currentTarget.checked)
        }}
      />

      <Switch
        label="启用粒子效果"
        description="在沉浸模式下显示情绪粒子动画（可能影响性能）"
        checked={particlesEnabled}
        disabled={!enabled}
        onChange={(e) => {
          setParticlesEnabled(e.currentTarget.checked)
          handleSave('particlesEnabled', e.currentTarget.checked)
        }}
      />
    </Stack>
  )
}
```

## 性能优化

### 自动降级策略

系统会自动检测设备性能并降级：

1. **移动端** - 自动禁用粒子效果
2. **低端设备** - CPU 核心数 < 4 时禁用粒子
3. **普通模式** - 仅轻度背景渐变和光晕
4. **沉浸模式** - 完整效果（背景、光晕、粒子）

### 动画优化

- 使用 CSS `will-change` 和 `transform` 触发 GPU 加速
- 粒子动画使用 `requestAnimationFrame` 优化
- 背景和光晕使用 CSS 过渡，避免 JavaScript 计算

## API 参考

### Hook: `useEmotionAtmosphere`

```tsx
const { emotion, theme, confidence } = useEmotionAtmosphere(message)
```

**参数：**
- `message: string | null` - 要检测情绪的消息内容

**返回：**
- `emotion: EmotionType` - 检测到的情绪类型
- `theme: EmotionTheme` - 对应的主题配置
- `confidence: number` - 置信度 (0-1)

### Hook: `useEmotionContext`

```tsx
const { currentEmotion, setEmotion, theme, isEnabled } = useEmotionContext()
```

**返回：**
- `currentEmotion: EmotionType` - 当前全局情绪
- `setEmotion: (emotion: EmotionType) => void` - 更新情绪
- `theme: EmotionTheme` - 当前主题
- `confidence: number` - 置信度
- `isEnabled: boolean` - 是否启用
- `isImmersiveMode: boolean` - 是否沉浸模式
- `enableParticles: boolean` - 是否启用粒子

### 组件：`EmotionBackground`

```tsx
<EmotionBackground intensity="medium" />
```

**Props：**
- `intensity?: 'light' | 'medium' | 'strong'` - 效果强度，默认 `'medium'`
- `className?: string` - 自定义类名

### 组件：`EmotionGlow`

```tsx
<EmotionGlow size={40} intensity={0.8}>
  <Avatar ... />
</EmotionGlow>
```

**Props：**
- `size: number` - 元素尺寸（用于计算光晕大小）
- `intensity?: number` - 光晕强度 (0-1)，默认 `1`
- `className?: string` - 自定义类名
- `children?: ReactNode` - 子元素

### 组件：`EmotionParticles`

```tsx
<EmotionParticles type="sparkle" count={20} />
```

**Props：**
- `type: ParticleType | null` - 粒子类型
- `count?: number` - 粒子数量，默认 `20`
- `className?: string` - 自定义类名

## 情绪类型映射

| 情绪类型 | 主色调 | 粒子效果 | 表情 |
|---------|--------|---------|------|
| happy | 金黄色 | ✨ 闪光 | smile |
| sad | 蓝色 | 💧 雨滴 | cry |
| shy | 粉色 | 💗 爱心 | blush |
| angry | 红色 | 🔥 火焰 | angry |
| surprised | 紫色 | ⭐ 星星 | shocked |
| love | 玫红色 | 💗 爱心 | love |
| scared | 靛蓝色 | 👻 幽灵 | scared |
| neutral | 灰色 | 无 | default |

## 故障排查

### 问题：效果不显示

**解决方案：**
1. 检查 `EmotionAtmosphereProvider` 是否正确包裹
2. 确认 `enabled` prop 为 `true`
3. 查看控制台是否有错误

### 问题：粒子效果性能差

**解决方案：**
1. 减少粒子数量（`count={10}`）
2. 禁用粒子效果（`enableParticles={false}`）
3. 检查设备性能（系统会自动降级）

### 问题：情绪检测不准确

**解决方案：**
1. 检查 `detectEmotionFromContent` 函数逻辑
2. 增加情绪关键词覆盖范围
3. 调整置信度计算算法

## 下一步优化

- [ ] 支持情绪历史趋势（最近N条消息）
- [ ] 添加自定义情绪主题
- [ ] 支持音效联动
- [ ] 优化情绪检测算法（机器学习）
- [ ] 添加情绪过渡动画

---

**反馈和建议：** 欢迎在 GitHub Issues 中提出！
