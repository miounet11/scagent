'use client'
/**
 * ExpGainFloater - 经验值获取飘字组件
 *
 * 特性：
 * - 显示获取的经验值
 * - 向上飘动并渐隐动画
 * - 支持连续显示多个
 */

import { useState, useEffect, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { IconSparkles } from '@tabler/icons-react'

interface ExpGainItem {
  id: string
  amount: number
  timestamp: number
}

interface ExpGainFloaterProps {
  /** 当前获得的经验值，变化时会显示飘字 */
  expGained?: number
  /** 触发器（每次变化会触发动画） */
  trigger?: number
  /** 自定义样式 */
  className?: string
}

function ExpGainFloater({ expGained = 0, trigger, className }: ExpGainFloaterProps) {
  const [items, setItems] = useState<ExpGainItem[]>([])

  // 当经验值变化时添加新的飘字
  useEffect(() => {
    if (expGained > 0) {
      const newItem: ExpGainItem = {
        id: `${Date.now()}-${Math.random()}`,
        amount: expGained,
        timestamp: Date.now(),
      }
      setItems(prev => [...prev, newItem])

      // 2秒后移除
      setTimeout(() => {
        setItems(prev => prev.filter(item => item.id !== newItem.id))
      }, 2000)
    }
  }, [expGained, trigger])

  // 手动添加经验飘字的方法（可以通过 ref 暴露）
  const addExpGain = useCallback((amount: number) => {
    if (amount <= 0) return
    const newItem: ExpGainItem = {
      id: `${Date.now()}-${Math.random()}`,
      amount,
      timestamp: Date.now(),
    }
    setItems(prev => [...prev, newItem])

    setTimeout(() => {
      setItems(prev => prev.filter(item => item.id !== newItem.id))
    }, 2000)
  }, [])

  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        right: 80,
        top: 120,
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: -index * 30, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.6 }}
            transition={{
              duration: 0.5,
              ease: 'easeOut',
            }}
            style={{
              position: 'absolute',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.9), rgba(245, 158, 11, 0.9))',
              boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            <IconSparkles size={16} color="#fff" />
            <span
              style={{
                color: '#fff',
                fontWeight: 700,
                fontSize: '14px',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
              }}
            >
              +{item.amount} EXP
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// 导出一个单例管理器，方便全局调用
class ExpGainManager {
  private listeners: Set<(amount: number) => void> = new Set()

  subscribe(callback: (amount: number) => void) {
    this.listeners.add(callback)
    return () => { this.listeners.delete(callback) }
  }

  trigger(amount: number) {
    this.listeners.forEach(callback => callback(amount))
  }
}

export const expGainManager = new ExpGainManager()

// Hook 版本，方便在组件中使用
export function useExpGainFloater() {
  const [trigger, setTrigger] = useState(0)
  const [expGained, setExpGained] = useState(0)

  useEffect(() => {
    return expGainManager.subscribe((amount) => {
      setExpGained(amount)
      setTrigger(prev => prev + 1)
    })
  }, [])

  return { expGained, trigger }
}

// 全局触发函数
export function triggerExpGain(amount: number) {
  expGainManager.trigger(amount)
}

export default memo(ExpGainFloater)
