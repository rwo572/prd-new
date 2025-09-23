#!/usr/bin/env node

import { CompetitiveIntelligenceAgentImpl } from './agents/competitive-intelligence-agent.js';
import { CompetitorTarget, AgentConfig } from './types/index.js';

async function main() {
  const agent = new CompetitiveIntelligenceAgentImpl();

  // Example configuration
  const config: AgentConfig = {
    monitoringSettings: {
      defaultFrequency: 'daily',
      maxConcurrentSessions: 5,
      dataRetentionDays: 90,
      alertThresholds: {
        criticalSignals: 5,
        highImpactEvents: 10,
        newCompetitorDetection: true,
        pricingChanges: true,
        productLaunches: true
      }
    },
    analysisSettings: {
      confidenceThreshold: 0.7,
      minimumEvidence: 2,
      speculationHandling: 'mark',
      sentimentAnalysis: true,
      entityExtraction: true
    },
    reportingSettings: {
      defaultFormat: 'json',
      schedules: [
        {
          type: 'monthly',
          frequency: 'monthly',
          dayOfMonth: 1,
          time: '09:00',
          enabled: true
        }
      ],
      distribution: [],
      customization: {
        includeSections: ['summary', 'keyFindings', 'recommendations'],
        excludeSections: [],
        branding: {
          companyName: 'Your Company',
          colors: {
            primary: '#007bff',
            secondary: '#6c757d',
            accent: '#28a745'
          },
          fonts: {
            primary: 'Arial, sans-serif',
            secondary: 'Times, serif'
          }
        },
        formatting: {
          dateFormat: 'YYYY-MM-DD',
          numberFormat: 'en-US',
          timezone: 'UTC',
          language: 'en'
        }
      }
    },
    guardrailsConfig: {
      ethicalChecks: {
        enabled: true,
        strictMode: true,
        prohibitedSources: [],
        requiredEthicsApproval: false,
        auditTrail: true
      },
      sourceValidation: {
        requirePublicSources: true,
        blacklistedDomains: [],
        minimumReliability: 0.6,
        crossReferenceRequired: true,
        verificationTimeout: 30000
      },
      contentFiltering: {
        markSpeculation: true,
        filterLowConfidence: true,
        requireEvidence: true,
        sensitiveContentHandling: 'flag'
      },
      complianceSettings: {
        gdprCompliant: true,
        ccpaCompliant: true,
        dataRetentionLimits: true,
        auditLogging: true,
        consentRequired: false
      }
    },
    performanceSettings: {
      maxConcurrentCollectors: 10,
      requestTimeout: 30000,
      retryAttempts: 3,
      cacheDuration: 3600,
      resourceLimits: {
        maxMemoryMB: 512,
        maxCpuPercent: 50,
        maxStorageGB: 5,
        maxNetworkMbps: 10
      }
    }
  };

  await agent.configure(config);

  // Example competitors to monitor
  const competitors: CompetitorTarget[] = [
    {
      id: 'competitor_a',
      name: 'Competitor A',
      domain: 'competitor-a.com',
      priority: 'high',
      categories: [
        {
          type: 'direct',
          productSegment: 'ai-tools',
          threatLevel: 4
        }
      ],
      monitoringChannels: [],
      lastUpdated: new Date()
    },
    {
      id: 'competitor_b',
      name: 'Competitor B',
      domain: 'competitor-b.com',
      priority: 'medium',
      categories: [
        {
          type: 'indirect',
          productSegment: 'productivity-tools',
          threatLevel: 3
        }
      ],
      monitoringChannels: [],
      lastUpdated: new Date()
    }
  ];

  console.log('🤖 Competitive Intelligence Agent v1.0.0');
  console.log('========================================');
  console.log();

  try {
    // Start monitoring
    const session = await agent.monitor(competitors, {
      duration: 30,
      unit: 'days'
    });

    console.log(`✅ Monitoring session started: ${session.id}`);
    console.log(`📊 Tracking ${competitors.length} competitors`);
    console.log(`⏰ Started at: ${session.startTime.toISOString()}`);
    console.log();

    // Get compliance metrics
    const metrics = await agent.getComplianceMetrics();
    console.log('📋 Compliance Metrics:');
    console.log(`   Compliance Rate: ${(metrics.complianceRate * 100).toFixed(1)}%`);
    console.log(`   Total Validations: ${metrics.totalValidations}`);
    console.log(`   Last Updated: ${metrics.lastUpdated.toISOString()}`);
    console.log();

    console.log('🔍 Agent is now monitoring competitors...');
    console.log('💡 Use Ctrl+C to stop monitoring');

    // Keep the process running
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping competitive intelligence monitoring...');
      await agent.stopMonitoringSession(session.id);
      console.log('✅ Monitoring stopped successfully');
      process.exit(0);
    });

    // Prevent the process from exiting
    setInterval(() => {
      // Keep alive
    }, 10000);

  } catch (error) {
    console.error('❌ Error starting competitive intelligence agent:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { CompetitiveIntelligenceAgentImpl } from './agents/competitive-intelligence-agent.js';
export * from './types/index.js';