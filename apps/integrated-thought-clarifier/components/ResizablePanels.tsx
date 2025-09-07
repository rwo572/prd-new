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
      
      // Work with visible panels only
      const visiblePanels = panels.filter(p => p && p.content !== null)
      const panelIndex = visiblePanels.findIndex(p => p.id === isDragging)
      
      if (panelIndex === -1) return

      const panel = visiblePanels[panelIndex]
      const nextPanel = visiblePanels[panelIndex + 1]
      
      if (!nextPanel) return

      const currentWidth = startWidths[panel.id] || panel.defaultWidth || 300
      const nextWidth = startWidths[nextPanel.id] || nextPanel.defaultWidth || 300
      
      // Get container width
      const containerWidth = containerRef.current?.clientWidth || 1200
      
      // Calculate the total width available for these two panels
      const totalWidth = currentWidth + nextWidth
      
      // Calculate new widths based on drag
      let newCurrentWidth = currentWidth + deltaX
      let newNextWidth = nextWidth - deltaX
      
      
      // Special handling when resizing between preview and chat panels
      if ((panel.id === 'preview' && nextPanel.id === 'chat') || 
          (panel.id === 'chat' && nextPanel.id === 'preview')) {
        // Very minimal constraints to allow maximum flexibility
        const absoluteMinWidth = 150 // Absolute minimum for any panel to remain usable
        
        // Only apply absolute minimum constraints
        if (newCurrentWidth < absoluteMinWidth) {
          newCurrentWidth = absoluteMinWidth
          newNextWidth = totalWidth - newCurrentWidth
        }
        
        if (newNextWidth < absoluteMinWidth) {
          newNextWidth = absoluteMinWidth
          newCurrentWidth = totalWidth - newNextWidth
        }
      } else if (nextPanel.id === 'chat' || panel.id === 'chat') {
        // Chat with other panels (not preview) - use normal constraints
        const panelMinWidth = panel.minWidth || 200
        const panelMaxWidth = panel.maxWidth || containerWidth * 0.8
        const nextPanelMinWidth = nextPanel.minWidth || 200
        const nextPanelMaxWidth = nextPanel.maxWidth || containerWidth * 0.8
        
        // Apply constraints
        newCurrentWidth = Math.max(panelMinWidth, Math.min(panelMaxWidth, newCurrentWidth))
        newNextWidth = Math.max(nextPanelMinWidth, Math.min(nextPanelMaxWidth, newNextWidth))
        
        // Ensure total width is preserved
        const totalAfter = newCurrentWidth + newNextWidth
        const diff = totalWidth - totalAfter
        
        if (Math.abs(diff) > 0.1) {
          // Adjust to maintain total width
          if (newCurrentWidth === panelMinWidth) {
            newNextWidth = totalWidth - newCurrentWidth
          } else if (newNextWidth === nextPanelMinWidth) {
            newCurrentWidth = totalWidth - newNextWidth
          } else {
            // Distribute the difference proportionally
            const currentRatio = newCurrentWidth / totalAfter
            newCurrentWidth += diff * currentRatio
            newNextWidth = totalWidth - newCurrentWidth
          }
        }
      } else {
        // Normal resize for other panel combinations
        const panelMinWidth = panel.minWidth || 200
        const panelMaxWidth = panel.maxWidth || containerWidth * 0.8
        const nextPanelMinWidth = nextPanel.minWidth || 200
        const nextPanelMaxWidth = nextPanel.maxWidth || containerWidth * 0.8
        
        // Apply constraints
        newCurrentWidth = Math.max(panelMinWidth, Math.min(panelMaxWidth, newCurrentWidth))
        newNextWidth = Math.max(nextPanelMinWidth, Math.min(nextPanelMaxWidth, newNextWidth))
        
        // Ensure total width is preserved
        const totalAfter = newCurrentWidth + newNextWidth
        const diff = totalWidth - totalAfter
        
        if (Math.abs(diff) > 0.1) {
          // Adjust to maintain total width
          if (newCurrentWidth === panelMinWidth) {
            newNextWidth = totalWidth - newCurrentWidth
          } else if (newNextWidth === nextPanelMinWidth) {
            newCurrentWidth = totalWidth - newNextWidth
          } else {
            // Distribute the difference proportionally
            const currentRatio = newCurrentWidth / totalAfter
            newCurrentWidth += diff * currentRatio
            newNextWidth = totalWidth - newCurrentWidth
          }
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
                style={{ touchAction: 'none' }} // Prevent touch scrolling interference
              >
                {/* Resize handle visual indicator with larger hit area */}
                <div 
                  className="absolute inset-0 -left-2 -right-2 z-10" 
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    handleMouseDown(e, panel.id)
                  }}
                />
                {/* Grip dots */}
                <div className="flex flex-col gap-0.5 opacity-40 group-hover:opacity-70 transition-opacity pointer-events-none">
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