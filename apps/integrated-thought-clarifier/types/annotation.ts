// Types for the Interactive Documentation Layer system

export interface AnnotationMarker {
  id: string
  type: 'behavior' | 'boundary' | 'flow' | 'edge-case'
  title: string
  description: string
  specRef?: string // Reference to PRD section
  position?: { x: number; y: number } // For absolute positioning (0-100 percentage)
  targetSelector?: string // CSS selector for the target element
  highlight?: boolean // Whether to highlight the target element
  connectionTo?: string[] // IDs of related annotations for drawing lines
}

export interface BehaviorExample {
  id: string
  type: 'good' | 'bad' | 'reject'
  title: string
  description: string
  code?: string
  specRef?: string
}

export interface BoundaryMarker {
  id: string
  type: 'hard' | 'soft'
  title: string
  description: string
  severity: 'critical' | 'warning' | 'info'
  specRef?: string
}

export interface FlowStep {
  id: string
  stepNumber: number
  title: string
  description: string
  actions: string[]
  outcomes: string[]
  specRef?: string
}

export interface AnnotationLayer {
  id: string
  name: string
  visible: boolean
  opacity: number
  color: string
  markers: AnnotationMarker[]
}

export interface AnnotatedPrototypeConfig {
  basePrototype: string // The generated React component code
  layers: {
    behavior: {
      enabled: boolean
      examples: BehaviorExample[]
    }
    boundaries: {
      enabled: boolean
      markers: BoundaryMarker[]
    }
    flow: {
      enabled: boolean
      steps: FlowStep[]
    }
    edgeCases: {
      enabled: boolean
      cases: AnnotationMarker[]
    }
  }
  metadata: {
    prdHash: string // MD5 hash of PRD for change detection
    generatedAt: string
    modelUsed: string
    version: string
  }
}

export interface LayerControlsProps {
  layers: AnnotationLayer[]
  onToggleLayer: (layerId: string) => void
  onOpacityChange: (layerId: string, opacity: number) => void
  onColorChange: (layerId: string, color: string) => void
}