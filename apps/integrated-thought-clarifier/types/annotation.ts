export interface BehaviorExample {
  id: string
  type: 'good' | 'bad' | 'reject'
  title: string
  description: string
  specRef: string
}

export interface BoundaryMarker {
  id: string
  type: 'hard' | 'soft'
  title: string
  description: string
  severity: 'critical' | 'warning'
  specRef: string
}

export interface FlowStep {
  id: string
  stepNumber: number
  title: string
  description: string
  actions: string[]
  outcomes: string[]
  specRef: string
}

export interface AnnotationMarker {
  id: string
  type: string
  title: string
  description: string
  specRef: string
}