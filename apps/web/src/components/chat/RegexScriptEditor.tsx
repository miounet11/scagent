"use client"

import { useState, useEffect } from 'react'
import { useTranslation } from '@/lib/i18n'
import { 
  Modal,
  Button,
  TextInput,
  Textarea,
  Badge,
  NumberInput,
  Select,
  Switch,
  Group,
  Stack,
  Text,
  ActionIcon,
  ScrollArea,
  FileButton,
  Code as CodeBlock,
  Divider
} from '@mantine/core'
import {
  IconX,
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconChevronDown,
  IconChevronUp,
  IconCode,
  IconUpload,
  IconDownload,
  IconPlayerPlay,
  IconRefresh
} from '@tabler/icons-react'
import { 
  getDefaultRegexRules, 
  hasDefaultRulesInitialized, 
  markDefaultRulesInitialized,
  RegexScript 
} from '@/lib/defaultRegexRules'
import {
  getRegexScripts,
  saveRegexScripts
} from '@/lib/regexScriptStorage'
import toast from 'react-hot-toast'

interface RegexScriptEditorProps {
  isOpen: boolean
  onClose: () => void
}

export default function RegexScriptEditor({
  isOpen,
  onClose
}: RegexScriptEditorProps) {
  const { t } = useTranslation()
  const [scripts, setScripts] = useState<RegexScript[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editingScript, setEditingScript] = useState<RegexScript | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [testInput, setTestInput] = useState('')
  const [testOutput, setTestOutput] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    findRegex: '',
    replaceWith: '',
    priority: 100,
    scriptType: 'all' as RegexScript['scriptType'],
    enabled: true
  })

  // Load scripts from localStorage on mount
  useEffect(() => {
    if (isOpen) {
      loadScripts()
    }
  }, [isOpen])

  const loadScripts = () => {
    const stored = getRegexScripts()
    
    // Auto-initialize with default rules if first time
    if (stored.length === 0 && !hasDefaultRulesInitialized()) {
      const defaultRules = getDefaultRegexRules()
      saveRegexScripts(defaultRules)
      markDefaultRulesInitialized()
      setScripts(defaultRules)
    } else {
      setScripts(stored)
    }
  }

  const handleLoadDefaults = () => {
    if (confirm('这将用默认规则替换现有规则。确定继续吗？')) {
      const defaultRules = getDefaultRegexRules()
      saveRegexScripts(defaultRules)
      setScripts(defaultRules)
      markDefaultRulesInitialized()
    }
  }

  const filteredScripts = scripts
    .filter(script =>
      script.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      script.findRegex.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const comparison = a.priority - b.priority
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const handleCreate = () => {
    setIsEditing(true)
    setEditingScript(null)
    setFormData({
      name: '',
      findRegex: '',
      replaceWith: '',
      priority: 100,
      scriptType: 'all',
      enabled: true
    })
    setTestInput('')
    setTestOutput('')
  }

  const handleSave = () => {
    // Validate regex
    try {
      // Try to parse regex with or without slashes
      const regexMatch = formData.findRegex.match(/^\/(.+)\/([gimsuvy]*)$/)
      if (regexMatch) {
        new RegExp(regexMatch[1], regexMatch[2])
      } else {
        new RegExp(formData.findRegex)
      }
    } catch (e) {
      alert(t('chat.error.invalidRegex') || '正则表达式格式错误')
      return
    }

    const newScript: RegexScript = {
      id: editingScript?.id || `custom-${Date.now()}`,
      name: formData.name,
      enabled: formData.enabled,
      findRegex: formData.findRegex,
      replaceWith: formData.replaceWith,
      priority: formData.priority,
      scriptType: formData.scriptType
    }

    let updatedScripts: RegexScript[]
    if (editingScript) {
      updatedScripts = scripts.map(s => s.id === editingScript.id ? newScript : s)
    } else {
      updatedScripts = [...scripts, newScript]
    }

    setScripts(updatedScripts)
    saveRegexScripts(updatedScripts)
    setIsEditing(false)
    setEditingScript(null)
  }

  const handleEdit = (script: RegexScript) => {
    setEditingScript(script)
    setIsEditing(true)
    setFormData({
      name: script.name,
      findRegex: script.findRegex,
      replaceWith: script.replaceWith,
      priority: script.priority,
      scriptType: script.scriptType,
      enabled: script.enabled
    })
    setTestInput('')
    setTestOutput('')
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个脚本吗？')) {
      const updated = scripts.filter(s => s.id !== id)
      setScripts(updated)
      saveRegexScripts(updated)
    }
  }

  const toggleScript = (id: string) => {
    const updated = scripts.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    )
    setScripts(updated)
    saveRegexScripts(updated)
  }

  const handleTest = () => {
    if (!formData.findRegex) {
      setTestOutput('请输入正则表达式')
      return
    }

    try {
      const regex = new RegExp(formData.findRegex, 'g')
      const result = testInput.replace(regex, formData.replaceWith)
      setTestOutput(result)
    } catch (e) {
      setTestOutput(`错误: ${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(scripts, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'regex-scripts.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (file: File | null) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string)
        if (Array.isArray(imported)) {
          const updatedScripts = [...scripts, ...imported]
          setScripts(updatedScripts)
          saveRegexScripts(updatedScripts)
          toast.success(t('chat.success.importSuccess') || '导入成功')
        }
      } catch (error) {
        toast.error(t('chat.error.importFailed') || '导入失败：文件格式错误')
      }
    }
    reader.readAsText(file)
  }

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <Group gap="xs">
          <IconCode size={24} color="hsl(var(--primary-rose))" />
          <Text size="xl" fw={700}>正则脚本编辑器</Text>
        </Group>
      }
      styles={{
        content: { height: '85vh' },
        body: { height: 'calc(100% - 60px)', display: 'flex', flexDirection: 'column' }
      }}
    >
      <Group style={{ flex: 1, overflow: 'hidden', alignItems: 'stretch' }} gap="md">
          {!isEditing ? (
            <>
              {/* Scripts List */}
              <Stack style={{ flex: 1, overflow: 'hidden' }}>
                <Group gap="xs" wrap="nowrap">
                  <TextInput
                    placeholder={t('chat.placeholder.searchScripts')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                    leftSection={<IconSearch size={16} />}
                    style={{ flex: 1 }}
                  />

                  <Button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    variant="default"
                    leftSection={sortOrder === 'asc' ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                  >
                    优先级
                  </Button>

                  <FileButton onChange={handleImport} accept=".json">
                    {(props) => (
                      <ActionIcon {...props} variant="default" size="lg">
                        <IconUpload size={18} />
                      </ActionIcon>
                    )}
                  </FileButton>

                  <ActionIcon
                    onClick={handleExport}
                    disabled={scripts.length === 0}
                    variant="default"
                    size="lg"
                  >
                    <IconDownload size={18} />
                  </ActionIcon>

                  <ActionIcon
                    onClick={handleLoadDefaults}
                    variant="default"
                    size="lg"
                  >
                    <IconRefresh size={18} />
                  </ActionIcon>

                  <Button
                    onClick={handleCreate}
                    leftSection={<IconPlus size={16} />}
                    color="brand"
                    variant="gradient"
                  >
                    添加脚本
                  </Button>
                </Group>

                <ScrollArea style={{ flex: 1 }}>
                  {filteredScripts.length === 0 ? (
                    <Stack align="center" gap="md" py={60}>
                      <IconCode size={64} opacity={0.3} />
                      <Text c="dimmed">
                        {searchQuery ? '未找到匹配的脚本' : '还没有正则脚本'}
                      </Text>
                      {!searchQuery && (
                        <Button
                          onClick={handleCreate}
                          variant="light"
                          leftSection={<IconPlus size={16} />}
                        >
                          创建第一个脚本
                        </Button>
                      )}
                    </Stack>
                  ) : (
                    <Stack gap="xs">
                      {filteredScripts.map((script) => (
                        <Stack
                          key={script.id}
                          p="md"
                          style={{
                            backgroundColor: 'var(--mantine-color-dark-7)',
                            borderRadius: 'var(--mantine-radius-md)',
                            border: '1px solid var(--mantine-color-dark-5)'
                          }}
                        >
                          <Group justify="space-between" wrap="nowrap">
                            <Group gap="xs" style={{ flex: 1 }}>
                              <Switch
                                checked={script.enabled}
                                onChange={() => toggleScript(script.id)}
                                color="brand"
                              />
                              <Text fw={600}>{script.name}</Text>
                              <Badge variant="light" color="gray" size="sm">
                                {script.scriptType}
                              </Badge>
                            </Group>

                            <Group gap={4}>
                              <ActionIcon
                                onClick={() => handleEdit(script)}
                                variant="subtle"
                                color="brand"
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon
                                onClick={() => handleDelete(script.id)}
                                variant="subtle"
                                color="red"
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Group>

                          <Stack gap={4}>
                            <Group gap="xs" align="flex-start">
                              <Text size="xs" c="dimmed" style={{ minWidth: 60 }}>查找:</Text>
                              <CodeBlock style={{ flex: 1 }} c="orange">
                                {script.findRegex}
                              </CodeBlock>
                            </Group>
                            <Group gap="xs" align="flex-start">
                              <Text size="xs" c="dimmed" style={{ minWidth: 60 }}>替换:</Text>
                              <CodeBlock style={{ flex: 1 }} c="brand">
                                {script.replaceWith}
                              </CodeBlock>
                            </Group>
                          </Stack>

                          <Text size="xs" c="dimmed">优先级: {script.priority}</Text>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </ScrollArea>
              </Stack>
            </>
          ) : (
            /* Editor Form */
            <Stack style={{ flex: 1, overflow: 'hidden' }}>
              <ScrollArea style={{ flex: 1 }}>
                <Stack gap="md">
                  <TextInput
                    label="脚本名称"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
                    placeholder={t('chat.placeholder.scriptName')}
                    required
                  />

                  <Textarea
                    label="查找（正则表达式）"
                    value={formData.findRegex}
                    onChange={(e) => setFormData({ ...formData, findRegex: e.currentTarget.value })}
                    placeholder={t('chat.placeholder.findRegex')}
                    minRows={4}
                    styles={{ input: { fontFamily: 'monospace', fontSize: '0.875rem' } }}
                    required
                  />

                  <Textarea
                    label="替换为"
                    value={formData.replaceWith}
                    onChange={(e) => setFormData({ ...formData, replaceWith: e.currentTarget.value })}
                    placeholder={t('chat.placeholder.replaceWith')}
                    minRows={4}
                    styles={{ input: { fontFamily: 'monospace', fontSize: '0.875rem' } }}
                  />

                  <Group grow>
                    <Select
                      label="脚本类型"
                      value={formData.scriptType}
                      onChange={(value) => setFormData({ ...formData, scriptType: value as RegexScript['scriptType'] })}
                      data={[
                        { value: 'all', label: '全部' },
                        { value: 'input', label: '输入' },
                        { value: 'output', label: '输出' },
                        { value: 'display', label: '显示' }
                      ]}
                    />

                    <NumberInput
                      label="优先级"
                      value={formData.priority}
                      onChange={(value) => setFormData({ ...formData, priority: Number(value) || 0 })}
                    />
                  </Group>

                  <Switch
                    label="启用此脚本"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.currentTarget.checked })}
                    color="brand"
                  />

                  {/* Test Section */}
                  <Divider my="md" />
                  
                  <Stack gap="md">
                    <Text size="sm" fw={600}>测试脚本</Text>
                    
                    <Textarea
                      label="测试输入"
                      value={testInput}
                      onChange={(e) => setTestInput(e.currentTarget.value)}
                      placeholder={t('chat.placeholder.testInput')}
                      minRows={4}
                      styles={{ input: { fontFamily: 'monospace', fontSize: '0.875rem' } }}
                    />

                    <Button
                      onClick={handleTest}
                      variant="light"
                      leftSection={<IconPlayerPlay size={16} />}
                    >
                      运行测试
                    </Button>

                    {testOutput && (
                      <Stack gap={4}>
                        <Text size="sm" c="dimmed">输出结果</Text>
                        <ScrollArea h={120}>
                          <CodeBlock
                            style={{
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all'
                            }}
                          >
                            {testOutput}
                          </CodeBlock>
                        </ScrollArea>
                      </Stack>
                    )}
                  </Stack>

                  <Group gap="xs" mt="md">
                    <Button
                      onClick={handleSave}
                      disabled={!formData.name || !formData.findRegex}
                      style={{ flex: 1 }}
                      color="brand"
                      variant="gradient"
                    >
                      保存
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditing(false)
                        setEditingScript(null)
                      }}
                      variant="default"
                      style={{ flex: 1 }}
                    >
                      取消
                    </Button>
                  </Group>
                </Stack>
              </ScrollArea>
            </Stack>
          )}
      </Group>
    </Modal>
  )
}

