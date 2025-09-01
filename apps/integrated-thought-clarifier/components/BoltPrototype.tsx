'use client'

import { useState, useEffect, useRef } from 'react'
import { WebContainer } from '@webcontainer/api'
import dynamic from 'next/dynamic'
import { 
  Play, 
  RefreshCw, 
  Terminal, 
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
  Minimize2,
  AlertCircle
} from 'lucide-react'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="animate-spin text-purple-600" size={24} />
    </div>
  )
})

interface BoltPrototypeProps {
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

// File system structure for the React app
const files = {
  'package.json': {
    file: {
      contents: `{
  "name": "vite-react-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.263.1",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-radio-group": "^1.1.3",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24",
    "tailwindcss": "^3.3.2",
    "vite": "^4.3.9"
  }
}`
    }
  },
  'vite.config.js': {
    file: {
      contents: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  }
})`
    }
  },
  'index.html': {
    file: {
      contents: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
    }
  },
  'postcss.config.js': {
    file: {
      contents: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
    }
  },
  'tailwind.config.js': {
    file: {
      contents: `/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}`
    }
  },
  'src': {
    directory: {
      'main.jsx': {
        file: {
          contents: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
        }
      },
      'App.jsx': {
        file: {
          contents: '' // Will be filled with the code prop
        }
      },
      'lib': {
        directory: {
          'utils.js': {
            file: {
              contents: `import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}`
            }
          }
        }
      },
      'index.css': {
        file: {
          contents: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
.hover\\:bg-gray-50:hover { background-color: #f9fafb; }
.hover\\:bg-blue-600:hover { background-color: #2563eb; }
.transition { transition: all 0.2s; }
.cursor-pointer { cursor: pointer; }

/* Button styles */
.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background-color: #d1d5db;
}`
        }
      }
    }
  }
}

// Store WebContainer instance globally to prevent multiple boots
let globalWebContainerInstance: WebContainer | null = null
let bootPromise: Promise<WebContainer> | null = null
let isInitialized = false
let initCount = 0

// Force reset to ensure Tailwind dependencies are installed
function resetWebContainer() {
  isInitialized = false
  initCount++
  // Force re-initialization every 5 loads to clear any stale state
  if (initCount > 5) {
    globalWebContainerInstance = null
    bootPromise = null
    initCount = 0
  }
}

async function getWebContainerInstance(): Promise<WebContainer> {
  // If already booting, wait for it
  if (bootPromise) {
    try {
      return await bootPromise
    } catch (e) {
      // If boot failed, return existing instance if available
      if (globalWebContainerInstance) {
        return globalWebContainerInstance
      }
      throw e
    }
  }
  
  // If already booted, return existing instance
  if (globalWebContainerInstance) {
    return globalWebContainerInstance
  }
  
  // Start booting
  bootPromise = (async () => {
    try {
      const instance = await WebContainer.boot()
      globalWebContainerInstance = instance
      return instance
    } catch (error) {
      // If boot fails, clear the promise so it can be retried
      bootPromise = null
      throw error
    }
  })()
  
  return bootPromise
}

// Force complete reset for debugging
globalWebContainerInstance = null
bootPromise = null
isInitialized = false

export default function BoltPrototype({ code, projectName }: BoltPrototypeProps) {
  const [webcontainerInstance, setWebcontainerInstance] = useState<WebContainer | null>(null)
  const [selectedFile, setSelectedFile] = useState('src/App.jsx')
  const [fileContent, setFileContent] = useState(code)
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['Initializing WebContainer...'])
  const [isRunning, setIsRunning] = useState(false)
  const [showTerminal, setShowTerminal] = useState(true)
  const [showFileExplorer, setShowFileExplorer] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  const [fileTree] = useState<FileNode[]>([
    {
      name: 'src',
      path: 'src',
      type: 'directory',
      expanded: true,
      children: [
        { name: 'App.jsx', path: 'src/App.jsx', type: 'file', content: code },
        { name: 'main.jsx', path: 'src/main.jsx', type: 'file', content: files.src.directory['main.jsx'].file.contents },
        { name: 'index.css', path: 'src/index.css', type: 'file', content: files.src.directory['index.css'].file.contents },
        {
          name: 'lib',
          path: 'src/lib',
          type: 'directory',
          expanded: true,
          children: [
            { name: 'utils.js', path: 'src/lib/utils.js', type: 'file', content: files.src.directory['lib'].directory['utils.js'].file.contents }
          ]
        }
      ]
    },
    { name: 'package.json', path: 'package.json', type: 'file', content: files['package.json'].file.contents },
    { name: 'vite.config.js', path: 'vite.config.js', type: 'file', content: files['vite.config.js'].file.contents },
    { name: 'tailwind.config.js', path: 'tailwind.config.js', type: 'file', content: files['tailwind.config.js'].file.contents },
    { name: 'postcss.config.js', path: 'postcss.config.js', type: 'file', content: files['postcss.config.js'].file.contents },
    { name: 'index.html', path: 'index.html', type: 'file', content: files['index.html'].file.contents }
  ])

  // Initialize WebContainer
  useEffect(() => {
    let mounted = true

    const initWebContainer = async () => {
      try {
        setTerminalOutput(prev => [...prev, 'Getting WebContainer instance...'])
        
        // Get or boot the WebContainer singleton
        const instance = await getWebContainerInstance()
        
        if (!mounted) {
          return
        }
        
        setWebcontainerInstance(instance)
        setTerminalOutput(prev => [...prev, '✓ WebContainer ready'])
        
        // Check if already initialized
        if (!isInitialized) {
          // Start with the absolute simplest component possible
          const testComponent = `function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>WebContainer is Loading...</h1>
      <p style={{ color: '#666' }}>If you can see this, the basic setup is working.</p>
      <p style={{ color: '#666', marginTop: '10px' }}>Your prototype will load shortly...</p>
    </div>
  )
}

export default App`
          
          // Update the files with test code first
          const filesWithCode = { ...files }
          filesWithCode.src.directory['App.jsx'].file.contents = testComponent
          
          // Mount files
          setTerminalOutput(prev => [...prev, 'Mounting file system...'])
          await instance.mount(filesWithCode)
          setTerminalOutput(prev => [...prev, '✓ File system mounted'])
          
          // Install dependencies
          setTerminalOutput(prev => [...prev, '', '> npm install', 'Installing dependencies...'])
          const installProcess = await instance.spawn('npm', ['install'])
          
          installProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              if (mounted) {
                setTerminalOutput(prev => {
                  const newOutput = [...prev, data]
                  // Keep only last 100 lines
                  return newOutput.slice(-100)
                })
                // Auto-scroll terminal
                if (terminalRef.current) {
                  terminalRef.current.scrollTop = terminalRef.current.scrollHeight
                }
              }
            }
          })
        )
        
        const installExitCode = await installProcess.exit
        
        if (installExitCode !== 0) {
          throw new Error('Installation failed')
        }
        
        setTerminalOutput(prev => [...prev, '✓ Dependencies installed successfully', ''])
        
        // Start dev server
        setTerminalOutput(prev => [...prev, '> npm run dev', 'Starting development server...'])
        const devProcess = await instance.spawn('npm', ['run', 'dev'])
        
        devProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              if (mounted) {
                setTerminalOutput(prev => {
                  const newOutput = [...prev, data]
                  return newOutput.slice(-100)
                })
                if (terminalRef.current) {
                  terminalRef.current.scrollTop = terminalRef.current.scrollHeight
                }
              }
            }
          })
          )

          // Wait for server to be ready
          instance.on('server-ready', (port, url) => {
            if (mounted) {
              setPreviewUrl(url)
              setIsRunning(true)
              setIsLoading(false)
              setTerminalOutput(prev => [...prev, `✓ Server running at ${url}`])
            }
          })
          
          isInitialized = true
          
          // Now update with the actual generated code if provided
          if (code && code.length > 100) {
            setTimeout(async () => {
              try {
                // Validate and fix the code
                let finalCode = code
                
                // Check if code appears truncated
                const lines = finalCode.split('\n')
                const lastLine = lines[lines.length - 1].trim()
                
                // Check for common truncation issues
                if (lastLine && !lastLine.endsWith('}') && !lastLine.endsWith(';') && !lastLine.includes('export')) {
                  console.warn('Code appears truncated, attempting to fix...')
                  
                  // Count open/close tags
                  const openDivs = (finalCode.match(/<div/g) || []).length
                  const closeDivs = (finalCode.match(/<\/div>/g) || []).length
                  const openParens = (finalCode.match(/\(/g) || []).length
                  const closeParens = (finalCode.match(/\)/g) || []).length
                  const openBraces = (finalCode.match(/\{/g) || []).length
                  const closeBraces = (finalCode.match(/\}/g) || []).length
                  
                  // Try to close unclosed JSX tags
                  if (openDivs > closeDivs) {
                    const divsToClose = openDivs - closeDivs
                    for (let i = 0; i < divsToClose; i++) {
                      finalCode += '\n</div>'
                    }
                  }
                  
                  // Close unclosed parens
                  if (openParens > closeParens) {
                    const parensToClose = openParens - closeParens
                    for (let i = 0; i < parensToClose; i++) {
                      finalCode += ')'
                    }
                  }
                  
                  // Close unclosed braces
                  if (openBraces > closeBraces) {
                    const bracesToClose = openBraces - closeBraces
                    for (let i = 0; i < bracesToClose; i++) {
                      finalCode += '\n}'
                    }
                  }
                }
                
                // Ensure the code starts with proper imports
                if (!finalCode.includes('import') && !finalCode.includes('const cn =')) {
                  // Add cn utility if missing
                  finalCode = `const cn = (...classes) => classes.filter(Boolean).join(' ')\n\n${finalCode}`
                }
                
                // Ensure export exists
                if (!finalCode.includes('export default')) {
                  finalCode += '\n\nexport default App'
                }
                
                await instance.fs.writeFile('src/App.jsx', finalCode)
                setTerminalOutput(prev => [...prev, '✓ App.jsx updated with generated prototype'])
                setFileContent(finalCode)
              } catch (err) {
                console.error('Error updating App.jsx with generated code:', err)
                setTerminalOutput(prev => [...prev, `❌ Error updating App.jsx: ${err}`])
                // Keep the test component if update fails
              }
            }, 3000) // Wait 3 seconds for dev server to stabilize
          }
        } else {
          // Already initialized, just update the App.jsx with new code
          if (code && code.length > 100) {
            try {
              // Validate and fix the code
              let finalCode = code
              
              // Check if code appears truncated
              const lines = finalCode.split('\n')
              const lastLine = lines[lines.length - 1].trim()
              
              // Check for common truncation issues
              if (lastLine && !lastLine.endsWith('}') && !lastLine.endsWith(';') && !lastLine.includes('export')) {
                console.warn('Code appears truncated, attempting to fix...')
                
                // Count open/close tags
                const openDivs = (finalCode.match(/<div/g) || []).length
                const closeDivs = (finalCode.match(/<\/div>/g) || []).length
                const openParens = (finalCode.match(/\(/g) || []).length
                const closeParens = (finalCode.match(/\)/g) || []).length
                const openBraces = (finalCode.match(/\{/g) || []).length
                const closeBraces = (finalCode.match(/\}/g) || []).length
                
                // Try to close unclosed JSX tags
                if (openDivs > closeDivs) {
                  const divsToClose = openDivs - closeDivs
                  for (let i = 0; i < divsToClose; i++) {
                    finalCode += '\n</div>'
                  }
                }
                
                // Close unclosed parens
                if (openParens > closeParens) {
                  const parensToClose = openParens - closeParens
                  for (let i = 0; i < parensToClose; i++) {
                    finalCode += ')'
                  }
                }
                
                // Close unclosed braces
                if (openBraces > closeBraces) {
                  const bracesToClose = openBraces - closeBraces
                  for (let i = 0; i < bracesToClose; i++) {
                    finalCode += '\n}'
                  }
                }
              }
              
              // Ensure the code starts with proper imports
              if (!finalCode.includes('import') && !finalCode.includes('const cn =')) {
                // Add cn utility if missing
                finalCode = `const cn = (...classes) => classes.filter(Boolean).join(' ')\n\n${finalCode}`
              }
              
              // Ensure export exists
              if (!finalCode.includes('export default')) {
                finalCode += '\n\nexport default App'
              }
              
              await instance.fs.writeFile('src/App.jsx', finalCode)
              setTerminalOutput(prev => [...prev, '✓ App.jsx updated with new code'])
              setFileContent(finalCode)
            } catch (err) {
              console.error('Error updating App.jsx:', err)
              setTerminalOutput(prev => [...prev, `❌ Error: ${err}`])
            }
          }
          setIsLoading(false)
          setIsRunning(true)
        }
        
      } catch (error) {
        console.error('WebContainer initialization error:', error)
        if (mounted) {
          setError('Failed to initialize development environment. Please refresh and try again.')
          setIsLoading(false)
          setTerminalOutput(prev => [...prev, `❌ Error: ${error}`])
        }
      }
    }

    // Start initialization
    initWebContainer()

    // Cleanup
    return () => {
      mounted = false
      // Don't destroy the singleton, just clear local reference
      setWebcontainerInstance(null)
    }
  }, []) // Only run once on mount

  // Update App.jsx when code prop changes
  useEffect(() => {
    if (webcontainerInstance && code && selectedFile === 'src/App.jsx') {
      webcontainerInstance.fs.writeFile('src/App.jsx', code).catch(console.error)
      setFileContent(code)
    }
  }, [code, webcontainerInstance, selectedFile])

  const handleFileSelect = async (file: FileNode) => {
    if (file.type === 'file' && webcontainerInstance) {
      setSelectedFile(file.path)
      try {
        const content = await webcontainerInstance.fs.readFile(file.path, 'utf-8')
        setFileContent(content)
      } catch (error) {
        console.error('Error reading file:', error)
        setFileContent(file.content || '')
      }
    }
  }

  const handleFileChange = async (value: string | undefined) => {
    if (!value || !webcontainerInstance) return
    
    setFileContent(value)
    try {
      await webcontainerInstance.fs.writeFile(selectedFile, value)
    } catch (error) {
      console.error('Error writing file:', error)
    }
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
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}-${selectedFile.split('/').pop()}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const toggleDirectory = (dir: FileNode) => {
    // Since fileTree is static, we'd need to make it stateful to toggle
    // For now, directories are always expanded
  }

  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map(node => (
      <div key={node.path}>
        <button
          onClick={() => node.type === 'directory' ? toggleDirectory(node) : handleFileSelect(node)}
          className={`w-full flex items-center gap-1 px-2 py-1 text-sm hover:bg-gray-100 transition-colors ${
            selectedFile === node.path ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {node.type === 'directory' ? (
            <>
              {node.expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {node.expanded ? <FolderOpen size={14} /> : <Folder size={14} />}
            </>
          ) : (
            <FileText size={14} className="ml-3.5" />
          )}
          <span className="ml-1">{node.name}</span>
        </button>
        {node.type === 'directory' && node.expanded && node.children && (
          <div>{renderFileTree(node.children, level + 1)}</div>
        )}
      </div>
    ))
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Initialization Error</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col bg-white ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Code2 size={16} className="text-purple-600" />
            <h3 className="font-semibold text-sm text-gray-900">Development Environment</h3>
          </div>
          {isRunning && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              Live Preview
            </span>
          )}
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
            onClick={() => setShowTerminal(!showTerminal)}
            className={`p-1.5 rounded transition-colors ${
              showTerminal ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Toggle Terminal"
          >
            <Terminal size={14} />
          </button>
          <button
            onClick={() => {
              // Force a re-render by changing the iframe src slightly
              if (iframeRef.current && previewUrl) {
                const url = new URL(previewUrl)
                url.searchParams.set('t', Date.now().toString())
                setPreviewUrl(url.toString())
              }
            }}
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
      <div className="flex-1 flex flex-col overflow-hidden">
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
                onChange={handleFileChange}
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
          <div className="flex-1 border-l border-gray-200">
            <div className="bg-gray-100 px-3 py-1 border-b border-gray-200">
              <span className="text-xs text-gray-600">Preview</span>
            </div>
            {isLoading ? (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <Loader2 className="animate-spin mx-auto mb-3 text-purple-600" size={32} />
                  <p className="text-sm text-gray-600">Setting up development environment...</p>
                  <p className="text-xs text-gray-500 mt-2">This may take a moment</p>
                </div>
              </div>
            ) : previewUrl ? (
              <iframe
                ref={iframeRef}
                src={previewUrl}
                className="w-full h-full bg-white"
                title="Preview"
                allow="cross-origin-isolated"
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <Loader2 className="animate-spin mx-auto mb-3 text-purple-600" size={32} />
                  <p className="text-sm text-gray-600">Starting server...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Terminal */}
        {showTerminal && (
          <div className="h-48 border-t border-gray-200 bg-gray-900 text-gray-100 overflow-hidden flex flex-col">
            <div className="px-3 py-1 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
              <span className="text-xs font-medium">Terminal</span>
              <button
                onClick={() => setShowTerminal(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <ChevronDown size={12} />
              </button>
            </div>
            <div 
              ref={terminalRef}
              className="flex-1 p-2 overflow-y-auto font-mono text-xs"
            >
              {terminalOutput.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}