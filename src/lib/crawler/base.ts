import puppeteer, { Browser, Page } from 'puppeteer';

export interface CrawlConfig {
  delayMs: number;
  userAgent: string;
  selectors: Record<string, string>;
}

export interface CrawlResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  pagesProcessed: number;
}

const DEFAULT_CONFIG: CrawlConfig = {
  delayMs: 3000,
  userAgent: 'ShoppingDeals Bot/1.0 (+https://shopping-deals.app)',
  selectors: {},
};

export abstract class BaseCrawler<T> {
  protected browser: Browser | null = null;
  protected config: CrawlConfig;

  constructor(config: Partial<CrawlConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async init(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  protected async createPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call init() first.');
    }

    const page = await this.browser.newPage();
    await page.setUserAgent(this.config.userAgent);
    await page.setViewport({ width: 1920, height: 1080 });

    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(30000);

    return page;
  }

  protected async delay(ms?: number): Promise<void> {
    const delayTime = ms ?? this.config.delayMs;
    return new Promise((resolve) => setTimeout(resolve, delayTime));
  }

  protected async navigateWithRetry(
    page: Page,
    url: string,
    maxRetries: number = 3
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        return true;
      } catch (error) {
        console.error(`Navigation attempt ${attempt}/${maxRetries} failed for ${url}:`, error);
        if (attempt < maxRetries) {
          await this.delay(this.config.delayMs * attempt);
        }
      }
    }
    return false;
  }

  protected async waitForSelector(
    page: Page,
    selector: string,
    timeout: number = 10000
  ): Promise<boolean> {
    try {
      await page.waitForSelector(selector, { timeout });
      return true;
    } catch {
      return false;
    }
  }

  protected async safeEvaluate<R>(
    page: Page,
    fn: () => R,
    defaultValue: R
  ): Promise<R> {
    try {
      return await page.evaluate(fn);
    } catch (error) {
      console.error('Evaluation error:', error);
      return defaultValue;
    }
  }

  abstract crawl(): Promise<CrawlResult<T>>;
}

export default BaseCrawler;
