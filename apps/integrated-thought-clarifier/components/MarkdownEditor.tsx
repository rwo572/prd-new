'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Eye, EyeOff, Copy, Download, Code, X, Loader2, Sparkles, Smartphone, Palette, Rocket, ExternalLink } from 'lucide-react'
import CodePreview from './CodePreview'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading editor...</div>
})

interface MarkdownEditorProps {
  content: string
  onChange: (value: string) => void
  projectName: string
  anthropicApiKey?: string
  prototypeCode?: string
  setPrototypeCode?: (code: string) => void
  onGeneratePrototype?: () => void
  showPrototypePreview?: boolean
  codeOnly?: boolean
}

export default function MarkdownEditor({ 
  content, 
  onChange, 
  projectName, 
  anthropicApiKey,
  prototypeCode: externalPrototypeCode,
  setPrototypeCode: externalSetPrototypeCode,
  onGeneratePrototype,
  showPrototypePreview = false,
  codeOnly = false
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(true)
  
  // Use external prototype code if provided, otherwise manage locally
  const [localPrototypeCode, setLocalPrototypeCode] = useState('')
  const prototypeCode = externalPrototypeCode !== undefined ? externalPrototypeCode : localPrototypeCode
  
  const setPrototypeCode = (code: string) => {
    if (externalSetPrototypeCode) {
      externalSetPrototypeCode(code)
    } else {
      setLocalPrototypeCode(code)
    }
  }
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStage, setGenerationStage] = useState<'wireframe' | 'styled' | 'interactive' | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedPrototype, setCopiedPrototype] = useState(false)
  const [refinementInput, setRefinementInput] = useState('')
  const [prototypeHistory, setPrototypeHistory] = useState<string[]>([])
  const [selectedView, setSelectedView] = useState<'desktop' | 'mobile'>('desktop')
  const [lastGenerationTime, setLastGenerationTime] = useState(0)
  const [generationMessage, setGenerationMessage] = useState('')
  const [messageIndex, setMessageIndex] = useState(0)
  const RATE_LIMIT_COOLDOWN = 10000 // 10 seconds cooldown
  
  const generationMessages = [
    'Analyzing your PRD requirements...',
    'Understanding the user journey...',
    'Designing component architecture...',
    'Creating React components...',
    'Setting up state management...',
    'Adding interactive features...',
    'Implementing business logic...',
    'Applying Tailwind styles...',
    'Adding responsive design...',
    'Finalizing the prototype...'
  ]

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyPrototype = async () => {
    await navigator.clipboard.writeText(prototypeCode)
    setCopiedPrototype(true)
    setTimeout(() => setCopiedPrototype(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}-prd.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadPrototype = () => {
    const blob = new Blob([prototypeCode], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}-prototype.tsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Effect to cycle through generation messages
  useEffect(() => {
    if (isGenerating && !prototypeCode) {
      const interval = setInterval(() => {
        setMessageIndex(prev => (prev + 1) % generationMessages.length)
      }, 2000) // Change message every 2 seconds
      
      return () => clearInterval(interval)
    }
  }, [isGenerating, prototypeCode, generationMessages.length])
  
  // Update generation message when index changes
  useEffect(() => {
    if (isGenerating && !prototypeCode) {
      setGenerationMessage(generationMessages[messageIndex])
    }
  }, [messageIndex, isGenerating, prototypeCode, generationMessages])

  const handleGeneratePrototype = async () => {
    if (!anthropicApiKey) {
      alert('Please configure your Anthropic API key in Settings to generate prototypes.')
      return
    }
    
    // Check for rate limit cooldown
    const now = Date.now()
    const timeSinceLastGeneration = now - lastGenerationTime
    if (timeSinceLastGeneration < RATE_LIMIT_COOLDOWN) {
      const remainingTime = Math.ceil((RATE_LIMIT_COOLDOWN - timeSinceLastGeneration) / 1000)
      alert(`Please wait ${remainingTime} seconds before generating another prototype.`)
      return
    }
    
    setIsGenerating(true)
    setGenerationStage('wireframe')
    setLastGenerationTime(now)
    setMessageIndex(0)
    setGenerationMessage(generationMessages[0])
    
    try {
      const response = await fetch('/api/generate-prototype', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-anthropic-api-key': anthropicApiKey
        },
        body: JSON.stringify({
          prd: content,
          projectName
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        if (response.status === 429) {
          throw new Error('Rate limit reached. Please wait a moment and try again.')
        } else if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Anthropic API key in Settings.')
        } else if (response.status === 400) {
          throw new Error(errorData.error || 'Invalid request. Please check your PRD content.')
        } else {
          throw new Error(errorData.error || `Server error: ${response.status}`)
        }
      }

      const data = await response.json()
      console.log('Prototype generated successfully:', data.prototype?.substring(0, 100))
      
      if (!data.prototype) {
        throw new Error('No prototype code received from API')
      }
      
      setPrototypeCode(data.prototype)
      setPrototypeHistory(prev => [...prev, data.prototype])
      setGenerationStage('interactive')
      // Call the callback if provided
      if (onGeneratePrototype) {
        onGeneratePrototype()
      }
    } catch (error) {
      console.error('Error generating prototype:', error)
      alert(`Error generating prototype: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setPrototypeCode('// Error generating prototype. Please check console for details.')
    } finally {
      setIsGenerating(false)
      setGenerationStage(null)
    }
  }

  const handleRefinePrototype = async () => {
    if (!refinementInput.trim() || !anthropicApiKey) return
    
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/refine-prototype', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-anthropic-api-key': anthropicApiKey
        },
        body: JSON.stringify({
          currentPrototype: prototypeCode,
          refinement: refinementInput,
          projectName
        })
      })

      if (!response.ok) {
        throw new Error('Failed to refine prototype')
      }

      const data = await response.json()
      setPrototypeCode(data.prototype)
      setPrototypeHistory(prev => [...prev, data.prototype])
      setRefinementInput('')
    } catch (error) {
      console.error('Error refining prototype:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  // For code-only mode, show only the CodeSandbox embed with expanded editor
  if (codeOnly) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header Bar */}
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Code size={18} className="text-purple-600" />
              <h3 className="font-semibold text-gray-900">Interactive Prototype</h3>
            </div>
            {prototypeCode && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                Live Preview
              </span>
            )}
          </div>
          {prototypeCode && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyPrototype}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="Copy prototype code"
              >
                <Copy size={14} />
                <span>{copiedPrototype ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={handleDownloadPrototype}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="Download as JavaScript file"
              >
                <Download size={14} />
                <span>Download</span>
              </button>
            </div>
          )}
        </div>
        
        {/* CodeSandbox Embed */}
        <div className="flex-1">
          {prototypeCode ? (
            <CodePreview
              code={prototypeCode}
              projectName={projectName}
              view="editor"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center">
                <div className="w-20 h-20 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Code size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">No prototype generated yet</p>
                <p className="text-sm text-gray-500 mt-2">Generate a prototype from the PRD tab to see it here</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Natural Language Refinement Bar */}
        {prototypeCode && (
          <div className="border-t border-gray-200 bg-white px-4 py-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={refinementInput}
                  onChange={(e) => setRefinementInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleRefinePrototype()}
                  placeholder="Describe changes: 'Add dark mode' or 'Make buttons larger'"
                  className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 placeholder-gray-400"
                  disabled={isGenerating}
                />
                <Sparkles size={14} className="absolute right-3 top-2.5 text-gray-400" />
              </div>
              <button
                onClick={handleRefinePrototype}
                disabled={!refinementInput.trim() || isGenerating}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
              >
                {isGenerating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Palette size={14} />
                )}
                <span>Refine</span>
              </button>
            </div>
            <div className="flex gap-3 mt-2">
              <span className="text-xs text-gray-400">Quick options:</span>
              <button className="text-xs text-purple-600 hover:text-purple-700 transition-colors font-medium" onClick={() => setRefinementInput('Add dark mode toggle')}>
                Dark mode
              </button>
              <button className="text-xs text-purple-600 hover:text-purple-700 transition-colors font-medium" onClick={() => setRefinementInput('Make it more colorful and modern')}>
                Modernize
              </button>
              <button className="text-xs text-purple-600 hover:text-purple-700 transition-colors font-medium" onClick={() => setRefinementInput('Add animations and transitions')}>
                Animations
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Regular mode with PRD editor
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold">PRD Editor</h3>
          <span className="text-sm text-gray-500">
            {content.split('\n').length} lines • {content.split(' ').length} words
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGeneratePrototype}
            disabled={!content || content.length < 100 || !anthropicApiKey}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm"
            title={!anthropicApiKey ? 'Configure Anthropic API key in Settings' : 'Generate a working prototype from this PRD'}
          >
            <Sparkles size={16} className="animate-pulse" />
            <span className="text-sm">Generate Prototype</span>
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="text-sm">{showPreview ? 'Hide' : 'Show'} Preview</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Copy size={16} />
            <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Download size={16} />
            <span className="text-sm">Download</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} h-full transition-all duration-300`}>
          <MonacoEditor
            height="100%"
            defaultLanguage="markdown"
            value={content}
            onChange={(value) => onChange(value || '')}
            theme="vs"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              wordWrap: 'on',
              wrappingIndent: 'indent',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
            }}
          />
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="w-1/2 h-full border-l border-gray-200 overflow-hidden flex flex-col">
            {/* Preview Header */}
            <div className="border-b border-gray-200 px-4 py-2 flex items-center justify-between bg-gray-50">
              <span className="text-sm font-medium text-gray-700">PRD Preview</span>
            </div>
            
            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  className="markdown-preview"
                >
                  {content || '*Start typing to see preview...*'}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}