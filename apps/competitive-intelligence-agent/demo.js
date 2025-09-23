#!/usr/bin/env node

// Simple localhost demo of the Competitive Intelligence Agent
// This demonstrates the agent without requiring full dependency installation

const http = require('http');
const url = require('url');

// Mock agent implementation for demo
class CompetitiveIntelligenceDemo {
  constructor() {
    this.sessions = new Map();
    this.competitors = [
      {
        id: 'competitor_a',
        name: 'Competitor A',
        domain: 'competitor-a.com',
        priority: 'high',
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'competitor_b',
        name: 'Competitor B',
        domain: 'competitor-b.com',
        priority: 'medium',
        lastUpdate: new Date().toISOString()
      }
    ];
    this.signals = [
      {
        id: 'signal_1',
        type: 'product_launch',
        title: 'Competitor A launched new AI feature',
        description: 'New machine learning capabilities announced on their blog',
        timestamp: new Date().toISOString(),
        verification: 'confirmed',
        impact: 'high',
        source: 'RSS Feed'
      },
      {
        id: 'signal_2',
        type: 'pricing_change',
        title: 'Competitor B reduced pricing by 20%',
        description: 'Updated pricing page shows significant reduction',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        verification: 'confirmed',
        impact: 'medium',
        source: 'Web Scraping'
      }
    ];
  }

  getStatus() {
    return {
      status: 'active',
      version: '1.0.0',
      competitors: this.competitors.length,
      signals: this.signals.length,
      compliance: {
        ethicalChecks: 'enabled',
        gdprCompliant: true,
        auditTrail: true
      }
    };
  }

  getCompetitors() {
    return this.competitors;
  }

  getSignals() {
    return this.signals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  generateReport() {
    return {
      id: `report_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      period: '30 days',
      summary: {
        totalSignals: this.signals.length,
        highImpactSignals: this.signals.filter(s => s.impact === 'high').length,
        competitorsMonitored: this.competitors.length
      },
      keyFindings: [
        'Increased product innovation activity from Competitor A',
        'Pricing pressure detected in the market',
        'New feature launches accelerating across competitors'
      ],
      recommendations: [
        'Monitor Competitor A\'s AI feature rollout closely',
        'Review pricing strategy in response to market changes',
        'Accelerate product development timeline'
      ],
      compliance: {
        sourcesUsed: ['RSS Feeds', 'Web Scraping', 'Job Boards'],
        ethicalGuidelines: 'All data collected from public sources only',
        factualAccuracy: '95% confirmed signals'
      }
    };
  }
}

const agent = new CompetitiveIntelligenceDemo();

// Create HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    let response;

    switch (path) {
      case '/':
        response = {
          message: '🤖 Competitive Intelligence Agent API',
          version: '1.0.0',
          endpoints: [
            'GET /status - Agent status and metrics',
            'GET /competitors - List monitored competitors',
            'GET /signals - Recent competitive signals',
            'GET /report - Generate monthly report'
          ],
          documentation: 'https://github.com/your-org/competitive-intelligence-agent'
        };
        break;

      case '/status':
        response = agent.getStatus();
        break;

      case '/competitors':
        response = {
          competitors: agent.getCompetitors(),
          count: agent.getCompetitors().length
        };
        break;

      case '/signals':
        response = {
          signals: agent.getSignals(),
          count: agent.getSignals().length
        };
        break;

      case '/report':
        response = agent.generateReport();
        break;

      default:
        res.writeHead(404);
        response = { error: 'Endpoint not found' };
    }

    res.writeHead(200);
    res.end(JSON.stringify(response, null, 2));

  } catch (error) {
    res.writeHead(500);
    res.end(JSON.stringify({ error: error.message }, null, 2));
  }
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

server.listen(PORT, HOST, () => {
  console.log('🤖 Competitive Intelligence Agent v1.0.0');
  console.log('========================================');
  console.log();
  console.log(`🌐 Server running at http://${HOST}:${PORT}`);
  console.log();
  console.log('📊 Available endpoints:');
  console.log(`   • http://${HOST}:${PORT}/status`);
  console.log(`   • http://${HOST}:${PORT}/competitors`);
  console.log(`   • http://${HOST}:${PORT}/signals`);
  console.log(`   • http://${HOST}:${PORT}/report`);
  console.log();
  console.log('✅ Ethical guardrails: ACTIVE');
  console.log('🛡️  Compliance mode: GDPR/CCPA');
  console.log('🔍 Monitoring: 2 competitors');
  console.log();
  console.log('💡 Use Ctrl+C to stop the server');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Competitive Intelligence Agent...');
  server.close(() => {
    console.log('✅ Server stopped successfully');
    process.exit(0);
  });
});