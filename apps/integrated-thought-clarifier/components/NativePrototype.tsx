'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { 
  Play, 
  RefreshCw, 
  Code2, 
  FileText, 
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Loader2,
  Copy,
  Download,
  Maximize2,
  Minimize2
} from 'lucide-react'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="animate-spin text-purple-600" size={24} />
    </div>
  )
})

interface NativePrototypeProps {
  code: string
  projectName: string
}

interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  content?: string
  children?: FileNode[]
  expanded?: boolean
}

export default function NativePrototype({ code, projectName }: NativePrototypeProps) {
  const [selectedFile, setSelectedFile] = useState('App.js')
  // Ensure code has an App component defined
  const ensuredCode = code || `function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-900">Hello World</h1>
      <p className="mt-4 text-gray-600">Start editing App.js to see changes!</p>
    </div>
  )
}`
  const [fileContent, setFileContent] = useState(ensuredCode)
  const [showFileExplorer, setShowFileExplorer] = useState(true)
  const [previewKey, setPreviewKey] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  // Update fileContent when code prop changes
  useEffect(() => {
    if (code) {
      setFileContent(code)
      setPreviewKey(prev => prev + 1) // Force preview refresh
    }
  }, [code])
  
  const [fileTree] = useState<FileNode[]>([
    {
      name: 'src',
      path: 'src',
      type: 'directory',
      expanded: true,
      children: [
        { name: 'App.js', path: 'App.js', type: 'file', content: ensuredCode },
        { name: 'index.css', path: 'index.css', type: 'file', content: `/* Tailwind CSS is loaded via CDN */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}` }
      ]
    },
    { name: 'package.json', path: 'package.json', type: 'file', content: `{
  "name": "${projectName.toLowerCase().replace(/\s+/g, '-')}",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}` }
  ])

  // Create the HTML for the preview
  const createPreviewHTML = () => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio"></script>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    ${fileContent}
    
    // Render the App - check if App is defined, otherwise try to find default export
    if (typeof App !== 'undefined') {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
    } else {
      // If no App component, try to render the first defined component
      console.log('No App component found. Please define: function App() { ... }');
    }
  </script>
</body>
</html>
    `
  }

  // Update preview when code changes
  useEffect(() => {
    const updatePreview = () => {
      if (iframeRef.current) {
        const doc = iframeRef.current.contentDocument
        if (doc) {
          doc.open()
          doc.write(createPreviewHTML())
          doc.close()
        }
      }
    }
    
    // Update immediately
    updatePreview()
    
    // Also update after a short delay to ensure iframe is ready
    const timer = setTimeout(updatePreview, 100)
    
    return () => clearTimeout(timer)
  }, [fileContent, previewKey, projectName])

  const handleFileSelect = (file: FileNode) => {
    if (file.type === 'file') {
      setSelectedFile(file.path)
      setFileContent(file.content || '')
    }
  }

  const handleRefresh = () => {
    setPreviewKey(prev => prev + 1)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fileContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([fileContent], { type: 'text/javascript' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}-${selectedFile}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map(node => (
      <div key={node.path}>
        <button
          onClick={() => handleFileSelect(node)}
          className={`w-full flex items-center gap-1 px-2 py-1 text-xs hover:bg-gray-100 transition-colors ${
            selectedFile === node.path ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {node.type === 'directory' ? (
            <>
              {node.expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              {node.expanded ? <FolderOpen size={12} /> : <Folder size={12} />}
            </>
          ) : (
            <FileText size={12} className="ml-3" />
          )}
          <span className="ml-1">{node.name}</span>
        </button>
        {node.type === 'directory' && node.expanded && node.children && (
          <div>{renderFileTree(node.children, level + 1)}</div>
        )}
      </div>
    ))
  }

  return (
    <div className={`h-full flex flex-col bg-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-purple-600" />
            <h3 className="font-semibold text-sm text-gray-900">Prototype</h3>
          </div>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            Live Preview
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
            title="Copy code"
          >
            <Copy size={12} />
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-2 py-1 text-xs bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
            title="Download file"
          >
            <Download size={12} />
            <span>Download</span>
          </button>
          <button
            onClick={handleRefresh}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-600"
            title="Refresh Preview"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-600"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        {showFileExplorer && (
          <div className="w-48 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-2 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600 uppercase">Explorer</span>
              <button
                onClick={() => setShowFileExplorer(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronRight size={12} />
              </button>
            </div>
            <div className="py-1">
              {renderFileTree(fileTree)}
            </div>
          </div>
        )}

        {/* Code Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="bg-gray-100 px-3 py-1 border-b border-gray-200 flex items-center gap-2">
            {!showFileExplorer && (
              <button
                onClick={() => setShowFileExplorer(true)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronRight size={12} />
              </button>
            )}
            <span className="text-xs text-gray-600">{selectedFile}</span>
          </div>
          <div className="flex-1">
            <MonacoEditor
              height="100%"
              language={selectedFile.endsWith('.css') ? 'css' : 'javascript'}
              value={fileContent}
              onChange={(value) => setFileContent(value || '')}
              theme="vs"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 2,
                scrollBeyondLastLine: false,
                padding: { top: 10, bottom: 10 }
              }}
            />
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 border-l border-gray-200 bg-white">
          <div className="bg-gray-100 px-3 py-1 border-b border-gray-200">
            <span className="text-xs text-gray-600">Preview</span>
          </div>
          <iframe
            key={previewKey}
            ref={iframeRef}
            className="w-full h-[calc(100%-28px)] bg-white"
            title="Preview"
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  )
}