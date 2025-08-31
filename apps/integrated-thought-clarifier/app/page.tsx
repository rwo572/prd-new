'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import ChatInterface from '@/components/ChatInterface'
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
  const [activeTab, setActiveTab] = useState<'chat' | 'prd' | 'code' | 'settings'>('chat')
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
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-800 mb-2">Integrated Thought Clarifier</h1>
          <p className="text-sm text-gray-600">Transform Ideas to PRDs</p>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'chat' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
            }`}
          >
            <MessageSquare size={18} />
            <span>AI Discovery</span>
          </button>

          <button
            onClick={() => setActiveTab('prd')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'prd' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
            }`}
          >
            <FileText size={18} />
            <span>PRD Editor</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            disabled={!prototypeCode || !isClient}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'code' 
                ? 'bg-primary-100 text-primary-700' 
                : prototypeCode && isClient
                  ? 'hover:bg-gray-100' 
                  : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <Code size={18} />
            <span>Prototype Code</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'settings' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
            }`}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="mt-8 pt-8 border-t border-gray-200 space-y-2">
          <GitHubIntegration 
            connected={githubConnected}
            onConnect={() => setGithubConnected(true)}
            projectName={currentProject}
            prdContent={prdContent}
          />

          <button
            onClick={handleSavePRD}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            <Save size={18} />
            <span>Save Locally</span>
          </button>

          <button
            onClick={handleExportPRD}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            <Download size={18} />
            <span>Export PRD</span>
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
          {activeTab === 'chat' && (
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
            />
          )}

          {activeTab === 'prd' && (
            <MarkdownEditor
              content={prdContent}
              onChange={setPrdContent}
              projectName={currentProject}
              anthropicApiKey={apiKeys.anthropic}
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
            prototypeCode ? (
              <MarkdownEditor
                content={prdContent}
                onChange={setPrdContent}
                projectName={currentProject}
                anthropicApiKey={apiKeys.anthropic}
                prototypeCode={prototypeCode}
                setPrototypeCode={setPrototypeCode}
                onGeneratePrototype={() => {}}
                showPrototypePreview={true}
                codeOnly={true}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <Code size={48} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Prototype Generated Yet</h3>
                  <p className="text-gray-600 mb-4">Generate a prototype from your PRD first</p>
                  <button
                    onClick={() => setActiveTab('prd')}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Go to PRD Editor
                  </button>
                </div>
              </div>
            )
          )}

          {activeTab === 'settings' && (
            <div className="h-full bg-white overflow-y-auto">
              <div className="max-w-2xl mx-auto p-6">
                <h2 className="text-2xl font-bold mb-6">Settings</h2>
                <ApiKeyManager
                  apiKeys={apiKeys}
                  onUpdateKeys={setApiKeys}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}