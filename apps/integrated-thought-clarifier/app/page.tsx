'use client'

import { useState, useEffect } from 'react'
import ChatInterface from '@/components/ChatInterface'
import MarkdownEditor from '@/components/MarkdownEditor'
import ApiKeyManager from '@/components/ApiKeyManager'
import GitHubIntegration from '@/components/GitHubIntegration'
import TemplateSelector from '@/components/TemplateSelector'
import { FileText, Settings, Github, MessageSquare, Download, Save } from 'lucide-react'
import { PRDContext, Message } from '@/types'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { generatePRD } from '@/lib/ai-service'
import { savePRDLocally, exportPRD } from '@/lib/storage'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'chat' | 'editor' | 'settings'>('chat')
  const [messages, setMessages] = useState<Message[]>([])
  const [prdContent, setPrdContent] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentProject, setCurrentProject] = useState<string>('untitled')
  const [apiKeys, setApiKeys] = useLocalStorage('api-keys', {
    openai: '',
    anthropic: '',
    activeProvider: 'openai' as 'openai' | 'anthropic'
  })
  const [githubConnected, setGithubConnected] = useState(false)

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

  const handleTemplateSelect = (template: string) => {
    setPrdContent(template)
    setActiveTab('editor')
  }

  const handleSavePRD = async () => {
    await savePRDLocally(currentProject, prdContent)
  }

  const handleExportPRD = () => {
    exportPRD(currentProject, prdContent)
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
            onClick={() => setActiveTab('editor')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'editor' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'
            }`}
          >
            <FileText size={18} />
            <span>PRD Editor</span>
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
              <span className="text-sm text-gray-500">
                {messages.length} messages • {Math.ceil(prdContent.length / 1000)}k chars
              </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && (
            <div className="h-full flex">
              <div className="flex-1">
                <ChatInterface
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isGenerating={isGenerating}
                />
              </div>
              <div className="w-80 border-l border-gray-200 bg-white p-4">
                <h3 className="font-semibold mb-4">Quick Start</h3>
                <TemplateSelector onSelectTemplate={handleTemplateSelect} />
              </div>
            </div>
          )}

          {activeTab === 'editor' && (
            <MarkdownEditor
              content={prdContent}
              onChange={setPrdContent}
              projectName={currentProject}
            />
          )}

          {activeTab === 'settings' && (
            <div className="h-full bg-white p-6">
              <div className="max-w-2xl mx-auto">
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