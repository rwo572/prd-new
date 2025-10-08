'use client'

import { useState, useRef, useEffect } from 'react'
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Code, Eye, EyeOff, Heading1, Heading2, Heading3, Quote, Link, AlignLeft, AlignCenter, AlignRight, Undo, Redo, Type, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

// Simple markdown converter functions
const markdownToHtml = (markdown: string): string => {
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    .replace(/\n/g, '<br>')
}

const htmlToMarkdown = (html: string): string => {
  return html
    .replace(/<h1>(.*?)<\/h1>/gim, '# $1\n')
    .replace(/<h2>(.*?)<\/h2>/gim, '## $1\n')
    .replace(/<h3>(.*?)<\/h3>/gim, '### $1\n')
    .replace(/<strong>(.*?)<\/strong>/gim, '**$1**')
    .replace(/<b>(.*?)<\/b>/gim, '**$1**')
    .replace(/<em>(.*?)<\/em>/gim, '*$1*')
    .replace(/<i>(.*?)<\/i>/gim, '*$1*')
    .replace(/<code>(.*?)<\/code>/gim, '`$1`')
    .replace(/<ul><li>(.*?)<\/li><\/ul>/gims, '* $1\n')
    .replace(/<li>(.*?)<\/li>/gim, '* $1\n')
    .replace(/<br\s*\/?>/gim, '\n')
    .replace(/<[^>]*>/g, '')
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  className
}: RichTextEditorProps) {
  const [isMarkdownView, setIsMarkdownView] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    if (isMarkdownView && textareaRef.current) {
      textareaRef.current.value = content
    } else if (!isMarkdownView && editorRef.current) {
      editorRef.current.innerHTML = markdownToHtml(content)
    }
  }, [isMarkdownView, content, isMounted])

  const handleRichTextChange = () => {
    if (!editorRef.current) return
    const htmlContent = editorRef.current.innerHTML
    const markdownContent = htmlToMarkdown(htmlContent)
    onChange(markdownContent)
  }

  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    handleRichTextChange()
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      execCommand('createLink', url)
    }
  }

  const changeTextColor = () => {
    const color = prompt('Enter color (e.g., #ff0000, red):')
    if (color) {
      execCommand('foreColor', color)
    }
  }

  const changeBackgroundColor = () => {
    const color = prompt('Enter background color (e.g., #ffff00, yellow):')
    if (color) {
      execCommand('backColor', color)
    }
  }

  const toggleView = () => {
    setIsMarkdownView(!isMarkdownView)
  }

  if (!isMounted) {
    return (
      <div className={cn("border border-slate-200 rounded-lg bg-white", className)}>
        <div className="flex items-center justify-center h-64">
          Loading editor...
        </div>
      </div>
    )
  }

  return (
    <div className={cn("border border-slate-200 rounded-lg bg-white flex flex-col", className)}>
      {/* Toolbar */}
      <div className="border-b border-slate-200 bg-slate-50 p-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto">
          {!isMarkdownView && (
            <>
              {/* Undo/Redo */}
              <button
                type="button"
                onClick={() => execCommand('undo')}
                className="p-2 rounded hover:bg-slate-200 transition-colors"
                title="Undo"
              >
                <Undo size={16} />
              </button>
              <button
                type="button"
                onClick={() => execCommand('redo')}
                className="p-2 rounded hover:bg-slate-200 transition-colors"
                title="Redo"
              >
                <Redo size={16} />
              </button>
              <div className="w-px h-6 bg-slate-300 mx-1" />

              {/* Headings */}
              <button
                type="button"
                onClick={() => execCommand('formatBlock', '<h1>')}
                className="p-2 rounded hover:bg-slate-200 transition-colors"
                title="Heading 1"
              >
                <Heading1 size={16} />
              </button>
              <button
                type="button"
                onClick={() => execCommand('formatBlock', '<h2>')}
                className="p-2 rounded hover:bg-slate-200 transition-colors"
                title="Heading 2"
              >
                <Heading2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => execCommand('formatBlock', '<h3>')}
                className="p-2 rounded hover:bg-slate-200 transition-colors"
                title="Heading 3"
              >
                <Heading3 size={16} />
              </button>
              <div className="w-px h-6 bg-slate-300 mx-1" />

              {/* Text Formatting */}
              <button
                type="button"
                onClick={() => execCommand('bold')}
                className="p-2 rounded hover:bg-slate-200 transition-colors"
                title="Bold"
              >
                <Bold size={16} />
              </button>
              <button
                type="button"
                onClick={() => execCommand('italic')}
                className="p-2 rounded hover:bg-slate-200 transition-colors"
                title="Italic"
              >
                <Italic size={16} />
              </button>
              <button
                type="button"
                onClick={() => execCommand('underline')}
                className="p-2 rounded hover:bg-slate-200 transition-colors"
                title="Underline"
              >
                <Underline size={16} />
              </button>
              <button
                type="button"
                onClick={() => execCommand('strikethrough')}
                className="p-2 rounded hover:bg-slate-200 transition-colors"
                title="Strikethrough"
              >
                <Strikethrough size={16} />
              </button>
              <div className="w-px h-6 bg-slate-300 mx-1" />

              {/* Colors */}
              <button
                type="button"
                onClick={changeTextColor}
                className="p-2 rounded hover:bg-slate-200 transition-colors"
                title="Text Color"
              >
                <Type size={16} />
              </button>
              <button
                type="button"
                onClick={changeBackgroundColor}
                className="p-2 rounded hover:bg-slate-200 transition-colors"
                title="Background Color"
              >
                <Palette size={16} />
              </button>
              <div className="w-px h-6 bg-slate-300 mx-1" />

              {/* Alignment */}
              <button
                type="button"
                onClick={() => execCommand('justifyLeft')}
                className="p-2 rounded hover:bg-slate-200 transition-colors"
                title="Align Left"
              >
                <AlignLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => execCommand('justifyCenter')}
                className="p-2 rounded hover:bg-slate-200 transition-colors"
                title="Align Center"
              >
                <AlignCenter size={16} />
              </button>
              <button
                type="button"
                onClick={() => execCommand('justifyRight')}
                className="p-2 rounded hover:bg-slate-200 transition-colors"
                title="Align Right"
              >
                <AlignRight size={16} />
              </button>
              <div className="w-px h-6 bg-slate-300 mx-1" />

              {/* Lists */}
              <button
                type="button"
                onClick={() => execCommand('insertUnorderedList')}
                className="p-2 rounded hover:bg-slate-200 transition-colors"
                title="Bullet List"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => execCommand('insertOrderedList')}
                className="p-2 rounded hover:bg-slate-200 transition-colors"
                title="Numbered List"
              >
                <ListOrdered size={16} />
              </button>
              <div className="w-px h-6 bg-slate-300 mx-1" />

              {/* Special */}
              <button
                type="button"
                onClick={() => execCommand('formatBlock', '<blockquote>')}
                className="p-2 rounded hover:bg-slate-200 transition-colors"
                title="Quote"
              >
                <Quote size={16} />
              </button>
              <button
                type="button"
                onClick={() => execCommand('formatBlock', '<pre>')}
                className="p-2 rounded hover:bg-slate-200 transition-colors"
                title="Code Block"
              >
                <Code size={16} />
              </button>
              <button
                type="button"
                onClick={insertLink}
                className="p-2 rounded hover:bg-slate-200 transition-colors"
                title="Insert Link"
              >
                <Link size={16} />
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={toggleView}
          className={cn(
            "flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors",
            isMarkdownView
              ? "bg-blue-100 text-blue-700"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          )}
        >
          {isMarkdownView ? (
            <>
              <Eye size={14} />
              Rich Text
            </>
          ) : (
            <>
              <EyeOff size={14} />
              Markdown
            </>
          )}
        </button>
      </div>

      {/* Editor Area - Now flexible */}
      <div className="relative flex-1 overflow-auto">
        {isMarkdownView ? (
          <textarea
            ref={textareaRef}
            onChange={handleMarkdownChange}
            placeholder={placeholder}
            className="w-full h-full p-4 border-none outline-none resize-none font-mono text-sm"
            defaultValue={content}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleRichTextChange}
            className="w-full h-full p-4 outline-none prose prose-sm max-w-none overflow-auto"
            style={{ minHeight: '100%' }}
            suppressContentEditableWarning={true}
            data-placeholder={placeholder}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-500 flex-shrink-0">
        {isMarkdownView ? 'Markdown Mode' : 'Rich Text Mode'} • {content.length} characters
      </div>
    </div>
  )
}