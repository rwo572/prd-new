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
  }, [panels.map(p => p?.id).join(',')]) // Only re-run when panel IDs change

  const handleMouseDown = (e: React.MouseEvent, panelId: string) => {
    e.preventDefault()
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
      
      // Work with visible panels only
      const visiblePanels = panels.filter(p => p && p.content !== null)
      const panelIndex = visiblePanels.findIndex(p => p.id === isDragging)
      
      if (panelIndex === -1) return

      const panel = visiblePanels[panelIndex]
      const nextPanel = visiblePanels[panelIndex + 1]
      
      if (!nextPanel) return

      const currentWidth = startWidths[panel.id] || panel.defaultWidth || 300
      const nextWidth = startWidths[nextPanel.id] || nextPanel.defaultWidth || 300
      
      // Calculate the total width available for these two panels
      const totalWidth = currentWidth + nextWidth
      
      // Get container width to calculate flexible minimum widths
      const containerWidth = containerRef.current?.clientWidth || 1200
      
      // Special case: if resizing between preview and chat panels, ensure chat gets at least 40%
      const isPreviewToChatResize = panel.id === 'preview' && nextPanel.id === 'chat'
      
      // Use panel-specific minWidth with special handling for preview-chat resize
      let panelMinWidth = panel.minWidth || 200
      let panelMaxWidth = panel.maxWidth || containerWidth * 0.8
      
      let nextPanelMinWidth = nextPanel.minWidth || 200
      let nextPanelMaxWidth = nextPanel.maxWidth || containerWidth * 0.8
      
      // Special handling for preview-chat resize
      if (isPreviewToChatResize) {
        // Chat should be at least 40% of the total width of preview + chat
        // Preview can be between 0% and 60% of total
        panelMinWidth = 0
        panelMaxWidth = totalWidth * 0.6
        // Chat can be between 40% and 100% of total
        nextPanelMinWidth = totalWidth * 0.4
        nextPanelMaxWidth = totalWidth
      }
      
      // Calculate new widths with constraints
      let newCurrentWidth = Math.max(
        panelMinWidth,
        Math.min(panelMaxWidth, currentWidth + deltaX)
      )
      
      let newNextWidth = Math.max(
        nextPanelMinWidth,
        Math.min(nextPanelMaxWidth, nextWidth - deltaX)
      )
      
      // Ensure total width is preserved
      const totalBefore = currentWidth + nextWidth
      
      // For preview-chat resize, simply ensure the total is preserved
      if (isPreviewToChatResize) {
        // Adjust next panel width to maintain total
        newNextWidth = totalBefore - newCurrentWidth
        
        // Ensure chat panel respects its minimum
        if (newNextWidth < nextPanelMinWidth) {
          newNextWidth = nextPanelMinWidth
          newCurrentWidth = totalBefore - newNextWidth
        }
      } else {
        // For other panel combinations, use the original logic
        const totalAfter = newCurrentWidth + newNextWidth
        const diff = totalBefore - totalAfter
        
        if (Math.abs(diff) > 0.1) {
          // Distribute the difference proportionally
          const currentRatio = newCurrentWidth / (newCurrentWidth + newNextWidth)
          const adjustment = diff * currentRatio
          
          newCurrentWidth = Math.max(panelMinWidth, Math.min(panelMaxWidth, newCurrentWidth + adjustment))
          newNextWidth = totalBefore - newCurrentWidth
          
          // Final constraint check for next panel
          newNextWidth = Math.max(nextPanelMinWidth, Math.min(nextPanelMaxWidth, newNextWidth))
          newCurrentWidth = totalBefore - newNextWidth
        }
      }
      
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

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, startX, startWidths, panels])

  // Filter out null panels but keep track of all panel IDs for consistent ordering
  const visiblePanels = panels.filter(panel => panel && panel.content !== null)

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
              flex: isLast ? '1 1 auto' : '0 0 auto'
            }}
          >
            <div className="flex-1 overflow-hidden">
              {panel.content}
            </div>
            
            {!isLast && (
              <div
                className={cn(
                  "w-3 bg-slate-200 hover:bg-indigo-400 cursor-col-resize transition-all duration-200 relative group flex items-center justify-center flex-shrink-0",
                  isDragging === panel.id && "bg-indigo-500"
                )}
                onMouseDown={(e) => handleMouseDown(e, panel.id)}
                title="Drag to resize"
              >
                {/* Resize handle visual indicator with larger hit area */}
                <div className="absolute inset-0 -left-2 -right-2 z-10" />
                {/* Grip dots */}
                <div className="flex flex-col gap-0.5 opacity-40 group-hover:opacity-70 transition-opacity">
                  <div className="w-1 h-1 bg-slate-600 rounded-full" />
                  <div className="w-1 h-1 bg-slate-600 rounded-full" />
                  <div className="w-1 h-1 bg-slate-600 rounded-full" />
                  <div className="w-1 h-1 bg-slate-600 rounded-full" />
                  <div className="w-1 h-1 bg-slate-600 rounded-full" />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}