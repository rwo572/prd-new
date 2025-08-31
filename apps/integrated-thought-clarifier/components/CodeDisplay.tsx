'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Copy, Download, Check } from 'lucide-react'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading editor...</div>
})

interface CodeDisplayProps {
  code: string
  projectName: string
}

export default function CodeDisplay({ code, projectName }: CodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}.js`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!code) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">No prototype code available</p>
          <p className="text-sm text-gray-400 mt-2">Generate a prototype from the PRD tab first</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 px-4 py-2 flex items-center justify-between bg-gray-50">
        <span className="text-sm font-medium text-gray-700">Prototype Code</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1 text-sm rounded-lg hover:bg-white transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-3 py-1 text-sm rounded-lg hover:bg-white transition-colors"
          >
            <Download size={14} />
            <span>Download</span>
          </button>
        </div>
      </div>
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          defaultLanguage="javascript"
          value={code}
          theme="vs"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  )
}