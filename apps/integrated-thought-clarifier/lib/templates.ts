import { PRDTemplate } from '@/types'

export const templates: PRDTemplate[] = [
  {
    id: 'b2b-saas',
    name: 'B2B SaaS Platform',
    description: 'Enterprise software with team collaboration',
    category: 'b2b',
    content: `# [Product Name] PRD

## Executive Summary
### Vision
[Define the long-term vision for this B2B product]

### Target Market
- Primary: [Enterprise/SMB]
- Industry: [Specific verticals]
- Company Size: [Employee range]
- Decision Makers: [Titles/Roles]

## Problem Statement
### Current State
[Describe how businesses currently handle this problem]

### Pain Points
- [Quantifiable business impact]
- [Efficiency losses]
- [Compliance/risk issues]

## Solution
### Core Value Proposition
[How this solves the business problem]

### Key Features
1. **[Feature Name]**
   - User Story: As a [role], I want to [action] so that [benefit]
   - Acceptance Criteria:
     - Given [context], when [action], then [result]

## Success Metrics
- Adoption: [% of users actively using]
- Efficiency: [Time/cost saved]
- ROI: [Return on investment targets]
- NPS: [Net Promoter Score target]

## Technical Requirements
### Integration
- APIs: [List of required integrations]
- SSO: [SAML, OAuth requirements]
- Data Export: [Formats and frequency]

### Security & Compliance
- SOC 2 Type II
- GDPR compliance
- Data encryption at rest and in transit

## Go-to-Market
### Pricing Model
- Tier 1: [Features and price]
- Tier 2: [Features and price]
- Enterprise: [Custom pricing]

### Sales Strategy
- Direct sales for Enterprise
- Self-serve for SMB
- Partner channel program`
  },
  {
    id: 'consumer-app',
    name: 'Consumer Mobile App',
    description: 'B2C mobile application with social features',
    category: 'b2c',
    content: `# [App Name] PRD

## Vision
[One-line vision that captures the essence]

## User Persona
### Primary User
- Demographics: [Age, location, income]
- Behaviors: [Daily habits, app usage]
- Goals: [What they want to achieve]
- Frustrations: [Current pain points]

## Problem Space
### User Journey
1. [Trigger - what makes them look for solution]
2. [Discovery - how they find your app]
3. [First Use - initial experience]
4. [Habit Formation - repeated use]
5. [Advocacy - sharing with others]

## Core Features
### MVP (Launch)
1. **Onboarding Flow**
   - Social login
   - Permission requests
   - Initial personalization

2. **Core Loop**
   - [Primary action]
   - [Reward/feedback]
   - [Progress/achievement]

3. **Social Features**
   - Share functionality
   - Friend invites
   - Social proof elements

## Design Principles
- Mobile-first, thumb-friendly
- Delightful micro-interactions
- Instant feedback
- Offline capability

## Monetization
- Freemium model
- In-app purchases: [List items]
- Subscription tiers: [Benefits]
- Ad placements: [Non-intrusive locations]

## Growth Mechanics
- Viral coefficient target: >1.2
- Retention: D1 >40%, D7 >20%, D30 >10%
- LTV:CAC ratio: >3:1`
  },
  {
    id: 'ai-product',
    name: 'AI-Powered Product',
    description: 'Product with AI/ML at its core',
    category: 'ai',
    content: `# [Product Name] AI PRD

## AI Vision
[How AI transforms the user experience]

## AI Capabilities
### Core AI Features
1. **[Capability 1]**
   - Model Type: [Classification/Generation/etc]
   - Input: [Data type and format]
   - Output: [Expected results]
   - Accuracy Target: [Percentage]

## Training Data
### Data Sources
- [Source 1]: [Volume, quality, licensing]
- [Source 2]: [Update frequency]

### Data Requirements
- Minimum dataset size: [Number]
- Labeling requirements: [Human-in-loop]
- Privacy considerations: [PII handling]

## Model Architecture
### Approach
- [ ] Pre-trained model (GPT-4, Claude, etc.)
- [ ] Fine-tuned model
- [ ] Custom trained model

### Performance Targets
- Latency: <[X]ms p95
- Throughput: [requests/second]
- Accuracy: >[X]%
- Cost per inference: <$[X]

## Safety & Ethics
### Guardrails
- Content filtering
- Bias mitigation strategies
- Hallucination prevention
- User consent and transparency

### Failure Modes
- Graceful degradation
- Human fallback options
- Error messaging

## Evaluation Framework
### Metrics
- Task success rate
- User satisfaction score
- False positive/negative rates
- Fairness metrics across demographics

### A/B Testing
- Control: [Non-AI baseline]
- Experiment: [AI-powered version]
- Success criteria: [Improvement targets]`
  },
  {
    id: 'marketplace',
    name: 'Marketplace Platform',
    description: 'Two-sided marketplace connecting buyers and sellers',
    category: 'platform',
    content: `# [Marketplace Name] PRD

## Vision
[Create the definitive marketplace for X]

## Market Dynamics
### Supply Side (Sellers)
- Target Sellers: [Profile]
- Value Proposition: [Why sell here]
- Onboarding: [Steps to first listing]

### Demand Side (Buyers)
- Target Buyers: [Profile]
- Value Proposition: [Why buy here]
- Discovery: [How they find products]

## Core Mechanics
### Matching Algorithm
- Search relevance factors
- Recommendation engine
- Personalization strategy

### Trust & Safety
- Identity verification
- Review system
- Dispute resolution
- Fraud prevention

### Transaction Flow
1. Discovery/Search
2. Product evaluation
3. Purchase decision
4. Payment processing
5. Fulfillment tracking
6. Review/feedback

## Network Effects
### Growth Loops
- More sellers → More selection → More buyers
- More buyers → More demand → More sellers

### Liquidity Metrics
- Time to first transaction
- Fill rate
- Repeat rate

## Revenue Model
- Transaction fees: [X]%
- Listing fees: [Premium placements]
- Value-added services: [Analytics, promotion]

## Platform Policies
- Prohibited items/services
- Quality standards
- Seller requirements
- Buyer protections`
  },
  {
    id: 'mobile-game',
    name: 'Mobile Game',
    description: 'Free-to-play mobile game with monetization',
    category: 'mobile',
    content: `# [Game Name] PRD

## Game Concept
### Core Loop
[30-second description of main gameplay]

### Genre & References
- Primary Genre: [Puzzle/Action/Strategy]
- Similar Games: [Successful comparables]
- Unique Twist: [What makes it different]

## Player Persona
- Demographics: [Age, gender distribution]
- Play Style: [Casual/Hardcore]
- Session Length: [Target minutes]
- Play Frequency: [Sessions per day]

## Game Mechanics
### Core Gameplay
1. **[Primary Mechanic]**
   - Controls: [Touch/swipe/tap]
   - Difficulty curve: [Learning progression]
   - Skill vs. Luck: [Balance ratio]

### Meta Game
- Progression system
- Collection mechanics
- Achievement system
- Social features

## Monetization Design
### IAP Strategy
- Hard currency: [Gems/Coins]
- Soft currency: [Points/Energy]
- Consumables: [Boosters, lives]
- Durables: [Characters, skins]

### Ad Placements
- Rewarded video: [Placement and rewards]
- Interstitials: [Frequency and triggers]
- Banner ads: [Location if any]

## Retention Mechanics
### Daily Engagement
- Daily rewards
- Limited-time events
- Energy system
- Push notification strategy

### Social Features
- Leaderboards
- Guilds/Teams
- PvP elements
- Gift sending

## Performance KPIs
- D1 Retention: >40%
- D7 Retention: >18%
- D30 Retention: >8%
- ARPDAU: >$0.20
- Session length: >8 minutes
- Sessions/DAU: >3`
  }
]