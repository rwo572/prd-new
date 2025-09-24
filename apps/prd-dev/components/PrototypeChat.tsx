'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, MessageSquare, X, Minimize2, Maximize2, Bot, User, Check, Code2, FileEdit, AlertCircle, Loader2 } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  codeBlock?: string
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

interface PrototypeChatProps {
  apiKey?: string
  modelId?: string
  prototypeCode?: string
  projectName?: string
  onCodeUpdate?: (newCode: string) => void
  onFileSystemUpdate?: (changes: CodeChange[]) => Promise<void>
  currentFiles?: { [path: string]: string }
}

export default function PrototypeChat({ 
  apiKey, 
  modelId = 'claude-3-5-sonnet-20241022',
  prototypeCode,
  projectName,
  onCodeUpdate,
  onFileSystemUpdate,
  currentFiles = {}
}: PrototypeChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [pendingChanges, setPendingChanges] = useState<CodeChange[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isApplyingCode, setIsApplyingCode] = useState(false)
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
    
    // Extract file updates with specific file paths
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
    
    // If no specific file paths, check for main App.jsx update
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

  const applyChanges = async (changes?: CodeChange[]) => {
    const changesToApply = changes || pendingChanges
    if (changesToApply.length === 0) return
    
    setIsApplyingCode(true)
    try {
      if (onFileSystemUpdate) {
        // Apply all file system changes
        await onFileSystemUpdate(changesToApply)
      } else if (onCodeUpdate) {
        // Fallback to single file update for backward compatibility
        const appChange = changesToApply.find(c => c.filePath === 'src/App.jsx')
        if (appChange?.newContent) {
          await onCodeUpdate(appChange.newContent)
        }
      }
      
      // Update message status
      setMessages(prev => prev.map(msg => {
        // Update status for messages with pending changes
        if (msg.codeChanges && msg.codeChanges.length > 0 && msg.status === 'pending') {
          return { ...msg, status: 'applied' }
        }
        return msg
      }))
      
      // Don't add a separate success message - the status indicator is enough
      
      setPendingChanges([])
    } catch (error) {
      console.error('Error applying changes:', error)
    } finally {
      setIsApplyingCode(false)
    }
  }

  const rejectChanges = () => {
    setPendingChanges([])
    setMessages(prev => prev.map(msg => 
      msg.codeChanges?.length ? { ...msg, status: 'rejected' } : msg
    ))
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
      const filesContext = Object.entries(currentFiles).length > 0
        ? Object.entries(currentFiles)
            .map(([path, content]) => `File: ${path}\n\`\`\`jsx\n${content}\n\`\`\``)
            .join('\n\n')
        : prototypeCode 
          ? `Current prototype code:\n\`\`\`jsx\n${prototypeCode}\n\`\`\`\n\n`
          : ''
      
      const systemPrompt = `You are a React prototype code generator using shadcn/ui components. Project: "${projectName || 'Untitled'}". 
        
        Current code:
        ${filesContext}
        
        AVAILABLE SHADCN/UI COMPONENTS (in src/components/ui/):
        - Button: import { Button } from './components/ui/button'
        - Card: import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './components/ui/card'
        - Input: import { Input } from './components/ui/input'
        - Label: import { Label } from './components/ui/label'
        - Badge: import { Badge } from './components/ui/badge'
        - Alert: import { Alert, AlertTitle, AlertDescription } from './components/ui/alert'
        - Separator: import { Separator } from './components/ui/separator'
        - Avatar: import { Avatar, AvatarImage, AvatarFallback } from './components/ui/avatar'
        
        ALSO AVAILABLE:
        - Lucide React icons: import { IconName } from 'lucide-react'
        - cn utility: import { cn } from './lib/utils'
        - Radix UI primitives for complex components (@radix-ui/react-*)
        
        STRICT RULES - YOU MUST:
        1. ALWAYS use shadcn/ui components from './components/ui/*' as your FIRST choice
        2. Use the exact import paths shown above (./components/ui/button, etc.)
        3. Apply Tailwind classes for additional styling
        4. Create modern, polished UIs with proper spacing and shadows
        5. When creating new files, specify the path after the code fence: \`\`\`jsx src/components/NewComponent.jsx
        6. Provide COMPLETE file contents, not snippets
        7. Include ALL necessary imports
        
        EXAMPLE STRUCTURE:
        import React, { useState } from 'react'
        import { Button } from './components/ui/button'
        import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card'
        import { Input } from './components/ui/input'
        import { Badge } from './components/ui/badge'
        import { Search, Plus, Settings } from 'lucide-react'
        
        function App() {
          return (
            <div className="min-h-screen bg-gray-50 p-8">
              <Card>
                <CardHeader>
                  <CardTitle>My App</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Search..." />
                  <Button>Click me</Button>
                  <Badge>New</Badge>
                </CardContent>
              </Card>
            </div>
          )
        }
        
        export default App
        
        ALWAYS use shadcn/ui components and create beautiful, modern interfaces!`

      const response = await fetch('/api/chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input.trim(),
          systemPrompt: systemPrompt + '\n\nConversation history:\n' + 
            messages.map(m => `${m.role}: ${m.content}`).join('\n'),
          apiKey: apiKey,
          modelId: modelId,
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
        content: 'Generating response...',
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
              
              // Skip [DONE] marker
              if (data === '[DONE]') continue
              
              try {
                const parsed = JSON.parse(data)
                
                // Handle different response formats
                let content = ''
                if (parsed.content) {
                  content = parsed.content
                } else if (parsed.delta?.text) {
                  content = parsed.delta.text
                } else if (parsed.choices?.[0]?.delta?.content) {
                  content = parsed.choices[0].delta.content
                }
                
                if (content) {
                  fullResponse += content
                  // Don't update the displayed message yet - we'll clean it after streaming
                }
              } catch (e) {
                // Skip invalid JSON
                console.debug('Skipping invalid JSON:', data)
              }
            }
          }
        }
        
        // Extract code changes from the response
        const changes = extractCodeChanges(fullResponse)
        
        // Clean the content by removing code blocks
        let cleanedContent = fullResponse
        
        if (changes.length > 0) {
          // Remove all code blocks that have file paths
          cleanedContent = cleanedContent.replace(/```(?:jsx|tsx|js|ts|css|html|json)\s+[^\n]+\n[\s\S]*?```/g, '')
          
          // Remove standalone code blocks if they're the main App.jsx update
          if (changes.some(c => c.filePath === 'src/App.jsx')) {
            cleanedContent = cleanedContent.replace(/```(?:jsx|tsx|js|ts)\n[\s\S]*?```/g, '')
          }
          
          // Clean up extra newlines
          cleanedContent = cleanedContent.replace(/\n{3,}/g, '\n\n').trim()
          
          // Update the assistant message with cleaned content and code changes
          assistantMessage.content = cleanedContent
          assistantMessage.codeChanges = changes
          assistantMessage.status = 'pending'
          
          // Set pending changes for user confirmation
          setPendingChanges(changes)
        } else {
          // No code changes, show the full response
          assistantMessage.content = fullResponse
        }
        
        // Update the message with final content
        setMessages(prev => 
          prev.map(m => m.id === assistantMessage.id 
            ? { ...m, 
                content: assistantMessage.content, 
                codeChanges: assistantMessage.codeChanges, 
                status: assistantMessage.status 
              }
            : m
          )
        )
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
          <span className="font-medium">Prototype Assistant</span>
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
            <span className="font-semibold text-sm">Prototype Assistant</span>
            <span className="text-xs text-gray-500">
              {modelId === 'claude-3-5-sonnet-20241022' ? 'Claude 3.5 Sonnet' :
               modelId === 'claude-opus-4-1-20250805' ? 'Claude Opus 4.1' :
               modelId === 'claude-3-opus-20240229' ? 'Claude 3 Opus' :
               modelId === 'claude-3-haiku-20240307' ? 'Claude 3 Haiku' :
               modelId?.includes('claude') ? modelId.split('-').slice(1, 3).join(' ').replace(/^\w/, c => c.toUpperCase()) :
               modelId || 'No model selected'}
            </span>
          </div>
          {isApplyingCode && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full animate-pulse ml-2">
              Applying code...
            </span>
          )}
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
            <p className="text-sm">Ask me about your prototype!</p>
            <p className="text-xs mt-2">I can help you understand, modify, or improve your code.</p>
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''} ${message.role === 'system' ? 'justify-center' : ''}`}>
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
                  <Bot size={16} className="text-purple-600" />
                </div>
              )}
              <div className={`${message.role === 'system' ? 'w-full' : 'max-w-[80%]'}`}>
                <div className={`rounded-lg px-3 py-2 ${
                  message.role === 'user' 
                    ? 'bg-purple-600 text-white' 
                    : message.role === 'system'
                    ? 'bg-green-50 text-green-800 border border-green-200 text-center'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                
                {/* Show code changes with Apply/Reject buttons */}
                {message.codeChanges && message.codeChanges.length > 0 && (
                  <div className="mt-3">
                    {message.status === 'pending' ? (
                      <div className="bg-purple-50 rounded-lg px-3 py-2 border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Code2 size={14} className="text-purple-600" />
                            <span className="text-sm text-gray-700">
                              Ready to update {message.codeChanges.length === 1 
                                ? message.codeChanges[0].filePath
                                : `${message.codeChanges.length} files`}
                            </span>
                          </div>
                          <div className="flex gap-2 ml-3">
                            <button
                              onClick={() => applyChanges(message.codeChanges)}
                              disabled={isApplyingCode}
                              className="px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                            >
                              {isApplyingCode ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  Applying...
                                </>
                              ) : (
                                <>
                                  <Check size={14} />
                                  Apply
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setPendingChanges([])
                                setMessages(prev => prev.map(m => 
                                  m.id === message.id ? { ...m, status: 'rejected' } : m
                                ))
                              }}
                              disabled={isApplyingCode}
                              className="px-3 py-1.5 bg-gray-500 text-white text-sm font-medium rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                            >
                              <X size={14} />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : message.status === 'applied' ? (
                      <div className="bg-green-50 rounded-lg px-2 py-1 border border-green-200 inline-flex items-center gap-1.5 mt-2">
                        <Check size={12} className="text-green-600" />
                        <span className="text-xs text-green-700">Applied</span>
                      </div>
                    ) : message.status === 'rejected' ? (
                      <div className="bg-gray-50 rounded-lg px-2 py-1 border border-gray-300 inline-flex items-center gap-1.5 mt-2">
                        <X size={12} className="text-gray-500" />
                        <span className="text-xs text-gray-600">Rejected</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                  <User size={16} className="text-blue-600" />
                </div>
              )}
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

      {/* Input */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your prototype..."
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