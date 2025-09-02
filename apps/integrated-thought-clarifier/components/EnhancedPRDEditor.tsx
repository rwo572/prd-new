'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import dynamic from 'next/dynamic'
import { 
  FileText, 
  CheckCircle,
  SplitSquareHorizontal,
  Sparkles,
  RefreshCw,
  Eye
} from 'lucide-react'
import DocumentOutline from './DocumentOutline'
import PRDLinter from './PRDLinter'
import ResizablePanels from './ResizablePanels'
import MarkdownToolbar from './MarkdownToolbar'
import { cn } from '@/lib/utils'
import { LintIssue } from '@/types/prd-linter'
import { applyMarkdownAction } from '@/lib/markdown-editor-actions'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading editor...</div>
})

const MarkdownPreview = dynamic(() => import('./MarkdownPreview'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading preview...</div>
})


interface EnhancedPRDEditorProps {
  content: string
  onChange: (value: string) => void
  projectName: string
  anthropicApiKey?: string
  selectedModel?: string
  onGeneratePrototype?: () => void
}

export default function EnhancedPRDEditor({
  content,
  onChange,
  projectName,
  anthropicApiKey,
  selectedModel,
  onGeneratePrototype
}: EnhancedPRDEditorProps) {
  // Client-side mounting check
  const [isMounted, setIsMounted] = useState(false)
  
  // Column visibility states with persistence
  const [showOutline, setShowOutline] = useLocalStorage('editor-show-outline', true)
  const [showEditor, setShowEditor] = useLocalStorage('editor-show-editor', true)
  const [showPreview, setShowPreview] = useLocalStorage('editor-show-preview', false)
  const [showLinter, setShowLinter] = useLocalStorage('editor-show-linter', false)
  
  // Use default values during SSR to prevent hydration mismatch
  const safeShowOutline = isMounted ? showOutline : true
  const safeShowEditor = isMounted ? showEditor : true
  const safeShowPreview = isMounted ? showPreview : false
  const safeShowLinter = isMounted ? showLinter : false
  
  // Editor state
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const [highlightPosition, setHighlightPosition] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Keyboard shortcuts
  useEffect(() => {
    if (!isMounted) return
    
    const handleKeyPress = (e: KeyboardEvent) => {
      // Check if user is typing in an input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return
      }
      
      // Check for Monaco editor focus
      if (editorRef.current?.hasTextFocus()) {
        return
      }
      
      switch(e.key) {
        case '1':
          e.preventDefault()
          setShowOutline(!showOutline)
          break
        case '2':
          e.preventDefault()
          setShowEditor(!showEditor)
          break
        case '3':
          e.preventDefault()
          setShowPreview(!showPreview)
          break
        case '4':
          e.preventDefault()
          setShowLinter(!showLinter)
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isMounted, showOutline, showEditor, showPreview, showLinter, setShowOutline, setShowEditor, setShowPreview, setShowLinter])
  

  // Handle outline item click
  const handleOutlineClick = (line: number) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(line)
      editorRef.current.setPosition({ lineNumber: line, column: 1 })
      editorRef.current.focus()
    }
  }

  // Handle linter issue click
  const handleIssueClick = (issue: LintIssue) => {
    if (issue.line && issue.column) {
      setHighlightPosition({
        line: issue.line,
        column: issue.column,
        startOffset: issue.startOffset,
        endOffset: issue.endOffset
      })
      
      if (editorRef.current) {
        editorRef.current.revealLineInCenter(issue.line)
        editorRef.current.setPosition({ lineNumber: issue.line, column: issue.column })
        editorRef.current.focus()
      }
    }
  }

  // Handle suggestion apply
  const handleSuggestionApply = (startOffset: number, endOffset: number, newText: string) => {
    const before = content.substring(0, startOffset)
    const after = content.substring(endOffset)
    onChange(before + newText + after)
    setTimeout(() => setHighlightPosition(null), 100)
  }

  // Handle toolbar actions
  const handleToolbarAction = (action: string, value?: any) => {
    if (editorRef.current) {
      applyMarkdownAction(editorRef.current, action, value)
    }
  }

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Handle highlighting when position changes
  useEffect(() => {
    if (highlightPosition && editorRef.current && monacoRef.current) {
      const { line, column, startOffset, endOffset } = highlightPosition
      const editor = editorRef.current
      const monaco = monacoRef.current
      
      if (startOffset !== undefined && endOffset !== undefined) {
        const model = editor.getModel()
        if (model) {
          const startPos = model.getPositionAt(startOffset)
          const endPos = model.getPositionAt(endOffset)
          
          const decorations = editor.deltaDecorations([], [
            {
              range: new monaco.Range(
                startPos.lineNumber,
                startPos.column,
                endPos.lineNumber,
                endPos.column
              ),
              options: {
                className: 'lint-highlight',
                inlineClassName: 'lint-highlight-inline'
              }
            }
          ])
          
          setTimeout(() => {
            editor.deltaDecorations(decorations, [])
          }, 3000)
        }
      }
    }
  }, [highlightPosition])

  // Handle regenerate
  const handleRegenerate = async () => {
    if (!content.trim()) {
      alert('Please enter PRD content first')
      return
    }
    
    if (!anthropicApiKey) {
      alert('Please add your Anthropic API key in Settings')
      return
    }
    
    setIsGenerating(true)
    if (onGeneratePrototype) {
      await onGeneratePrototype()
    }
    setIsGenerating(false)
  }

  // Calculate column count for layout
  const columnCount = [safeShowOutline, safeShowEditor, safeShowPreview, safeShowLinter].filter(Boolean).length

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Navigation Bar */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-sm text-gray-900">Editor</h3>
          
          {/* Divider */}
          <div className="h-5 w-px bg-gray-300" />
          
          {/* Column Toggle Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowOutline(!showOutline)}
              className={cn(
                "p-1.5 rounded transition-colors",
                safeShowOutline 
                  ? "bg-purple-100 text-purple-700 hover:bg-purple-200" 
                  : "hover:bg-gray-100 text-gray-600"
              )}
              title="Outline (1)"
            >
              <FileText className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setShowEditor(!showEditor)}
              className={cn(
                "p-1.5 rounded transition-colors",
                safeShowEditor 
                  ? "bg-purple-100 text-purple-700 hover:bg-purple-200" 
                  : "hover:bg-gray-100 text-gray-600"
              )}
              title="Editor (2)"
            >
              <SplitSquareHorizontal className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={cn(
                "p-1.5 rounded transition-colors",
                safeShowPreview 
                  ? "bg-purple-100 text-purple-700 hover:bg-purple-200" 
                  : "hover:bg-gray-100 text-gray-600"
              )}
              title="Preview (3)"
            >
              <Eye className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setShowLinter(!showLinter)}
              className={cn(
                "p-1.5 rounded transition-colors",
                safeShowLinter 
                  ? "bg-purple-100 text-purple-700 hover:bg-purple-200" 
                  : "hover:bg-gray-100 text-gray-600"
              )}
              title="Linter (4)"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Generate Prototype Button */}
        <div className="flex items-center gap-2">
            {onGeneratePrototype && (
              <button
                onClick={handleRegenerate}
                disabled={isMounted ? (isGenerating || !content.trim()) : false}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  (isMounted && (isGenerating || !content.trim()))
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                )}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Prototype</span>
                  </>
                )}
              </button>
            )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanels
          storageKey="editor-panel-widths"
          panels={[
            safeShowOutline ? {
              id: 'outline',
              content: (
                <div className="h-full border-r border-gray-200 bg-gray-50">
                  <DocumentOutline
                    content={content}
                    onItemClick={handleOutlineClick}
                  />
                </div>
              ),
              defaultWidth: 260,
              minWidth: 150,
              maxWidth: 600
            } : null,
            safeShowEditor ? {
              id: 'editor',
              content: (
                <div className="h-full flex flex-col">
                  <MarkdownToolbar 
                    onAction={handleToolbarAction}
                  />
                  <div className="flex-1">
                    <MonacoEditor
                  height="100%"
                  defaultLanguage="markdown"
                  value={content}
                  onChange={(value) => onChange(value || '')}
                  theme="vs"
                  onMount={(editor, monaco) => {
                    editorRef.current = editor
                    monacoRef.current = monaco
                    
                    monaco.editor.defineTheme('custom', {
                      base: 'vs',
                      inherit: true,
                      rules: [],
                      colors: {}
                    })
                    
                    // Add keyboard shortcuts
                    editor.addAction({
                      id: 'markdown-bold',
                      label: 'Bold',
                      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB],
                      run: () => applyMarkdownAction(editor, 'bold')
                    })
                    
                    editor.addAction({
                      id: 'markdown-italic',
                      label: 'Italic',
                      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI],
                      run: () => applyMarkdownAction(editor, 'italic')
                    })
                    
                    editor.addAction({
                      id: 'markdown-link',
                      label: 'Insert Link',
                      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK],
                      run: () => applyMarkdownAction(editor, 'link')
                    })
                  }}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    wrappingIndent: 'indent',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    folding: true,
                    foldingStrategy: 'indentation',
                    renderWhitespace: 'none',
                    lineDecorationsWidth: 0,
                    lineNumbersMinChars: 4,
                    padding: { top: 16, bottom: 16 }
                  }}
                    />
                  </div>
                </div>
              ),
              defaultWidth: 500,
              minWidth: 200,
              maxWidth: 1000
            } : null,
            safeShowPreview ? {
              id: 'preview',
              content: (
                <div className="h-full flex flex-col border-l border-gray-200">
                  <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Rich Text Preview</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <MarkdownPreview content={content} />
                  </div>
                </div>
              ),
              defaultWidth: 450,
              minWidth: 200,
              maxWidth: 800
            } : null,
            safeShowLinter ? {
              id: 'linter',
              content: (
                <div className="h-full border-l border-gray-200">
                  <PRDLinter
                    content={content}
                    onAutoFix={(fixedContent) => onChange(fixedContent)}
                    onIssueClick={handleIssueClick}
                    onSuggestionApply={handleSuggestionApply}
                    anthropicApiKey={anthropicApiKey}
                    selectedModel={selectedModel}
                  />
                </div>
              ),
              defaultWidth: 320,
              minWidth: 200,
              maxWidth: 600
            } : null
          ].filter(Boolean) as any}
        />
      </div>

      {/* Empty State */}
      {columnCount === 0 && (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <p className="mb-2">No columns visible</p>
            <p className="text-sm">Use the toggle buttons above to show columns</p>
          </div>
        </div>
      )}
    </div>
  )
}