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
      if (!(panel.id in newWidths)) {
        newWidths[panel.id] = panel.defaultWidth || 300
        hasChanges = true
      }
    })
    
    if (hasChanges) {
      setWidths(newWidths)
    }
  }, [panels])

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
      const panelIndex = panels.findIndex(p => p.id === isDragging)
      
      if (panelIndex === -1) return

      const panel = panels[panelIndex]
      const nextPanel = panels[panelIndex + 1]
      
      if (!nextPanel) return

      const currentWidth = startWidths[panel.id] || panel.defaultWidth || 300
      const nextWidth = startWidths[nextPanel.id] || nextPanel.defaultWidth || 300
      
      // Get container width to calculate flexible minimum widths
      const containerWidth = containerRef.current?.clientWidth || 1200
      
      // Use panel-specific minWidth or 25% of container (whichever is smaller for flexibility)
      const panelMinWidth = Math.min(panel.minWidth || 200, containerWidth * 0.25)
      const panelMaxWidth = Math.min(panel.maxWidth || containerWidth * 0.8, containerWidth * 0.8)
      
      const nextPanelMinWidth = Math.min(nextPanel.minWidth || 200, containerWidth * 0.25)
      const nextPanelMaxWidth = Math.min(nextPanel.maxWidth || containerWidth * 0.8, containerWidth * 0.8)
      
      // Calculate new widths with constraints
      let newCurrentWidth = Math.max(
        panelMinWidth,
        Math.min(panelMaxWidth, currentWidth + deltaX)
      )
      
      let newNextWidth = Math.max(
        nextPanelMinWidth,
        Math.min(nextPanelMaxWidth, nextWidth - deltaX)
      )
      
      // Ensure total width is preserved - adjust if constraints changed the total
      const totalBefore = currentWidth + nextWidth
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

  const visiblePanels = panels.filter(panel => panel.content !== null)

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
                  "w-1 bg-gray-200 hover:bg-purple-400 cursor-col-resize transition-colors relative",
                  isDragging === panel.id && "bg-purple-500"
                )}
                onMouseDown={(e) => handleMouseDown(e, panel.id)}
              >
                <div className="absolute inset-0 -left-1 -right-1 z-10" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}