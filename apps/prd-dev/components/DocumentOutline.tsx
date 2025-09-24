'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Hash, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OutlineItem {
  id: string
  title: string
  level: number
  line: number
  children?: OutlineItem[]
}

interface DocumentOutlineProps {
  content: string
  onItemClick?: (line: number) => void
  className?: string
}

export default function DocumentOutline({ content, onItemClick, className }: DocumentOutlineProps) {
  const [outline, setOutline] = useState<OutlineItem[]>([])
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [activeItem, setActiveItem] = useState<string | null>(null)

  // Parse markdown headers to create outline
  useEffect(() => {
    const lines = content.split('\n')
    const items: OutlineItem[] = []
    const stack: OutlineItem[] = []
    
    lines.forEach((line, index) => {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)/)
      if (headerMatch) {
        const level = headerMatch[1].length
        const title = headerMatch[2].trim()
        const id = `outline-${index}-${title.toLowerCase().replace(/\s+/g, '-')}`
        
        const item: OutlineItem = {
          id,
          title,
          level,
          line: index + 1,
          children: []
        }
        
        // Find parent based on level
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
          stack.pop()
        }
        
        if (stack.length === 0) {
          items.push(item)
        } else {
          const parent = stack[stack.length - 1]
          if (!parent.children) parent.children = []
          parent.children.push(item)
        }
        
        stack.push(item)
      }
    })
    
    setOutline(items)
    // Expand first two levels by default
    const toExpand = new Set<string>()
    items.forEach(item => {
      if (item.level <= 2) {
        toExpand.add(item.id)
        item.children?.forEach(child => {
          if (child.level <= 2) {
            toExpand.add(child.id)
          }
        })
      }
    })
    setExpandedItems(toExpand)
  }, [content])

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const handleItemClick = (item: OutlineItem) => {
    setActiveItem(item.id)
    onItemClick?.(item.line)
  }

  const renderItem = (item: OutlineItem, depth: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.has(item.id)
    const isActive = activeItem === item.id
    
    return (
      <div key={item.id}>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1 text-sm hover:bg-gray-100 cursor-pointer transition-colors rounded",
            isActive && "bg-purple-50 text-purple-700 font-medium",
            depth > 0 && "ml-4"
          )}
          onClick={() => handleItemClick(item)}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(item.id)
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          {!hasChildren && (
            <Hash className="h-3 w-3 text-gray-400 ml-1" />
          )}
          <span className="truncate flex-1">
            {item.title}
          </span>
          <span className="text-xs text-gray-400">
            L{item.line}
          </span>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {item.children?.map(child => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (outline.length === 0) {
    return (
      <div className={cn("p-4 text-sm text-gray-500", className)}>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4" />
          <span className="font-medium">Document Outline</span>
        </div>
        <p className="text-xs">No headers found. Add headers using # to create an outline.</p>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium">Outline</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {outline.map(item => renderItem(item))}
      </div>
    </div>
  )
}