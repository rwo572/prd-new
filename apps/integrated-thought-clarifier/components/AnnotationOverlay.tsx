'use client'

import { useEffect, useRef, useState } from 'react'
import { 
  Activity, 
  Shield, 
  GitBranch, 
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react'
import { AnnotationMarker, AnnotationLayer } from '@/types/annotation'

interface AnnotationOverlayProps {
  layers: AnnotationLayer[]
  selectedAnnotation: AnnotationMarker | null
  hoveredAnnotation: string | null
  onAnnotationClick: (marker: AnnotationMarker) => void
  onAnnotationHover: (markerId: string | null) => void
  containerRef: React.RefObject<HTMLDivElement>
}

interface MarkerPosition {
  x: number
  y: number
  id: string
}

export default function AnnotationOverlay({
  layers,
  selectedAnnotation,
  hoveredAnnotation,
  onAnnotationClick,
  onAnnotationHover,
  containerRef
}: AnnotationOverlayProps) {
  const [markerPositions, setMarkerPositions] = useState<MarkerPosition[]>([])
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerSize({ width: rect.width, height: rect.height })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [containerRef])

  // Calculate marker positions
  useEffect(() => {
    const positions: MarkerPosition[] = []
    
    layers.forEach(layer => {
      if (!layer.visible) return
      
      layer.markers.forEach((marker, index) => {
        // Use provided position or calculate automatic position
        const position = marker.position || calculateAutoPosition(marker.type, index, layer.markers.length)
        positions.push({
          x: (position.x / 100) * containerSize.width,
          y: (position.y / 100) * containerSize.height,
          id: marker.id
        })
      })
    })
    
    setMarkerPositions(positions)
  }, [layers, containerSize])

  // Draw connection lines
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Set canvas size
    canvas.width = containerSize.width
    canvas.height = containerSize.height

    // Draw connections
    layers.forEach(layer => {
      if (!layer.visible) return
      
      layer.markers.forEach(marker => {
        if (!marker.connectionTo) return
        
        const fromPos = markerPositions.find(p => p.id === marker.id)
        if (!fromPos) return
        
        marker.connectionTo.forEach(toId => {
          const toPos = markerPositions.find(p => p.id === toId)
          if (!toPos) return
          
          // Draw curved connection line
          ctx.beginPath()
          ctx.strokeStyle = `${layer.color}40` // Semi-transparent
          ctx.lineWidth = 2
          ctx.setLineDash([5, 5])
          
          const cp1x = fromPos.x + (toPos.x - fromPos.x) / 3
          const cp1y = fromPos.y - 30
          const cp2x = fromPos.x + (toPos.x - fromPos.x) * 2 / 3
          const cp2y = toPos.y - 30
          
          ctx.moveTo(fromPos.x, fromPos.y)
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, toPos.x, toPos.y)
          ctx.stroke()
          
          // Draw arrow
          const angle = Math.atan2(toPos.y - cp2y, toPos.x - cp2x)
          ctx.beginPath()
          ctx.moveTo(toPos.x, toPos.y)
          ctx.lineTo(
            toPos.x - 10 * Math.cos(angle - Math.PI / 6),
            toPos.y - 10 * Math.sin(angle - Math.PI / 6)
          )
          ctx.moveTo(toPos.x, toPos.y)
          ctx.lineTo(
            toPos.x - 10 * Math.cos(angle + Math.PI / 6),
            toPos.y - 10 * Math.sin(angle + Math.PI / 6)
          )
          ctx.stroke()
          ctx.setLineDash([])
        })
      })
    })
  }, [layers, markerPositions, containerSize])

  const calculateAutoPosition = (type: string, index: number, total: number): { x: number; y: number } => {
    // Distribute markers in a grid pattern based on type
    const zones = {
      'behavior': { x: 20, y: 20, width: 30, height: 60 },
      'boundary': { x: 60, y: 10, width: 30, height: 30 },
      'flow': { x: 30, y: 40, width: 40, height: 40 },
      'edge-case': { x: 70, y: 60, width: 25, height: 30 }
    }
    
    const zone = zones[type as keyof typeof zones] || zones['behavior']
    const cols = Math.ceil(Math.sqrt(total))
    const row = Math.floor(index / cols)
    const col = index % cols
    
    return {
      x: zone.x + (col * zone.width / cols),
      y: zone.y + (row * zone.height / Math.ceil(total / cols))
    }
  }

  const getMarkerIcon = (type: string, subType?: string) => {
    switch (type) {
      case 'behavior':
        if (subType === 'good') return <CheckCircle size={16} className="text-green-500" />
        if (subType === 'bad') return <XCircle size={16} className="text-red-500" />
        if (subType === 'reject') return <AlertTriangle size={16} className="text-orange-500" />
        return <Activity size={16} />
      case 'boundary':
        return <Shield size={16} />
      case 'flow':
        return <GitBranch size={16} />
      case 'edge-case':
        return <AlertTriangle size={16} />
      default:
        return <Info size={16} />
    }
  }

  const getMarkerColor = (layer: AnnotationLayer, marker: AnnotationMarker) => {
    const isSelected = selectedAnnotation?.id === marker.id
    const isHovered = hoveredAnnotation === marker.id
    
    if (isSelected) return '#7C3AED' // Purple
    if (isHovered) return layer.color
    return `${layer.color}CC` // Slightly transparent
  }

  return (
    <>
      {/* Connection lines canvas */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />
      
      {/* Annotation markers */}
      {layers.map(layer => {
        if (!layer.visible) return null
        
        return layer.markers.map(marker => {
          const position = markerPositions.find(p => p.id === marker.id)
          if (!position) return null
          
          const color = getMarkerColor(layer, marker)
          const isActive = selectedAnnotation?.id === marker.id || hoveredAnnotation === marker.id
          
          return (
            <div
              key={marker.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
              style={{
                left: position.x,
                top: position.y,
                opacity: layer.opacity,
                zIndex: isActive ? 20 : 10
              }}
            >
              {/* Pulse animation for selected marker */}
              {selectedAnnotation?.id === marker.id && (
                <div 
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{ backgroundColor: color, opacity: 0.3 }}
                />
              )}
              
              {/* Marker button */}
              <button
                onClick={() => onAnnotationClick(marker)}
                onMouseEnter={() => onAnnotationHover(marker.id)}
                onMouseLeave={() => onAnnotationHover(null)}
                className={`
                  relative flex items-center justify-center
                  w-8 h-8 rounded-full shadow-lg
                  transform transition-all duration-200 pointer-events-auto
                  ${isActive ? 'scale-125' : 'scale-100 hover:scale-110'}
                `}
                style={{
                  backgroundColor: color,
                  borderColor: 'white',
                  borderWidth: '2px'
                }}
              >
                <div className="text-white">
                  {getMarkerIcon(marker.type)}
                </div>
                
                {/* Marker number for flow steps */}
                {marker.type === 'flow' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold" style={{ color }}>
                      {layer.markers.indexOf(marker) + 1}
                    </span>
                  </div>
                )}
              </button>
              
              {/* Tooltip on hover */}
              {hoveredAnnotation === marker.id && (
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-30">
                  <div className="bg-gray-900 text-white text-xs rounded-lg py-1 px-2 whitespace-nowrap max-w-xs">
                    <div className="font-semibold">{marker.title}</div>
                    {marker.specRef && (
                      <div className="text-gray-300 text-xs">#{marker.specRef}</div>
                    )}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                  </div>
                </div>
              )}
              
              {/* Highlight indicator */}
              {marker.highlight && marker.targetSelector && (
                <div 
                  className="absolute w-16 h-16 rounded-full pointer-events-none animate-pulse"
                  style={{
                    backgroundColor: `${color}20`,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                />
              )}
            </div>
          )
        })
      })}
    </>
  )
}