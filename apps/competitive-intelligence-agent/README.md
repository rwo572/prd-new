# Competitive Intelligence Agent

A Claude Code SDK-based agent that monitors competitor moves and market shifts through ethical data collection and analysis.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development server
npm run dev

# Or start production
npm run build && npm start
```

## Features

- **Ethical Monitoring**: Only uses public information sources
- **Fact Verification**: Distinguishes between confirmed facts and speculation
- **Real-time Alerts**: Monitors for critical competitive signals
- **Monthly Reports**: Generates comprehensive competitive landscape analysis
- **Compliance**: GDPR/CCPA compliant with full audit trails

## Usage

```typescript
import { CompetitiveIntelligenceAgentImpl } from './src/index.js';

const agent = new CompetitiveIntelligenceAgentImpl();

// Configure the agent
await agent.configure({
  monitoringSettings: {
    defaultFrequency: 'daily',
    alertThresholds: {
      criticalSignals: 5,
      productLaunches: true
    }
  }
});

// Start monitoring competitors
const session = await agent.monitor([
  {
    id: 'competitor_a',
    name: 'Competitor A',
    domain: 'competitor-a.com',
    priority: 'high'
  }
], { duration: 30, unit: 'days' });
```

## Architecture

- **Data Collectors**: RSS, web scraping, job boards
- **Fact Verification**: Cross-reference validation
- **Ethical Guardrails**: Compliance and validation
- **Reporting**: Monthly landscape reports
- **Claude SDK**: Integration for AI analysis

## Behavioral Contract

✅ **Good**: "Competitor X launched feature Y yesterday. Based on user reviews, adoption appears strong in segment Z"

❌ **Bad**: Making unsubstantiated claims about competitor strategy

🚫 **Reject**: Engaging in unethical intelligence gathering

## Compliance

- Only public information sources
- Clear fact vs speculation marking
- GDPR/CCPA compliant
- Full audit trails
- Rate limiting and ethical checks