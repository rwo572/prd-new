'use client'

import { useState, useRef, useEffect } from 'react'
import {
  MessageSquare,
  Send,
  Loader2,
  Bot,
  User,
  FileText,
  Type,
  Edit3,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Brain,
  Zap,
  Wand2,
  X,
  Trash2,
  Eraser,
  Plus,
  RefreshCw,
  Target,
  AlertCircle,
  Users,
  ArrowRight,
  Check,
  RotateCcw,
  MessageCircle,
  Undo2,
  CheckSquare,
  Upload
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Message } from '@/types'
import { ApiKeys } from '@/types'
import { cn } from '@/lib/utils'
import { generatePromptSuggestions, getQuickPromptSuggestions, PromptSuggestion } from '@/lib/prompt-suggestion-service'
import { getModelById } from '@/lib/model-config'

interface ChatPanelProps {
  messages: Message[]
  onSendMessage: (message: string, context?: {
    type: 'full' | 'selection' | 'file',
    content: string,
    selectionStart?: number,
    selectionEnd?: number,
    fileName?: string
  }) => void
  isGenerating: boolean
  editorContent: string
  selectedText?: string
  selectionRange?: { start: number, end: number }
  activeFileName?: string
  onReplaceText?: (start: number, end: number, newText: string) => void
  onInsertText?: (position: number, text: string) => void
  onAcceptContent?: (content: string, context?: { type: 'full' | 'selection', selectionStart?: number, selectionEnd?: number }) => void
  streamingThought?: string
  streamingContent?: string
  apiKeys?: ApiKeys
  onClearChat?: () => void
  onStopGeneration?: () => void
  error?: string | null
}

export default function ChatPanel({
  messages,
  onSendMessage,
  isGenerating,
  editorContent,
  selectedText,
  selectionRange,
  onReplaceText,
  onInsertText,
  onAcceptContent,
  streamingThought = '',
  streamingContent = '',
  apiKeys,
  onClearChat,
  onStopGeneration,
  activeFileName,
  error
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const [showContext, setShowContext] = useState(false)
  const [contextMode, setContextMode] = useState<'none' | 'full' | 'selection'>('none')
  const [promptSuggestions, setPromptSuggestions] = useState<PromptSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [lastAssistantMessage, setLastAssistantMessage] = useState<Message | null>(null)
  const [lastUserPrompt, setLastUserPrompt] = useState<string>('')
  const [lastContext, setLastContext] = useState<{ type: 'full' | 'selection', content: string, selectionStart?: number, selectionEnd?: number } | undefined>()
  const [actionStates, setActionStates] = useState<Record<string, 'accepted' | 'regenerated' | 'reprompted' | null>>({})
  const [previousContent, setPreviousContent] = useState<string>('')
  const [undoContext, setUndoContext] = useState<{ messageId: string, content: string, context?: any } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    // Track the last markdown message for interactive actions
    const markdownMessages = messages.filter(m => m.role === 'assistant' && m.isMarkdown)
    if (markdownMessages.length > 0) {
      setLastAssistantMessage(markdownMessages[markdownMessages.length - 1])
    } else {
      // Fallback to last assistant message if no markdown messages
      const assistantMessages = messages.filter(m => m.role === 'assistant')
      if (assistantMessages.length > 0) {
        setLastAssistantMessage(assistantMessages[assistantMessages.length - 1])
      }
    }
    // Track last user prompt
    const userMessages = messages.filter(m => m.role === 'user')
    if (userMessages.length > 0) {
      setLastUserPrompt(userMessages[userMessages.length - 1].content)
    }
  }, [messages])

  // Update context mode and generate suggestions when selection changes
  useEffect(() => {
    if (selectedText && selectedText.trim()) {
      setContextMode('selection')
      setShowContext(true)
      
      // Show loading state immediately
      setLoadingSuggestions(true)
      setPromptSuggestions([])
      
      // Fetch AI-powered suggestions if available
      if (apiKeys && (apiKeys.openai || apiKeys.anthropic || apiKeys.gemini)) {
        generatePromptSuggestions(selectedText, apiKeys, editorContent)
          .then(suggestions => {
            // Take up to 6 suggestions
            setPromptSuggestions(suggestions.slice(0, 6))
          })
          .catch(error => {
            console.error('Failed to generate suggestions:', error)
            // Fall back to quick local suggestions on error
            const quickSuggestions = getQuickPromptSuggestions(selectedText)
            setPromptSuggestions(quickSuggestions.slice(0, 6))
          })
          .finally(() => {
            setLoadingSuggestions(false)
          })
      } else {
        // Use local suggestions if no API keys
        const quickSuggestions = getQuickPromptSuggestions(selectedText)
        setPromptSuggestions(quickSuggestions.slice(0, 6))
        setLoadingSuggestions(false)
      }
    } else if (editorContent && editorContent.trim().length > 100) {
      // Generate prompts for full document when no selection
      setLoadingSuggestions(true)
      setPromptSuggestions([])
      
      if (apiKeys && (apiKeys.openai || apiKeys.anthropic || apiKeys.gemini)) {
        // Use first 500 chars of document for prompt generation
        const contentPreview = editorContent.slice(0, 500)
        generatePromptSuggestions(contentPreview, apiKeys, editorContent)
          .then(suggestions => {
            setPromptSuggestions(suggestions.slice(0, 6))
          })
          .catch(error => {
            console.error('Failed to generate suggestions:', error)
            // Default prompts for full document
            setPromptSuggestions([
              { icon: '🎯', label: 'Improve clarity', prompt: 'How can I make this PRD clearer and more actionable?' },
              { icon: '✅', label: 'Check completeness', prompt: 'What key sections or details are missing from this PRD?' },
              { icon: '📊', label: 'Add metrics', prompt: 'What success metrics and KPIs should I add to measure impact?' },
              { icon: '👥', label: 'User stories', prompt: 'Help me write detailed user stories for the main features' },
              { icon: '🔄', label: 'Technical spec', prompt: 'What technical requirements and architecture details are needed?' },
              { icon: '🚀', label: 'MVP scope', prompt: 'How can I better define the MVP scope and phasing?' }
            ])
          })
          .finally(() => {
            setLoadingSuggestions(false)
          })
      } else {
        // Default prompts when no API keys
        setPromptSuggestions([
          { icon: '🎯', label: 'Improve clarity', prompt: 'How can I make this PRD 10x clearer and more actionable?' },
          { icon: '✅', label: 'Check completeness', prompt: 'What key sections or details are missing from this PRD?' },
          { icon: '📊', label: 'Add metrics', prompt: 'What success metrics and KPIs should I add to measure impact?' },
          { icon: '👥', label: 'User stories', prompt: 'Help me write detailed user stories for the main features' },
          { icon: '🔄', label: 'Technical spec', prompt: 'What technical requirements and architecture details are needed?' },
          { icon: '🚀', label: 'MVP scope', prompt: 'How can I better define the MVP scope and phasing?' }
        ])
        setLoadingSuggestions(false)
      }
    } else {
      setPromptSuggestions([])
      setLoadingSuggestions(false)
    }
  }, [selectedText, apiKeys, editorContent])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileName = file.name
    const fileExtension = fileName.split('.').pop()?.toLowerCase()

    // Check if file type is supported
    if (!['md', 'markdown', 'pdf', 'doc', 'docx'].includes(fileExtension || '')) {
      alert('Please upload a Markdown (.md), PDF (.pdf), or Word (.doc, .docx) file')
      return
    }

    try {
      const reader = new FileReader()

      reader.onload = async (event) => {
        const content = event.target?.result as string

        // For markdown files, we can use the content directly
        if (['md', 'markdown'].includes(fileExtension || '')) {
          const prompt = `Translate uploaded file to prd.dev structure and generate files.

FILE: ${fileName}
CONTENT:
${content}`

          // Send with file context
          onSendMessage(prompt, {
            type: 'file',
            content: content,
            fileName: fileName
          })
        } else if (fileExtension === 'pdf') {
          const base64Content = btoa(content)
          const prompt = `Translate PDF to prd.dev structure and generate files.

FILE: ${fileName}`

          onSendMessage(prompt, {
            type: 'file',
            content: base64Content,
            fileName: fileName
          })
        } else {
          const prompt = `Translate Word doc to prd.dev structure and generate files.

FILE: ${fileName}`

          onSendMessage(prompt, {
            type: 'file',
            content: content,
            fileName: fileName
          })
        }
      }

      // Read as text for markdown, as binary string for others
      if (['md', 'markdown'].includes(fileExtension || '')) {
        reader.readAsText(file)
      } else {
        reader.readAsBinaryString(file)
      }

    } catch (error) {
      console.error('Error reading file:', error)
      alert('Failed to read file. Please try again.')
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isGenerating) {
      let context = undefined
      
      if (contextMode === 'full') {
        context = {
          type: 'full' as const,
          content: editorContent
        }
      } else if (contextMode === 'selection' && selectedText) {
        context = {
          type: 'selection' as const,
          content: selectedText,
          selectionStart: selectionRange?.start,
          selectionEnd: selectionRange?.end
        }
      }
      
      onSendMessage(input.trim(), context)
      setLastContext(context) // Store the context for regeneration
      setInput('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    adjustTextareaHeight(e.target)
  }

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto'
    const newHeight = Math.min(textarea.scrollHeight, 120) // Max 120px
    textarea.style.height = `${newHeight}px`
  }

  // Auto-resize textarea when input changes programmatically
  useEffect(() => {
    if (textareaRef.current) {
      // Always adjust height when input changes, including empty strings
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          adjustTextareaHeight(textareaRef.current)
        }
      }, 10)
      return () => clearTimeout(timer)
    }
  }, [input])

  // Also add a manual resize trigger function
  const triggerResize = () => {
    if (textareaRef.current) {
      setTimeout(() => {
        if (textareaRef.current) {
          adjustTextareaHeight(textareaRef.current)
        }
      }, 50)
    }
  }

  const handleQuickAction = (action: 'full' | 'selection') => {
    if (action === 'full') {
      setContextMode('full')
      setShowContext(true)
    } else if (action === 'selection' && selectedText) {
      setContextMode('selection')
      setShowContext(true)
    }
  }

  const handleApplySuggestion = (suggestion: string) => {
    if (contextMode === 'selection' && selectionRange && onReplaceText) {
      onReplaceText(selectionRange.start, selectionRange.end, suggestion)
    }
  }

  const getActiveProvider = () => {
    if (!apiKeys?.selectedModel) return null

    const selectedModel = getModelById(apiKeys.selectedModel)
    if (!selectedModel) return null

    // Return provider info with specific model name
    if (selectedModel.provider === 'openai') {
      return { name: selectedModel.name, icon: '🟢', color: 'text-green-600' }
    }
    if (selectedModel.provider === 'anthropic') {
      return { name: selectedModel.name, icon: '🔷', color: 'text-orange-600' }
    }
    if (selectedModel.provider === 'gemini') {
      return { name: selectedModel.name, icon: '🔵', color: 'text-blue-600' }
    }

    return null
  }

  const activeProvider = getActiveProvider()

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-white">
      {/* API Provider Header */}
      {activeProvider && (
        <div className="px-3 py-1.5 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm">{activeProvider.icon}</span>
            <span className={`text-xs font-medium ${activeProvider.color}`}>
              {activeProvider.name}
            </span>
          </div>
        </div>
      )}

      {/* File Context Header - New */}
      <div className="px-3 py-2 border-b border-slate-200 bg-blue-50">
        <div className="flex items-center justify-center gap-2">
          <FileText size={14} className="text-blue-600" />
          <span className="text-xs font-medium text-blue-700">
            {activeFileName ? `Editing: ${activeFileName}` : 'No file selected'}
          </span>
        </div>
      </div>

      {/* Primary Control Row */}
      <div className="px-3 py-2 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuickAction('full')}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200",
                contextMode === 'full' 
                  ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-sm" 
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <FileText className="h-3 w-3" />
              <span>Entire PRD</span>
            </button>
            
            <button
              onClick={() => handleQuickAction('selection')}
              disabled={!selectedText}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200",
                contextMode === 'selection' 
                  ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white shadow-sm" 
                  : selectedText
                    ? "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              <Type className="h-3 w-3" />
              <span>Selected Text</span>
            </button>


            {/* Action buttons - Pushed to the right */}
            <div className="flex-1 flex items-center justify-end gap-2">
              {contextMode !== 'none' && (
                <button
                  onClick={() => {
                    setContextMode('none')
                    setShowContext(false)
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-all duration-200"
                  title="Clear context"
                >
                  <X className="h-3 w-3" />
                  <span>Clear</span>
                </button>
              )}
              {messages.length > 0 && onClearChat && (
                <button
                  onClick={onClearChat}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-all duration-200"
                  title="Clear all messages"
                >
                  <Eraser className="h-3 w-3" />
                  <span>Clear Chat</span>
                </button>
              )}
            </div>
          </div>
        </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <h3 className="text-sm font-medium text-slate-900 mb-3">prd.dev assistant</h3>
            <p className="text-xs text-slate-600 mb-4 max-w-md mx-auto leading-relaxed">
              PRD.Dev is continuous documentation. I'll ask you 3-4 questions to understand your product, then generate a comprehensive README as your project foundation. I'll use your README as context that continually gets updated.
            </p>

            {/* API Key Notice - Only show when NO API key is available */}
            {!activeProvider && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg max-w-sm mx-auto">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-800">API Key Required</span>
                </div>
                <p className="text-xs text-amber-700 mb-2">
                  Add your OpenAI, Anthropic, or Gemini API key in Settings to unlock full AI capabilities.
                </p>
                <button
                  onClick={() => {
                    // Assuming there's a way to navigate to settings - this might need to be passed as a prop
                    // For now, we'll show a message
                    const settingsBtn = document.querySelector('[title="Settings"]') as HTMLElement;
                    if (settingsBtn) {
                      settingsBtn.click();
                    }
                  }}
                  className="text-xs text-amber-600 hover:text-amber-800 underline font-medium"
                >
                  Go to Settings →
                </button>
              </div>
            )}

            <div className="space-y-3 text-left max-w-xs mx-auto">
              {/* Generate New PRD */}
              <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <h4 className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Generate New PRD
                </h4>
                <button
                  onClick={() => {
                    setInput("I want to create a new PRD from scratch")
                    setContextMode('none')
                  }}
                  className="w-full text-left px-3 py-2 bg-white border border-green-300 rounded-lg hover:bg-green-50 hover:shadow-sm text-xs transition-all duration-200"
                >
                  <Sparkles className="h-3 w-3 inline mr-2 text-green-500" />
                  Start from scratch with AI guidance
                </button>
              </div>
              
              {/* Improve Existing PRD */}
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h4 className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Improve Existing PRD
                </h4>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-3 py-2 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 hover:shadow-sm text-xs transition-all duration-200 mb-2"
                >
                  <Upload className="h-3 w-3 inline mr-2 text-blue-500" />
                  Upload requirements file (.md, .pdf, .docx)
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.markdown,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => {
                    setInput("How can I make this PRD more comprehensive?")
                    setContextMode('full')
                  }}
                  className="w-full text-left px-3 py-2 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 hover:shadow-sm text-xs transition-all duration-200 mb-2"
                >
                  <Target className="h-3 w-3 inline mr-2 text-blue-500" />
                  Make PRD more comprehensive
                </button>
                <button
                  onClick={() => {
                    setInput("What are the key missing sections in this PRD?")
                    setContextMode('full')
                  }}
                  className="w-full text-left px-3 py-2 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 hover:shadow-sm text-xs transition-all duration-200 mb-2"
                >
                  <AlertCircle className="h-3 w-3 inline mr-2 text-blue-500" />
                  Identify missing sections
                </button>
                <button
                  onClick={() => {
                    const promptText = "Create ONLY a Tasks section in markdown format. Do NOT create a full PRD. Do NOT include Problem Statement, Solution Overview, or any other sections.\n\nReturn EXACTLY this format:\n\n## Tasks\n\n### Phase 1: Setup\n[ ] Task description here\n[ ] Another task description\n\n### Phase 2: Development\n[ ] Development task\n[ ] Another development task\n\n### Phase 3: Testing\n[ ] Testing task\n[ ] Final deployment task\n\nFORMATTING RULES:\n- Use ## for main heading, ### for subheadings\n- Use [ ] for checkboxes with NO bullets, dashes, or other symbols before them\n- FORBIDDEN: '- [ ]', '• [ ]', '* [ ]', or any symbol before [ ]\n- Each task on its own line\n- No duplicate content from existing PRD"
                    setInput(promptText)
                    setContextMode('full')
                    // Trigger resize and focus textarea after setting input
                    setTimeout(() => {
                      triggerResize()
                      textareaRef.current?.focus()
                    }, 20)
                  }}
                  className="w-full text-left px-3 py-2 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 hover:shadow-sm text-xs transition-all duration-200"
                >
                  <CheckSquare className="h-3 w-3 inline mr-2 text-blue-500" />
                  Generate task list
                </button>
              </div>
            </div>
          </div>
        ) : (
          messages
            .filter(message => !message.content.startsWith('Error:'))
            .map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
              
              <div
                className={cn(
                  "rounded-lg px-3 py-2 shadow-sm overflow-hidden",
                  // Expand user messages with long content, keep others at 85%
                  message.role === 'user' && message.content.length > 500
                    ? 'max-w-[95%]'
                    : 'max-w-[85%]',
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white'
                    : message.isImprovements
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-slate-800'
                    : message.isMarkdown
                    ? 'bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-slate-800'
                    : 'bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 text-slate-800'
                )}
              >
                {message.isImprovements && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-amber-200">
                    <span className="text-xs font-semibold text-amber-700">🔍 Analysis</span>
                  </div>
                )}
                {message.isMarkdown && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-emerald-200">
                    <span className="text-xs font-semibold text-emerald-700">📝 Markdown Changes</span>
                  </div>
                )}
                <div className={cn(
                  "text-sm break-words overflow-wrap-anywhere",
                  message.role === 'assistant' && "prose prose-sm max-w-none",
                  message.isImprovements && "prose-amber",
                  message.isMarkdown && "prose-emerald"
                )}>
                  {message.role === 'assistant' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Rich text formatting following OpenAI model spec conventions
                        h1: ({children}) => <h1 className="text-xl font-bold mt-4 mb-3 text-slate-900 leading-tight break-words">{children}</h1>,
                        h2: ({children}) => <h2 className="text-lg font-semibold mt-4 mb-2 text-slate-800 leading-tight break-words">{children}</h2>,
                        h3: ({children}) => <h3 className="text-base font-semibold mt-3 mb-2 text-slate-800 leading-tight break-words">{children}</h3>,
                        h4: ({children}) => <h4 className="text-sm font-medium mt-3 mb-1 text-slate-700 leading-tight break-words">{children}</h4>,
                        h5: ({children}) => <h5 className="text-sm font-medium mt-2 mb-1 text-slate-700 leading-tight break-words">{children}</h5>,
                        h6: ({children}) => <h6 className="text-xs font-medium mt-2 mb-1 text-slate-600 leading-tight break-words">{children}</h6>,

                        // Paragraphs with proper spacing and readability
                        p: ({children}) => <p className="mb-3 text-slate-700 leading-relaxed break-words">{children}</p>,

                        // Enhanced lists with better visual hierarchy
                        ul: ({children}) => <ul className="list-none pl-0 mb-3 space-y-2 break-words">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal pl-6 mb-3 space-y-2 break-words marker:text-slate-500">{children}</ol>,
                        li: ({children, ...props}: any) => {
                          const isOrdered = props.ordered;
                          return (
                            <li className={cn(
                              "text-sm text-slate-700 leading-relaxed break-words mb-2",
                              !isOrdered && "flex items-start gap-2 [&:has(input[type=checkbox])]:before:content-none before:content-['•'] before:text-slate-400 before:font-bold before:mt-0.5"
                            )}>
                              {children}
                            </li>
                          )
                        },

                        // Task lists with our custom checkbox styling
                        input: ({type, checked, ...props}: any) => {
                          if (type === 'checkbox') {
                            return (
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled
                                className="mr-2 mt-1 h-3.5 w-3.5 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                                {...props}
                              />
                            )
                          }
                          return <input type={type} {...props} />
                        },

                        // Code blocks with enhanced styling (preserved as code)
                        code: ({children, ...allProps}: any) => {
                          const isInline = (allProps as any).inline
                          return isInline ? (
                            <code className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-sm font-mono break-all border">{children}</code>
                          ) : (
                            <code className="block p-4 bg-slate-50 text-slate-800 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all border border-slate-200 shadow-sm">{children}</code>
                          )
                        },
                        pre: ({children}) => <pre className="mb-3 overflow-x-auto whitespace-pre-wrap break-words">{children}</pre>,

                        // Enhanced blockquotes
                        blockquote: ({children}) => (
                          <blockquote className="border-l-4 border-blue-200 bg-blue-50 pl-4 pr-4 py-2 my-3 italic text-slate-700 rounded-r-lg">
                            {children}
                          </blockquote>
                        ),

                        // Tables with better styling
                        table: ({children}) => (
                          <div className="overflow-x-auto my-3">
                            <table className="min-w-full border border-slate-200 rounded-lg overflow-hidden">
                              {children}
                            </table>
                          </div>
                        ),
                        thead: ({children}) => <thead className="bg-slate-50">{children}</thead>,
                        tbody: ({children}) => <tbody className="divide-y divide-slate-200">{children}</tbody>,
                        tr: ({children}) => <tr className="hover:bg-slate-50">{children}</tr>,
                        th: ({children}) => <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">{children}</th>,
                        td: ({children}) => <td className="px-4 py-2 text-sm text-slate-700">{children}</td>,

                        // Text formatting with subtle enhancements
                        strong: ({children}) => <strong className="font-semibold text-slate-900">{children}</strong>,
                        em: ({children}) => <em className="italic text-slate-700">{children}</em>,

                        // Links with hover states
                        a: ({href, children}) => (
                          <a
                            href={href}
                            className="text-blue-600 hover:text-blue-800 underline decoration-blue-200 hover:decoration-blue-400 transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {children}
                          </a>
                        ),

                        // Horizontal rules
                        hr: () => <hr className="my-4 border-t border-slate-200" />,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  )}
                </div>
                
                {/* Interactive actions for markdown messages and PRD content */}
                {(() => {
                  const shouldShow = message.role === 'assistant' &&
                    (message.isMarkdown || message.content.includes('[PRD_UPDATE]') || (message.content.includes('# ') && message.content.length > 200)) &&
                    message === lastAssistantMessage &&
                    !isGenerating

                  if (message === lastAssistantMessage) {
                    console.log('🔍 Button render check:', {
                      role: message.role,
                      isMarkdown: message.isMarkdown,
                      hasPRDUpdate: message.content.includes('[PRD_UPDATE]'),
                      hasHeader: message.content.includes('# '),
                      length: message.content.length,
                      isLastMessage: message === lastAssistantMessage,
                      isGenerating,
                      shouldShow,
                      contentPreview: message.content.substring(0, 200)
                    })
                  }

                  return shouldShow
                })() && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    {actionStates[message.id] ? (
                      // Show completed state
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-green-700 font-medium">
                            {actionStates[message.id] === 'accepted' && 'Content accepted and added to editor'}
                            {actionStates[message.id] === 'regenerated' && 'Response regenerated'}
                            {actionStates[message.id] === 'reprompted' && 'Modified and resent'}
                          </span>
                        </div>
                        {undoContext && undoContext.messageId === message.id && (
                          <button
                            onClick={() => {
                              // Restore previous content
                              if (onAcceptContent && undoContext.content) {
                                // For undo, we replace the entire editor content with the previous content
                                onAcceptContent(undoContext.content, { type: 'full' })
                                // Clear the action state and undo context
                                setActionStates(prev => ({ ...prev, [message.id]: null }))
                                setUndoContext(null)
                              }
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-md text-xs font-medium transition-all duration-200"
                          >
                            <Undo2 className="h-3 w-3" />
                            Undo
                          </button>
                        )}
                      </div>
                    ) : (
                      // Show action buttons
                      <div className="flex flex-wrap gap-2">
                        {onAcceptContent && (
                          <button
                            onClick={(e) => {
                              // Save current editor content for undo
                              setPreviousContent(editorContent)
                              setUndoContext({
                                messageId: message.id,
                                content: editorContent,
                                context: lastContext
                              })
                              
                              // Extract and clean the markdown content
                              let markdownContent = message.content
                              
                              // Remove common AI response headers
                              if (markdownContent.includes('## Suggested Markdown')) {
                                markdownContent = markdownContent.split('## Suggested Markdown')[1]?.trim() || message.content
                              }
                              if (markdownContent.includes('Here is the improved')) {
                                markdownContent = markdownContent.split(/Here is the improved.*?:/i)[1]?.trim() || markdownContent
                              }
                              if (markdownContent.includes('Here\'s the updated')) {
                                markdownContent = markdownContent.split(/Here'?s the updated.*?:/i)[1]?.trim() || markdownContent
                              }
                              
                              // Strip markdown code block formatting
                              markdownContent = markdownContent.replace(/^```(?:markdown|md)?\n?/, '')
                              markdownContent = markdownContent.replace(/\n?```$/, '')
                              // Also handle other code block languages
                              markdownContent = markdownContent.replace(/^```[a-z]*\n?/, '')
                              
                              // Convert plain text lists to markdown if needed
                              const lines = markdownContent.split('\n')
                              const convertedLines = lines.map(line => {
                                const trimmed = line.trim()
                                
                                // Convert plain bullet points to markdown
                                if (trimmed.match(/^[•·◦▪▫◆◇★☆→➤]/)) {
                                  return line.replace(/^(\s*)[•·◦▪▫◆◇★☆→➤]\s*/, '$1- ')
                                }
                                
                                // Convert numbered lists without proper markdown
                                if (trimmed.match(/^\d+\)\s/)) {
                                  return line.replace(/^(\s*)(\d+)\)\s/, '$1$2. ')
                                }
                                
                                // Convert plain headers (lines that look like headers but aren't)
                                if (trimmed.length > 0 && trimmed === trimmed.toUpperCase() && trimmed.length < 50 && !trimmed.startsWith('#')) {
                                  return `## ${trimmed}`
                                }
                                
                                return line
                              })
                              markdownContent = convertedLines.join('\n')
                              
                              // Ensure proper spacing around headers
                              markdownContent = markdownContent.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2')
                              markdownContent = markdownContent.replace(/(#{1,6}\s[^\n]+)\n([^\n#])/g, '$1\n\n$2')
                              
                              // Ensure lists have proper spacing
                              markdownContent = markdownContent.replace(/([^\n])\n(\s*[-*+]\s)/g, '$1\n\n$2')
                              
                              // Clean up excessive blank lines
                              markdownContent = markdownContent.replace(/\n{3,}/g, '\n\n')
                              
                              // Trim any extra whitespace
                              markdownContent = markdownContent.trim()
                              
                              // Pass the context so we know where to insert
                              onAcceptContent(markdownContent, lastContext)
                              
                              // Mark as accepted
                              setActionStates(prev => ({ ...prev, [message.id]: 'accepted' }))
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-md text-xs font-medium transition-all duration-200 hover:shadow-sm"
                          >
                            <Check className="h-3 w-3" />
                            Accept
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            // Regenerate with same prompt and original context
                            if (lastUserPrompt) {
                              onSendMessage(lastUserPrompt, lastContext)
                              setActionStates(prev => ({ ...prev, [message.id]: 'regenerated' }))
                            }
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-xs font-medium transition-all duration-200 hover:shadow-sm"
                          disabled={!lastUserPrompt}
                        >
                          <RotateCcw className="h-3 w-3" />
                          Regenerate
                        </button>
                        
                        <button
                          onClick={() => {
                            // Focus input for reprompting
                            textareaRef.current?.focus()
                            setInput('Please revise: ')
                            setActionStates(prev => ({ ...prev, [message.id]: 'reprompted' }))
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md text-xs font-medium transition-all duration-200 hover:shadow-sm"
                        >
                          <MessageCircle className="h-3 w-3" />
                          Reprompt
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        
        {isGenerating && (
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                <Bot className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              {streamingContent ? (
                <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
                  <div className="text-sm break-words overflow-wrap-anywhere prose prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Rich text formatting for streaming content (matching OpenAI conventions)
                        h1: ({children}) => <h1 className="text-xl font-bold mt-4 mb-3 text-slate-900 leading-tight break-words">{children}</h1>,
                        h2: ({children}) => <h2 className="text-lg font-semibold mt-4 mb-2 text-slate-800 leading-tight break-words">{children}</h2>,
                        h3: ({children}) => <h3 className="text-base font-semibold mt-3 mb-2 text-slate-800 leading-tight break-words">{children}</h3>,
                        h4: ({children}) => <h4 className="text-sm font-medium mt-3 mb-1 text-slate-700 leading-tight break-words">{children}</h4>,
                        h5: ({children}) => <h5 className="text-sm font-medium mt-2 mb-1 text-slate-700 leading-tight break-words">{children}</h5>,
                        h6: ({children}) => <h6 className="text-xs font-medium mt-2 mb-1 text-slate-600 leading-tight break-words">{children}</h6>,
                        p: ({children}) => <p className="mb-3 text-slate-700 leading-relaxed break-words">{children}</p>,

                        // Enhanced lists with better visual hierarchy
                        ul: ({children}) => <ul className="list-none pl-0 mb-3 space-y-2 break-words">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal pl-6 mb-3 space-y-2 break-words marker:text-slate-500">{children}</ol>,
                        li: ({children, ...props}: any) => {
                          const isOrdered = props.ordered;
                          return (
                            <li className={cn(
                              "text-sm text-slate-700 leading-relaxed break-words mb-2",
                              !isOrdered && "flex items-start gap-2 [&:has(input[type=checkbox])]:before:content-none before:content-['•'] before:text-slate-400 before:font-bold before:mt-0.5"
                            )}>
                              {children}
                            </li>
                          )
                        },

                        // Task lists with custom checkbox styling
                        input: ({type, checked, ...props}: any) => {
                          if (type === 'checkbox') {
                            return (
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled
                                className="mr-2 mt-1 h-3.5 w-3.5 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                                {...props}
                              />
                            )
                          }
                          return <input type={type} {...props} />
                        },

                        // Code blocks with enhanced styling
                        code: ({children, ...allProps}: any) => {
                          const isInline = (allProps as any).inline
                          return isInline ? (
                            <code className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded text-sm font-mono break-all border">{children}</code>
                          ) : (
                            <code className="block p-4 bg-slate-50 text-slate-800 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all border border-slate-200 shadow-sm">{children}</code>
                          )
                        },
                        pre: ({children}) => <pre className="mb-3 overflow-x-auto whitespace-pre-wrap break-words">{children}</pre>,
                        blockquote: ({children}) => (
                          <blockquote className="border-l-4 border-blue-200 bg-blue-50 pl-4 pr-4 py-2 my-3 italic text-slate-700 rounded-r-lg">
                            {children}
                          </blockquote>
                        ),
                        strong: ({children}) => <strong className="font-semibold text-slate-900">{children}</strong>,
                        em: ({children}) => <em className="italic text-slate-700">{children}</em>,
                        a: ({href, children}) => (
                          <a
                            href={href}
                            className="text-blue-600 hover:text-blue-800 underline decoration-blue-200 hover:decoration-blue-400 transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {children}
                          </a>
                        ),
                        hr: () => <hr className="my-4 border-t border-slate-200" />,
                      }}
                    >
                      {streamingContent}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                    <span className="text-sm text-slate-600">Generating improved content...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="mt-0.5">
                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200">
        <form onSubmit={handleSubmit} className="p-3 bg-white">
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={
                contextMode === 'full' 
                  ? "Ask about the entire PRD..." 
                  : contextMode === 'selection'
                    ? "Ask about the selected text..."
                    : "Type your message..."
              }
              className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[40px] transition-all duration-200 hover:border-slate-300"
              style={{ maxHeight: '120px' }}
              disabled={isGenerating}
            />
            <button
              type={isGenerating ? "button" : "submit"}
              onClick={isGenerating ? onStopGeneration : undefined}
              disabled={isGenerating ? false : !input.trim()}
              className={cn(
                "px-3 py-2 rounded-lg transition-all duration-200 shadow-sm",
                isGenerating
                  ? "bg-red-500 text-white hover:bg-red-600 hover:shadow-md cursor-pointer"
                  : input.trim()
                  ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:from-indigo-600 hover:to-blue-600 hover:shadow-md"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
              title={isGenerating ? "Stop generation" : "Send message"}
            >
              {isGenerating ? (
                <X className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}