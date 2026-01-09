/**
 * Character Tune Modal - 角色微调设置弹窗
 * 允许用户自定义角色行为偏好和选择用户人设
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Modal,
  Tabs,
  Select,
  Textarea,
  Button,
  Stack,
  Text,
  Group,
  NumberInput,
  Badge,
  Box,
  Divider,
  Loader,
  ActionIcon,
  Tooltip,
  TextInput,
} from '@mantine/core'
import {
  IconAdjustments,
  IconUser,
  IconRefresh,
  IconSparkles,
  IconArchive,
  IconWorld,
  IconPlus,
  IconEdit,
  IconTrash,
  IconStar,
  IconStarFilled,
} from '@tabler/icons-react'
import {
  useCharacterTuneStore,
} from '@/stores/characterTuneStore'
import type { ResponseLength, ToneStyle, DetailLevel } from '@/stores/characterTuneStore'
import { useTranslation } from '@/lib/i18n'
import { useChatStore } from '@/stores/chatStore'
import { chatService } from '@/services/chatService'
import { personaService, type Persona, type CreatePersonaInput } from '@/services/personaService'
import toast from 'react-hot-toast'

interface CharacterTuneModalProps {
  opened: boolean
  onClose: () => void
  characterId: string | null
  characterName?: string
}

export default function CharacterTuneModal({
  opened,
  onClose,
  characterId,
  characterName,
}: CharacterTuneModalProps) {
  const { t } = useTranslation()
  const {
    currentSettings,
    setCurrentCharacter,
    updateSettings,
    resetSettings,
    clearCurrentCharacter,
  } = useCharacterTuneStore()
  const { currentChat, character, messages, refreshMessages } = useChatStore()

  const [activeTab, setActiveTab] = useState<string | null>('behavior')
  const [instructionsDraft, setInstructionsDraft] = useState('')
  const [isCompressing, setIsCompressing] = useState(false)
  const [showCompressionDialog, setShowCompressionDialog] = useState(false)
  const [compressionStrategy, setCompressionStrategy] = useState<'llm' | 'truncate'>('llm')

  // Persona 相关状态
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null)
  const [isLoadingPersonas, setIsLoadingPersonas] = useState(false)
  const [showPersonaManageModal, setShowPersonaManageModal] = useState(false)
  const [personaToEdit, setPersonaToEdit] = useState<Persona | null>(null)
  const [personaFormData, setPersonaFormData] = useState<CreatePersonaInput>({
    name: '',
    description: '',
    userPersona: '',
    customInstructions: '',
    isDefault: false,
  })
  const [isSavingPersona, setIsSavingPersona] = useState(false)

  // 防抖定时器引用
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 加载所有人设
  const loadPersonas = useCallback(async () => {
    setIsLoadingPersonas(true)
    try {
      const data = await personaService.getPersonas()
      setPersonas(data)

      // 如果没有选中的人设，自动选择默认人设
      if (!selectedPersonaId && data.length > 0) {
        const defaultPersona = data.find(p => p.isDefault)
        if (defaultPersona) {
          setSelectedPersonaId(defaultPersona.id)
          // 同步到设置
          updateSettings({
            userPersona: defaultPersona.userPersona,
          })
          setInstructionsDraft(defaultPersona.customInstructions || '')
        }
      }
    } catch (error) {
      console.error('加载人设列表失败:', error)
      toast.error(t('chat.error.failedLoadPersonas') || '加载人设列表失败')
    } finally {
      setIsLoadingPersonas(false)
    }
  }, [selectedPersonaId, updateSettings])

  // 当角色ID变化时,加载对应设置
  useEffect(() => {
    if (characterId && opened) {
      setCurrentCharacter(characterId)
      loadPersonas()
    }
  }, [characterId, opened, setCurrentCharacter, loadPersonas])

  // Sync drafts from current settings when modal opens or settings change
  useEffect(() => {
    if (opened && currentSettings) {
      setInstructionsDraft(currentSettings.customInstructions || '')
    }
  }, [opened, currentSettings])

  // 关闭时清理
  useEffect(() => {
    if (!opened) {
      const timer = setTimeout(() => {
        clearCurrentCharacter()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [opened, clearCurrentCharacter])

  // 清理防抖定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // 防抖更新函数
  const debouncedUpdate = useCallback((field: string, value: any) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      updateSettings({ [field]: value })
    }, 300)
  }, [updateSettings])

  // 选择人设 - 必须在早期返回之前定义所有 hooks
  const handleSelectPersona = useCallback((personaId: string | null) => {
    if (!personaId) return

    setSelectedPersonaId(personaId)
    const persona = personas.find(p => p.id === personaId)
    if (persona) {
      updateSettings({
        userPersona: persona.userPersona,
      })
      setInstructionsDraft(persona.customInstructions || '')
    }
  }, [personas, updateSettings])

  if (!currentSettings) {
    return null
  }

  const handleReset = () => {
    if (confirm(t('chat.characterTune.confirmReset') || '确定要重置所有设置为默认值吗？')) {
      resetSettings()
    }
  }

  const handleCompressHistory = async () => {
    if (!currentChat) {
      toast.error(t('chat.error.noActiveChat') || '没有活动对话')
      return
    }

    setIsCompressing(true)
    try {
      const result = await chatService.compressHistory(currentChat.id, compressionStrategy)
      toast.success(t('chat.success.messagesCompressed', {
        deletedCount: result.deletedCount,
        tokensEstimate: result.tokensEstimate
      }) || `已压缩 ${result.deletedCount} 条消息为 1 条摘要，节省约 ${result.tokensEstimate} tokens`)
      setShowCompressionDialog(false)
      await refreshMessages()
    } catch (error) {
      console.error('Compression failed:', error)
      toast.error(t('chat.error.compressionFailed') || '压缩失败: ' + (error as Error).message)
    } finally {
      setIsCompressing(false)
    }
  }

  // 打开创建/编辑人设对话框
  const handleOpenPersonaModal = (persona?: Persona) => {
    if (persona) {
      setPersonaToEdit(persona)
      setPersonaFormData({
        name: persona.name,
        description: persona.description || '',
        userPersona: persona.userPersona,
        customInstructions: persona.customInstructions || '',
        isDefault: persona.isDefault,
      })
    } else {
      setPersonaToEdit(null)
      setPersonaFormData({
        name: '',
        description: '',
        userPersona: '',
        customInstructions: '',
        isDefault: false,
      })
    }
    setShowPersonaManageModal(true)
  }

  // 保存人设（创建或更新）
  const handleSavePersona = async () => {
    if (!personaFormData.name || !personaFormData.userPersona) {
      toast.error(t('chat.error.personaRequiredFields') || '人设名称和内容不能为空')
      return
    }

    setIsSavingPersona(true)
    try {
      if (personaToEdit) {
        // 更新现有人设
        await personaService.updatePersona(personaToEdit.id, personaFormData)
        toast.success(t('chat.success.personaUpdated') || '人设已更新')
      } else {
        // 创建新人设
        await personaService.createPersona(personaFormData)
        toast.success(t('chat.success.personaCreated') || '人设已创建')
      }

      setShowPersonaManageModal(false)
      await loadPersonas()
    } catch (error) {
      console.error('保存人设失败:', error)
      toast.error(t('chat.error.failedSavePersona') || '保存人设失败')
    } finally {
      setIsSavingPersona(false)
    }
  }

  // 删除人设
  const handleDeletePersona = async (personaId: string) => {
    if (!confirm(t('chat.characterTune.userPersona.confirmDelete') || '确定要删除这个人设吗？')) return

    try {
      await personaService.deletePersona(personaId)
      toast.success(t('chat.success.personaDeleted') || '人设已删除')

      // 如果删除的是当前选中的人设，清空选择
      if (selectedPersonaId === personaId) {
        setSelectedPersonaId(null)
      }

      await loadPersonas()
    } catch (error) {
      console.error('删除人设失败:', error)
      toast.error(t('chat.error.failedDeletePersona') || '删除人设失败')
    }
  }

  // 设置为默认人设
  const handleSetDefault = async (personaId: string) => {
    try {
      await personaService.setDefaultPersona(personaId)
      toast.success(t('chat.success.setAsDefault') || '已设置为默认人设')
      await loadPersonas()
    } catch (error) {
      console.error('设置默认人设失败:', error)
      toast.error(t('chat.error.failedSetDefault') || '设置默认人设失败')
    }
  }

  // Calculate stats
  const daysSince = (date: string | Date | undefined) => {
    if (!date) return 0
    return Math.ceil((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
  }

  const currentMessageCount = messages.length
  const canCompress = currentMessageCount >= 50

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <IconAdjustments size={24} />
          <div>
            <Text size="lg" fw={600}>
              {t('chat.characterTune.title') || '角色微调设置'}
            </Text>
            {characterName && (
              <Text size="xs" c="dimmed">
                {characterName}
              </Text>
            )}
          </div>
        </Group>
      }
      size="lg"
      centered
    >
      <Stack gap="md">
        {/* Stats and Compression Section */}
        {character?.stats && (character.stats.totalChats > 0 || character.stats.firstChatDate) && (
          <Box p="md" style={{ background: 'rgba(249, 200, 109, 0.1)', borderRadius: '8px' }}>
            <Text size="sm" fw={600} mb="xs">{t('chat.characterTune.statistics') || '对话统计'}</Text>
            <Group gap="md" mb="sm">
              {character.stats.totalChats > 0 && (
                <Text size="xs">{t('chat.characterTune.chatsCount', { count: character.stats.totalChats })}</Text>
              )}
              {character.stats.totalMessages > 0 && (
                <Text size="xs">{t('chat.characterTune.messagesCount', { count: character.stats.totalMessages })}</Text>
              )}
              {character.stats.firstChatDate && (
                <Text size="xs">{t('chat.characterTune.daysKnown', { count: daysSince(character.stats.firstChatDate) })}</Text>
              )}
            </Group>
            {currentChat && (
              <>
                <Divider my="xs" />
                <Group justify="space-between" align="center">
                  <Text size="xs" c="dimmed">
                    {t('chat.characterTune.currentChat', { count: currentMessageCount })}
                  </Text>
                  <Button
                    size="xs"
                    variant="light"
                    onClick={() => setShowCompressionDialog(true)}
                    disabled={!canCompress}
                    leftSection={<IconArchive size={14} />}
                    title={!canCompress ? t('chat.characterTune.needMinMessages') || '需要至少 50 条消息才能压缩' : ''}
                  >
                    {t('chat.characterTune.compressHistory') || '压缩历史'}
                  </Button>
                </Group>
              </>
            )}
          </Box>
        )}

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="behavior" leftSection={<IconSparkles size={16} />}>
              {t('chat.characterTune.tabs.behavior') || '角色行为'}
            </Tabs.Tab>
            <Tabs.Tab value="persona" leftSection={<IconUser size={16} />}>
              {t('chat.characterTune.tabs.persona') || '用户人设'}
            </Tabs.Tab>
          </Tabs.List>

          {/* 角色行为 Tab */}
          <Tabs.Panel value="behavior" pt="md">
            <Stack gap="md">
              <Box>
                <Text size="sm" fw={500} mb="xs">
                  {t('chat.characterTune.responseLength.label') || '回复长度'}
                </Text>
                <Select
                  value={currentSettings.responseLength}
                  onChange={(value) => updateSettings({ responseLength: value as ResponseLength })}
                  data={[
                    {
                      value: 'short',
                      label: t('chat.characterTune.responseLength.short') || '简短 (50-150字)'
                    },
                    {
                      value: 'medium',
                      label: t('chat.characterTune.responseLength.medium') || '中等 (150-300字)'
                    },
                    {
                      value: 'long',
                      label: t('chat.characterTune.responseLength.long') || '详细 (300-500字)'
                    },
                    {
                      value: 'custom',
                      label: t('chat.characterTune.responseLength.custom') || '自定义长度'
                    },
                  ]}
                />
                {currentSettings.responseLength === 'custom' && (
                  <NumberInput
                    mt="xs"
                    label={t('chat.characterTune.customLength') || '自定义字数'}
                    placeholder="200"
                    min={50}
                    max={1000}
                    step={50}
                    value={currentSettings.customLength || 200}
                    onChange={(value) => updateSettings({ customLength: value as number })}
                  />
                )}
                <Text size="xs" c="dimmed" mt="xs">
                  {t('chat.characterTune.responseLength.hint') || '控制AI回复的大致长度'}
                </Text>
              </Box>

              <Box>
                <Text size="sm" fw={500} mb="xs">
                  {t('chat.characterTune.toneStyle.label') || '语气风格'}
                </Text>
                <Select
                  value={currentSettings.toneStyle}
                  onChange={(value) => updateSettings({ toneStyle: value as ToneStyle })}
                  data={[
                    {
                      value: 'default',
                      label: t('chat.characterTune.toneStyle.default') || '默认(遵循角色卡)'
                    },
                    {
                      value: 'formal',
                      label: t('chat.characterTune.toneStyle.formal') || '正式专业'
                    },
                    {
                      value: 'casual',
                      label: t('chat.characterTune.toneStyle.casual') || '轻松随意'
                    },
                    {
                      value: 'playful',
                      label: t('chat.characterTune.toneStyle.playful') || '活泼俏皮'
                    },
                    {
                      value: 'serious',
                      label: t('chat.characterTune.toneStyle.serious') || '严肃认真'
                    },
                  ]}
                />
                <Text size="xs" c="dimmed" mt="xs">
                  {t('chat.characterTune.toneStyle.hint') || '调整角色的整体语气和说话方式'}
                </Text>
              </Box>

              <Box>
                <Text size="sm" fw={500} mb="xs">
                  {t('chat.characterTune.detailLevel.label') || '细节程度'}
                </Text>
                <Select
                  value={currentSettings.detailLevel}
                  onChange={(value) => updateSettings({ detailLevel: value as DetailLevel })}
                  data={[
                    {
                      value: 'concise',
                      label: t('chat.characterTune.detailLevel.concise') || '简洁明了'
                    },
                    {
                      value: 'balanced',
                      label: t('chat.characterTune.detailLevel.balanced') || '适度平衡'
                    },
                    {
                      value: 'detailed',
                      label: t('chat.characterTune.detailLevel.detailed') || '丰富详细'
                    },
                  ]}
                />
                <Text size="xs" c="dimmed" mt="xs">
                  {t('chat.characterTune.detailLevel.hint') || '控制回复中的描述和细节丰富程度'}
                </Text>
              </Box>

              <Divider />

              <Box>
                <Text size="sm" fw={500} mb="xs">
                  {t('chat.characterTune.customInstructions.label') || '自定义指令'}
                </Text>
                <Textarea
                  placeholder={
                    t('chat.characterTune.customInstructions.placeholder') ||
                    '例如: 多使用比喻和成语...'
                  }
                  value={instructionsDraft}
                  onChange={(e) => {
                    const v = e.target.value
                    setInstructionsDraft(v)
                    debouncedUpdate('customInstructions', v)
                  }}
                  minRows={3}
                  maxRows={6}
                />
                <Text size="xs" c="dimmed" mt="xs">
                  {t('chat.characterTune.customInstructions.hint') ||
                    '添加特定的行为指令,如语言风格、表达习惯等'}
                </Text>
              </Box>
            </Stack>
          </Tabs.Panel>

          {/* 用户人设 Tab */}
          <Tabs.Panel value="persona" pt="md">
            <Stack gap="md">
              {/* 人设选择器 */}
              <Box>
                <Group justify="space-between" mb="xs">
                  <Text size="sm" fw={500}>
                    {t('chat.characterTune.userPersona.selectPersona') || '选择用户人设'}
                  </Text>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconPlus size={14} />}
                    onClick={() => handleOpenPersonaModal()}
                  >
                    {t('chat.characterTune.userPersona.createPersona') || '新建人设'}
                  </Button>
                </Group>

                <Select
                  placeholder={t('chat.placeholder.selectPersona')}
                  value={selectedPersonaId}
                  onChange={handleSelectPersona}
                  data={personas.map(persona => ({
                    value: persona.id,
                    label: `${persona.isDefault ? '⭐ ' : ''}${persona.name}${persona.description ? ` - ${persona.description}` : ''}`,
                  }))}
                  disabled={isLoadingPersonas || personas.length === 0}
                  rightSection={isLoadingPersonas ? <Loader size="xs" /> : undefined}
                />

                {personas.length === 0 && !isLoadingPersonas && (
                  <Text size="xs" c="dimmed" mt="xs">
                    {t('chat.characterTune.userPersona.noPersonas') || '还没有人设，点击"新建人设"创建一个'}
                  </Text>
                )}
              </Box>

              {/* 选中人设的详情 */}
              {selectedPersonaId && (() => {
                const selectedPersona = personas.find(p => p.id === selectedPersonaId)
                if (!selectedPersona) return null

                return (
                  <>
                    <Divider />

                    <Box>
                      <Group justify="space-between" mb="xs">
                        <Group gap="xs">
                          <Text size="sm" fw={500}>
                            {selectedPersona.name}
                          </Text>
                          {selectedPersona.isDefault && (
                            <Badge size="sm" variant="light" color="yellow">
                              {t('chat.characterTune.userPersona.defaultLabel') || '默认'}
                            </Badge>
                          )}
                        </Group>
                        <Group gap="xs">
                          {!selectedPersona.isDefault && (
                            <Tooltip label={t('chat.characterTune.userPersona.setDefaultTooltip') || '设为默认'}>
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="yellow"
                                onClick={() => handleSetDefault(selectedPersona.id)}
                              >
                                <IconStar size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                          <Tooltip label={t('common.edit') || '编辑'}>
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              onClick={() => handleOpenPersonaModal(selectedPersona)}
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label={t('common.delete') || '删除'}>
                            <ActionIcon
                              size="sm"
                              variant="subtle"
                              color="red"
                              onClick={() => handleDeletePersona(selectedPersona.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Group>

                      {selectedPersona.description && (
                        <Text size="xs" c="dimmed" mb="sm">
                          {selectedPersona.description}
                        </Text>
                      )}

                      <Box p="md" style={{
                        background: 'var(--mantine-color-gray-light)',
                        borderRadius: '8px'
                      }}>
                        <Text size="xs" fw={500} mb="xs">{t('chat.characterTune.userPersona.contentLabel') || '人设内容:'}</Text>
                        <Text size="xs" style={{ whiteSpace: 'pre-wrap' }}>
                          {selectedPersona.userPersona}
                        </Text>

                        {selectedPersona.customInstructions && (
                          <>
                            <Divider my="sm" />
                            <Text size="xs" fw={500} mb="xs">{t('chat.characterTune.customInstructions.label') || '自定义指令:'}</Text>
                            <Text size="xs" style={{ whiteSpace: 'pre-wrap' }}>
                              {selectedPersona.customInstructions}
                            </Text>
                          </>
                        )}
                      </Box>
                    </Box>
                  </>
                )
              })()}

              <Box p="md" style={{ backgroundColor: 'var(--mantine-color-blue-light)', borderRadius: '8px' }}>
                <Text size="sm" fw={500} c="blue" mb="xs">
                  📝 {t('chat.characterTune.userPersona.tips.title') || '使用提示'}
                </Text>
                <Stack gap="xs">
                  <Text size="xs" c="dimmed">
                    • {t('chat.characterTune.userPersona.tips.tip1') || '人设会影响AI对你的回复内容和语气'}
                  </Text>
                  <Text size="xs" c="dimmed">
                    • {t('chat.characterTune.userPersona.tips.tip2') || '可以创建多个人设，在不同场景下切换使用'}
                  </Text>
                  <Text size="xs" c="dimmed">
                    • {t('chat.characterTune.userPersona.tips.tip3') || '设置默认人设后，新对话会自动使用该人设'}
                  </Text>
                  <Text size="xs" c="dimmed">
                    • {t('chat.characterTune.userPersona.tips.tip4') || '人设保存在用户层级，所有角色共享'}
                  </Text>
                </Stack>
              </Box>
            </Stack>
          </Tabs.Panel>
        </Tabs>

        {/* 底部操作按钮 */}
        <Group justify="space-between" mt="md">
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconRefresh size={16} />}
            onClick={handleReset}
          >
            {t('chat.characterTune.reset') || '重置为默认'}
          </Button>
          <Button onClick={onClose}>
            {t('common.close') || '关闭'}
          </Button>
        </Group>
      </Stack>

      {/* Compression Dialog */}
      <Modal
        opened={showCompressionDialog}
        onClose={() => setShowCompressionDialog(false)}
        title={t('chat.characterTune.compressionTitle') || '压缩对话历史'}
        size="md"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {t('chat.characterTune.compressionHint') || '压缩历史将使用 AI 总结中间对话，保留开头和最近的消息。这将节省上下文，但不可逆。继续吗？'}
          </Text>

          <Box>
            <Text size="sm" fw={500} mb="xs">{t('chat.characterTune.compressionStrategy') || '选择压缩策略'}</Text>
            <Stack gap="xs">
              <Button
                variant={compressionStrategy === 'llm' ? 'filled' : 'light'}
                onClick={() => setCompressionStrategy('llm')}
                fullWidth
                justify="flex-start"
              >
                <Stack gap={4} align="flex-start">
                  <Text size="sm" fw={500}>{t('chat.characterTune.useAI') || '使用 AI 总结 (推荐)'}</Text>
                  <Text size="xs" c="dimmed">{t('chat.characterTune.useAIDesc') || '保留完整上下文，智能摘要'}</Text>
                </Stack>
              </Button>
              <Button
                variant={compressionStrategy === 'truncate' ? 'filled' : 'light'}
                onClick={() => setCompressionStrategy('truncate')}
                fullWidth
                justify="flex-start"
              >
                <Stack gap={4} align="flex-start">
                  <Text size="sm" fw={500}>{t('chat.characterTune.truncate') || '简单截断 (免费)'}</Text>
                  <Text size="xs" c="dimmed">{t('chat.characterTune.truncateDesc') || '保留首尾，删除中间'}</Text>
                </Stack>
              </Button>
            </Stack>
          </Box>

          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => setShowCompressionDialog(false)}>
              {t('common.cancel') || '取消'}
            </Button>
            <Button
              onClick={handleCompressHistory}
              loading={isCompressing}
              leftSection={!isCompressing && <IconArchive size={16} />}
            >
              {isCompressing ? (t('chat.characterTune.compressing') || '压缩中...') : (t('chat.characterTune.startCompression') || '开始压缩')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* 人设管理模态框 */}
      <Modal
        opened={showPersonaManageModal}
        onClose={() => setShowPersonaManageModal(false)}
        title={personaToEdit ? t('chat.characterTune.userPersona.editPersona') || '编辑人设' : t('chat.characterTune.userPersona.createPersona') || '新建人设'}
        size="lg"
        centered
      >
        <Stack gap="md">
          <TextInput
            label={t('chat.characterTune.userPersona.personaName') || '人设名称'}
            placeholder={t('chat.placeholder.personaName')}
            value={personaFormData.name}
            onChange={(e) => setPersonaFormData({ ...personaFormData, name: e.target.value })}
            required
          />

          <Textarea
            label={t('chat.characterTune.userPersona.personaDescription') || '人设描述（可选）'}
            placeholder={t('chat.placeholder.personaDescription')}
            value={personaFormData.description}
            onChange={(e) => setPersonaFormData({ ...personaFormData, description: e.target.value })}
            minRows={2}
            maxRows={3}
          />

          <Textarea
            label={t('chat.characterTune.userPersona.personaContent') || '人设内容'}
            placeholder={t('chat.placeholder.personaContent')}
            value={personaFormData.userPersona}
            onChange={(e) => setPersonaFormData({ ...personaFormData, userPersona: e.target.value })}
            minRows={8}
            maxRows={15}
            required
          />

          <Textarea
            label={t('chat.characterTune.customInstructions.label') + (t('common.optional') ? ` (${t('common.optional')})` : ' (可选)')}
            placeholder={t('chat.placeholder.customInstructions')}
            value={personaFormData.customInstructions}
            onChange={(e) => setPersonaFormData({ ...personaFormData, customInstructions: e.target.value })}
            minRows={3}
            maxRows={6}
          />

          <Group justify="space-between">
            <Button
              variant={personaFormData.isDefault ? 'filled' : 'light'}
              color="yellow"
              leftSection={personaFormData.isDefault ? <IconStarFilled size={16} /> : <IconStar size={16} />}
              onClick={() => setPersonaFormData({ ...personaFormData, isDefault: !personaFormData.isDefault })}
            >
              {personaFormData.isDefault ? t('chat.characterTune.userPersona.defaultPersona') || '默认人设' : t('chat.characterTune.userPersona.setDefault') || '设为默认'}
            </Button>

            <Group gap="xs">
              <Button variant="subtle" onClick={() => setShowPersonaManageModal(false)}>
                {t('common.cancel') || '取消'}
              </Button>
              <Button
                onClick={handleSavePersona}
                loading={isSavingPersona}
              >
                {isSavingPersona ? (t('chat.characterTune.userPersona.saving') || '保存中...') : (t('common.save') || '保存')}
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </Modal>
  )
}
