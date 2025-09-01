'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import AIDiscoveryModal from '@/components/AIDiscoveryModal'
import MarkdownEditor from '@/components/MarkdownEditor'
import ApiKeyManager from '@/components/ApiKeyManager'
import GitHubIntegration from '@/components/GitHubIntegration'
import ModelSelector from '@/components/model-selector'
import { FileText, Settings, Github, MessageSquare, Download, Save, Code } from 'lucide-react'
import { PRDContext, Message } from '@/types'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { generatePRD } from '@/lib/ai-service'
import { savePRDLocally, exportPRD } from '@/lib/storage'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'prd' | 'code' | 'settings'>('prd')
  const [showAIDiscovery, setShowAIDiscovery] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [githubConnected, setGithubConnected] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [prototypeCode, setPrototypeCode] = useLocalStorage<string>('prototype-code', '')
  
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
            onClick={() => setActiveTab('prd')}
            className={`relative group w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${
              activeTab === 'prd' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="PRD Editor"
          >
            <FileText size={20} />
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              PRD Editor
            </span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`relative group w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${
              activeTab === 'code' 
                ? 'bg-purple-100 text-purple-700' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Prototype"
          >
            <Code size={20} />
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Prototype
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
          {activeTab === 'prd' && (
            <MarkdownEditor
              content={prdContent}
              onChange={setPrdContent}
              projectName={currentProject}
              anthropicApiKey={apiKeys.anthropic}
              selectedModel={apiKeys.selectedModel}
              prototypeCode={prototypeCode}
              setPrototypeCode={setPrototypeCode}
              onGeneratePrototype={() => {
                // After generating, switch to code tab
                setActiveTab('code')
              }}
              showPrototypePreview={false}
            />
          )}

          {activeTab === 'code' && (
            <MarkdownEditor
              content={prdContent}
              onChange={setPrdContent}
              projectName={currentProject}
              anthropicApiKey={apiKeys.anthropic}
              selectedModel={apiKeys.selectedModel}
              prototypeCode={prototypeCode}
              setPrototypeCode={setPrototypeCode}
              onGeneratePrototype={() => {
                // Prototype generated successfully, already on code tab
              }}
              showPrototypePreview={true}
              codeOnly={true}
            />
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