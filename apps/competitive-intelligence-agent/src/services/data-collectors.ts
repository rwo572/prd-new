import { BaseDataCollector } from '../pipelines/monitoring-pipeline.js';
import {
  DataSource,
  CronSchedule,
  RawData,
  MonitoringData,
  MonitoringChannel,
  CompetitorTarget
} from '../types/index.js';
import * as cheerio from 'cheerio';
import Parser from 'rss-parser';

// RSS Feed Collector for blog posts and news
export class RSSFeedCollector extends BaseDataCollector {
  private rssParser: Parser;

  constructor(id: string, source: DataSource, schedule: CronSchedule) {
    super(id, source, schedule);
    this.rssParser = new Parser({
      customFields: {
        feed: ['language', 'copyright'],
        item: ['author', 'pubDate', 'category']
      }
    });
  }

  async collect(): Promise<RawData[]> {
    try {
      const feed = await this.rssParser.parseURL(this.source.url);

      return feed.items.map(item => ({
        id: item.guid || item.link || '',
        title: item.title || '',
        content: item.content || item.summary || '',
        url: item.link || '',
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        author: item.author || '',
        categories: item.categories || [],
        source: this.source.name
      }));
    } catch (error) {
      console.error(`Error collecting RSS feed from ${this.source.url}:`, error);
      throw error;
    }
  }

  transform(data: RawData): MonitoringData {
    const rawItem = data as RSSItem;

    return {
      id: `rss_${this.source.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      competitorId: this.extractCompetitorId(rawItem),
      channel: this.createChannel(),
      timestamp: rawItem.publishedAt,
      rawData: rawItem,
      processed: {
        type: 'technical_insight',
        category: 'blog_post',
        title: rawItem.title,
        description: this.extractDescription(rawItem.content),
        impact: {
          strategic: 'medium',
          timeframe: 'medium_term',
          affectedSegments: ['technical'],
          responseRecommendation: 'Analyze for technical insights'
        },
        metadata: {
          keywords: this.extractKeywords(rawItem.content),
          sentiment: 0,
          entities: [],
          topics: rawItem.categories,
          language: 'en',
          readabilityScore: 0.7
        },
        verification: {
          isVerified: true,
          sourceCount: 1,
          lastVerified: new Date(),
          verificationMethod: 'automatic',
          confidenceLevel: 0.8
        }
      },
      confidence: 0.8,
      source: this.source
    };
  }

  private extractCompetitorId(item: RSSItem): string {
    // Extract competitor ID from URL or source
    const domain = new URL(item.url).hostname;
    return domain.replace(/^www\./, '').replace(/\./g, '_');
  }

  private createChannel(): MonitoringChannel {
    return {
      type: 'tech_blogs',
      source: this.source,
      frequency: 'daily',
      filters: [],
      enabled: true
    };
  }

  private extractDescription(content: string): string {
    // Strip HTML and get first 200 chars
    const $ = cheerio.load(content);
    const text = $.text();
    return text.substring(0, 200) + (text.length > 200 ? '...' : '');
  }

  private extractKeywords(content: string): string[] {
    const $ = cheerio.load(content);
    const text = $.text().toLowerCase();

    const techKeywords = [
      'ai', 'machine learning', 'api', 'cloud', 'kubernetes', 'docker',
      'microservices', 'database', 'performance', 'security', 'scaling',
      'architecture', 'framework', 'library', 'open source'
    ];

    return techKeywords.filter(keyword => text.includes(keyword));
  }
}

// Web Scraper for product pages and pricing
export class WebScrapingCollector extends BaseDataCollector {
  private selectors: ScrapingSelectors;

  constructor(
    id: string,
    source: DataSource,
    schedule: CronSchedule,
    selectors: ScrapingSelectors
  ) {
    super(id, source, schedule);
    this.selectors = selectors;
  }

  async collect(): Promise<RawData[]> {
    try {
      const response = await fetch(this.source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CompetitiveIntelligenceBot/1.0)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const data: ScrapedData = {
        url: this.source.url,
        title: $(this.selectors.title).text().trim(),
        content: $(this.selectors.content).text().trim(),
        lastModified: new Date(),
        metadata: {}
      };

      // Extract pricing if selector provided
      if (this.selectors.pricing) {
        data.pricing = this.extractPricing($, this.selectors.pricing);
      }

      // Extract features if selector provided
      if (this.selectors.features) {
        data.features = $(this.selectors.features)
          .map((_, el) => $(el).text().trim())
          .get();
      }

      return [data];
    } catch (error) {
      console.error(`Error scraping ${this.source.url}:`, error);
      throw error;
    }
  }

  transform(data: RawData): MonitoringData {
    const scrapedData = data as ScrapedData;

    return {
      id: `scrape_${this.source.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      competitorId: this.extractCompetitorFromUrl(scrapedData.url),
      channel: this.createChannel(),
      timestamp: scrapedData.lastModified,
      rawData: scrapedData,
      processed: {
        type: scrapedData.pricing ? 'pricing_change' : 'product_update',
        category: 'product_page',
        title: scrapedData.title,
        description: scrapedData.content.substring(0, 300),
        impact: {
          strategic: scrapedData.pricing ? 'high' : 'medium',
          timeframe: 'immediate',
          affectedSegments: ['pricing', 'product'],
          responseRecommendation: 'Review competitive positioning'
        },
        metadata: {
          keywords: this.extractKeywords(scrapedData.content),
          sentiment: 0,
          entities: [],
          topics: ['product', 'pricing'],
          language: 'en',
          readabilityScore: 0.6
        },
        verification: {
          isVerified: true,
          sourceCount: 1,
          lastVerified: new Date(),
          verificationMethod: 'automatic',
          confidenceLevel: 0.9
        }
      },
      confidence: 0.9,
      source: this.source
    };
  }

  private extractPricing($: cheerio.CheerioAPI, selector: string): PricingInfo[] {
    const pricingElements = $(selector);
    const pricing: PricingInfo[] = [];

    pricingElements.each((_, element) => {
      const text = $(element).text();
      const priceMatch = text.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);

      if (priceMatch) {
        pricing.push({
          amount: parseFloat(priceMatch[1].replace(',', '')),
          currency: 'USD',
          period: this.extractPeriod(text),
          plan: this.extractPlanName($(element))
        });
      }
    });

    return pricing;
  }

  private extractPeriod(text: string): string {
    if (text.includes('/month') || text.includes('monthly')) return 'monthly';
    if (text.includes('/year') || text.includes('annually')) return 'yearly';
    if (text.includes('/day') || text.includes('daily')) return 'daily';
    return 'unknown';
  }

  private extractPlanName(element: cheerio.Cheerio): string {
    // Look for plan name in parent elements or nearby headings
    const heading = element.closest('.plan, .tier, .package').find('h1, h2, h3, h4').first();
    return heading.text().trim() || 'Unknown Plan';
  }

  private extractCompetitorFromUrl(url: string): string {
    const domain = new URL(url).hostname;
    return domain.replace(/^www\./, '').replace(/\./g, '_');
  }

  private createChannel(): MonitoringChannel {
    return {
      type: 'product_updates',
      source: this.source,
      frequency: 'daily',
      filters: [],
      enabled: true
    };
  }

  private extractKeywords(content: string): string[] {
    const productKeywords = [
      'features', 'pricing', 'plans', 'subscription', 'free trial',
      'enterprise', 'api', 'integration', 'security', 'compliance',
      'support', 'analytics', 'dashboard', 'reporting'
    ];

    const lowerContent = content.toLowerCase();
    return productKeywords.filter(keyword => lowerContent.includes(keyword));
  }
}

// Job Board Collector for hiring signals
export class JobBoardCollector extends BaseDataCollector {
  private jobBoards: JobBoardConfig[];

  constructor(id: string, source: DataSource, schedule: CronSchedule, jobBoards: JobBoardConfig[]) {
    super(id, source, schedule);
    this.jobBoards = jobBoards;
  }

  async collect(): Promise<RawData[]> {
    const allJobs: JobListing[] = [];

    for (const board of this.jobBoards) {
      try {
        const jobs = await this.scrapeJobBoard(board);
        allJobs.push(...jobs);
      } catch (error) {
        console.error(`Error scraping ${board.name}:`, error);
      }
    }

    return allJobs;
  }

  private async scrapeJobBoard(board: JobBoardConfig): Promise<JobListing[]> {
    const response = await fetch(board.searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; JobBot/1.0)'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    const jobs: JobListing[] = [];

    $(board.selectors.jobItems).each((_, element) => {
      const jobElement = $(element);

      const job: JobListing = {
        title: jobElement.find(board.selectors.title).text().trim(),
        company: jobElement.find(board.selectors.company).text().trim(),
        location: jobElement.find(board.selectors.location).text().trim(),
        description: jobElement.find(board.selectors.description).text().trim(),
        postedDate: this.parseDate(jobElement.find(board.selectors.date).text().trim()),
        url: this.resolveUrl(jobElement.find(board.selectors.link).attr('href') || '', board.baseUrl),
        source: board.name,
        skills: this.extractSkills(jobElement.find(board.selectors.description).text())
      };

      if (job.title && job.company) {
        jobs.push(job);
      }
    });

    return jobs;
  }

  transform(data: RawData): MonitoringData {
    const job = data as JobListing;

    return {
      id: `job_${this.source.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      competitorId: this.normalizeCompanyName(job.company),
      channel: this.createChannel(),
      timestamp: job.postedDate,
      rawData: job,
      processed: {
        type: 'hiring_signal',
        category: 'job_posting',
        title: `${job.company} hiring ${job.title}`,
        description: job.description.substring(0, 300),
        impact: {
          strategic: this.assessStrategicImpact(job),
          timeframe: 'short_term',
          affectedSegments: this.identifyAffectedSegments(job),
          responseRecommendation: this.generateRecommendation(job)
        },
        metadata: {
          keywords: job.skills,
          sentiment: 0.1, // Slightly positive (hiring is growth)
          entities: [
            {
              type: 'organization',
              name: job.company,
              confidence: 1.0,
              mentions: 1
            }
          ],
          topics: ['hiring', 'growth', ...this.categorizeDepartment(job.title)],
          language: 'en',
          readabilityScore: 0.7
        },
        verification: {
          isVerified: true,
          sourceCount: 1,
          lastVerified: new Date(),
          verificationMethod: 'automatic',
          confidenceLevel: 0.85
        }
      },
      confidence: 0.85,
      source: this.source
    };
  }

  private assessStrategicImpact(job: JobListing): 'low' | 'medium' | 'high' | 'critical' {
    const title = job.title.toLowerCase();
    const description = job.description.toLowerCase();

    // C-level and VP positions
    if (title.includes('ceo') || title.includes('cto') || title.includes('cpo') ||
        title.includes('vp') || title.includes('chief')) {
      return 'critical';
    }

    // Director and senior roles in key areas
    if (title.includes('director') || title.includes('head of') || title.includes('lead')) {
      if (description.includes('ai') || description.includes('product') ||
          description.includes('engineering') || description.includes('growth')) {
        return 'high';
      }
      return 'medium';
    }

    // Specialist roles in emerging areas
    if (description.includes('machine learning') || description.includes('ai') ||
        description.includes('blockchain') || description.includes('crypto')) {
      return 'medium';
    }

    return 'low';
  }

  private identifyAffectedSegments(job: JobListing): string[] {
    const segments: string[] = [];
    const combined = `${job.title} ${job.description}`.toLowerCase();

    const segmentKeywords = {
      'product': ['product', 'pm', 'roadmap', 'feature'],
      'engineering': ['engineer', 'developer', 'software', 'backend', 'frontend'],
      'data': ['data', 'analytics', 'scientist', 'ml', 'ai'],
      'sales': ['sales', 'account', 'revenue', 'customer success'],
      'marketing': ['marketing', 'growth', 'acquisition', 'brand'],
      'operations': ['operations', 'ops', 'infrastructure', 'devops']
    };

    for (const [segment, keywords] of Object.entries(segmentKeywords)) {
      if (keywords.some(keyword => combined.includes(keyword))) {
        segments.push(segment);
      }
    }

    return segments.length > 0 ? segments : ['general'];
  }

  private generateRecommendation(job: JobListing): string {
    const impact = this.assessStrategicImpact(job);

    if (impact === 'critical') {
      return 'Monitor leadership changes and strategic direction shifts';
    } else if (impact === 'high') {
      return 'Analyze team expansion and capability building in key areas';
    } else if (impact === 'medium') {
      return 'Track emerging technology investments and skill building';
    }

    return 'Note hiring trends and organizational growth patterns';
  }

  private categorizeDepartment(title: string): string[] {
    const titleLower = title.toLowerCase();

    if (titleLower.includes('engineer') || titleLower.includes('developer')) {
      return ['engineering', 'technology'];
    } else if (titleLower.includes('product') || titleLower.includes('pm')) {
      return ['product', 'strategy'];
    } else if (titleLower.includes('data') || titleLower.includes('analyst')) {
      return ['data', 'analytics'];
    } else if (titleLower.includes('sales') || titleLower.includes('account')) {
      return ['sales', 'revenue'];
    } else if (titleLower.includes('marketing') || titleLower.includes('growth')) {
      return ['marketing', 'growth'];
    }

    return ['general'];
  }

  private extractSkills(description: string): string[] {
    const skillKeywords = [
      'javascript', 'typescript', 'python', 'java', 'go', 'rust',
      'react', 'vue', 'angular', 'node.js', 'express',
      'aws', 'gcp', 'azure', 'kubernetes', 'docker',
      'postgresql', 'mongodb', 'redis', 'elasticsearch',
      'machine learning', 'ai', 'data science', 'analytics',
      'product management', 'agile', 'scrum', 'leadership'
    ];

    const descriptionLower = description.toLowerCase();
    return skillKeywords.filter(skill => descriptionLower.includes(skill));
  }

  private normalizeCompanyName(company: string): string {
    return company
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private createChannel(): MonitoringChannel {
    return {
      type: 'job_postings',
      source: this.source,
      frequency: 'daily',
      filters: [],
      enabled: true
    };
  }

  private parseDate(dateStr: string): Date {
    // Parse various date formats from job boards
    const now = new Date();

    if (dateStr.includes('today')) {
      return now;
    } else if (dateStr.includes('yesterday')) {
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (dateStr.includes('days ago')) {
      const days = parseInt(dateStr.match(/(\d+) days ago/)?.[1] || '0');
      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }

    // Try to parse as regular date
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? now : parsed;
  }

  private resolveUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) {
      return url;
    } else if (url.startsWith('/')) {
      return baseUrl + url;
    } else {
      return baseUrl + '/' + url;
    }
  }
}

// Factory for creating specialized collectors
export class CollectorFactory {
  static createRSSCollector(
    competitorTarget: CompetitorTarget,
    feedUrl: string,
    schedule: CronSchedule = '0 */4 * * *' // Every 4 hours
  ): RSSFeedCollector {
    const source: DataSource = {
      id: `rss_${competitorTarget.id}`,
      name: `${competitorTarget.name} RSS Feed`,
      type: 'rss',
      url: feedUrl,
      rateLimit: {
        requestsPerHour: 24,
        requestsPerDay: 288,
        burstLimit: 5
      },
      reliability: 0.9
    };

    return new RSSFeedCollector(`rss_collector_${competitorTarget.id}`, source, schedule);
  }

  static createWebScrapingCollector(
    competitorTarget: CompetitorTarget,
    pageUrl: string,
    selectors: ScrapingSelectors,
    schedule: CronSchedule = '0 */6 * * *' // Every 6 hours
  ): WebScrapingCollector {
    const source: DataSource = {
      id: `scrape_${competitorTarget.id}`,
      name: `${competitorTarget.name} Web Scraping`,
      type: 'web_scraping',
      url: pageUrl,
      rateLimit: {
        requestsPerHour: 10,
        requestsPerDay: 48,
        burstLimit: 2
      },
      reliability: 0.8
    };

    return new WebScrapingCollector(
      `scrape_collector_${competitorTarget.id}`,
      source,
      schedule,
      selectors
    );
  }

  static createJobBoardCollector(
    competitorTarget: CompetitorTarget,
    jobBoards: JobBoardConfig[],
    schedule: CronSchedule = '0 8 * * *' // Daily at 8 AM
  ): JobBoardCollector {
    const source: DataSource = {
      id: `jobs_${competitorTarget.id}`,
      name: `${competitorTarget.name} Job Monitoring`,
      type: 'job_board',
      url: jobBoards[0]?.searchUrl || '',
      rateLimit: {
        requestsPerHour: 5,
        requestsPerDay: 24,
        burstLimit: 1
      },
      reliability: 0.7
    };

    return new JobBoardCollector(
      `jobs_collector_${competitorTarget.id}`,
      source,
      schedule,
      jobBoards
    );
  }
}

// Supporting interfaces
interface RSSItem {
  id: string;
  title: string;
  content: string;
  url: string;
  publishedAt: Date;
  author: string;
  categories: string[];
  source: string;
}

interface ScrapedData {
  url: string;
  title: string;
  content: string;
  lastModified: Date;
  pricing?: PricingInfo[];
  features?: string[];
  metadata: Record<string, unknown>;
}

interface ScrapingSelectors {
  title: string;
  content: string;
  pricing?: string;
  features?: string;
}

interface PricingInfo {
  amount: number;
  currency: string;
  period: string;
  plan: string;
}

interface JobListing {
  title: string;
  company: string;
  location: string;
  description: string;
  postedDate: Date;
  url: string;
  source: string;
  skills: string[];
}

interface JobBoardConfig {
  name: string;
  baseUrl: string;
  searchUrl: string;
  selectors: {
    jobItems: string;
    title: string;
    company: string;
    location: string;
    description: string;
    date: string;
    link: string;
  };
}