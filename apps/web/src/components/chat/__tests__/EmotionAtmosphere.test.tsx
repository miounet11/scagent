/**
 * EmotionAtmosphere 组件测试
 *
 * 测试情绪检测、主题切换和视觉效果
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import {
  useEmotionAtmosphere,
  EMOTION_THEME_MAP,
  getEmotionTheme,
  type EmotionType,
} from '../EmotionAtmosphere'

describe('EmotionAtmosphere', () => {
  describe('useEmotionAtmosphere', () => {
    it('应该返回 neutral 当消息为 null', () => {
      const { result } = renderHook(() => useEmotionAtmosphere(null))

      expect(result.current.emotion).toBe('neutral')
      expect(result.current.confidence).toBe(0)
    })

    it('应该检测到开心情绪', () => {
      const { result } = renderHook(() => useEmotionAtmosphere('哈哈，今天真开心！😊'))

      expect(result.current.emotion).toBe('happy')
      expect(result.current.confidence).toBeGreaterThan(0.5)
    })

    it('应该检测到难过情绪', () => {
      const { result } = renderHook(() => useEmotionAtmosphere('唉...好难过啊... 😢'))

      expect(result.current.emotion).toBe('sad')
      expect(result.current.confidence).toBeGreaterThan(0.5)
    })

    it('应该检测到害羞情绪', () => {
      const { result } = renderHook(() => useEmotionAtmosphere('人家才不害羞呢！/// 😳'))

      expect(result.current.emotion).toBe('shy')
      expect(result.current.confidence).toBeGreaterThan(0.5)
    })

    it('应该检测到生气情绪', () => {
      const { result } = renderHook(() => useEmotionAtmosphere('真是太过分了！💢 让人很生气！'))

      expect(result.current.emotion).toBe('angry')
      expect(result.current.confidence).toBeGreaterThan(0.5)
    })

    it('应该检测到爱意情绪', () => {
      const { result } = renderHook(() => useEmotionAtmosphere('喜欢你...❤️ 心跳加速了...'))

      expect(result.current.emotion).toBe('love')
      expect(result.current.confidence).toBeGreaterThan(0.5)
    })

    it('应该根据消息长度调整置信度', () => {
      const { result: shortResult } = renderHook(() => useEmotionAtmosphere('开心'))
      const { result: longResult } = renderHook(() =>
        useEmotionAtmosphere('哈哈，今天真是太开心了！和你聊天总是让我感到愉快！😊'.repeat(3))
      )

      expect(longResult.current.confidence).toBeGreaterThan(shortResult.current.confidence)
    })

    it('应该返回正确的主题', () => {
      const { result } = renderHook(() => useEmotionAtmosphere('开心 😊'))

      expect(result.current.theme).toEqual(EMOTION_THEME_MAP.happy)
      expect(result.current.theme.primary).toBe('#fbbf24')
      expect(result.current.theme.particle).toBe('sparkle')
    })
  })

  describe('getEmotionTheme', () => {
    it('应该返回正确的主题配置', () => {
      const happyTheme = getEmotionTheme('happy')
      expect(happyTheme.primary).toBe('#fbbf24')
      expect(happyTheme.expression).toBe('smile')

      const sadTheme = getEmotionTheme('sad')
      expect(sadTheme.primary).toBe('#60a5fa')
      expect(sadTheme.expression).toBe('cry')
    })

    it('应该返回 neutral 主题当情绪未知', () => {
      const unknownTheme = getEmotionTheme('unknown' as EmotionType)
      expect(unknownTheme).toEqual(EMOTION_THEME_MAP.neutral)
    })
  })

  describe('EMOTION_THEME_MAP', () => {
    it('应该包含所有基础情绪类型', () => {
      const basicEmotions: EmotionType[] = [
        'happy',
        'sad',
        'shy',
        'angry',
        'surprised',
        'love',
        'scared',
        'neutral',
      ]

      basicEmotions.forEach((emotion) => {
        expect(EMOTION_THEME_MAP[emotion]).toBeDefined()
        expect(EMOTION_THEME_MAP[emotion].primary).toBeTruthy()
        expect(EMOTION_THEME_MAP[emotion].glow).toBeTruthy()
        expect(EMOTION_THEME_MAP[emotion].bg).toBeTruthy()
        expect(EMOTION_THEME_MAP[emotion].expression).toBeTruthy()
      })
    })

    it('应该包含扩展情绪类型', () => {
      const extendedEmotions: EmotionType[] = [
        'joy',
        'affection',
        'embarrassed',
        'melancholy',
        'shocked',
        'excited',
        'energetic',
        'smug',
        'confident',
        'thinking',
        'curious',
      ]

      extendedEmotions.forEach((emotion) => {
        expect(EMOTION_THEME_MAP[emotion]).toBeDefined()
      })
    })

    it('所有主题应该有有效的颜色值', () => {
      Object.values(EMOTION_THEME_MAP).forEach((theme) => {
        // 检查主色调是十六进制颜色
        expect(theme.primary).toMatch(/^#[0-9a-f]{6}$/i)

        // 检查光晕是 rgba 颜色
        expect(theme.glow).toMatch(/^rgba?\(/i)

        // 检查背景是渐变
        expect(theme.bg).toMatch(/linear-gradient/i)
      })
    })
  })

  describe('性能优化', () => {
    it('应该在消息未变化时不重新计算', () => {
      const message = '开心 😊'
      const { result, rerender } = renderHook(() => useEmotionAtmosphere(message))

      const firstEmotion = result.current.emotion
      const firstTheme = result.current.theme

      // 重新渲染但消息不变
      rerender()

      // 应该返回相同的结果
      expect(result.current.emotion).toBe(firstEmotion)
      expect(result.current.theme).toBe(firstTheme)
    })

    it('应该在消息变化时重新计算', () => {
      const { result, rerender } = renderHook(
        ({ message }) => useEmotionAtmosphere(message),
        { initialProps: { message: '开心 😊' } }
      )

      const initialEmotion = result.current.emotion

      // 更新消息
      rerender({ message: '难过 😢' })

      // 应该检测到新的情绪
      expect(result.current.emotion).not.toBe(initialEmotion)
      expect(result.current.emotion).toBe('sad')
    })
  })

  describe('边界情况', () => {
    it('应该处理空字符串', () => {
      const { result } = renderHook(() => useEmotionAtmosphere(''))

      expect(result.current.emotion).toBe('neutral')
      expect(result.current.confidence).toBe(0)
    })

    it('应该处理只有空格的字符串', () => {
      const { result } = renderHook(() => useEmotionAtmosphere('   '))

      expect(result.current.emotion).toBe('neutral')
    })

    it('应该处理非常长的消息', () => {
      const longMessage = '开心 😊 '.repeat(1000)
      const { result } = renderHook(() => useEmotionAtmosphere(longMessage))

      expect(result.current.emotion).toBe('happy')
      expect(result.current.confidence).toBeGreaterThan(0.7)
      expect(result.current.confidence).toBeLessThanOrEqual(1)
    })

    it('应该处理混合情绪的消息', () => {
      // 包含多种情绪关键词，应该选择最强的一个
      const { result } = renderHook(() =>
        useEmotionAtmosphere('虽然有点难过，但还是很开心能见到你！😊❤️')
      )

      // 应该检测到某种情绪（具体是哪个取决于检测算法）
      expect(result.current.emotion).toBeTruthy()
      expect(result.current.confidence).toBeGreaterThan(0)
    })
  })
})
