"use client"

import { useChatStore } from '@/stores/chatStore'
import { useTranslation, getLocale } from '@/lib/i18n'
import { NoChatsEmpty } from '@/components/ui/EmptyState'
import { SwipeToDelete } from '@/components/ui/MobileGestures'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function ChatList() {
  const { chats, currentChat, setCurrentChat, deleteChat } = useChatStore()
  const { t } = useTranslation()
  const router = useRouter()

  const handleCreateChat = () => {
    router.push('/characters')
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-gray-100">{t('chat.chatList.title')}</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <NoChatsEmpty onCreateChat={handleCreateChat} />
        ) : (
          <div className="space-y-1 p-2">
            <AnimatePresence>
              {chats.map((chat, index) => (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <SwipeToDelete onDelete={() => deleteChat?.(chat.id)}>
                    <button
                      onClick={() => setCurrentChat(chat)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                        currentChat?.id === chat.id
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                    >
                      <div className="font-medium truncate">{chat.title || t('chat.chatList.newChat')}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(chat.createdAt).toLocaleDateString(getLocale())}
                      </div>
                    </button>
                  </SwipeToDelete>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
