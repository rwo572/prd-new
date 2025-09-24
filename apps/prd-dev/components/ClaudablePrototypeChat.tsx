'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Send, 
  MessageSquare, 
  X, 
  Minimize2, 
  Bot, 
  User, 
  Check, 
  Code2, 
  FileEdit,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  codeChanges?: CodeChange[]
  status?: 'pending' | 'applied' | 'rejected'
}

interface CodeChange {
  type: 'create' | 'update' | 'delete'
  filePath: string
  oldContent?: string
  newContent?: string
  description?: string
}

interface ClaudablePrototypeChatProps {
  apiKey?: string
  modelId?: string
  prototypeCode?: string
  projectName?: string
  onCodeUpdate?: (changes: CodeChange[]) => Promise<void>
  currentFiles?: { [path: string]: string }
}

export default function ClaudablePrototypeChat({ 
  apiKey, 
  modelId = 'claude-3-5-sonnet-20241022',
  prototypeCode,
  projectName,
  onCodeUpdate,
  currentFiles = {}
}: ClaudablePrototypeChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<CodeChange[]>([])
  const [isApplying, setIsApplying] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const extractCodeChanges = (content: string): CodeChange[] => {
    const changes: CodeChange[] = []
    
    // Extract file updates (```jsx filename or ```typescript filename patterns)
    const fileBlockRegex = /```(?:jsx|tsx|js|ts|css|html|json)\s+([^\n]+)\n([\s\S]*?)```/g
    let match
    
    while ((match = fileBlockRegex.exec(content)) !== null) {
      const filePath = match[1].trim()
      const newContent = match[2]
      
      changes.push({
        type: currentFiles[filePath] ? 'update' : 'create',
        filePath,
        oldContent: currentFiles[filePath],
        newContent,
        description: `${currentFiles[filePath] ? 'Update' : 'Create'} ${filePath}`
      })
    }
    
    // Also extract main App.jsx updates if no specific file is mentioned
    if (changes.length === 0) {
      const codeMatch = content.match(/```(?:jsx|tsx|js|ts)\n([\s\S]*?)```/)
      if (codeMatch && codeMatch[1]) {
        changes.push({
          type: 'update',
          filePath: 'src/App.jsx',
          oldContent: prototypeCode,
          newContent: codeMatch[1].trim(),
          description: 'Update main application code'
        })
      }
    }
    
    return changes
  }

  const applyChanges = async () => {
    if (!onCodeUpdate || pendingChanges.length === 0) return
    
    setIsApplying(true)
    try {
      await onCodeUpdate(pendingChanges)
      
      // Update message status
      setMessages(prev => prev.map(msg => 
        msg.codeChanges?.length ? { ...msg, status: 'applied' } : msg
      ))
      
      // Add success message
      const successMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: `✅ Successfully applied ${pendingChanges.length} change${pendingChanges.length > 1 ? 's' : ''} to your prototype!`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, successMessage])
      
      setPendingChanges([])
    } catch (error) {
      console.error('Error applying changes:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: '❌ Failed to apply changes. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsApplying(false)
    }
  }

  const rejectChanges = () => {
    setPendingChanges([])
    setMessages(prev => prev.map(msg => 
      msg.codeChanges?.length ? { ...msg, status: 'rejected' } : msg
    ))
    
    const rejectMessage: Message = {
      id: Date.now().toString(),
      role: 'system',
      content: 'Changes rejected. You can continue chatting to refine the solution.',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, rejectMessage])
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    if (!apiKey) {
      alert('Please add your API key in Settings')
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setPendingChanges([])

    try {
      // Build context with current files
      const filesContext = Object.entries(currentFiles)
        .map(([path, content]) => `File: ${path}\n\`\`\`jsx\n${content}\n\`\`\``)
        .join('\n\n')
      
      const systemPrompt = `You are a React code assistant for a project called "${projectName || 'Untitled'}". 
        
        Current project files:
        ${filesContext || `Main App.jsx:\n\`\`\`jsx\n${prototypeCode}\n\`\`\``}
        
        IMPORTANT INSTRUCTIONS:
        1. When suggesting code changes, ALWAYS specify the file path after the code fence like: \`\`\`jsx src/App.jsx
        2. For new files, use paths like: src/components/ComponentName.jsx
        3. Provide COMPLETE file contents, not just snippets
        4. Use modern React patterns and hooks
        5. Include all necessary imports
        6. Maintain consistent code style
        7. When creating new components, follow the existing project structure
        
        Available libraries:
        - React 18 with hooks
        - Tailwind CSS for styling
        - Lucide React for icons
        - Shadcn/ui components (Button, Card, Input, etc.)
        
        Respond with clear explanations and complete, working code.`

      const response = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input.trim(),
          systemPrompt,
          apiKey,
          modelId,
          provider: 'anthropic',
          stream: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      if (reader) {
        let fullResponse = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]') continue
              
              try {
                const parsed = JSON.parse(data)
                let content = ''
                
                if (parsed.content) {
                  content = parsed.content
                } else if (parsed.delta?.text) {
                  content = parsed.delta.text
                } else if (parsed.choices?.[0]?.delta?.content) {
                  content = parsed.choices[0].delta.content
                }
                
                if (content) {
                  assistantMessage.content += content
                  fullResponse += content
                  setMessages(prev => 
                    prev.map(m => m.id === assistantMessage.id 
                      ? { ...m, content: assistantMessage.content }
                      : m
                    )
                  )
                }
              } catch (e) {
                console.debug('Skipping invalid JSON:', data)
              }
            }
          }
        }
        
        // Extract code changes from the response
        const changes = extractCodeChanges(fullResponse)
        if (changes.length > 0) {
          assistantMessage.codeChanges = changes
          assistantMessage.status = 'pending'
          setPendingChanges(changes)
          
          // Update the message with changes
          setMessages(prev => 
            prev.map(m => m.id === assistantMessage.id 
              ? { ...m, codeChanges: changes, status: 'pending' }
              : m
            )
          )
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 bg-purple-600 text-white rounded-lg shadow-lg p-3 cursor-pointer hover:bg-purple-700 transition-colors"
           onClick={() => setIsMinimized(false)}>
        <div className="flex items-center gap-2">
          <MessageSquare size={20} />
          <span className="font-medium">Claudable Assistant</span>
          {messages.length > 0 && (
            <span className="bg-white text-purple-600 text-xs rounded-full px-2 py-0.5">
              {messages.length}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex-1 flex items-center gap-2">
          <MessageSquare size={18} className="text-purple-600" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Claudable Assistant</span>
            <span className="text-xs text-gray-500">
              {modelId === 'claude-3-5-sonnet-20241022' ? 'Claude 3.5 Sonnet' :
               modelId === 'claude-opus-4-1-20250805' ? 'Claude Opus 4.1' :
               'Claude'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title="Minimize chat"
        >
          <Minimize2 size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageSquare size={48} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Describe what you want to build!</p>
            <p className="text-xs mt-2">I'll help you create and modify your prototype.</p>
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id}>
              <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
                    <Bot size={16} className="text-purple-600" />
                  </div>
                )}
                {message.role === 'system' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                    <AlertCircle size={16} className="text-blue-600" />
                  </div>
                )}
                <div className={`max-w-[80%]`}>
                  <div className={`rounded-lg px-3 py-2 ${
                    message.role === 'user' 
                      ? 'bg-purple-600 text-white' 
                      : message.role === 'system'
                      ? 'bg-blue-50 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {/* Show code changes if present */}
                  {message.codeChanges && message.codeChanges.length > 0 && (
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <FileEdit size={14} className="text-gray-600" />
                        <span className="text-xs font-medium text-gray-700">
                          Code Changes ({message.codeChanges.length} file{message.codeChanges.length > 1 ? 's' : ''})
                        </span>
                        {message.status === 'applied' && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <Check size={12} /> Applied
                          </span>
                        )}
                        {message.status === 'rejected' && (
                          <span className="text-xs text-red-600 flex items-center gap-1">
                            <X size={12} /> Rejected
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {message.codeChanges.map((change, idx) => (
                          <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                            <Code2 size={12} />
                            <span className={`font-medium ${
                              change.type === 'create' ? 'text-green-600' :
                              change.type === 'delete' ? 'text-red-600' :
                              'text-blue-600'
                            }`}>
                              {change.type === 'create' ? '+' : change.type === 'delete' ? '-' : '~'}
                            </span>
                            <span>{change.filePath}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                    <User size={16} className="text-blue-600" />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
              <Bot size={16} className="text-purple-600" />
            </div>
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Pending Changes Actions */}
      {pendingChanges.length > 0 && (
        <div className="border-t border-gray-200 bg-yellow-50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-yellow-600" />
              <span className="text-sm font-medium text-gray-700">
                Apply {pendingChanges.length} change{pendingChanges.length > 1 ? 's' : ''}?
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={rejectChanges}
                disabled={isApplying}
                className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={applyChanges}
                disabled={isApplying}
                className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {isApplying ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check size={12} />
                    Apply Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to build or change..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}