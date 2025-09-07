'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
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
  MessageCircle
} from 'lucide-react'
import { Message } from '@/types'
import { ApiKeys } from '@/types'
import { cn } from '@/lib/utils'
import { generatePromptSuggestions, getQuickPromptSuggestions, PromptSuggestion } from '@/lib/prompt-suggestion-service'

const MarkdownPreview = dynamic(() => import('./MarkdownPreview'), {
  ssr: false,
  loading: () => <div className="text-sm text-slate-500">Loading...</div>
})

interface ChatPanelProps {
  messages: Message[]
  onSendMessage: (message: string, context?: { 
    type: 'full' | 'selection', 
    content: string,
    selectionStart?: number,
    selectionEnd?: number 
  }) => void
  isGenerating: boolean
  editorContent: string
  selectedText?: string
  selectionRange?: { start: number, end: number }
  onReplaceText?: (start: number, end: number, newText: string) => void
  onInsertText?: (position: number, text: string) => void
  onAcceptContent?: (content: string, context?: { type: 'full' | 'selection', selectionStart?: number, selectionEnd?: number }) => void
  streamingThought?: string
  streamingContent?: string
  apiKeys?: ApiKeys
  onClearChat?: () => void
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
  const [lastSuggestionsFor, setLastSuggestionsFor] = useState<string>('') // Track what we generated suggestions for
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
    // Clear any pending suggestion generation
    if (suggestionsTimeoutRef.current) {
      clearTimeout(suggestionsTimeoutRef.current)
    }

    // Determine what content to generate suggestions for
    const contentForSuggestions = selectedText && selectedText.trim() 
      ? selectedText 
      : (editorContent && editorContent.trim().length > 100 ? editorContent.slice(0, 500) : '')
    
    // Only generate new suggestions if the content has changed significantly
    if (contentForSuggestions && contentForSuggestions !== lastSuggestionsFor) {
      // Update context mode based on selection
      if (selectedText && selectedText.trim()) {
        setContextMode('selection')
        setShowContext(true)
      }
      
      // Debounce the suggestion generation to avoid flickering
      suggestionsTimeoutRef.current = setTimeout(() => {
        setLoadingSuggestions(true)
        setLastSuggestionsFor(contentForSuggestions)
        
        // Fetch AI-powered suggestions if available
        if (apiKeys && (apiKeys.openai || apiKeys.anthropic)) {
          generatePromptSuggestions(contentForSuggestions, apiKeys, editorContent)
            .then(suggestions => {
              setPromptSuggestions(suggestions.slice(0, 3))
              setLoadingSuggestions(false)
            })
            .catch(error => {
              console.error('Failed to generate suggestions:', error)
              // Fall back to quick local suggestions on error
              const quickSuggestions = selectedText && selectedText.trim()
                ? getQuickPromptSuggestions(selectedText)
                : [
                    { icon: '🎯', label: 'Improve clarity', prompt: 'How can I make this PRD clearer and more actionable?' },
                    { icon: '✅', label: 'Check completeness', prompt: 'What key sections or details are missing from this PRD?' },
                    { icon: '📊', label: 'Add metrics', prompt: 'What success metrics and KPIs should I add to measure impact?' }
                  ]
              setPromptSuggestions(quickSuggestions.slice(0, 3))
              setLoadingSuggestions(false)
            })
        } else {
          // Use local suggestions if no API keys
          const quickSuggestions = selectedText && selectedText.trim()
            ? getQuickPromptSuggestions(selectedText)
            : [
                { icon: '🎯', label: 'Improve clarity', prompt: 'How can I make this PRD clearer and more actionable?' },
                { icon: '✅', label: 'Check completeness', prompt: 'What key sections or details are missing from this PRD?' },
                { icon: '📊', label: 'Add metrics', prompt: 'What success metrics and KPIs should I add to measure impact?' }
              ]
          setPromptSuggestions(quickSuggestions.slice(0, 3))
          setLoadingSuggestions(false)
        }
      }, 800) // 800ms debounce delay to prevent flickering
    } else if (!contentForSuggestions && lastSuggestionsFor) {
      // Clear suggestions if no content
      setPromptSuggestions([])
      setLoadingSuggestions(false)
      setLastSuggestionsFor('')
    }
    
    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (suggestionsTimeoutRef.current) {
        clearTimeout(suggestionsTimeoutRef.current)
      }
    }
  }, [selectedText, apiKeys, editorContent, lastSuggestionsFor])

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
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
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

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 to-white">
      {/* Top Control Bar */}
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
            {isGenerating && (
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-all duration-200"
                title="Force stop generation"
              >
                <X className="h-3 w-3" />
                <span>Stop</span>
              </button>
            )}
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-sm font-medium text-slate-900 mb-2">AI Chat Assistant</h3>
            <p className="text-xs text-slate-500 mb-4">
              I can help you create or improve your PRD. Choose:
            </p>
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
                  className="w-full text-left px-3 py-2 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 hover:shadow-sm text-xs transition-all duration-200"
                >
                  <AlertCircle className="h-3 w-3 inline mr-2 text-blue-500" />
                  Identify missing sections
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
                  "max-w-[85%] rounded-lg px-3 py-2 shadow-sm",
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white'
                    : message.isImprovements
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-slate-800'
                    : message.isMarkdown
                    ? 'bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-slate-800'
                    : 'bg-white border border-slate-200 text-slate-800'
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
                {/* Render markdown for both analysis and markdown messages */}
                {(message.isImprovements || message.isMarkdown) ? (
                  <div className="markdown-content">
                    <MarkdownPreview 
                      content={(() => {
                        let content = message.content
                        // Strip markdown code blocks for markdown messages
                        if (message.isMarkdown) {
                          // Remove ```markdown from the beginning
                          content = content.replace(/^```markdown\n?/, '')
                          // Remove ``` from the end
                          content = content.replace(/\n?```$/, '')
                          // Also handle other code block languages
                          content = content.replace(/^```[a-z]*\n?/, '')
                          // Remove "## Suggested Markdown" header if present
                          if (content.includes('## Suggested Markdown')) {
                            content = content.split('## Suggested Markdown')[1]?.trim() || content
                          }
                        }
                        return content
                      })()} 
                      className={cn(
                        "text-sm",
                        message.isImprovements && "prose-amber",
                        message.isMarkdown && "prose-emerald"
                      )}
                    />
                  </div>
                ) : (
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                )}
                
                {/* Interactive actions only for markdown messages */}
                {message.role === 'assistant' && message.isMarkdown && message === lastAssistantMessage && !isGenerating && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                    {onAcceptContent && (
                      <button
                        onClick={(e) => {
                          // Extract just the markdown content (remove the "## Suggested Markdown" header if present)
                          let markdownContent = message.content
                          if (markdownContent.includes('## Suggested Markdown')) {
                            markdownContent = markdownContent.split('## Suggested Markdown')[1]?.trim() || message.content
                          }
                          
                          // Strip markdown code block formatting
                          // Remove ```markdown from the beginning
                          markdownContent = markdownContent.replace(/^```markdown\n?/, '')
                          // Remove ``` from the end
                          markdownContent = markdownContent.replace(/\n?```$/, '')
                          // Also handle other code block languages
                          markdownContent = markdownContent.replace(/^```[a-z]*\n?/, '')
                          
                          // Trim any extra whitespace
                          markdownContent = markdownContent.trim()
                          
                          // Pass the context so we know where to insert
                          onAcceptContent(markdownContent, lastContext)
                          // Show success feedback
                          const btn = e.currentTarget
                          const originalText = btn.textContent
                          btn.innerHTML = '<svg class="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Added'
                          btn.disabled = true
                          setTimeout(() => {
                            btn.innerHTML = originalText || 'Accept'
                            btn.disabled = false
                          }, 2000)
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
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-md text-xs font-medium transition-all duration-200 hover:shadow-sm"
                    >
                      <MessageCircle className="h-3 w-3" />
                      Reprompt
                    </button>
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
                  <p className="text-sm whitespace-pre-wrap break-words text-slate-800">{streamingContent}</p>
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
        {/* AI Prompt Suggestions Bar */}
        {(loadingSuggestions || promptSuggestions.length > 0) && (
          <div className="px-3 py-1.5 bg-gradient-to-r from-indigo-50/30 to-blue-50/30 border-b border-indigo-100/50">
            {loadingSuggestions ? (
              <div className="flex items-center gap-2">
                <Wand2 className="h-3 w-3 text-indigo-400 animate-pulse" />
                <span className="text-xs text-indigo-600">Generating prompts...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Wand2 className="h-3 w-3 text-indigo-400" />
                {promptSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInput(suggestion.prompt)
                      textareaRef.current?.focus()
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 hover:bg-white/70 rounded text-xs transition-all duration-200 group"
                    disabled={isGenerating}
                    title={suggestion.prompt}
                  >
                    <span>{suggestion.icon}</span>
                    <span className="text-slate-600 group-hover:text-indigo-600">
                      {suggestion.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
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
              className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[40px] max-h-[120px] transition-all duration-200 hover:border-slate-300"
              disabled={isGenerating}
            />
            <button
              type="submit"
              disabled={!input.trim() || isGenerating}
              className={cn(
                "px-3 py-2 rounded-lg transition-all duration-200 shadow-sm",
                input.trim() && !isGenerating
                  ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:from-indigo-600 hover:to-blue-600 hover:shadow-md"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
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