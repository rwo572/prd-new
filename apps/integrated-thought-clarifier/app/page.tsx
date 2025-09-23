'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import EnhancedPRDEditor from '@/components/EnhancedPRDEditor'
import ApiKeyManager from '@/components/ApiKeyManager'
import GitHubIntegration from '@/components/GitHubIntegration'
import ModelSelector from '@/components/model-selector'
import BoltPrototype from '@/components/BoltPrototype'
import { FileText, Settings, Github, Download, Save, Code2, RefreshCw, Sparkles, Bot } from 'lucide-react'
import { PRDContext, Message, ApiKeys } from '@/types'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { generatePRD } from '@/lib/ai-service'
import { streamChatResponse } from '@/lib/ai-chat-service'
import { savePRDLocally, exportPRD } from '@/lib/storage'
import { getModelById } from '@/lib/model-config'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'editor' | 'prototype' | 'settings'>('editor')
  const [isGenerating, setIsGenerating] = useState(false)
  const [githubConnected, setGithubConnected] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [prototypeCode, setPrototypeCode] = useLocalStorage<string>('prototype-code', '')
  const [streamingThought, setStreamingThought] = useState('')
  const [streamingContent, setStreamingContent] = useState('')
  const [chatError, setChatError] = useState<string | null>(null)
  
  // Use localStorage hooks - will only work on client
  const [messages, setMessages] = useLocalStorage<Message[]>('prd-messages', [])
  const [prdContent, setPrdContent] = useLocalStorage<string>('prd-content', '')
  const [currentProject, setCurrentProject] = useLocalStorage<string>('prd-project-name', 'untitled')
  const [apiKeys, setApiKeys] = useLocalStorage<ApiKeys>('api-keys', {
    openai: '',
    anthropic: '',
    activeProvider: 'openai',
    selectedModel: undefined
  })
  
  // Set client flag after mount
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check if we're in demo mode (no API keys)
  useEffect(() => {
    const isDemo = !apiKeys.openai && !apiKeys.anthropic
    setDemoMode(isDemo)
  }, [apiKeys])

  const handleSendMessage = async (content: string, editorContext?: { 
    type: 'full' | 'selection', 
    content: string,
    selectionStart?: number,
    selectionEnd?: number 
  }) => {
    // Create user message
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, newMessage])
    setIsGenerating(true)
    setStreamingThought('')
    setStreamingContent('')
    setChatError(null)

    try {
      // Add a timeout to prevent infinite generating state
      const timeoutId = setTimeout(() => {
        if (isGenerating) {
          console.error('Chat response timed out')
          setChatError('Response timed out. Please try again.')
          setIsGenerating(false)
          setStreamingThought('')
          setStreamingContent('')
        }
      }, 30000) // 30 second timeout
      
      // Use streaming for chat responses
      await streamChatResponse(
        content,
        editorContext,
        apiKeys,
        {
          onThought: (thought) => {
            setStreamingThought(thought)
          },
          onContent: (content) => {
            setStreamingContent(content)
          },
          onComplete: (fullResponse) => {
            clearTimeout(timeoutId) // Clear the timeout
            
            // Check if response has the two-part format
            const improvementsMatch = fullResponse.match(/\[IMPROVEMENTS\]([\s\S]*?)\[MARKDOWN_CHANGES\]/);
            const markdownMatch = fullResponse.match(/\[MARKDOWN_CHANGES\]([\s\S]*?)$/);
            
            if (improvementsMatch && markdownMatch) {
              // Split into two messages
              const improvementsContent = improvementsMatch[1].trim();
              const markdownContent = markdownMatch[1].trim();
              
              // Add improvements message (without controls)
              const improvementsMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: improvementsContent,
                timestamp: new Date(),
                isImprovements: true // Flag to identify this message type
              }
              
              // Add markdown message (with controls)
              const markdownMessage: Message = {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: markdownContent,
                timestamp: new Date(),
                isMarkdown: true // Flag to identify this message type
              }
              
              setMessages(prev => [...prev, improvementsMessage, markdownMessage])
            } else {
              // Fallback to single message for other responses
              const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: fullResponse,
                timestamp: new Date()
              }
              
              setMessages(prev => [...prev, aiMessage])
            }
            
            // If working with selection and the response contains improved content,
            // update only that selection
            if (editorContext?.type === 'selection' && editorContext.selectionStart !== undefined) {
              // Extract the improved content from the response
              const improvedMatch = fullResponse.match(/===IMPROVED CONTENT===\n([\s\S]*?)(\n===|$)/)
              if (improvedMatch && improvedMatch[1]) {
                const before = prdContent.substring(0, editorContext.selectionStart)
                const after = prdContent.substring(editorContext.selectionEnd || editorContext.selectionStart)
                setPrdContent(before + improvedMatch[1].trim() + after)
              }
            }
            
            // Clear streaming states
            setStreamingThought('')
            setStreamingContent('')
            setIsGenerating(false)
          },
          onError: (error) => {
            clearTimeout(timeoutId) // Clear the timeout
            console.error('Streaming error:', error)
            // Don't add error to message history, use temporary state
            setChatError(error)
            setStreamingThought('')
            setStreamingContent('')
            setIsGenerating(false)
          }
        }
      )
    } catch (error) {
      console.error('Error in handleSendMessage:', error)
      setIsGenerating(false)
      setStreamingThought('')
      setStreamingContent('')
    }
  }

  const handleSavePRD = async () => {
    await savePRDLocally(currentProject, prdContent)
  }

  const handleExportPRD = () => {
    exportPRD(currentProject, prdContent)
  }

  const handleModelChange = (modelId: string) => {
    const selectedModel = getModelById(modelId)
    setApiKeys(prev => ({
      ...prev,
      selectedModel: modelId,
      activeProvider: selectedModel?.provider || prev.activeProvider
    }))
  }

  const handleGeneratePrototype = async () => {
    if (!prdContent || prdContent.trim().length < 10) {
      alert('Please write some PRD content first')
      return
    }
    
    if (!apiKeys.anthropic) {
      alert('Please add your Anthropic API key in Settings')
      setActiveTab('settings')
      return
    }
    
    // If there's existing code, confirm before regenerating
    if (prototypeCode && prototypeCode.trim().length > 100) {
      const shouldRegenerate = window.confirm('You have an existing prototype. Regenerating will replace it. Continue?')
      if (!shouldRegenerate) {
        return
      }
    }
    
    // Store existing code as backup
    const previousCode = prototypeCode
    
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-prototype', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-anthropic-api-key': apiKeys.anthropic || ''
        },
        body: JSON.stringify({
          prd: prdContent,
          projectName: currentProject || 'My App',
          modelId: apiKeys.selectedModel || 'claude-sonnet-4-20250514'
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.prototype) {
        setPrototypeCode(data.prototype)
        // Switch to prototype tab to show the generated prototype
        setActiveTab('prototype')
      } else {
        throw new Error(data.error || 'Failed to generate prototype')
      }
    } catch (error) {
      console.error('Error generating prototype:', error)
      // Optionally restore previous code if user wants
      const shouldRestore = window.confirm('Failed to generate prototype. Would you like to keep your existing prototype?')
      if (shouldRestore && previousCode) {
        setPrototypeCode(previousCode)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Collapsed Sidebar - Icons Only */}
      <div className="w-16 bg-white/80 backdrop-blur-sm border-r border-slate-200/50 flex flex-col items-center py-4">
        <div className="mb-8 flex items-center justify-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg">
            <Bot className="w-6 h-6 text-white" />
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('editor')}
            className={`relative group w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200 ${
              activeTab === 'editor' ? 'bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 shadow-sm' : 'hover:bg-slate-100 text-slate-600'
            }`}
            title="Editor"
          >
            <FileText size={20} />
            <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg" style={{zIndex: 9999}}>
              Editor
            </span>
          </button>

          <button
            onClick={() => setActiveTab('prototype')}
            className={`relative group w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200 ${
              activeTab === 'prototype' 
                ? 'bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 shadow-sm' 
                : 'hover:bg-slate-100 text-slate-600'
            }`}
            title="Prototype"
          >
            <Code2 size={20} />
            {isGenerating && (
              <div className="absolute top-1 right-1">
                <div className="h-2 w-2 bg-cyan-500 rounded-full animate-pulse"></div>
              </div>
            )}
            <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg" style={{zIndex: 9999}}>
              Prototype {isGenerating && '(Generating...)'}
            </span>
          </button>

        </nav>

        <div className="flex flex-col gap-1 pt-4 border-t border-slate-200/50">
          <button
            onClick={handleSavePRD}
            className="relative group w-12 h-12 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition-all duration-200 hover:shadow-sm"
            title="Save Locally"
          >
            <Save size={20} />
            <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg" style={{zIndex: 9999}}>
              Save Locally
            </span>
          </button>

          <button
            onClick={handleExportPRD}
            className="relative group w-12 h-12 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition-all duration-200 hover:shadow-sm"
            title="Export PRD"
          >
            <Download size={20} />
            <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg" style={{zIndex: 9999}}>
              Export PRD
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`relative group w-12 h-12 flex items-center justify-center rounded-lg transition-all duration-200 ${
              activeTab === 'settings' ? 'bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 shadow-sm' : 'hover:bg-slate-100 text-slate-600'
            }`}
            title="Settings"
          >
            <Settings size={20} />
            <span className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg" style={{zIndex: 9999}}>
              Settings
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Area - No Header */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'editor' && (
            <EnhancedPRDEditor
              content={prdContent}
              onChange={setPrdContent}
              projectName={currentProject}
              onProjectNameChange={setCurrentProject}
              anthropicApiKey={apiKeys.anthropic}
              selectedModel={apiKeys.selectedModel}
              onGeneratePrototype={handleGeneratePrototype}
              messages={messages}
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
              streamingThought={streamingThought}
              streamingContent={streamingContent}
              apiKeys={apiKeys}
              onClearMessages={() => {
                setMessages([])
                setChatError(null)
              }}
              error={chatError}
            />
          )}

          {activeTab === 'prototype' && (
            <div className="h-full overflow-hidden bg-white">
              {isGenerating ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="h-16 w-16 border-4 border-purple-200 rounded-full"></div>
                      <div className="h-16 w-16 border-4 border-purple-600 rounded-full animate-spin border-t-transparent absolute top-0"></div>
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Prototype...</h3>
                      <p className="text-sm text-gray-600">This may take a moment while we create your interactive prototype</p>
                    </div>
                  </div>
                </div>
              ) : prototypeCode ? (
                <BoltPrototype
                  code={prototypeCode}
                  projectName={currentProject}
                  isRegenerating={isGenerating}
                  onRegenerate={handleGeneratePrototype}
                  apiKey={apiKeys.anthropic}
                  modelId={apiKeys.selectedModel || 'claude-sonnet-4-20250514'}
                />
              ) : (
                <div className="h-full bg-white">
                  {/* Prototype Header */}
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex items-center">
                    <h3 className="font-semibold text-sm text-gray-900">Prototype</h3>
                  </div>
                  {/* Empty State Content */}
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Code2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold mb-2">No Prototype Generated</h3>
                      <p className="text-gray-600 mb-4">Generate a prototype from your PRD in the Editor tab</p>
                      <button
                        onClick={() => setActiveTab('editor')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Go to Editor
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {activeTab === 'settings' && (
            <div className="h-full bg-white overflow-y-auto">
              <div className="max-w-2xl mx-auto p-6">
                <h2 className="text-2xl font-bold mb-6">Settings</h2>

                {/* Model Selection Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">AI Model</h3>
                  <ModelSelector
                    apiKeys={apiKeys}
                    onModelChange={handleModelChange}
                  />
                </div>

                {/* API Keys Section */}
                <div className="border-t pt-6">
                  <ApiKeyManager
                    apiKeys={apiKeys}
                    onUpdateKeys={setApiKeys}
                  />
                </div>

                {/* GitHub Integration Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">GitHub Integration</h3>
                  <GitHubIntegration 
                    connected={githubConnected}
                    onConnect={() => setGithubConnected(true)}
                    projectName={currentProject}
                    prdContent={prdContent}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}