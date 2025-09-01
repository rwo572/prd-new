'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Info, 
  AlertTriangle,
  XCircle,
  CheckCircle,
  Activity,
  Shield,
  GitBranch,
  Settings,
  ChevronRight,
  ChevronDown,
  Hash
} from 'lucide-react'
import { AnnotatedPrototypeConfig, AnnotationLayer, AnnotationMarker } from '@/types/annotation'
import BoltPrototype from './BoltPrototype'
import AnnotationOverlay from './AnnotationOverlay'

interface AnnotatedPrototypeProps {
  code: string
  projectName: string
  config: AnnotatedPrototypeConfig
  onRegenerate?: () => void
  isRegenerating?: boolean
}

export default function AnnotatedPrototype({ 
  code, 
  projectName, 
  config,
  onRegenerate,
  isRegenerating = false
}: AnnotatedPrototypeProps) {
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(['base', 'behavior', 'boundaries', 'flow', 'edgeCases']))
  const [layerOpacity, setLayerOpacity] = useState<Record<string, number>>({
    behavior: 0.9,
    boundaries: 0.9,
    flow: 0.9,
    edgeCases: 0.9
  })
  const [showControls, setShowControls] = useState(true)
  const [selectedAnnotation, setSelectedAnnotation] = useState<AnnotationMarker | null>(null)
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null)
  const prototypeRef = useRef<HTMLDivElement>(null)
  
  // Debug: Log the config to see what data we have
  useEffect(() => {
    console.log('AnnotatedPrototype config:', config)
    console.log('Behavior examples:', config.layers.behavior.examples)
    console.log('Boundaries:', config.layers.boundaries.markers)
    console.log('Flow steps:', config.layers.flow.steps)
    console.log('Edge cases:', config.layers.edgeCases.cases)
  }, [config])

  // Generate positions for markers based on their index and type
  const generatePosition = (index: number, total: number, type: string) => {
    const zones = {
      'behavior': { baseX: 15, baseY: 20, spread: 60 },
      'boundary': { baseX: 75, baseY: 15, spread: 40 },
      'flow': { baseX: 50, baseY: 50, spread: 70 },
      'edge-case': { baseX: 85, baseY: 70, spread: 30 }
    }
    const zone = zones[type as keyof typeof zones] || zones['behavior']
    
    // Create a spiral or grid pattern
    const angle = (index / total) * Math.PI * 2
    const radius = zone.spread * (0.3 + (index % 3) * 0.2)
    
    return {
      x: zone.baseX + Math.cos(angle) * radius / 2,
      y: zone.baseY + Math.sin(angle) * radius / 2
    }
  }

  // Layer definitions with generated positions
  const layers: AnnotationLayer[] = [
    {
      id: 'base',
      name: 'Base Prototype',
      visible: activeLayers.has('base'),
      opacity: 1,
      color: '#6B7280',
      markers: []
    },
    {
      id: 'behavior',
      name: 'Behavior Examples',
      visible: activeLayers.has('behavior'),
      opacity: layerOpacity.behavior,
      color: '#10B981',
      markers: config.layers.behavior.examples.map((ex, idx) => ({
        id: ex.id,
        type: 'behavior' as const,
        title: ex.title,
        description: ex.description,
        specRef: ex.specRef,
        position: generatePosition(idx, config.layers.behavior.examples.length, 'behavior'),
        highlight: ex.type === 'good'
      }))
    },
    {
      id: 'boundaries',
      name: 'Safety Boundaries',
      visible: activeLayers.has('boundaries'),
      opacity: layerOpacity.boundaries,
      color: '#EF4444',
      markers: config.layers.boundaries.markers.map((b, idx) => ({
        id: b.id,
        type: 'boundary' as const,
        title: b.title,
        description: b.description,
        specRef: b.specRef,
        position: generatePosition(idx, config.layers.boundaries.markers.length, 'boundary'),
        highlight: b.severity === 'critical'
      }))
    },
    {
      id: 'flow',
      name: 'User Flow',
      visible: activeLayers.has('flow'),
      opacity: layerOpacity.flow,
      color: '#3B82F6',
      markers: config.layers.flow.steps.map((s, idx, arr) => ({
        id: s.id,
        type: 'flow' as const,
        title: `Step ${s.stepNumber}: ${s.title}`,
        description: s.description,
        specRef: s.specRef,
        position: generatePosition(idx, arr.length, 'flow'),
        connectionTo: idx < arr.length - 1 ? [arr[idx + 1].id] : undefined
      }))
    },
    {
      id: 'edgeCases',
      name: 'Edge Cases',
      visible: activeLayers.has('edgeCases'),
      opacity: layerOpacity.edgeCases,
      color: '#F59E0B',
      markers: config.layers.edgeCases.cases.map((c, idx) => ({
        ...c,
        position: c.position || generatePosition(idx, config.layers.edgeCases.cases.length, 'edge-case')
      }))
    }
  ]

  const toggleLayer = (layerId: string) => {
    if (layerId === 'base') return // Base layer is always visible
    
    setActiveLayers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(layerId)) {
        newSet.delete(layerId)
      } else {
        newSet.add(layerId)
      }
      return newSet
    })
  }

  const getLayerIcon = (layerId: string) => {
    switch (layerId) {
      case 'base': return <Layers size={14} />
      case 'behavior': return <Activity size={14} />
      case 'boundaries': return <Shield size={14} />
      case 'flow': return <GitBranch size={14} />
      case 'edgeCases': return <AlertTriangle size={14} />
      default: return <Info size={14} />
    }
  }

  const getBehaviorIcon = (type: string) => {
    switch (type) {
      case 'good': return <CheckCircle size={16} className="text-green-500" />
      case 'bad': return <XCircle size={16} className="text-red-500" />
      case 'reject': return <AlertTriangle size={16} className="text-orange-500" />
      default: return <Info size={16} className="text-blue-500" />
    }
  }

  return (
    <div className="h-full flex">
      {/* Layer Controls Sidebar */}
      {showControls && (
        <div className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <Layers size={16} />
                Annotation Layers
              </h3>
              <button
                onClick={() => setShowControls(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Layer List */}
          <div className="p-4 space-y-3">
            {layers.map(layer => (
              <div key={layer.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleLayer(layer.id)}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                      layer.visible ? 'text-gray-900' : 'text-gray-400'
                    }`}
                    disabled={layer.id === 'base'}
                  >
                    {getLayerIcon(layer.id)}
                    <span>{layer.name}</span>
                    {layer.markers.length > 0 && (
                      <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">
                        {layer.markers.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => toggleLayer(layer.id)}
                    className="p-1"
                    disabled={layer.id === 'base'}
                  >
                    {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>

                {/* Layer Markers */}
                {layer.visible && layer.markers.length > 0 && (
                  <div className="ml-6 space-y-1">
                    {layer.markers.map(marker => (
                      <button
                        key={marker.id}
                        onClick={() => setSelectedAnnotation(marker)}
                        onMouseEnter={() => setHoveredAnnotation(marker.id)}
                        onMouseLeave={() => setHoveredAnnotation(null)}
                        className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                          selectedAnnotation?.id === marker.id
                            ? 'bg-purple-100 text-purple-700'
                            : hoveredAnnotation === marker.id
                            ? 'bg-gray-100'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start gap-1">
                          {layer.id === 'behavior' && getBehaviorIcon(
                            config.layers.behavior.examples.find(e => e.id === marker.id)?.type || ''
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{marker.title}</div>
                            {marker.specRef && (
                              <div className="text-gray-500 flex items-center gap-1 mt-0.5">
                                <Hash size={10} />
                                <span>{marker.specRef}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Opacity Control for non-base layers */}
                {layer.id !== 'base' && layer.visible && (
                  <div className="ml-6 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Opacity:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={layerOpacity[layer.id] * 100}
                      onChange={(e) => setLayerOpacity({
                        ...layerOpacity,
                        [layer.id]: parseInt(e.target.value) / 100
                      })}
                      className="flex-1 h-1"
                    />
                    <span className="text-xs text-gray-500 w-8">
                      {Math.round(layerOpacity[layer.id] * 100)}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Metadata */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-center justify-between">
                <span>Generated:</span>
                <span>{new Date(config.metadata.generatedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Model:</span>
                <span>{config.metadata.modelUsed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>PRD Hash:</span>
                <span className="font-mono">{config.metadata.prdHash.substring(0, 8)}...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prototype with Annotations */}
      <div className="flex-1 relative overflow-hidden" ref={prototypeRef}>
        {/* Base Prototype with integrated controls */}
        <div className="h-full relative z-0">
          <BoltPrototype 
            code={code} 
            projectName={projectName}
            onRegenerate={onRegenerate}
            isRegenerating={isRegenerating}
            showAnnotations={showControls}
            onToggleAnnotations={() => setShowControls(!showControls)}
          />
        </div>

        {/* Annotation Overlays - positioned absolutely over the prototype */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <AnnotationOverlay
            layers={layers.filter(l => l.id !== 'base')}
            selectedAnnotation={selectedAnnotation}
            hoveredAnnotation={hoveredAnnotation}
            onAnnotationClick={setSelectedAnnotation}
            onAnnotationHover={setHoveredAnnotation}
            containerRef={prototypeRef}
          />
        </div>

        {/* Selected Annotation Detail */}
        {selectedAnnotation && (
          <div className="absolute bottom-4 right-4 max-w-sm p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-sm">{selectedAnnotation.title}</h4>
              <button
                onClick={() => setSelectedAnnotation(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-600">{selectedAnnotation.description}</p>
            {selectedAnnotation.specRef && (
              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                <Hash size={10} />
                <span>PRD Reference: {selectedAnnotation.specRef}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}