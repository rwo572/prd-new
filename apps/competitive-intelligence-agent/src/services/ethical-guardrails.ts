import {
  GuardrailsConfig,
  EthicalCheckConfig,
  SourceValidationConfig,
  ContentFilteringConfig,
  ComplianceConfig,
  DataSource,
  ProcessedSignal,
  MonitoringData,
  ValidationResult,
  ValidationError,
  ValidationWarning
} from '../types/index.js';

export class EthicalGuardrailsService {
  private config: GuardrailsConfig;
  private auditLog: AuditLogEntry[] = [];
  private blacklistedDomains: Set<string>;
  private prohibitedSources: Set<string>;

  constructor(config: GuardrailsConfig) {
    this.config = config;
    this.blacklistedDomains = new Set(config.sourceValidation.blacklistedDomains);
    this.prohibitedSources = new Set(config.ethicalChecks.prohibitedSources);
  }

  async validateDataCollection(source: DataSource, data: MonitoringData): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const recommendations: string[] = [];

    // 1. Source validation
    const sourceValidation = await this.validateSource(source);
    if (!sourceValidation.isValid) {
      errors.push(...sourceValidation.errors);
      warnings.push(...sourceValidation.warnings);
    }

    // 2. Ethical checks
    const ethicalValidation = await this.performEthicalChecks(source, data);
    if (!ethicalValidation.isValid) {
      errors.push(...ethicalValidation.errors);
    }

    // 3. Content filtering
    const contentValidation = await this.validateContent(data);
    if (!contentValidation.isValid) {
      errors.push(...contentValidation.errors);
      warnings.push(...contentValidation.warnings);
    }

    // 4. Compliance checks
    const complianceValidation = await this.validateCompliance(source, data);
    if (!complianceValidation.isValid) {
      errors.push(...complianceValidation.errors);
    }

    const isValid = errors.length === 0;

    // Log the validation attempt
    await this.logValidationAttempt({
      sourceId: source.id,
      dataId: data.id,
      isValid,
      errors: errors.length,
      warnings: warnings.length,
      timestamp: new Date()
    });

    return {
      isValid,
      errors,
      warnings,
      recommendations: this.generateRecommendations(errors, warnings)
    };
  }

  async validateSource(source: DataSource): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if source requires public access
    if (this.config.sourceValidation.requirePublicSources) {
      if (source.authentication && !this.isPublicAPI(source)) {
        errors.push({
          field: 'source.authentication',
          message: 'Only public sources are permitted for ethical data collection',
          code: 'ETHICAL_001',
          severity: 'error'
        });
      }
    }

    // Check blacklisted domains
    try {
      const domain = new URL(source.url).hostname;
      if (this.blacklistedDomains.has(domain)) {
        errors.push({
          field: 'source.url',
          message: `Domain ${domain} is blacklisted`,
          code: 'ETHICAL_002',
          severity: 'error'
        });
      }
    } catch (urlError) {
      errors.push({
        field: 'source.url',
        message: 'Invalid URL format',
        code: 'VALIDATION_001',
        severity: 'error'
      });
    }

    // Check minimum reliability threshold
    if (source.reliability < this.config.sourceValidation.minimumReliability) {
      warnings.push({
        field: 'source.reliability',
        message: `Source reliability (${source.reliability}) is below threshold (${this.config.sourceValidation.minimumReliability})`,
        suggestion: 'Consider using higher-reliability sources or implementing additional verification'
      });
    }

    // Check for prohibited source patterns
    if (this.prohibitedSources.has(source.id) || this.isProhibitedSourceType(source)) {
      errors.push({
        field: 'source.type',
        message: 'Source type is prohibited by ethical guidelines',
        code: 'ETHICAL_003',
        severity: 'error'
      });
    }

    // Validate robots.txt compliance for web scraping
    if (source.type === 'web_scraping') {
      const robotsCompliance = await this.checkRobotsCompliance(source.url);
      if (!robotsCompliance.allowed) {
        errors.push({
          field: 'source.url',
          message: 'Web scraping not allowed per robots.txt',
          code: 'ETHICAL_004',
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations: []
    };
  }

  async performEthicalChecks(source: DataSource, data: MonitoringData): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    if (!this.config.ethicalChecks.enabled) {
      return { isValid: true, errors: [], warnings: [], recommendations: [] };
    }

    // Check for insider information indicators
    const insiderCheck = this.detectInsiderInformation(data);
    if (insiderCheck.detected) {
      errors.push({
        field: 'data.content',
        message: 'Potential insider information detected',
        code: 'ETHICAL_005',
        severity: 'error'
      });
    }

    // Check for unauthorized access patterns
    const accessCheck = this.detectUnauthorizedAccess(source, data);
    if (accessCheck.detected) {
      errors.push({
        field: 'source.access',
        message: 'Potential unauthorized access pattern detected',
        code: 'ETHICAL_006',
        severity: 'error'
      });
    }

    // Check for social engineering indicators
    const socialEngCheck = this.detectSocialEngineering(data);
    if (socialEngCheck.detected) {
      errors.push({
        field: 'data.collection_method',
        message: 'Social engineering patterns detected',
        code: 'ETHICAL_007',
        severity: 'error'
      });
    }

    // Check for personal data exposure
    const personalDataCheck = this.detectPersonalData(data);
    if (personalDataCheck.detected) {
      errors.push({
        field: 'data.content',
        message: 'Personal data detected - privacy violation risk',
        code: 'PRIVACY_001',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      recommendations: []
    };
  }

  async validateContent(data: MonitoringData): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check confidence threshold
    if (this.config.contentFiltering.filterLowConfidence &&
        data.confidence < 0.5) {
      warnings.push({
        field: 'data.confidence',
        message: 'Low confidence data detected',
        suggestion: 'Consider additional verification or flagging as uncertain'
      });
    }

    // Check for speculation markers
    if (this.config.contentFiltering.markSpeculation) {
      const speculationCheck = this.detectSpeculation(data);
      if (speculationCheck.detected && !speculationCheck.marked) {
        warnings.push({
          field: 'data.content',
          message: 'Speculation detected but not marked',
          suggestion: 'Add speculation markers to maintain transparency'
        });
      }
    }

    // Check for evidence requirements
    if (this.config.contentFiltering.requireEvidence) {
      const evidenceCheck = this.validateEvidence(data);
      if (!evidenceCheck.sufficient) {
        errors.push({
          field: 'data.evidence',
          message: 'Insufficient evidence for claims made',
          code: 'CONTENT_001',
          severity: 'error'
        });
      }
    }

    // Check for sensitive content
    const sensitiveCheck = this.detectSensitiveContent(data);
    if (sensitiveCheck.detected) {
      const action = this.config.contentFiltering.sensitiveContentHandling;

      if (action === 'block') {
        errors.push({
          field: 'data.content',
          message: 'Sensitive content detected and blocked',
          code: 'CONTENT_002',
          severity: 'error'
        });
      } else if (action === 'flag') {
        warnings.push({
          field: 'data.content',
          message: 'Sensitive content detected and flagged for review',
          suggestion: 'Review content before publishing or sharing'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations: []
    };
  }

  async validateCompliance(source: DataSource, data: MonitoringData): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // GDPR Compliance
    if (this.config.complianceSettings.gdprCompliant) {
      const gdprCheck = await this.validateGDPRCompliance(source, data);
      if (!gdprCheck.compliant) {
        errors.push({
          field: 'compliance.gdpr',
          message: 'GDPR compliance violation detected',
          code: 'GDPR_001',
          severity: 'error'
        });
      }
    }

    // CCPA Compliance
    if (this.config.complianceSettings.ccpaCompliant) {
      const ccpaCheck = await this.validateCCPACompliance(source, data);
      if (!ccpaCheck.compliant) {
        errors.push({
          field: 'compliance.ccpa',
          message: 'CCPA compliance violation detected',
          code: 'CCPA_001',
          severity: 'error'
        });
      }
    }

    // Data retention limits
    if (this.config.complianceSettings.dataRetentionLimits) {
      const retentionCheck = this.validateDataRetention(data);
      if (!retentionCheck.compliant) {
        errors.push({
          field: 'compliance.retention',
          message: 'Data retention policy violation',
          code: 'RETENTION_001',
          severity: 'error'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
      recommendations: []
    };
  }

  // Specialized detection methods

  private detectInsiderInformation(data: MonitoringData): DetectionResult {
    const content = JSON.stringify(data.rawData).toLowerCase();

    const insiderPatterns = [
      /confidential(?:\s+(?:information|data|document))?/,
      /internal(?:\s+(?:only|use|document))?/,
      /not\s+for\s+(?:public|external|distribution)/,
      /proprietary(?:\s+(?:information|data))?/,
      /leaked?(?:\s+(?:document|information))?/,
      /insider\s+(?:information|knowledge|source)/
    ];

    const detected = insiderPatterns.some(pattern => pattern.test(content));

    return {
      detected,
      confidence: detected ? 0.8 : 0,
      indicators: detected ? ['Insider language patterns'] : []
    };
  }

  private detectUnauthorizedAccess(source: DataSource, data: MonitoringData): DetectionResult {
    // Check for signs of unauthorized access
    const indicators: string[] = [];

    // Check for authentication bypass patterns
    if (source.authentication && data.source.type === 'web_scraping') {
      indicators.push('Scraping authenticated content');
    }

    // Check for rate limit violations
    if (data.timestamp && this.isRateLimitViolation(source, data.timestamp)) {
      indicators.push('Rate limit violation');
    }

    // Check for suspicious access patterns
    if (this.hasSuspiciousAccessPattern(data)) {
      indicators.push('Suspicious access pattern');
    }

    return {
      detected: indicators.length > 0,
      confidence: indicators.length * 0.3,
      indicators
    };
  }

  private detectSocialEngineering(data: MonitoringData): DetectionResult {
    const content = JSON.stringify(data.rawData).toLowerCase();

    const socialEngPatterns = [
      /pretend(?:ing)?\s+to\s+be/,
      /posed?\s+as/,
      /impersonat(?:e|ing)/,
      /false\s+identity/,
      /misrepresent(?:ed|ing)/
    ];

    const detected = socialEngPatterns.some(pattern => pattern.test(content));

    return {
      detected,
      confidence: detected ? 0.9 : 0,
      indicators: detected ? ['Social engineering language'] : []
    };
  }

  private detectPersonalData(data: MonitoringData): DetectionResult {
    const content = JSON.stringify(data.rawData);

    const personalDataPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
      /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/ // Phone number
    ];

    const detectedPatterns = personalDataPatterns.filter(pattern => pattern.test(content));

    return {
      detected: detectedPatterns.length > 0,
      confidence: detectedPatterns.length * 0.7,
      indicators: detectedPatterns.map(p => `Personal data pattern: ${p.source}`)
    };
  }

  private detectSpeculation(data: MonitoringData): { detected: boolean; marked: boolean } {
    const content = JSON.stringify(data.rawData).toLowerCase();

    const speculationPatterns = [
      /(?:might|may|could|possibly|likely|probably)/,
      /(?:rumor|speculation|unconfirmed)/,
      /(?:appears|seems|suggests)/
    ];

    const detected = speculationPatterns.some(pattern => pattern.test(content));

    // Check if speculation is already marked
    const marked = /\[speculation\]|\[unconfirmed\]|\[rumor\]/i.test(content);

    return { detected, marked };
  }

  private detectSensitiveContent(data: MonitoringData): DetectionResult {
    const content = JSON.stringify(data.rawData).toLowerCase();

    const sensitivePatterns = [
      /sexual(?:ly)?/,
      /violent(?:ly|ce)?/,
      /discriminat(?:e|ing|ion)/,
      /offensive/,
      /inappropriate/
    ];

    const detected = sensitivePatterns.some(pattern => pattern.test(content));

    return {
      detected,
      confidence: detected ? 0.6 : 0,
      indicators: detected ? ['Sensitive content detected'] : []
    };
  }

  // Compliance validation methods

  private async validateGDPRCompliance(source: DataSource, data: MonitoringData): Promise<ComplianceResult> {
    // Check for EU data processing requirements
    const hasConsent = this.checkForConsent(data);
    const hasLegalBasis = this.checkForLegalBasis(source);
    const respectsRights = this.checkDataSubjectRights(data);

    return {
      compliant: hasConsent && hasLegalBasis && respectsRights,
      issues: [
        !hasConsent ? 'Missing consent' : null,
        !hasLegalBasis ? 'No legal basis for processing' : null,
        !respectsRights ? 'Data subject rights not respected' : null
      ].filter(Boolean) as string[]
    };
  }

  private async validateCCPACompliance(source: DataSource, data: MonitoringData): Promise<ComplianceResult> {
    // Check for California privacy requirements
    const hasNotice = this.checkForPrivacyNotice(source);
    const respectsOptOut = this.checkOptOutRights(data);

    return {
      compliant: hasNotice && respectsOptOut,
      issues: [
        !hasNotice ? 'Missing privacy notice' : null,
        !respectsOptOut ? 'Opt-out rights not respected' : null
      ].filter(Boolean) as string[]
    };
  }

  // Utility methods

  private async checkRobotsCompliance(url: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const robotsUrl = new URL('/robots.txt', url).toString();
      const response = await fetch(robotsUrl);

      if (!response.ok) {
        return { allowed: true, reason: 'No robots.txt found' };
      }

      const robotsTxt = await response.text();

      // Simple robots.txt parsing - in production, use a proper parser
      if (robotsTxt.includes('Disallow: /') && !robotsTxt.includes('Allow:')) {
        return { allowed: false, reason: 'Crawling disallowed by robots.txt' };
      }

      return { allowed: true };
    } catch (error) {
      console.warn('Error checking robots.txt:', error);
      return { allowed: true, reason: 'Could not verify robots.txt' };
    }
  }

  private isPublicAPI(source: DataSource): boolean {
    // Check if API is publicly accessible (simplified logic)
    return !source.authentication ||
           source.authentication.type === 'api_key' &&
           this.isPublicAPIKey(source.authentication.credentials);
  }

  private isPublicAPIKey(credentials: Record<string, string>): boolean {
    // Check if API key appears to be for public access
    const apiKey = credentials.apiKey || credentials.key || '';

    // Public APIs often have specific patterns or documentation indicating public access
    return apiKey.startsWith('pub_') ||
           apiKey.startsWith('public_') ||
           apiKey.length < 20; // Very simple heuristic
  }

  private isProhibitedSourceType(source: DataSource): boolean {
    const prohibitedTypes = ['social']; // Example: social media scraping might be prohibited
    return prohibitedTypes.includes(source.type);
  }

  private generateRecommendations(errors: ValidationError[], warnings: ValidationWarning[]): string[] {
    const recommendations: string[] = [];

    if (errors.some(e => e.code.startsWith('ETHICAL_'))) {
      recommendations.push('Review ethical guidelines and ensure all data collection follows ethical practices');
    }

    if (warnings.some(w => w.field.includes('confidence'))) {
      recommendations.push('Implement additional verification steps for low-confidence data');
    }

    if (errors.some(e => e.code.startsWith('PRIVACY_'))) {
      recommendations.push('Implement data anonymization and privacy protection measures');
    }

    return recommendations;
  }

  private async logValidationAttempt(entry: AuditLogEntry): Promise<void> {
    this.auditLog.push(entry);

    // Keep only recent entries
    const maxEntries = 10000;
    if (this.auditLog.length > maxEntries) {
      this.auditLog = this.auditLog.slice(-maxEntries);
    }

    if (this.config.complianceSettings.auditLogging) {
      console.log('Ethical validation audit:', entry);
    }
  }

  // Public methods for configuration and monitoring

  updateConfig(newConfig: Partial<GuardrailsConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.sourceValidation?.blacklistedDomains) {
      this.blacklistedDomains = new Set(newConfig.sourceValidation.blacklistedDomains);
    }

    if (newConfig.ethicalChecks?.prohibitedSources) {
      this.prohibitedSources = new Set(newConfig.ethicalChecks.prohibitedSources);
    }
  }

  getAuditLog(since?: Date): AuditLogEntry[] {
    if (since) {
      return this.auditLog.filter(entry => entry.timestamp >= since);
    }
    return [...this.auditLog];
  }

  getComplianceMetrics(): ComplianceMetrics {
    const recent = this.auditLog.filter(entry =>
      Date.now() - entry.timestamp.getTime() < 24 * 60 * 60 * 1000
    );

    const total = recent.length;
    const passed = recent.filter(entry => entry.isValid).length;

    return {
      totalValidations: total,
      passedValidations: passed,
      complianceRate: total > 0 ? passed / total : 1,
      commonViolations: this.getCommonViolations(recent),
      lastUpdated: new Date()
    };
  }

  // Helper methods with simplified implementations
  private validateEvidence(data: MonitoringData): { sufficient: boolean } {
    return { sufficient: data.confidence > 0.6 };
  }

  private validateDataRetention(data: MonitoringData): { compliant: boolean } {
    return { compliant: true }; // Simplified
  }

  private checkForConsent(data: MonitoringData): boolean {
    return true; // Simplified - would check for actual consent indicators
  }

  private checkForLegalBasis(source: DataSource): boolean {
    return source.type !== 'social'; // Simplified
  }

  private checkDataSubjectRights(data: MonitoringData): boolean {
    return true; // Simplified
  }

  private checkForPrivacyNotice(source: DataSource): boolean {
    return true; // Simplified
  }

  private checkOptOutRights(data: MonitoringData): boolean {
    return true; // Simplified
  }

  private isRateLimitViolation(source: DataSource, timestamp: Date): boolean {
    return false; // Simplified
  }

  private hasSuspiciousAccessPattern(data: MonitoringData): boolean {
    return false; // Simplified
  }

  private getCommonViolations(entries: AuditLogEntry[]): string[] {
    return ['Low confidence data', 'Missing verification']; // Simplified
  }
}

// Supporting interfaces
interface DetectionResult {
  detected: boolean;
  confidence: number;
  indicators: string[];
}

interface ComplianceResult {
  compliant: boolean;
  issues: string[];
}

interface AuditLogEntry {
  sourceId: string;
  dataId: string;
  isValid: boolean;
  errors: number;
  warnings: number;
  timestamp: Date;
}

interface ComplianceMetrics {
  totalValidations: number;
  passedValidations: number;
  complianceRate: number;
  commonViolations: string[];
  lastUpdated: Date;
}