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
      
      const newCurrentWidth = Math.max(
        panel.minWidth || 150,
        Math.min(panel.maxWidth || 800, currentWidth + deltaX)
      )
      
      const newNextWidth = Math.max(
        nextPanel.minWidth || 150,
        Math.min(nextPanel.maxWidth || 800, nextWidth - deltaX)
      )
      
      // Only update if both panels can accommodate the change
      const totalBefore = currentWidth + nextWidth
      const totalAfter = newCurrentWidth + newNextWidth
      
      if (Math.abs(totalBefore - totalAfter) < 1) {
        setWidths(prev => ({
          ...prev,
          [panel.id]: newCurrentWidth,
          [nextPanel.id]: newNextWidth
        }))
      }
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
        const width = widths[panel.id] || panel.defaultWidth || 300
        
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