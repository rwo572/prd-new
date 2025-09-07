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
      
      // Get container width
      const containerWidth = containerRef.current?.clientWidth || 1200
      
      // Calculate the total width available for these two panels
      const totalWidth = currentWidth + nextWidth
      
      // Calculate new widths based on drag
      let newCurrentWidth = currentWidth + deltaX
      let newNextWidth = nextWidth - deltaX
      
      // Special handling when resizing with chat panel
      if (nextPanel.id === 'chat' || panel.id === 'chat') {
        // Chat panel should be resizable between 40-60% of container
        const minChatPercent = 0.4
        const maxChatPercent = 0.6
        
        if (nextPanel.id === 'chat') {
          // Resizing the preview panel (dragging the bar affects chat size)
          // Calculate what percentage the chat panel would be
          const chatPercent = newNextWidth / containerWidth
          
          // Allow chat to be between 40-60% of container
          if (chatPercent < minChatPercent) {
            // Chat is too small, set it to minimum
            newNextWidth = containerWidth * minChatPercent
            newCurrentWidth = totalWidth - newNextWidth
          } else if (chatPercent > maxChatPercent) {
            // Chat is too large, set it to maximum
            newNextWidth = containerWidth * maxChatPercent
            newCurrentWidth = totalWidth - newNextWidth
          }
          
          // Don't let the preview panel get too small
          const minPreviewWidth = 200
          if (newCurrentWidth < minPreviewWidth) {
            newCurrentWidth = minPreviewWidth
            newNextWidth = totalWidth - newCurrentWidth
          }
        } else if (panel.id === 'chat') {
          // Resizing chat from its right edge (if there's a panel after it)
          const chatPercent = newCurrentWidth / containerWidth
          
          if (chatPercent < minChatPercent) {
            newCurrentWidth = containerWidth * minChatPercent
            newNextWidth = totalWidth - newCurrentWidth
          } else if (chatPercent > maxChatPercent) {
            newCurrentWidth = containerWidth * maxChatPercent
            newNextWidth = totalWidth - newCurrentWidth
          }
          
          // Don't let the panel after chat get too small
          if (newNextWidth < 200) {
            newNextWidth = 200
            newCurrentWidth = totalWidth - newNextWidth
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