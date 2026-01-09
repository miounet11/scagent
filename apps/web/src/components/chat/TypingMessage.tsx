/**
 * TypingMessage component for displaying messages with typing animation
 */

import { useState, useEffect } from 'react'
import { Message } from '@sillytavern-clone/shared'
import { stripReasoningBlocks, isStripReasoningEnabled } from '@/lib/stripReasoningBlocks'
import { replaceMessageVariables } from '@/lib/preset-application'

interface TypingMessageProps {
  message: Message
  speed?: number // characters per second
  onComplete?: () => void
}

export default function TypingMessage({ message, speed = 50, onComplete }: TypingMessageProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  useEffect(() => {
    setDisplayedText('')
    setIsTyping(true)

    let currentIndex = 0
    const text = message.content

    const typeNextChar = () => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1))
        currentIndex++
        setTimeout(typeNextChar, 1000 / speed)
      } else {
        setIsTyping(false)
        onComplete?.()
      }
    }

    typeNextChar()
  }, [message.content, speed, onComplete])

  const formatMessageContent = (content: string) => {
    // 1. 首先替换模板变量
    let text = replaceMessageVariables(content)
    
    // 2. Pre-strip reasoning blocks for assistant messages when enabled
    try {
      if (message.role !== 'user' && isStripReasoningEnabled()) {
        text = stripReasoningBlocks(text)
      }
    } catch {}
    
    // 3. Enhanced markdown-like formatting with better styling
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-blue-300">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-300">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-800/60 text-teal-300 px-2 py-0.5 rounded text-sm font-mono border border-gray-700">$1</code>')
      .replace(/\n/g, '<br />')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold text-blue-300 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-purple-300 mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-purple-400 mt-4 mb-2">$1</h1>')
  }

  return (
    <div
      className="whitespace-pre-wrap break-words text-sm leading-relaxed"
      dangerouslySetInnerHTML={{
        __html: formatMessageContent(displayedText)
      }}
    />
  )
}