/**
 * EmotionAtmosphereDemo - 情绪氛围系统演示页面
 *
 * 展示不同情绪类型的视觉效果，供开发和测试使用
 */

'use client'

import { useState } from 'react'
import {
  Stack,
  Group,
  Button,
  Paper,
  Text,
  Avatar,
  Box,
  SegmentedControl,
  Container,
} from '@mantine/core'
import {
  EmotionAtmosphereProvider,
  EmotionBackground,
  EmotionGlow,
  EmotionParticles,
  useEmotionContext,
  type EmotionType,
  EMOTION_THEME_MAP,
} from './EmotionAtmosphere'

// 演示消息
const DEMO_MESSAGES: Record<EmotionType, string> = {
  happy: '哈哈，今天真是太开心了！✨ 和你聊天总是让我感到愉快！😊',
  sad: '唉...最近有点难过，感觉心里空落落的... 😢',
  shy: '你、你说什么呢...人家才不会害羞呢！🙈 ////',
  angry: '哼！真是太过分了！💢 让人很生气啊！😠',
  surprised: '哇！这是真的吗？！太惊讶了！❗ 不敢相信！',
  love: '喜欢你...心跳加速了...💗 和你在一起真好... ❤️',
  scared: '呜呜...有点害怕...😰 能不能陪陪我...',
  neutral: '嗯，今天天气不错。😌',
  joy: '太棒啦！这简直是最好的消息！✨✨✨',
  affection: '能见到你真好...总是让我感到温暖... 💕',
  embarrassed: '啊、这个...好尴尬啊.../// 不要看我啦！',
  melancholy: '窗外的雨...让人忍不住陷入沉思...',
  shocked: '什么？！这怎么可能？！😱',
  excited: '啊啊啊！我要兴奋到飞起来了！⚡⚡⚡',
  energetic: '今天充满活力！一起去做些有趣的事吧！💪',
  smug: '嘿嘿，我就知道会是这样~ 😏',
  confident: '放心吧，交给我！我一定能做到！💪',
  thinking: '嗯...让我想想...这个问题很有意思...',
  curious: '诶？那是什么？好想知道啊！',
  frustrated: '真是烦人！怎么会这样啊！💢',
  anxious: '呜...好紧张...心里好不安...😰',
}

// 情绪按钮组
const EMOTION_BUTTONS = [
  { emotion: 'happy' as EmotionType, label: '开心', icon: '✨' },
  { emotion: 'sad' as EmotionType, label: '难过', icon: '💧' },
  { emotion: 'shy' as EmotionType, label: '害羞', icon: '💗' },
  { emotion: 'angry' as EmotionType, label: '生气', icon: '💢' },
  { emotion: 'surprised' as EmotionType, label: '惊讶', icon: '⭐' },
  { emotion: 'love' as EmotionType, label: '爱意', icon: '💗' },
  { emotion: 'scared' as EmotionType, label: '紧张', icon: '😰' },
  { emotion: 'neutral' as EmotionType, label: '平静', icon: '😌' },
]

function DemoContent() {
  const { currentEmotion, setEmotion, theme } = useEmotionContext()
  const [mode, setMode] = useState<'normal' | 'immersive'>('normal')

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        {/* 标题 */}
        <Box ta="center">
          <Text size="xl" fw={700} mb="xs">
            情绪氛围系统演示
          </Text>
          <Text size="sm" c="dimmed">
            点击下方按钮切换不同的情绪类型，观察视觉效果变化
          </Text>
        </Box>

        {/* 模式切换 */}
        <Group justify="center">
          <SegmentedControl
            value={mode}
            onChange={(value) => setMode(value as 'normal' | 'immersive')}
            data={[
              { label: '普通模式', value: 'normal' },
              { label: '沉浸模式', value: 'immersive' },
            ]}
          />
        </Group>

        {/* 情绪按钮 */}
        <Paper p="md" radius="md" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <Text size="sm" fw={500} mb="sm">
            选择情绪：
          </Text>
          <Group gap="xs">
            {EMOTION_BUTTONS.map(({ emotion, label, icon }) => (
              <Button
                key={emotion}
                variant={currentEmotion === emotion ? 'filled' : 'light'}
                size="sm"
                onClick={() => setEmotion(emotion)}
                leftSection={icon}
                style={{
                  background:
                    currentEmotion === emotion
                      ? `linear-gradient(135deg, ${EMOTION_THEME_MAP[emotion].primary} 0%, ${EMOTION_THEME_MAP[emotion].primary}dd 100%)`
                      : undefined,
                }}
              >
                {label}
              </Button>
            ))}
          </Group>
        </Paper>

        {/* 效果展示区 */}
        <Paper
          p="xl"
          radius="md"
          style={{
            position: 'relative',
            minHeight: 400,
            background: 'rgba(0, 0, 0, 0.3)',
            overflow: 'hidden',
          }}
        >
          {/* 背景渐变 */}
          <EmotionBackground intensity={mode === 'immersive' ? 'strong' : 'medium'} />

          {/* 粒子效果（仅沉浸模式） */}
          {mode === 'immersive' && <EmotionParticles type={theme.particle} count={15} />}

          {/* 内容 */}
          <Stack gap="lg" style={{ position: 'relative', zIndex: 2 }}>
            {/* 角色头像 */}
            <Group justify="center">
              <EmotionGlow size={80} intensity={mode === 'immersive' ? 1 : 0.5}>
                <Avatar
                  size={80}
                  radius="xl"
                  style={{
                    border: `3px solid ${theme.primary}`,
                    boxShadow: `0 0 20px ${theme.glow}`,
                    transition: 'all 0.3s ease',
                  }}
                >
                  🎭
                </Avatar>
              </EmotionGlow>
            </Group>

            {/* 当前情绪信息 */}
            <Stack gap="xs" align="center">
              <Text size="lg" fw={600} style={{ color: theme.primary }}>
                当前情绪: {EMOTION_BUTTONS.find((b) => b.emotion === currentEmotion)?.label || '未知'}
              </Text>
              <Text size="sm" c="dimmed">
                主色调: {theme.primary}
              </Text>
              <Text size="sm" c="dimmed">
                粒子类型: {theme.particle || '无'}
              </Text>
            </Stack>

            {/* 示例消息 */}
            <Paper
              p="md"
              radius="md"
              style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: `2px solid ${theme.primary}`,
                borderLeft: `4px solid ${theme.primary}`,
                boxShadow: `0 4px 20px ${theme.glow}`,
                transition: 'all 0.3s ease',
              }}
            >
              <Text size="sm" style={{ color: 'white', lineHeight: 1.6 }}>
                {DEMO_MESSAGES[currentEmotion] || '示例消息'}
              </Text>
            </Paper>

            {/* 效果说明 */}
            <Stack gap="xs" style={{ textAlign: 'center' }}>
              <Text size="xs" c="dimmed">
                {mode === 'immersive' ? '🎮 沉浸模式：完整效果（背景 + 光晕 + 粒子）' : '📱 普通模式：轻度效果（背景 + 光晕）'}
              </Text>
              <Text size="xs" c="dimmed">
                移动端和低端设备会自动禁用粒子效果以保证性能
              </Text>
            </Stack>
          </Stack>
        </Paper>

        {/* 主题颜色参考 */}
        <Paper p="md" radius="md" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
          <Text size="sm" fw={500} mb="sm">
            所有情绪主题：
          </Text>
          <Group gap="xs">
            {Object.entries(EMOTION_THEME_MAP).map(([emotion, emotionTheme]) => (
              <Box
                key={emotion}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: emotionTheme.bg,
                  border: `2px solid ${emotionTheme.primary}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: currentEmotion === emotion ? 1 : 0.6,
                }}
                onClick={() => setEmotion(emotion as EmotionType)}
              >
                <Text size="xs" fw={500} style={{ color: emotionTheme.primary }}>
                  {emotion}
                </Text>
              </Box>
            ))}
          </Group>
        </Paper>
      </Stack>
    </Container>
  )
}

export default function EmotionAtmosphereDemo() {
  return (
    <EmotionAtmosphereProvider isImmersiveMode={true} enabled={true} enableParticles={true}>
      <DemoContent />
    </EmotionAtmosphereProvider>
  )
}
