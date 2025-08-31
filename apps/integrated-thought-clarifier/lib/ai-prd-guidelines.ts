// AI PRD Guidelines Reference System
// This module loads and applies the AI PRD guidelines from /docs/specifications/ai_prd_guidelines/

export interface AIGuideline {
  section: string
  requirements: string[]
  questions: string[]
}

// Core sections from the AI PRD Master Template
export const AI_PRD_SECTIONS = [
  'Behavioral Contract Definition',
  'Contextual Behavioral Rules', 
  'Safety Rules',
  'Edge Case Handling',
  'Quality Standards',
  'Performance Boundaries',
  'Implementation Checklist'
] as const

// Product stage determines everything else
export type ProductStage = '0-to-1' | '1-to-n' | 'n-to-x'

// Start with the most important question
export const STAGE_QUESTION = "What stage is your product at? Are you creating something new (0→1), scaling an existing product (1→n), or optimizing a mature product (n^x)?"

// Scope narrowing questions based on stage
export const SCOPE_QUESTIONS = {
  stage: {
    '0-to-1': [
      "What core problem are you solving that hasn't been solved before?",
      "Who is your beachhead customer segment?",
      "What's your riskiest assumption to validate?",
      "How will you know if you've achieved product-market fit?"
    ],
    '1-to-n': [
      "What's currently working that you want to scale?",
      "What are your growth bottlenecks?",
      "Which customer segments are you expanding to?",
      "What's your target growth rate?"
    ],
    'n-to-x': [
      "What optimization metric are you targeting?",
      "Where are you seeing diminishing returns?",
      "What's your competitive differentiation?",
      "How much improvement is meaningful?"
    ]
  },
  initial: [
    "What specific AI capability are you building? (Generation, Classification, Recommendation, Analysis)",
    "Who is the end user and what's their technical sophistication?",
    "What's the primary success metric? (Accuracy, Speed, Cost, User Satisfaction)"
  ],
  behavioral: [
    "What tone should the AI maintain? (Professional, Friendly, Technical, Casual)",
    "What are the hard boundaries it should never cross?",
    "How should it handle ambiguous requests?"
  ],
  safety: [
    "What sensitive data will it handle?",
    "What are the consequences of incorrect outputs?",
    "Are there regulatory/compliance requirements?"
  ],
  technical: [
    "What's your latency requirement? (<1s, <5s, <30s)",
    "What's your accuracy target? (>90%, >95%, >99%)",
    "What's your budget per request? (<$0.01, <$0.10, <$1.00)"
  ]
}

// Generate stage-specific PRD structure
export function generateAIGuidedPRD({
  productName,
  productStage,
  aiCapability,
  targetUser,
  successMetric,
  coreProblem
}: {
  productName: string
  productStage?: ProductStage
  aiCapability?: string
  targetUser?: string
  successMetric?: string
  coreProblem?: string
}): string {
  const stage = productStage || '0-to-1'
  
  // Stage-specific PRD templates
  if (stage === '0-to-1') {
    return generate0to1PRD({ productName, aiCapability, targetUser, coreProblem })
  } else if (stage === '1-to-n') {
    return generate1toNPRD({ productName, aiCapability, targetUser, successMetric })
  } else {
    return generateNtoXPRD({ productName, aiCapability, targetUser, successMetric })
  }
}

// 0→1: Discovery & Validation PRD (Following AI PRD Master Template)
function generate0to1PRD({ productName, aiCapability, targetUser, coreProblem }: any): string {
  return `# ${productName} - 0→1 Discovery PRD

## 1. Executive Summary
**Vision**: Building a ${aiCapability ? `${aiCapability} AI` : 'solution'} that ${coreProblem || 'solves an unmet need'} for ${targetUser || 'early adopters'}.

**Opportunity**: Validate product-market fit through rapid experimentation with minimal investment.

**Success Criteria**: 
- 10+ users complete core workflow
- 40% report they'd be "very disappointed" without it
- 3+ users willing to pre-order/pay

## 2. Problem Definition

### Core Problem
${coreProblem || '**[To be validated]** Users struggle with manual processes that could be automated intelligently.'}

### Evidence & Impact
- **Quantitative**: [Gather data on time/cost impact]
- **Qualitative**: [User interview insights]
- **Market Signal**: Technology enablers newly available

### Riskiest Assumptions
1. **Problem exists**: Users experience sufficient pain
2. **Solution fit**: Our approach meaningfully addresses it
3. **Willingness to pay**: Value exceeds cost threshold

## 3. Solution Design

### Why AI?
- Human approaches are too slow/expensive
- Pattern recognition enables new capabilities
- Competitive advantage through automation

### MVP Scope (4 weeks)
| Phase | Focus | Success Metric |
|-------|-------|----------------|
| Week 1-2 | Core POC | Technical feasibility proven |
| Week 3 | User testing | 5/10 complete workflow |
| Week 4 | Iteration | Incorporate feedback |

### Out of Scope (v1)
- Advanced features
- Multiple integrations
- Full automation
- Team features

## 4. Behavioral Contract${aiCapability ? `

### Core Personality
- **Tone**: Helpful, clear, humble about limitations
- **Expertise**: Acknowledges beta status
- **Boundaries**: Clear about what it can't do

### Behavioral Examples (MVP)
| Scenario | Good Response | Bad Response |
|----------|--------------|--------------|
| Ambiguous input | "Could you clarify X?" | Making assumptions |
| Edge case | "I'm not sure, let me escalate" | Incorrect guess |
| Success case | Clear, actionable output | Over-promising |` : ''}

## 5. Safety & Ethics

### MVP Safety Rules
- **Hard Boundaries**: No sensitive data processing
- **Human-in-Loop**: Required for critical decisions
- **Transparency**: Clear "beta" labeling
- **Data**: Local storage only, no persistence

## 6. Success Metrics

### North Star Metric
**User Activation Rate**: % completing core workflow

### Supporting Metrics
- Time to first value: <5 minutes
- Task completion: >60%
- User satisfaction: >7/10
- Technical reliability: >95% uptime

## 7. Edge Cases & Error Handling

### Known Edge Cases
| Case | Detection | Response |
|------|-----------|----------|
| Invalid input | Validation | Clear error message |
| System overload | Rate limiting | Queue or defer |
| Ambiguous request | Low confidence | Ask clarification |

## 8. Implementation Plan

### Technical Approach
- **Stack**: Next.js + PostgreSQL
- **AI**: OpenAI/Anthropic APIs
- **Hosting**: Vercel for rapid iteration
- **Monitoring**: Basic analytics only

### Development Phases
1. **Core Build** (Week 1-2)
2. **User Testing** (Week 3)
3. **Iteration** (Week 4)
4. **Go/No-Go Decision**

## 9. Validation Strategy

### Experiment Design
| Week | Hypothesis | Method | Success Criteria |
|------|------------|--------|------------------|
| 1 | Problem exists | Interviews | 7/10 confirm |
| 2 | Solution works | Prototype | 5/10 complete |
| 3 | Will pay | Pricing test | 3+ commit |

### Learning Goals
1. Problem-solution fit
2. Minimum feature set
3. Pricing sensitivity
4. Technical feasibility

## 10. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| No product-market fit | Medium | High | Fast pivots |
| Technical complexity | Low | Medium | Use proven APIs |
| User adoption | Medium | High | Direct outreach |

## 11. Resource Requirements

### Team
- 1 Engineer (full-time)
- 1 Designer (part-time)
- 10 Beta users

### Budget
- Infrastructure: $500
- APIs: $500
- Total: $1,000

## 12. Kill Criteria

**Stop if by Week 4**:
- <30% users see value
- Core assumption disproven
- Technical approach not viable
- No path to differentiation

## 13. Next Actions

1. **Today**: Interview 5 potential users
2. **Tomorrow**: Create clickable prototype
3. **Day 3**: Technical spike on core feature
4. **Week 1 End**: Go/No-Go checkpoint

---
*References: /docs/specifications/ai_prd_guidelines/opportunity-assessment-0to1.md*`
}

// 1→n: Scaling & Growth PRD
function generate1toNPRD({ productName, aiCapability, targetUser, successMetric }: any): string {
  return `# ${productName} - 1→n PRD

## 📈 Scaling Vision
Expanding our proven ${aiCapability ? `${aiCapability} AI` : 'solution'} from early adopters to ${targetUser || 'broader market'}.

## What's Working (Don't Break)

### Proven Value Props
- Core feature that users love
- Key workflow that drives retention
- Pricing model that converts

### Current Metrics
- 100 active users
- 60% monthly retention
- $10K MRR
- NPS: 45

## Growth Strategy

### Expansion Vectors
1. **Geographic**: Same product, new markets
2. **Segment**: Adjacent customer types
3. **Use Case**: New problems, same users
4. **Platform**: Web → Mobile → API

### Target Metrics (6 months)
- Users: 100 → 10,000
- MRR: $10K → $500K
- Retention: 60% → 75%
- CAC Payback: <6 months

## Feature Roadmap

### Phase 1: Core Scaling (Months 1-2)
- Performance optimization for 100x load
- Self-service onboarding
- Basic analytics dashboard
- Payment processing at scale

### Phase 2: Growth Features (Months 3-4)
- Team collaboration
- API access
- Advanced integrations
- Mobile app

### Phase 3: Retention (Months 5-6)
- Power user features
- Customization options
- Advanced AI capabilities
- Enterprise security

## AI Scaling Considerations

### Performance at Scale
- Response time <2s at p95
- 99.9% uptime SLA
- Graceful degradation
- Cost per request <$0.05

### Quality Maintenance
- Monitoring for drift
- A/B testing framework
- Feedback loops
- Regular retraining

## Infrastructure Evolution

### Technical Debt to Address
- Database optimization
- Caching layer
- Queue system
- Monitoring/alerting

### Scale Requirements
- 10,000 concurrent users
- 1M API calls/day
- 100GB data storage
- Global CDN

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Quality degradation | High | Staged rollouts |
| Infrastructure failure | High | Multi-region deployment |
| Competitor response | Medium | Fast feature velocity |
| Regulatory changes | Medium | Compliance framework |

## Success Metrics

### North Star
Weekly Active Users (WAU)

### Supporting Metrics
- Activation rate: >50%
- Week 1 retention: >70%
- Referral rate: >20%
- Support tickets: <5% of users

## Investment Required
- 5 engineers
- 1 designer
- 1 PM
- $50K/month infrastructure
- $20K/month AI costs

## Next Milestones
1. **Month 1**: Scale to 1,000 users
2. **Month 3**: Launch mobile app
3. **Month 6**: Series A metrics`
}

// n→x: Optimization & Differentiation PRD
function generateNtoXPRD({ productName, aiCapability, targetUser, successMetric }: any): string {
  return `# ${productName} - n^x PRD

## 🚀 Optimization Vision
Transform our mature ${aiCapability ? `${aiCapability} AI` : 'product'} into the category-defining solution for ${targetUser || 'enterprise customers'}.

## Current State

### Market Position
- 10,000+ active users
- $2M ARR
- #3 in market share
- Strong brand recognition

### Optimization Targets
- Efficiency: ${successMetric === 'Cost' ? 'Reduce cost by 50%' : 'Improve speed by 10x'}
- Quality: ${successMetric === 'Accuracy' ? 'Achieve 99.9% accuracy' : 'Reduce errors by 90%'}
- Scale: Handle enterprise workloads
- Differentiation: Unique capabilities competitors can't match

## Strategic Initiatives

### Initiative 1: AI Model Optimization
**Goal**: Industry-leading performance
- Custom model fine-tuning
- Edge deployment capabilities
- Real-time personalization
- Explainable AI features

### Initiative 2: Enterprise Platform
**Goal**: Become the default choice
- SSO/SAML integration
- Advanced permissions
- Audit logging
- SLA guarantees

### Initiative 3: Ecosystem Development
**Goal**: Create moat via integrations
- Developer API/SDK
- Marketplace for extensions
- Strategic partnerships
- White-label options

## Technical Excellence

### Performance Optimization
| Metric | Current | Target | Approach |
|--------|---------|--------|----------|
| Latency | 500ms | 50ms | Edge computing |
| Accuracy | 92% | 99.9% | Ensemble models |
| Cost/request | $0.10 | $0.01 | Model optimization |
| Uptime | 99.9% | 99.99% | Multi-region |

### AI Innovation
- Proprietary models
- Transfer learning
- Active learning loops
- Automated retraining

## Competitive Differentiation

### Unique Capabilities
1. **Only solution with**: Real-time processing at scale
2. **Best-in-class**: Accuracy for domain-specific tasks
3. **Exclusive**: Integration with key platforms
4. **Patent-pending**: Novel AI approach

### Moat Building
- Network effects through marketplace
- Switching costs via deep integration
- Data advantage from scale
- Brand as category leader

## Enterprise Requirements

### Compliance & Security
- SOC 2 Type II
- GDPR/CCPA compliance
- HIPAA ready
- ISO 27001

### Enterprise Features
- Multi-tenant architecture
- Role-based access control
- Custom deployment options
- 24/7 support with SLA

## Revenue Optimization

### Pricing Evolution
- Usage-based tiers
- Enterprise contracts
- Platform fees
- Premium features

### Target Metrics
- ACV: $50K → $250K
- Gross margin: 70% → 85%
- CAC/LTV: 1:3 → 1:5
- NRR: 110% → 140%

## Innovation Pipeline

### R&D Focus Areas
1. Next-gen AI models
2. Real-time processing
3. Vertical-specific solutions
4. No-code customization

### Experimentation Framework
- 20% resources for innovation
- Quarterly hackathons
- Customer advisory board
- Academic partnerships

## Success Metrics

### Business Metrics
- Market share: #3 → #1
- ARR: $2M → $20M
- Enterprise customers: 10 → 100
- NPS: 45 → 70

### Technical Metrics
- API uptime: 99.99%
- p95 latency: <50ms
- Model accuracy: >99%
- Cost efficiency: 10x improvement

## 3-Year Vision
Become the industry standard for ${aiCapability || 'intelligent automation'}, with:
- 50% market share
- $100M ARR
- Global presence
- Category definition

## Next Quarter Priorities
1. Ship model v2.0 with 10x improvement
2. Close 3 enterprise deals
3. Launch developer platform
4. Achieve SOC 2 certification`
}

// Structured question flow for collecting context
export const CONTEXT_QUESTIONS = {
  stage: "What stage is your product at? Are you creating something new (0→1), scaling an existing product (1→n), or optimizing a mature product (n^x)?",
  '0-to-1': {
    problem: "What core problem are you solving that hasn't been solved before?",
    user: "Who is your beachhead customer segment?",
    differentiator: "What's your unique insight or approach?"
  },
  '1-to-n': {
    working: "What's currently working that you want to scale?",
    bottleneck: "What are your growth bottlenecks?",
    metric: "What's your target growth metric?"
  },
  'n-to-x': {
    optimization: "What optimization metric are you targeting?",
    competition: "What's your competitive differentiation?",
    improvement: "How much improvement would be meaningful?"
  }
}

// Question flow - ONE at a time, starting broad
export function getNextQuestion(context: {
  messages: any[]
  currentAnswers: Record<string, string>
  questionCount?: number
}): string {
  const { currentAnswers, questionCount = 0 } = context
  
  // ALWAYS start with stage if not defined
  if (!currentAnswers.productStage) {
    return CONTEXT_QUESTIONS.stage
  }
  
  // Get stage-specific questions
  const stage = currentAnswers.productStage as ProductStage
  
  // Ask stage-specific questions based on what's missing
  if (stage === '0-to-1') {
    const stageQuestions = CONTEXT_QUESTIONS['0-to-1']
    if (!currentAnswers.coreProblem) return stageQuestions.problem
    if (!currentAnswers.targetUser) return stageQuestions.user
    if (!currentAnswers.differentiator) return stageQuestions.differentiator
  } else if (stage === '1-to-n') {
    const stageQuestions = CONTEXT_QUESTIONS['1-to-n']
    if (!currentAnswers.working) return stageQuestions.working
    if (!currentAnswers.bottleneck) return stageQuestions.bottleneck
    if (!currentAnswers.metric) return stageQuestions.metric
  } else if (stage === 'n-to-x') {
    const stageQuestions = CONTEXT_QUESTIONS['n-to-x']
    if (!currentAnswers.optimization) return stageQuestions.optimization
    if (!currentAnswers.competition) return stageQuestions.competition
    if (!currentAnswers.improvement) return stageQuestions.improvement
  }
  
  // Stop after 2 questions max (stage + 1 follow-up) - we generate PRD on 3rd interaction
  return "" // No more questions needed
}

// Extract answers from user message
export function extractAnswers(message: string): Partial<Record<string, string>> {
  const answers: Partial<Record<string, string>> = {}
  const lower = message.toLowerCase()
  
  // Detect product stage
  if (lower.includes('new') || lower.includes('mvp') || lower.includes('prototype') || 
      lower.includes('0 to 1') || lower.includes('0→1') || lower.includes('idea')) {
    answers.productStage = '0-to-1'
  } else if (lower.includes('scale') || lower.includes('grow') || lower.includes('expand') ||
             lower.includes('1 to n') || lower.includes('1→n')) {
    answers.productStage = '1-to-n'
  } else if (lower.includes('optimiz') || lower.includes('improve') || lower.includes('enhance') ||
             lower.includes('n^x') || lower.includes('mature')) {
    answers.productStage = 'n-to-x'
  }
  
  // Detect if it's an AI product
  if (lower.includes('ai') || lower.includes('ml') || lower.includes('machine learn') ||
      lower.includes('automat') || lower.includes('intelligent') || lower.includes('smart')) {
    answers.isAIProduct = 'true'
  }
  
  // Detect AI capability
  if (message.includes('generat') || message.includes('create') || message.includes('write')) {
    answers.aiCapability = 'Generation'
  } else if (message.includes('classif') || message.includes('categoriz') || message.includes('detect')) {
    answers.aiCapability = 'Classification'
  } else if (message.includes('recommend') || message.includes('suggest')) {
    answers.aiCapability = 'Recommendation'
  } else if (message.includes('analyz') || message.includes('analys') || message.includes('insight')) {
    answers.aiCapability = 'Analysis'
  }
  
  // Detect user type
  if (message.includes('customer') || message.includes('consumer')) {
    answers.targetUser = 'End consumers'
  } else if (message.includes('business') || message.includes('enterprise')) {
    answers.targetUser = 'Business users'
  } else if (message.includes('developer') || message.includes('engineer')) {
    answers.targetUser = 'Technical users'
  }
  
  // Detect success focus
  if (message.includes('accura') || message.includes('correct') || message.includes('precise')) {
    answers.successMetric = 'Accuracy'
  } else if (message.includes('fast') || message.includes('quick') || message.includes('real-time')) {
    answers.successMetric = 'Speed'
  } else if (message.includes('cheap') || message.includes('cost') || message.includes('budget')) {
    answers.successMetric = 'Cost'
  }
  
  return answers
}