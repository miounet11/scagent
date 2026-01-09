# EmotionAtmosphere 情绪氛围系统

> 轻量级情绪氛围系统，根据对话内容自动检测情绪并联动多维度视觉效果

## 🎯 特性

- ✨ **自动情绪检测** - 复用现有 `detectEmotionFromContent`，智能识别8种基础情绪 + 11种扩展情绪
- 🎨 **多维度视觉联动** - 背景渐变、光晕效果、粒子动画三位一体
- 🎮 **双模式支持** - 普通模式轻度效果，沉浸模式完整体验
- ⚡ **性能优化** - 移动端/低端设备自动降级，GPU 加速动画
- 🎛️ **用户可控** - 提供设置面板，可自定义强度和开关
- 📱 **响应式设计** - 完美适配桌面端和移动端

## 📦 文件清单

| 文件 | 说明 | 位置 |
|------|------|------|
| `EmotionAtmosphere.tsx` | 核心组件、Hook、Provider | `apps/web/src/components/chat/` |
| `EmotionAtmosphereSettings.tsx` | 用户设置面板 | `apps/web/src/components/settings/` |
| `EmotionAtmosphereDemo.tsx` | 交互式演示页面 | `apps/web/src/components/chat/` |
| `EmotionAtmosphere.test.tsx` | 单元测试 | `apps/web/src/components/chat/__tests__/` |
| `EMOTION_ATMOSPHERE_INTEGRATION.md` | 完整集成文档 | `apps/web/src/components/chat/` |
| `EMOTION_ATMOSPHERE_QUICKSTART.md` | 快速开始指南 | `apps/web/src/components/chat/` |

## 🚀 快速开始

### 1. 包裹 Provider

```tsx
import { EmotionAtmosphereProvider } from './EmotionAtmosphere'

<EmotionAtmosphereProvider
  isImmersiveMode={isRPGMode}
  enabled={true}
  enableParticles={false}
>
  {/* 你的聊天界面 */}
</EmotionAtmosphereProvider>
```

### 2. 添加背景

```tsx
import { EmotionBackground } from './EmotionAtmosphere'

<Stack style={{ position: 'relative' }}>
  <EmotionBackground intensity="medium" />
  {/* 消息列表 */}
</Stack>
```

### 3. 添加光晕

```tsx
import { EmotionGlow } from './EmotionAtmosphere'

<EmotionGlow size={40} intensity={0.8}>
  <Avatar size={40} src={avatar} />
</EmotionGlow>
```

### 4. 检测情绪

```tsx
import { useEmotionAtmosphere, useEmotionContext } from './EmotionAtmosphere'

const { emotion, theme } = useEmotionAtmosphere(latestMessage)
const { setEmotion } = useEmotionContext()

useEffect(() => {
  setEmotion(emotion)
}, [emotion, setEmotion])
```

## 🎨 支持的情绪类型

### 基础情绪（8种）

| 情绪 | 主色调 | 粒子 | 表情 | 关键词 |
|------|--------|------|------|--------|
| happy | 金黄 #fbbf24 | ✨ 闪光 | smile | 开心、高兴、哈哈、😊 |
| sad | 蓝色 #60a5fa | 💧 雨滴 | cry | 难过、伤心、哭、😢 |
| shy | 粉色 #f472b6 | 💗 爱心 | blush | 害羞、脸红、😳 |
| angry | 红色 #ef4444 | 🔥 火焰 | angry | 生气、愤怒、😠 |
| surprised | 紫色 #a855f7 | ⭐ 星星 | shocked | 惊讶、震惊、😲 |
| love | 玫红 #ec4899 | 💗 爱心 | love | 喜欢、爱、❤️ |
| scared | 靛蓝 #6366f1 | 👻 幽灵 | scared | 害怕、紧张、😰 |
| neutral | 灰色 #94a3b8 | 无 | default | 默认状态 |

### 扩展情绪（11种）

joy, affection, embarrassed, melancholy, shocked, excited, energetic, smug, confident, thinking, curious

## 📊 效果强度对比

| 模式 | 背景渐变 | 光晕效果 | 粒子动画 |
|------|----------|----------|----------|
| 普通模式 | 轻度（30%） | 轻度（50%） | 禁用 |
| 沉浸模式 | 中度（70%） | 完整（100%） | 启用 |

## ⚙️ 性能优化策略

### 自动降级

- **移动端**（宽度 < 768px）- 禁用粒子
- **低端设备**（CPU < 4核）- 禁用粒子
- **普通模式** - 减少效果强度

### 动画优化

- CSS `will-change: transform, opacity`
- GPU 加速（`transform` 替代 `top/left`）
- `requestAnimationFrame` 节流
- 缓存情绪检测结果（`useMemo`）

## 🎛️ API 参考

### Hook: `useEmotionAtmosphere`

```tsx
const { emotion, theme, confidence } = useEmotionAtmosphere(message)
```

**参数：**
- `message: string | null` - 消息内容

**返回：**
- `emotion: EmotionType` - 情绪类型
- `theme: EmotionTheme` - 主题配置
- `confidence: number` - 置信度 (0-1)

### Hook: `useEmotionContext`

```tsx
const {
  currentEmotion,
  setEmotion,
  theme,
  confidence,
  isEnabled,
  isImmersiveMode,
  enableParticles
} = useEmotionContext()
```

### Provider: `EmotionAtmosphereProvider`

```tsx
<EmotionAtmosphereProvider
  isImmersiveMode={boolean}
  enabled={boolean}
  enableParticles={boolean}
>
  {children}
</EmotionAtmosphereProvider>
```

### 组件: `EmotionBackground`

```tsx
<EmotionBackground
  intensity="light" | "medium" | "strong"
  className={string}
/>
```

### 组件: `EmotionGlow`

```tsx
<EmotionGlow
  size={number}
  intensity={number}
  className={string}
>
  {children}
</EmotionGlow>
```

### 组件: `EmotionParticles`

```tsx
<EmotionParticles
  type="sparkle" | "rain" | "heart" | "fire" | "star" | "ghost" | null
  count={number}
  className={string}
/>
```

## 🧪 测试

运行单元测试：

```bash
pnpm test EmotionAtmosphere.test.tsx
```

查看演示页面（需要添加路由）：

```bash
# 创建路由文件
# apps/web/src/app/emotion-demo/page.tsx

import EmotionAtmosphereDemo from '@/components/chat/EmotionAtmosphereDemo'
export default EmotionAtmosphereDemo
```

访问 `/emotion-demo` 查看交互式演示。

## 📚 文档

- [集成指南](./EMOTION_ATMOSPHERE_INTEGRATION.md) - 详细集成步骤
- [快速开始](./EMOTION_ATMOSPHERE_QUICKSTART.md) - 3分钟快速上手
- [单元测试](../__tests__/EmotionAtmosphere.test.tsx) - 测试用例参考

## 🎯 集成检查清单

- [ ] 在 ChatInterface 中添加 Provider
- [ ] 在 MessageList 中添加背景和情绪检测
- [ ] 在消息气泡中添加光晕效果
- [ ] 在立绘面板中添加粒子效果（可选）
- [ ] 在设置页面添加用户控制选项
- [ ] 测试不同情绪类型的视觉效果
- [ ] 测试移动端响应式表现
- [ ] 测试性能（粒子数量、动画流畅度）

## 🐛 故障排查

### 效果不显示

1. 检查 Provider 是否正确包裹
2. 确认 `enabled` prop 为 `true`
3. 查看控制台错误信息
4. 确认 `detectEmotionFromContent` 函数可用

### 情绪检测不准确

1. 检查消息内容是否包含情绪关键词
2. 查看 `latestAssistantMessage` 获取逻辑
3. 调整置信度计算算法

### 粒子效果卡顿

1. 减少粒子数量（`count={10}`）
2. 检查设备性能（自动降级是否生效）
3. 在设置中禁用粒子效果

## 🔮 未来优化方向

- [ ] 支持情绪历史趋势（最近N条消息）
- [ ] 自定义情绪主题配色
- [ ] 音效联动（情绪切换时播放音效）
- [ ] 机器学习优化情绪检测
- [ ] 更多粒子类型和动画效果
- [ ] 情绪过渡动画（从一种情绪平滑过渡到另一种）
- [ ] 情绪强度分级（轻度/中度/强烈）

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

在提交前请确保：

1. 代码通过 TypeScript 类型检查
2. 所有单元测试通过
3. 遵循现有代码风格
4. 更新相关文档

## 📄 许可证

MIT License - 随意使用和修改！

---

**创建日期**: 2026-01-02
**版本**: v1.0.0
**维护者**: X-Tavern Team
