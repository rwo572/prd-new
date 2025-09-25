'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import dynamic from 'next/dynamic'
import { 
  FileText, 
  CheckCircle,
  SplitSquareHorizontal,
  Sparkles,
  RefreshCw,
  Eye,
  MessageSquare
} from 'lucide-react'
import DocumentOutline from './DocumentOutline'
import Linter from './Linter'
import ChatPanel from './ChatPanel'
import ResizablePanels from './ResizablePanels'
import MarkdownToolbar from './MarkdownToolbar'
import { cn } from '@/lib/utils'
import { LintIssue } from '@/types/prd-linter'
import { Message } from '@/types'
import { applyMarkdownAction } from '@/lib/markdown-editor-actions'
import { cleanTaskListFormatting } from '@/lib/ai-chat-service'

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
  onProjectNameChange?: (name: string) => void
  anthropicApiKey?: string
  selectedModel?: string
  onGeneratePrototype?: () => void
  messages: Message[]
  onSendMessage: (message: string, context?: any) => void
  isGenerating: boolean
  streamingThought?: string
  streamingContent?: string
  apiKeys?: any
  onClearMessages?: () => void
  error?: string | null
}

export default function EnhancedPRDEditor({
  content,
  onChange,
  projectName,
  onProjectNameChange,
  anthropicApiKey,
  selectedModel,
  onGeneratePrototype,
  messages,
  onSendMessage,
  isGenerating,
  streamingThought,
  streamingContent,
  apiKeys,
  onClearMessages,
  error
}: EnhancedPRDEditorProps) {
  // Client-side mounting check
  const [isMounted, setIsMounted] = useState(false)
  
  // Column visibility states with persistence
  const [showOutline, setShowOutline] = useLocalStorage('editor-show-outline', false)
  const [showEditor, setShowEditor] = useLocalStorage('editor-show-editor', false)
  const [showPreview, setShowPreview] = useLocalStorage('editor-show-preview', true)
  const [showLinter, setShowLinter] = useLocalStorage('editor-show-linter', false)
  const [showChat, setShowChat] = useLocalStorage('editor-show-chat', true)
  
  // Use default values during SSR to prevent hydration mismatch
  // After mount, use localStorage values; before mount use SSR defaults
  const safeShowOutline = isMounted ? showOutline : false
  const safeShowEditor = isMounted ? showEditor : false
  const safeShowPreview = isMounted ? showPreview : true
  const safeShowLinter = isMounted ? showLinter : false
  const safeShowChat = isMounted ? showChat : true
  
  // Editor state
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<any>(null)
  const [highlightPosition, setHighlightPosition] = useState<any>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [selectedText, setSelectedText] = useState<string>('')
  const [selectionRange, setSelectionRange] = useState<{ start: number, end: number } | undefined>()
  
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
        case '5':
          e.preventDefault()
          setShowChat(!showChat)
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isMounted, showOutline, showEditor, showPreview, showLinter, showChat, setShowOutline, setShowEditor, setShowPreview, setShowLinter, setShowChat])
  

  // Handle outline item click
  const handleOutlineClick = (line: number) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(line)
      editorRef.current.setPosition({ lineNumber: line, column: 1 })
      editorRef.current.focus()
    }
  }

  // Handle linter issue click - select the specific text
  const handleIssueClick = (issue: LintIssue) => {
    console.log('Linter issue clicked:', issue)
    
    // Ensure the editor panel is visible
    if (!showEditor) {
      setShowEditor(true)
    }
    
    // Wait a tick for the editor to become visible if it wasn't
    setTimeout(() => {
      if (editorRef.current && monacoRef.current) {
        const editor = editorRef.current
        const monaco = monacoRef.current
        const model = editor.getModel()
        
        if (model) {
          // If we have specific offsets, use them to select text
          if (issue.startOffset !== undefined && issue.endOffset !== undefined) {
            const startPos = model.getPositionAt(issue.startOffset)
            const endPos = model.getPositionAt(issue.endOffset)
          
          // Create a selection range
          const selection = new monaco.Selection(
            startPos.lineNumber,
            startPos.column,
            endPos.lineNumber,
            endPos.column
          )
          
          // Set the selection in the editor
          editor.setSelection(selection)
          
          // Reveal the selection in the center of the editor
          editor.revealLineInCenter(startPos.lineNumber)
          
          // Focus the editor
          editor.focus()
          
          // Update highlight position for visual feedback
          setHighlightPosition({
            line: startPos.lineNumber,
            column: startPos.column,
            startOffset: issue.startOffset,
            endOffset: issue.endOffset
          })
          } else if (issue.line && issue.column) {
            // Fallback to line/column positioning
            editor.revealLineInCenter(issue.line)
            editor.setPosition({ lineNumber: issue.line, column: issue.column })
            editor.focus()
            
            setHighlightPosition({
              line: issue.line,
              column: issue.column,
              startOffset: issue.startOffset,
              endOffset: issue.endOffset
            })
          }
        }
      }
    }, showEditor ? 0 : 100) // Wait longer if editor needs to be shown
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

  // Set mounted state after hydration and show linter by default for new users
  useEffect(() => {
    setIsMounted(true)
    
    // Check if this is the first time - if no localStorage key exists, show linter
    if (typeof window !== 'undefined') {
      const hasLinterPreference = window.localStorage.getItem('editor-show-linter')
      if (hasLinterPreference === null) {
        // First time user - show the linter
        setShowLinter(true)
      }
    }
  }, [setShowLinter])
  
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
    
    setIsRegenerating(true)
    if (onGeneratePrototype) {
      await onGeneratePrototype()
    }
    setIsRegenerating(false)
  }

  // Handle text replacement from chat
  const handleReplaceText = (start: number, end: number, newText: string) => {
    const before = content.substring(0, start)
    const after = content.substring(end)
    onChange(before + newText + after)
    
    // Highlight the changed text
    setHighlightPosition({
      line: 0, // Will be calculated by Monaco
      column: 0,
      startOffset: start,
      endOffset: start + newText.length
    })
    
    // Reset selection after replacement
    setSelectedText('')
    setSelectionRange(undefined)
    
    // Clear highlight after a delay
    setTimeout(() => setHighlightPosition(null), 3000)
  }

  // Calculate column count for layout
  const columnCount = [safeShowChat, safeShowOutline, safeShowEditor, safeShowPreview, safeShowLinter].filter(Boolean).length
  
  // Memoize panels array to prevent unnecessary re-renders
  const panels = useMemo(() => [
    safeShowChat ? {
      id: 'chat',
      content: (
        <div className="h-full border-r border-slate-200">
          <ChatPanel
            messages={messages}
            onSendMessage={onSendMessage}
            isGenerating={isGenerating}
            editorContent={content}
            selectedText={selectedText}
            selectionRange={selectionRange}
            onReplaceText={handleReplaceText}
            onAcceptContent={(newContent, context) => {
              // Clean up task list formatting before insertion
              const cleanedContent = cleanTaskListFormatting(newContent)
              if (context?.type === 'selection' && context.selectionStart !== undefined && context.selectionEnd !== undefined) {
                // Replace the selected text with the new content
                const before = content.substring(0, context.selectionStart)
                const after = content.substring(context.selectionEnd)
                const updatedContent = before + cleanedContent + after
                onChange(updatedContent)

                // Highlight the inserted text
                setHighlightPosition({
                  line: 0,
                  column: 0,
                  startOffset: context.selectionStart,
                  endOffset: context.selectionStart + cleanedContent.length
                })

                // Clear highlight after 5 seconds
                setTimeout(() => setHighlightPosition(null), 5000)

                // Show the editor if it's hidden
                if (!showEditor) {
                  setShowEditor(true)
                }

                // Focus and scroll to the changed text
                setTimeout(() => {
                  if (editorRef.current && monacoRef.current) {
                    const model = editorRef.current.getModel()
                    if (model) {
                      const position = model.getPositionAt((context.selectionStart || 0) + cleanedContent.length)
                      editorRef.current.setPosition(position)
                      editorRef.current.revealLineInCenter(position.lineNumber)
                      editorRef.current.focus()
                    }
                  }
                }, 100)
              } else {
                // Intelligent content insertion instead of full replacement
                if (content.trim()) {
                  // If there's existing content, try to find the best insertion point
                  let insertionPoint = content.length

                  // Look for common PRD sections where tasks should be inserted
                  const taskSectionPatterns = [
                    /##?\s*(Implementation|Development|Tasks|Timeline|Roadmap|Action Items)/i,
                    /##?\s*Next Steps/i,
                    /##?\s*Appendix/i,
                    /##?\s*References/i
                  ]

                  // Try to find the best insertion point
                  for (const pattern of taskSectionPatterns) {
                    const match = content.match(pattern)
                    if (match && match.index !== undefined) {
                      insertionPoint = match.index
                      break
                    }
                  }

                  // If we found a good insertion point, insert before it
                  // Otherwise, append to the end
                  let updatedContent
                  if (insertionPoint < content.length) {
                    const before = content.substring(0, insertionPoint)
                    const after = content.substring(insertionPoint)
                    updatedContent = before + '\n\n' + cleanedContent + '\n\n' + after
                  } else {
                    updatedContent = content + '\n\n' + cleanedContent
                  }

                  onChange(updatedContent)
                } else {
                  // If document is empty, just set the content
                  onChange(cleanedContent)
                }

                // Show the editor if it's hidden
                if (!showEditor) {
                  setShowEditor(true)
                }

                // Focus editor
                setTimeout(() => {
                  if (editorRef.current) {
                    editorRef.current.focus()
                  }
                }, 100)
              }
            }}
            streamingThought={streamingThought}
            streamingContent={streamingContent}
            apiKeys={apiKeys}
            onClearChat={onClearMessages}
            error={error}
          />
        </div>
      ),
      defaultWidth: 350,
      minWidth: 50,
      maxWidth: 1000
    } : null,
    safeShowOutline ? {
      id: 'outline',
      content: (
        <div className="h-full border-r border-slate-200 bg-gradient-to-b from-slate-50 to-white">
          <DocumentOutline
            content={content}
            onItemClick={handleOutlineClick}
          />
        </div>
      ),
      defaultWidth: 260,
      minWidth: 100,
      maxWidth: 800
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
                
                // Track selection changes
                editor.onDidChangeCursorSelection((e) => {
                  const selection = editor.getSelection()
                  if (selection && !selection.isEmpty()) {
                    const model = editor.getModel()
                    if (model) {
                      const selectedText = model.getValueInRange(selection)
                      const startOffset = model.getOffsetAt(selection.getStartPosition())
                      const endOffset = model.getOffsetAt(selection.getEndPosition())
                      setSelectedText(selectedText)
                      setSelectionRange({ start: startOffset, end: endOffset })
                    }
                  } else {
                    setSelectedText('')
                    setSelectionRange(undefined)
                  }
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
      minWidth: 100,
      maxWidth: 2000
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
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <MarkdownPreview 
              content={content} 
              onTextSelect={(text) => {
                setSelectedText(text)
                // Note: We can't set selectionRange here as it refers to editor positions
                // For preview selections, we'll just have the text without position info
                setSelectionRange(undefined)
              }}
            />
          </div>
        </div>
      ),
      defaultWidth: 450,
      minWidth: 100,
      maxWidth: 1500
    } : null,
    safeShowLinter ? {
      id: 'linter',
      content: (
        <div className="h-full border-l border-slate-200">
          <Linter
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
      minWidth: 50,
      maxWidth: 800
    } : null
  ].filter(Boolean), [
    safeShowChat,
    safeShowOutline,
    safeShowEditor,
    safeShowPreview,
    safeShowLinter,
    content,
    handleOutlineClick,
    handleToolbarAction,
    onChange,
    handleIssueClick,
    handleSuggestionApply,
    anthropicApiKey,
    selectedModel,
    messages,
    onSendMessage,
    isGenerating,
    selectedText,
    selectionRange,
    handleReplaceText,
    showEditor,
    setShowEditor,
    onGeneratePrototype,
    onClearMessages,
    streamingThought,
    streamingContent,
    apiKeys,
    error,
    setSelectedText,
    setSelectionRange,
    setHighlightPosition
  ])

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Compact Navigation Bar - Single Line */}
      <div className="relative z-50 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-2 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-3 flex-1">
          {/* Project Name */}
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange?.(e.target.value)}
            className="font-semibold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1 transition-colors"
            placeholder="Project Name"
            readOnly={!onProjectNameChange}
          />
          
          {/* Divider */}
          <div className="h-5 w-px bg-slate-300" />
          
          {/* Column Toggle Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowChat(!showChat)}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200",
                safeShowChat
                  ? "bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 shadow-sm"
                  : "hover:bg-slate-100 text-slate-600"
              )}
              title="Chat (1)"
            >
              <MessageSquare className="h-4 w-4" />
            </button>

            <button
              onClick={() => setShowOutline(!showOutline)}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200",
                safeShowOutline
                  ? "bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 shadow-sm"
                  : "hover:bg-slate-100 text-slate-600"
              )}
              title="Outline (2)"
            >
              <FileText className="h-4 w-4" />
            </button>

            <button
              onClick={() => setShowEditor(!showEditor)}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200",
                safeShowEditor
                  ? "bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 shadow-sm"
                  : "hover:bg-slate-100 text-slate-600"
              )}
              title="Editor (3)"
            >
              <SplitSquareHorizontal className="h-4 w-4" />
            </button>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200",
                safeShowPreview
                  ? "bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 shadow-sm"
                  : "hover:bg-slate-100 text-slate-600"
              )}
              title="Markdown (4)"
            >
              <Eye className="h-4 w-4" />
            </button>

            <button
              onClick={() => setShowLinter(!showLinter)}
              className={cn(
                "p-1.5 rounded-lg transition-all duration-200",
                safeShowLinter
                  ? "bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 shadow-sm"
                  : "hover:bg-slate-100 text-slate-600"
              )}
              title="Linter (5)"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Generate Prototype Button */}
        {onGeneratePrototype && (
          <button
            onClick={handleRegenerate}
            disabled={isMounted ? (isRegenerating || !content.trim()) : false}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm ml-3",
              (isMounted && (isRegenerating || !content.trim()))
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:from-indigo-600 hover:to-blue-600 hover:shadow-md"
            )}
          >
            {isRegenerating ? (
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

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanels
          storageKey="editor-panel-widths"
          panels={panels as any}
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