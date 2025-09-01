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
import { cn } from '@/lib/utils'
import { LintIssue } from '@/types/prd-linter'

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
  // Column visibility states with persistence
  const [showOutline, setShowOutline] = useLocalStorage('editor-show-outline', true)
  const [showEditor, setShowEditor] = useLocalStorage('editor-show-editor', true)
  const [showPreview, setShowPreview] = useLocalStorage('editor-show-preview', false)
  const [showLinter, setShowLinter] = useLocalStorage('editor-show-linter', false)
  
  // Editor state
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const [highlightPosition, setHighlightPosition] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  

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
  const columnCount = [showOutline, showEditor, showPreview, showLinter].filter(Boolean).length

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Navigation Bar */}
      <div className="border-b border-gray-200 px-4 py-2 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-sm">Editor</h3>
            
            {/* Column Toggle Buttons */}
            <div className="flex items-center gap-1 border-l pl-4">
            <button
              onClick={() => setShowOutline(!showOutline)}
              className={cn(
                "p-1.5 rounded transition-colors",
                showOutline 
                  ? "bg-purple-100 text-purple-700 hover:bg-purple-200" 
                  : "hover:bg-gray-100 text-gray-600"
              )}
              title="Toggle Outline"
            >
              <FileText className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setShowEditor(!showEditor)}
              className={cn(
                "p-1.5 rounded transition-colors",
                showEditor 
                  ? "bg-purple-100 text-purple-700 hover:bg-purple-200" 
                  : "hover:bg-gray-100 text-gray-600"
              )}
              title="Toggle Editor"
            >
              <SplitSquareHorizontal className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={cn(
                "p-1.5 rounded transition-colors",
                showPreview 
                  ? "bg-purple-100 text-purple-700 hover:bg-purple-200" 
                  : "hover:bg-gray-100 text-gray-600"
              )}
              title="Toggle Rich Text Preview"
            >
              <Eye className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setShowLinter(!showLinter)}
              className={cn(
                "p-1.5 rounded transition-colors",
                showLinter 
                  ? "bg-purple-100 text-purple-700 hover:bg-purple-200" 
                  : "hover:bg-gray-100 text-gray-600"
              )}
              title="Toggle PRD Quality Score"
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
                disabled={isGenerating || !content.trim()}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  isGenerating || !content.trim()
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
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanels
          storageKey="editor-panel-widths"
          panels={[
            showOutline ? {
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
              minWidth: 200,
              maxWidth: 400
            } : null,
            showEditor ? {
              id: 'editor',
              content: (
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
              ),
              defaultWidth: 500,
              minWidth: 300,
              maxWidth: 800
            } : null,
            showPreview ? {
              id: 'preview',
              content: (
                <div className="h-full border-l border-gray-200">
                  <MarkdownPreview content={content} />
                </div>
              ),
              defaultWidth: 450,
              minWidth: 300,
              maxWidth: 700
            } : null,
            showLinter ? {
              id: 'linter',
              content: (
                <div className="h-full border-l border-gray-200 bg-gray-50 overflow-y-auto">
                  <div className="p-4">
                    <PRDLinter
                      content={content}
                      onAutoFix={(fixedContent) => onChange(fixedContent)}
                      onIssueClick={handleIssueClick}
                      onSuggestionApply={handleSuggestionApply}
                    />
                  </div>
                </div>
              ),
              defaultWidth: 320,
              minWidth: 280,
              maxWidth: 500
            } : null
          ].filter(Boolean)}
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