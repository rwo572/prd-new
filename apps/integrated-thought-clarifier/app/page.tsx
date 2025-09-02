'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import AIDiscoveryModal from '@/components/AIDiscoveryModal'
import EnhancedPRDEditor from '@/components/EnhancedPRDEditor'
import ApiKeyManager from '@/components/ApiKeyManager'
import GitHubIntegration from '@/components/GitHubIntegration'
import ModelSelector from '@/components/model-selector'
import AnnotatedPrototype from '@/components/AnnotatedPrototype'
import { FileText, Settings, Github, MessageSquare, Download, Save, Layers, RefreshCw, Sparkles } from 'lucide-react'
import { PRDContext, Message } from '@/types'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { generatePRD } from '@/lib/ai-service'
import { savePRDLocally, exportPRD } from '@/lib/storage'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'editor' | 'development' | 'settings'>('editor')
  const [showAIDiscovery, setShowAIDiscovery] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [githubConnected, setGithubConnected] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [prototypeCode, setPrototypeCode] = useLocalStorage<string>('prototype-code', '')
  const [annotationConfig, setAnnotationConfig] = useState<any>(null)
  
  // Use localStorage hooks - will only work on client
  const [messages, setMessages] = useLocalStorage<Message[]>('prd-messages', [])
  const [prdContent, setPrdContent] = useLocalStorage<string>('prd-content', '')
  const [currentProject, setCurrentProject] = useLocalStorage<string>('prd-project-name', 'untitled')
  const [apiKeys, setApiKeys] = useLocalStorage('api-keys', {
    openai: '',
    anthropic: '',
    activeProvider: 'openai' as 'openai' | 'anthropic'
  })
  
  // Set client flag after mount
  useEffect(() => {
    setIsClient(true)
    // Auto-open AI Discovery modal if no messages exist (first time user)
    if (messages.length === 0) {
      setShowAIDiscovery(true)
    }
  }, [])

  // Check if we're in demo mode (no API keys)
  useEffect(() => {
    const isDemo = !apiKeys.openai && !apiKeys.anthropic
    setDemoMode(isDemo)
  }, [apiKeys])

  const handleSendMessage = async (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, newMessage])
    setIsGenerating(true)

    try {
      const context: PRDContext = {
        messages: [...messages, newMessage],
        currentPRD: prdContent,
        projectName: currentProject
      }

      const response = await generatePRD(context, apiKeys)
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, aiMessage])
      
      if (response.updatedPRD) {
        setPrdContent(response.updatedPRD)
      }
    } catch (error) {
      console.error('Error generating response:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an error. Please check your API key settings and try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSavePRD = async () => {
    await savePRDLocally(currentProject, prdContent)
  }

  const handleExportPRD = () => {
    exportPRD(currentProject, prdContent)
  }

  const handleModelChange = (modelId: string) => {
    setApiKeys(prev => ({
      ...prev,
      selectedModel: modelId
    }))
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Collapsed Sidebar - Icons Only */}
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4">
        <div className="mb-8 relative group">
          <button
            onClick={() => setShowAIDiscovery(!showAIDiscovery)}
            className={`w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center cursor-pointer transform transition-all duration-200 hover:scale-110 hover:rotate-3 shadow-lg ${
              showAIDiscovery ? 'ring-2 ring-purple-400 ring-offset-2' : ''
            }`}
            title="AI Discovery"
          >
            <MessageSquare size={24} className="text-white" />
          </button>
          <span className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-medium">
            AI Discovery - Integrated Thought Clarifier
          </span>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('editor')}
            className={`relative group w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${
              activeTab === 'editor' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Editor"
          >
            <FileText size={20} />
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Editor
            </span>
          </button>

          <button
            onClick={() => setActiveTab('development')}
            className={`relative group w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${
              activeTab === 'development' 
                ? 'bg-purple-100 text-purple-700' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Development Environment"
          >
            <Layers size={20} />
            {isGenerating && (
              <div className="absolute top-1 right-1">
                <div className="h-2 w-2 bg-purple-600 rounded-full animate-pulse"></div>
              </div>
            )}
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Development Environment {isGenerating && '(Generating...)'}
            </span>
          </button>
        </nav>

        <div className="flex flex-col gap-1 pt-4 border-t border-gray-200">
          <button
            onClick={handleSavePRD}
            className="relative group w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            title="Save Locally"
          >
            <Save size={20} />
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Save Locally
            </span>
          </button>

          <button
            onClick={handleExportPRD}
            className="relative group w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            title="Export PRD"
          >
            <Download size={20} />
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Export PRD
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`relative group w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${
              activeTab === 'settings' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Settings"
          >
            <Settings size={20} />
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Settings
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <input
                type="text"
                value={currentProject}
                onChange={(e) => setCurrentProject(e.target.value)}
                className="text-lg font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 focus:outline-none transition-colors"
                placeholder="Project Name"
              />
            </div>
            <div className="flex items-center gap-4">
              <ModelSelector 
                apiKeys={apiKeys}
                onModelChange={handleModelChange}
              />
              {demoMode && (
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                  Demo Mode
                </span>
              )}
              {isClient && (
                <span className="text-sm text-gray-500">
                  {messages.length} messages • {Math.ceil(prdContent.length / 1000)}k chars
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'editor' && (
            <EnhancedPRDEditor
              content={prdContent}
              onChange={setPrdContent}
              projectName={currentProject}
              anthropicApiKey={apiKeys.anthropic}
              selectedModel={apiKeys.selectedModel}
              onGeneratePrototype={async () => {
                if (!prdContent.trim()) {
                  alert('Please enter PRD content first')
                  return
                }
                
                if (!apiKeys.anthropic) {
                  alert('Please add your Anthropic API key in Settings')
                  setActiveTab('settings')
                  return
                }
                
                setIsGenerating(true)
                try {
                  const response = await fetch('/api/generate-annotated-prototype', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      prdContent,
                      apiKey: apiKeys.anthropic,
                      modelId: apiKeys.selectedModel || 'claude-3-5-sonnet-20241022',
                      includeAnnotations: true
                    })
                  })
                  
                  if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                  }
                  
                  const data = await response.json()
                  
                  if (data.success && data.code) {
                    setPrototypeCode(data.code)
                    if (data.annotationConfig) {
                      setAnnotationConfig(data.annotationConfig)
                    }
                    // Switch to development tab to show the generated prototype
                    setActiveTab('development')
                  } else {
                    throw new Error(data.error || 'Failed to generate prototype')
                  }
                } catch (error) {
                  console.error('Error generating prototype:', error)
                  alert('Failed to generate prototype. Please try again.')
                } finally {
                  setIsGenerating(false)
                }
              }}
            />
          )}

          {activeTab === 'development' && (
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
              ) : annotationConfig && prototypeCode ? (
                <AnnotatedPrototype
                  code={prototypeCode}
                  projectName={currentProject}
                  config={annotationConfig}
                  isRegenerating={false}
                  onRegenerate={() => {}}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <Layers className="w-12 h-12 mx-auto mb-4 text-gray-400" />
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
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="h-full bg-white overflow-y-auto">
              <div className="max-w-2xl mx-auto p-6">
                <h2 className="text-2xl font-bold mb-6">Settings</h2>
                
                {/* API Keys Section */}
                <div className="mb-8">
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

      {/* AI Discovery Modal */}
      <AIDiscoveryModal
        isOpen={showAIDiscovery}
        onClose={() => setShowAIDiscovery(false)}
        messages={messages}
        onSendMessage={handleSendMessage}
        isGenerating={isGenerating}
      />
    </div>
  )
}