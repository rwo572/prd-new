'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Eye, EyeOff, Copy, Download } from 'lucide-react'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading editor...</div>
})

interface MarkdownEditorProps {
  content: string
  onChange: (value: string) => void
  projectName: string
}

export default function MarkdownEditor({ content, onChange, projectName }: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(true)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} h-full`}>
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

        {showPreview && (
          <div className="w-1/2 h-full border-l border-gray-200 overflow-y-auto">
            <div className="p-6">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                className="markdown-preview"
              >
                {content || '*Start typing to see preview...*'}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}