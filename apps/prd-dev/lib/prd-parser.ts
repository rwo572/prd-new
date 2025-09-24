// PRD Parser for extracting annotation data
import { BehaviorExample, BoundaryMarker, FlowStep, AnnotationMarker } from '@/types/annotation'
import crypto from 'crypto'

export class PRDParser {
  private content: string
  
  constructor(prdContent: string) {
    this.content = prdContent
  }
  
  // Generate hash for change detection
  getContentHash(): string {
    return crypto.createHash('md5').update(this.content).digest('hex')
  }
  
  // Extract behavioral examples from PRD
  extractBehaviorExamples(): BehaviorExample[] {
    const examples: BehaviorExample[] = []
    const sections = this.content.split(/#{2,3}\s+/)
    
    sections.forEach(section => {
      // Look for Good/Bad/Reject patterns
      const goodMatches = section.match(/Good(?:\s+example)?:?\s*\n([\s\S]*?)(?=\n(?:Bad|Reject|#{2,3}|$))/gi)
      const badMatches = section.match(/Bad(?:\s+example)?:?\s*\n([\s\S]*?)(?=\n(?:Good|Reject|#{2,3}|$))/gi)
      const rejectMatches = section.match(/Reject(?:\s+example)?:?\s*\n([\s\S]*?)(?=\n(?:Good|Bad|#{2,3}|$))/gi)
      
      if (goodMatches) {
        goodMatches.forEach((match, idx) => {
          examples.push({
            id: `behavior-good-${examples.length}`,
            type: 'good',
            title: `Good Example ${idx + 1}`,
            description: this.cleanText(match),
            specRef: this.findSectionRef(section)
          })
        })
      }
      
      if (badMatches) {
        badMatches.forEach((match, idx) => {
          examples.push({
            id: `behavior-bad-${examples.length}`,
            type: 'bad',
            title: `Bad Example ${idx + 1}`,
            description: this.cleanText(match),
            specRef: this.findSectionRef(section)
          })
        })
      }
      
      if (rejectMatches) {
        rejectMatches.forEach((match, idx) => {
          examples.push({
            id: `behavior-reject-${examples.length}`,
            type: 'reject',
            title: `Reject Example ${idx + 1}`,
            description: this.cleanText(match),
            specRef: this.findSectionRef(section)
          })
        })
      }
    })
    
    return examples
  }
  
  // Extract safety boundaries from PRD
  extractBoundaries(): BoundaryMarker[] {
    const boundaries: BoundaryMarker[] = []
    
    // Look for hard boundaries
    const hardBoundarySection = this.content.match(/Hard\s+Boundaries[\s\S]*?(?=\n#{2,3}|$)/i)
    if (hardBoundarySection) {
      const items = hardBoundarySection[0].match(/[-*]\s+(.+)/g)
      items?.forEach((item, idx) => {
        boundaries.push({
          id: `boundary-hard-${idx}`,
          type: 'hard',
          title: `Hard Boundary ${idx + 1}`,
          description: this.cleanText(item),
          severity: 'critical',
          specRef: 'hard-boundaries'
        })
      })
    }
    
    // Look for soft boundaries
    const softBoundarySection = this.content.match(/Soft\s+Boundaries[\s\S]*?(?=\n#{2,3}|$)/i)
    if (softBoundarySection) {
      const items = softBoundarySection[0].match(/[-*]\s+(.+)/g)
      items?.forEach((item, idx) => {
        boundaries.push({
          id: `boundary-soft-${idx}`,
          type: 'soft',
          title: `Soft Boundary ${idx + 1}`,
          description: this.cleanText(item),
          severity: 'warning',
          specRef: 'soft-boundaries'
        })
      })
    }
    
    return boundaries
  }
  
  // Extract user flow steps from PRD
  extractFlowSteps(): FlowStep[] {
    const steps: FlowStep[] = []
    
    // Look for numbered flow steps (common in PRDs)
    const flowSection = this.content.match(/(?:User\s+)?Flow[\s\S]*?(?=\n#{2,3}|$)/i)
    if (flowSection) {
      const stepMatches = flowSection[0].match(/\d+\.\s+(.+?)(?=\n\d+\.|$)/gs)
      stepMatches?.forEach((match, idx) => {
        const lines = match.split('\n').filter(l => l.trim())
        steps.push({
          id: `flow-step-${idx}`,
          stepNumber: idx + 1,
          title: lines[0].replace(/^\d+\.\s+/, ''),
          description: lines.slice(1).join(' '),
          actions: this.extractActions(match),
          outcomes: this.extractOutcomes(match),
          specRef: `flow-step-${idx + 1}`
        })
      })
    }
    
    // Also look for the 8-step process mentioned in the PRD
    const processSteps = [
      'Initiate', 'Contextualize', 'Specify', 'Elaborate',
      'Visualize', 'Refine', 'Validate', 'Converge'
    ]
    
    processSteps.forEach((step, idx) => {
      const stepSection = this.content.match(new RegExp(`${step}[:\\s]+([^\\n]+)`, 'i'))
      if (stepSection && !steps.find(s => s.title.includes(step))) {
        steps.push({
          id: `flow-process-${idx}`,
          stepNumber: idx + 1,
          title: step,
          description: stepSection[1],
          actions: [],
          outcomes: [],
          specRef: `process-${step.toLowerCase()}`
        })
      }
    })
    
    return steps
  }
  
  // Extract edge cases from PRD
  extractEdgeCases(): AnnotationMarker[] {
    const edgeCases: AnnotationMarker[] = []
    
    const edgeCaseSection = this.content.match(/Edge\s+Cases?[\s\S]*?(?=\n#{2,3}|$)/i)
    if (edgeCaseSection) {
      const items = edgeCaseSection[0].match(/[-*]\s+(.+)/g)
      items?.forEach((item, idx) => {
        edgeCases.push({
          id: `edge-case-${idx}`,
          type: 'edge-case',
          title: `Edge Case ${idx + 1}`,
          description: this.cleanText(item),
          specRef: `edge-case-${idx + 1}`
        })
      })
    }
    
    return edgeCases
  }
  
  // Helper methods
  private cleanText(text: string): string {
    return text
      .replace(/^[-*]\s+/, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  
  private findSectionRef(section: string): string {
    const titleMatch = section.match(/^([^\n]+)/)
    if (titleMatch) {
      return titleMatch[1].toLowerCase().replace(/\s+/g, '-')
    }
    return 'unknown'
  }
  
  private extractActions(text: string): string[] {
    const actions: string[] = []
    const actionMatches = text.match(/(?:action|do|perform|click|enter|select):\s*([^.!?\n]+)/gi)
    actionMatches?.forEach(match => {
      actions.push(this.cleanText(match))
    })
    return actions
  }
  
  private extractOutcomes(text: string): string[] {
    const outcomes: string[] = []
    const outcomeMatches = text.match(/(?:result|outcome|then|should|will):\s*([^.!?\n]+)/gi)
    outcomeMatches?.forEach(match => {
      outcomes.push(this.cleanText(match))
    })
    return outcomes
  }
}