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
  ChevronDown,
  ChevronRight,
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
  const [showAnnotations, setShowAnnotations] = useState(false)
  const [annotationOpacity, setAnnotationOpacity] = useState(0.9)
  const [selectedAnnotation, setSelectedAnnotation] = useState<AnnotationMarker | null>(null)
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const prototypeRef = useRef<HTMLDivElement>(null)

  // Generate positions for markers
  const generatePosition = (index: number, total: number, type: string) => {
    const zones = {
      'behavior': { baseX: 15, baseY: 20, spread: 60 },
      'boundary': { baseX: 75, baseY: 15, spread: 40 },
      'flow': { baseX: 50, baseY: 50, spread: 70 },
      'edge-case': { baseX: 85, baseY: 70, spread: 30 }
    }
    const zone = zones[type as keyof typeof zones] || zones['behavior']
    
    const angle = (index / total) * Math.PI * 2
    const radius = zone.spread * (0.3 + (index % 3) * 0.2)
    
    return {
      x: zone.baseX + Math.cos(angle) * radius / 2,
      y: zone.baseY + Math.sin(angle) * radius / 2
    }
  }

  // Combine all layers into one with unified opacity
  const allMarkers: AnnotationMarker[] = [
    ...config.layers.behavior.examples.map((ex, idx) => ({
      id: ex.id,
      type: 'behavior' as const,
      title: ex.title,
      description: ex.description,
      specRef: ex.specRef,
      position: generatePosition(idx, config.layers.behavior.examples.length, 'behavior'),
      category: 'behavior',
      subType: ex.type
    })),
    ...config.layers.boundaries.markers.map((b, idx) => ({
      id: b.id,
      type: 'boundary' as const,
      title: b.title,
      description: b.description,
      specRef: b.specRef,
      position: generatePosition(idx, config.layers.boundaries.markers.length, 'boundary'),
      category: 'boundaries',
      severity: b.severity
    })),
    ...config.layers.flow.steps.map((s, idx, arr) => ({
      id: s.id,
      type: 'flow' as const,
      title: `Step ${s.stepNumber}: ${s.title}`,
      description: s.description,
      specRef: s.specRef,
      position: generatePosition(idx, arr.length, 'flow'),
      connectionTo: idx < arr.length - 1 ? [arr[idx + 1].id] : undefined,
      category: 'flow'
    })),
    ...config.layers.edgeCases.cases.map((c, idx) => ({
      ...c,
      position: c.position || generatePosition(idx, config.layers.edgeCases.cases.length, 'edge-case'),
      category: 'edgeCases'
    }))
  ]

  // Group markers by category
  const markersByCategory = {
    behavior: allMarkers.filter(m => m.category === 'behavior'),
    boundaries: allMarkers.filter(m => m.category === 'boundaries'),
    flow: allMarkers.filter(m => m.category === 'flow'),
    edgeCases: allMarkers.filter(m => m.category === 'edgeCases')
  }

  const categoryInfo = {
    behavior: { name: 'Behavior', icon: Activity, color: '#10B981' },
    boundaries: { name: 'Boundaries', icon: Shield, color: '#EF4444' },
    flow: { name: 'User Flow', icon: GitBranch, color: '#3B82F6' },
    edgeCases: { name: 'Edge Cases', icon: AlertTriangle, color: '#F59E0B' }
  }

  const layers: AnnotationLayer[] = showAnnotations ? [
    {
      id: 'all',
      name: 'All Annotations',
      visible: true,
      opacity: annotationOpacity,
      color: '#6B7280',
      markers: allMarkers
    }
  ] : []

  return (
    <div className="h-full relative overflow-hidden" ref={prototypeRef}>
      {/* Base Prototype */}
      <div className="h-full relative z-0">
        <BoltPrototype 
          code={code} 
          projectName={projectName}
          onRegenerate={onRegenerate}
          isRegenerating={isRegenerating}
          showAnnotations={showAnnotations}
          onToggleAnnotations={() => setShowAnnotations(!showAnnotations)}
        />
      </div>

      {/* Annotation Overlays */}
      {showAnnotations && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <AnnotationOverlay
            layers={layers}
            selectedAnnotation={selectedAnnotation}
            hoveredAnnotation={hoveredAnnotation}
            onAnnotationClick={setSelectedAnnotation}
            onAnnotationHover={setHoveredAnnotation}
            containerRef={prototypeRef}
          />
        </div>
      )}

      {/* Simplified Annotation Controls - positioned as a column */}
      {showAnnotations && (
        <div className="absolute top-16 left-2 w-64 max-h-[calc(100%-5rem)] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20">
          {/* Header */}
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Layers size={14} />
                Annotations
              </h4>
              <button
                onClick={() => setShowAnnotations(false)}
                className="text-gray-400 hover:text-gray-600 p-0.5"
              >
                <XCircle size={14} />
              </button>
            </div>
          </div>
          
          {/* Single Opacity Control */}
          <div className="px-3 py-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600">Opacity:</label>
              <input
                type="range"
                min="20"
                max="100"
                value={annotationOpacity * 100}
                onChange={(e) => setAnnotationOpacity(parseInt(e.target.value) / 100)}
                className="flex-1 h-1"
              />
              <span className="text-xs text-gray-600 w-10 text-right">
                {Math.round(annotationOpacity * 100)}%
              </span>
            </div>
          </div>
          
          {/* Annotation List */}
          <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
            {Object.entries(markersByCategory).map(([category, markers]) => {
              if (markers.length === 0) return null
              const info = categoryInfo[category as keyof typeof categoryInfo]
              const Icon = info.icon
              const isExpanded = expandedCategory === category
              
              return (
                <div key={category} className="border-b border-gray-100 last:border-0">
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : category)}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} style={{ color: info.color }} />
                      <span className="text-sm font-medium text-gray-700">{info.name}</span>
                      <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full text-gray-600">
                        {markers.length}
                      </span>
                    </div>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  
                  {isExpanded && (
                    <div className="px-3 pb-2 space-y-1">
                      {markers.map(marker => (
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
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-medium truncate">{marker.title}</div>
                          {marker.specRef && (
                            <div className="text-gray-500 flex items-center gap-1">
                              <Hash size={8} />
                              <span className="text-xs">{marker.specRef}</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Metadata Footer */}
          <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Generated:</span>
                <span>{new Date(config.metadata.generatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Annotation Detail Popup */}
      {selectedAnnotation && (
        <div className="absolute bottom-4 right-4 max-w-sm p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
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
  )
}