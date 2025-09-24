'use client'

import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Image,
  Table,
  Minus,
  CheckSquare,
  Undo,
  Redo
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MarkdownToolbarProps {
  onAction: (action: string, value?: any) => void
  className?: string
}

interface ToolButton {
  icon: React.ReactNode
  title: string
  action: string
  value?: any
}

export default function MarkdownToolbar({ 
  onAction, 
  className
}: MarkdownToolbarProps) {
  
  const toolGroups: ToolButton[][] = [
    // Text formatting
    [
      { icon: <Bold className="h-4 w-4" />, title: 'Bold (Ctrl+B)', action: 'bold' },
      { icon: <Italic className="h-4 w-4" />, title: 'Italic (Ctrl+I)', action: 'italic' },
      { icon: <Code className="h-4 w-4" />, title: 'Inline Code', action: 'code' },
    ],
    // Headers
    [
      { icon: <Heading1 className="h-4 w-4" />, title: 'Heading 1', action: 'heading', value: 1 },
      { icon: <Heading2 className="h-4 w-4" />, title: 'Heading 2', action: 'heading', value: 2 },
      { icon: <Heading3 className="h-4 w-4" />, title: 'Heading 3', action: 'heading', value: 3 },
    ],
    // Lists and blocks
    [
      { icon: <List className="h-4 w-4" />, title: 'Bullet List', action: 'bulletList' },
      { icon: <ListOrdered className="h-4 w-4" />, title: 'Numbered List', action: 'numberedList' },
      { icon: <CheckSquare className="h-4 w-4" />, title: 'Task List', action: 'taskList' },
      { icon: <Quote className="h-4 w-4" />, title: 'Quote', action: 'quote' },
    ],
    // Insert
    [
      { icon: <Link className="h-4 w-4" />, title: 'Insert Link', action: 'link' },
      { icon: <Image className="h-4 w-4" />, title: 'Insert Image', action: 'image' },
      { icon: <Table className="h-4 w-4" />, title: 'Insert Table', action: 'table' },
      { icon: <Minus className="h-4 w-4" />, title: 'Horizontal Rule', action: 'horizontalRule' },
    ],
    // History
    [
      { icon: <Undo className="h-4 w-4" />, title: 'Undo (Ctrl+Z)', action: 'undo' },
      { icon: <Redo className="h-4 w-4" />, title: 'Redo (Ctrl+Shift+Z)', action: 'redo' },
    ]
  ]

  const handleButtonClick = (action: string, value?: any) => {
    onAction(action, value)
  }

  return (
    <div className={cn(
      "flex items-center gap-1 px-3 py-2 bg-white border-b border-gray-200",
      className
    )}>
      {toolGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="flex items-center gap-0.5">
          {group.map((tool, toolIndex) => (
            <button
              key={toolIndex}
              onClick={() => handleButtonClick(tool.action, tool.value)}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors"
              title={tool.title}
            >
              {tool.icon}
            </button>
          ))}
          {groupIndex < toolGroups.length - 1 && (
            <div className="w-px h-6 bg-gray-300 mx-1" />
          )}
        </div>
      ))}
    </div>
  )
}