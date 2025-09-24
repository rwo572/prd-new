'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { cn } from '@/lib/utils'

interface Panel {
  id: string
  content: ReactNode
  minWidth?: number
  defaultWidth?: number
  maxWidth?: number
}

interface ResizablePanelsProps {
  panels: Panel[]
  className?: string
  storageKey?: string
}

export default function ResizablePanels({ panels, className, storageKey = 'panel-widths' }: ResizablePanelsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [widths, setWidths] = useLocalStorage<Record<string, number>>(
    storageKey,
    panels.reduce((acc, panel) => ({
      ...acc,
      [panel.id]: panel.defaultWidth || 300
    }), {})
  )
  const [isDragging, setIsDragging] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidths, setStartWidths] = useState<Record<string, number>>({})

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Initialize widths for new panels
  useEffect(() => {
    const newWidths = { ...widths }
    let hasChanges = false
    
    panels.forEach(panel => {
      if (panel && !(panel.id in newWidths)) {
        newWidths[panel.id] = panel.defaultWidth || 300
        hasChanges = true
      }
    })
    
    if (hasChanges) {
      setWidths(newWidths)
    }
  }, [panels.map(p => p?.id).join(','), setWidths]) // Only re-run when panel IDs change

  const handleMouseDown = (e: React.MouseEvent, panelId: string) => {
    e.preventDefault()
    e.stopPropagation() // Prevent event bubbling
    setIsDragging(panelId)
    setStartX(e.clientX)
    setStartWidths({ ...widths })
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const deltaX = e.clientX - startX

      // Work with visible panels only - check by ID, not content
      const visiblePanels = panels.filter(p => p && p.id)
      const panelIndex = visiblePanels.findIndex(p => p.id === isDragging)

      if (panelIndex === -1) {
        return
      }

      const panel = visiblePanels[panelIndex]
      const nextPanel = visiblePanels[panelIndex + 1]

      if (!nextPanel) {
        return
      }

      const currentWidth = startWidths[panel.id] || panel.defaultWidth || 300
      const nextWidth = startWidths[nextPanel.id] || nextPanel.defaultWidth || 300

      // Calculate new widths based on drag
      let newCurrentWidth = currentWidth + deltaX
      let newNextWidth = nextWidth - deltaX

      // Use configured panel minimum widths directly - no percentage constraints
      const panelMinWidth = panel.minWidth || 50
      const nextPanelMinWidth = nextPanel.minWidth || 50

      // Only enforce minimums to keep panels usable
      if (newCurrentWidth < panelMinWidth) {
        newCurrentWidth = panelMinWidth
        newNextWidth = (currentWidth + nextWidth) - newCurrentWidth
      }

      if (newNextWidth < nextPanelMinWidth) {
        newNextWidth = nextPanelMinWidth
        newCurrentWidth = (currentWidth + nextWidth) - newNextWidth
      }

      // Apply the new widths
      setWidths(prev => ({
        ...prev,
        [panel.id]: newCurrentWidth,
        [nextPanel.id]: newNextWidth
      }))
    }

    const handleMouseUp = () => {
      setIsDragging(null)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    const cleanup = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return cleanup
    }

    return cleanup
  }, [isDragging, startX, startWidths, panels.map(p => p?.id).join(','), setWidths])

  // Filter out null panels but keep track of all panel IDs for consistent ordering
  const visiblePanels = panels.filter(panel => panel && panel.id && panel.content !== null)

  if (visiblePanels.length === 0) {
    return null
  }

  return (
    <div ref={containerRef} className={cn("flex h-full", className)}>
      {visiblePanels.map((panel, index) => {
        const isLast = index === visiblePanels.length - 1
        // Use default width during SSR to prevent hydration mismatch
        const width = isMounted ? (widths[panel.id] || panel.defaultWidth || 300) : (panel.defaultWidth || 300)
        
        return (
          <div
            key={panel.id}
            className="flex"
            style={{
              width: isLast ? 'auto' : `${width}px`,
              flex: isLast ? '1 1 auto' : '0 0 auto',
              minWidth: isLast ? `${panel.minWidth || 50}px` : undefined
            }}
          >
            <div className="flex-1 overflow-hidden">
              {panel.content}
            </div>
            
            {!isLast && (
              <div
                className={cn(
                  "w-2 bg-gray-200 hover:bg-gray-300 cursor-col-resize transition-all duration-200 relative group flex items-center justify-center flex-shrink-0",
                  isDragging === panel.id && "bg-gray-400"
                )}
                onMouseDown={(e) => {
                  handleMouseDown(e, panel.id)
                }}
                title="Drag to resize"
                style={{
                  touchAction: 'none',
                  zIndex: 1000,
                  position: 'relative'
                }}
              >
                {/* Larger invisible hit area for easier dragging */}
                <div
                  className="absolute inset-0 -left-2 -right-2 cursor-col-resize"
                  style={{ zIndex: 1001 }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleMouseDown(e, panel.id)
                  }}
                />
                {/* Visual indicator */}
                <div className="w-1 h-4 bg-white rounded pointer-events-none opacity-60" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}