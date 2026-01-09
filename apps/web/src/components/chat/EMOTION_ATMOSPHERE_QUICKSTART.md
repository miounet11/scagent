# EmotionAtmosphere 快速开始

## 📦 已创建的文件

```
apps/web/src/components/
├── chat/
│   ├── EmotionAtmosphere.tsx                    # 核心组件和 Hook
│   ├── EmotionAtmosphereDemo.tsx                # 演示页面
│   ├── EMOTION_ATMOSPHERE_INTEGRATION.md        # 集成文档
│   └── __tests__/
│       └── EmotionAtmosphere.test.tsx           # 单元测试
└── settings/
    └── EmotionAtmosphereSettings.tsx            # 用户设置面板
```

## 🚀 3分钟快速集成

### 步骤 1: 包裹 Provider（2分钟）

在 `apps/web/src/components/chat/ChatInterface.tsx` 中添加：

```tsx
import { EmotionAtmosphereProvider } from './EmotionAtmosphere'
import { useRPGModeStore } from '@/stores/rpgModeStore'
import { getEmotionAtmosphereSettings } from '@/components/settings/EmotionAtmosphereSettings'

export default function ChatInterface({ ... }: ChatInterfaceProps) {
  const { isRPGMode } = useRPGModeStore()
  const [settings, setSettings] = useState(getEmotionAtmosphereSettings())

  // 监听设置变化
  useEffect(() => {
    const handleSettingsChange = (e: CustomEvent) => {
      setSettings(e.detail)
    }
    window.addEventListener('emotion-settings-changed', handleSettingsChange as EventListener)
    return () => window.removeEventListener('emotion-settings-changed', handleSettingsChange as EventListener)
  }, [])

  return (
    <EmotionAtmosphereProvider
      isImmersiveMode={isRPGMode}
      enabled={settings.enabled}
      enableParticles={settings.particlesEnabled}
    >
      {/* 现有内容 */}
    </EmotionAtmosphereProvider>
  )
}
```

### 步骤 2: 添加背景和情绪检测（1分钟）

在 `apps/web/src/components/chat/MessageList.tsx` 中：

```tsx
import {
  EmotionBackground,
  useEmotionAtmosphere,
  useEmotionContext,
  EmotionGlow,
} from './EmotionAtmosphere'

export default function MessageList({ ... }: MessageListProps) {
  const { setEmotion } = useEmotionContext()

  // 获取最新助手消息
  const latestAssistantMessage = useMemo(() => {
    const assistantMessages = messages.filter(m => m.role === 'assistant')
    return assistantMessages[assistantMessages.length - 1]?.content || null
  }, [messages])

  // 检测情绪
  const { emotion } = useEmotionAtmosphere(latestAssistantMessage)

  // 更新全局情绪
  useEffect(() => {
    if (emotion) {
      setEmotion(emotion)
    }
  }, [emotion, setEmotion])

  return (
    <Stack className="message-list" style={{ position: 'relative' }}>
      {/* ✨ 添加背景渐变 */}
      <EmotionBackground intensity="medium" />

      {/* 现有消息列表 */}
      {messages.map((message) => (
        <Group key={message.id}>
          {/* ✨ 角色头像添加光晕 */}
          {!message.role === 'user' && (
            <EmotionGlow size={40} intensity={0.8}>
              <Avatar size={40} src={character?.avatar} />
            </EmotionGlow>
          )}
          {/* 其他内容 */}
        </Group>
      ))}
    </Stack>
  )
}
```

### 步骤 3: 添加设置选项（可选）

在设置页面中引入：

```tsx
import { EmotionAtmosphereSettings } from '@/components/settings/EmotionAtmosphereSettings'

export function SettingsPage() {
  return (
    <Tabs>
      <Tabs.Panel value="appearance">
        {/* 现有设置 */}

        {/* ✨ 添加情绪氛围设置 */}
        <Stack gap="md" mt="xl">
          <Text size="lg" fw={600}>情绪氛围</Text>
          <EmotionAtmosphereSettings />
        </Stack>
      </Tabs.Panel>
    </Tabs>
  )
}
```

## 🎨 效果预览

访问 `/emotion-demo` 查看演示页面（需要添加路由）：

```tsx
// apps/web/src/app/emotion-demo/page.tsx
import EmotionAtmosphereDemo from '@/components/chat/EmotionAtmosphereDemo'

export default function EmotionDemoPage() {
  return <EmotionAtmosphereDemo />
}
```

## ✅ 验证集成

1. **背景渐变**：发送包含情绪关键词的消息（如"开心😊"），观察背景是否变为金黄色渐变
2. **光晕效果**：查看角色头像周围是否有对应情绪颜色的光晕
3. **粒子效果**：在沉浸模式下，开启粒子设置后应该看到对应的粒子动画
4. **设置生效**：在设置中调整强度滑块，效果应该实时变化

## 🔧 故障排查

### 问题：效果不显示

**检查清单：**
- [ ] `EmotionAtmosphereProvider` 是否正确包裹
- [ ] `enabled` prop 是否为 `true`
- [ ] 是否在 `useEmotionContext()` 外部调用（会报错）
- [ ] 浏览器控制台是否有错误

### 问题：情绪检测不准确

**解决方案：**
- 检查 `detectEmotionFromContent` 函数（在 `@/components/effects` 中）
- 确认消息内容包含情绪关键词
- 查看 `latestAssistantMessage` 是否正确获取

### 问题：粒子效果卡顿

**解决方案：**
- 减少粒子数量（`count={10}`）
- 检查设备性能（系统会自动降级）
- 在设置中禁用粒子效果

## 📚 完整文档

详细集成指南请参考：
- `EMOTION_ATMOSPHERE_INTEGRATION.md` - 完整集成文档
- `EmotionAtmosphereDemo.tsx` - 交互式演示
- `EmotionAtmosphere.test.tsx` - 单元测试示例

## 🎯 下一步

- [ ] 在 ChatInterface 中集成 Provider
- [ ] 在 MessageList 中添加背景和检测
- [ ] 在设置页面添加用户选项
- [ ] 测试不同情绪类型的效果
- [ ] 根据用户反馈调整视觉效果

---

**需要帮助？** 查看完整文档或提交 Issue！
