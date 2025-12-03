import { Types } from 'mongoose';
import { BaseCrawler, CrawlConfig, CrawlResult } from '../base';
import { parsePriceText } from '../../utils/price';
import { parseGermanDate, getCalendarWeek } from '../../utils/date';

export interface RawDeal {
  productName: string;
  productBrand?: string;
  productImageUrl: string;
  currentPrice: number;
  originalPrice: number | null;
  discountPercent: number | null;
  unitType: 'piece' | 'kg' | 'liter' | '100g' | '100ml';
  unitPrice?: number;
  priceText: string;
  originalPriceText?: string;
  startDate: Date;
  endDate: Date;
  source: 'flyer' | 'website' | 'api';
  sourceRef: string;
  sourceUrl?: string;
  categorySlug: string;
}

const DEFAULT_SELECTORS = {
  dealCard: '[data-testid="deal-card"], .deal-card, .offer-card, .flyer-item',
  dealName: '[data-testid="deal-name"], .deal-name, .offer-title, h2, h3',
  dealPrice: '[data-testid="deal-price"], .deal-price, .offer-price, .current-price',
  originalPrice: '.original-price, .was-price, .strikethrough, del',
  dealImage: '[data-testid="deal-image"] img, .deal-image img, .offer-image img',
  discount: '.discount, .savings, .discount-badge, [data-testid="discount"]',
  validity: '.validity, .valid-dates, .offer-period, [data-testid="validity"]',
  category: '.category, .deal-category, [data-testid="category"]',
  flyerPage: '.flyer-page, [data-page], .prospekt-page',
  weekSelector: '.week-selector, [data-testid="week"]',
};

export class GlobusDealsCrawler extends BaseCrawler<RawDeal> {
  private supermarketId: Types.ObjectId;
  private locationSlug: string;
  private flyerUrl: string;

  constructor(
    supermarketId: Types.ObjectId,
    flyerUrl: string,
    locationSlug: string = 'halle-dieselstrasse',
    config: Partial<CrawlConfig> = {}
  ) {
    super({
      ...config,
      selectors: { ...DEFAULT_SELECTORS, ...config.selectors },
    });
    this.supermarketId = supermarketId;
    this.flyerUrl = flyerUrl;
    this.locationSlug = locationSlug;
  }

  async crawl(): Promise<CrawlResult<RawDeal>> {
    const result: CrawlResult<RawDeal> = {
      success: false,
      data: [],
      errors: [],
      pagesProcessed: 0,
    };

    try {
      await this.init();
      const page = await this.createPage();

      const success = await this.navigateWithRetry(page, this.flyerUrl);
      if (!success) {
        result.errors.push(`Failed to load flyer page: ${this.flyerUrl}`);
        return result;
      }

      await this.delay(2000);

      const validityDates = await this.extractValidityDates(page);
      const currentWeek = `KW${getCalendarWeek()}`;

      const flyerPages = await this.getFlyerPages(page);
      console.log(`Found ${flyerPages.length} flyer pages`);

      for (let i = 0; i < flyerPages.length; i++) {
        try {
          if (i > 0) {
            await this.navigateToPage(page, flyerPages[i]);
            await this.delay();
          }

          const pageDeals = await this.extractDeals(page, validityDates, currentWeek, i + 1);
          result.data.push(...pageDeals);
          result.pagesProcessed++;

          console.log(`Extracted ${pageDeals.length} deals from page ${i + 1}`);
        } catch (error) {
          const errorMsg = `Error extracting deals from page ${i + 1}: ${error}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }
      }

      if (result.data.length === 0) {
        const fallbackDeals = await this.extractDealsFromCurrentPage(
          page,
          validityDates,
          currentWeek
        );
        result.data.push(...fallbackDeals);
        result.pagesProcessed = 1;
      }

      result.success = result.errors.length === 0 || result.data.length > 0;
    } catch (error) {
      result.errors.push(`Crawler error: ${error}`);
    } finally {
      await this.close();
    }

    return result;
  }

  private async extractValidityDates(
    page: Awaited<ReturnType<typeof this.createPage>>
  ): Promise<{ startDate: Date; endDate: Date }> {
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(now.getDate() - now.getDay() + 1);
    const defaultEnd = new Date(defaultStart);
    defaultEnd.setDate(defaultStart.getDate() + 6);

    try {
      const validityText = await page.evaluate((selector) => {
        const el = document.querySelector(selector);
        return el?.textContent?.trim() || '';
      }, this.config.selectors.validity);

      if (validityText) {
        const dateMatch = validityText.match(
          /(\d{1,2}\.\d{1,2}\.?\d{0,4})\s*[-–]\s*(\d{1,2}\.\d{1,2}\.?\d{0,4})/
        );
        if (dateMatch) {
          const start = parseGermanDate(dateMatch[1], now.getFullYear());
          const end = parseGermanDate(dateMatch[2], now.getFullYear());
          if (start && end) {
            return { startDate: start, endDate: end };
          }
        }
      }
    } catch (error) {
      console.error('Error extracting validity dates:', error);
    }

    return { startDate: defaultStart, endDate: defaultEnd };
  }

  private async getFlyerPages(
    page: Awaited<ReturnType<typeof this.createPage>>
  ): Promise<string[]> {
    const pages = await page.evaluate((selector) => {
      const pageElements = document.querySelectorAll(selector);
      const urls: string[] = [];

      pageElements.forEach((el) => {
        const link = el.querySelector('a') as HTMLAnchorElement;
        if (link?.href) {
          urls.push(link.href);
        } else {
          const pageNum = el.getAttribute('data-page');
          if (pageNum) {
            urls.push(pageNum);
          }
        }
      });

      return urls;
    }, this.config.selectors.flyerPage);

    return pages.length > 0 ? pages : [this.flyerUrl];
  }

  private async navigateToPage(
    page: Awaited<ReturnType<typeof this.createPage>>,
    pageRef: string
  ): Promise<void> {
    if (pageRef.startsWith('http')) {
      await this.navigateWithRetry(page, pageRef);
    } else {
      await page.evaluate((pageNum) => {
        const pageEl = document.querySelector(`[data-page="${pageNum}"]`);
        if (pageEl) {
          (pageEl as HTMLElement).click();
        }
      }, pageRef);
      await this.delay(1000);
    }
  }

  private async extractDeals(
    page: Awaited<ReturnType<typeof this.createPage>>,
    validityDates: { startDate: Date; endDate: Date },
    sourceRef: string,
    pageNum: number
  ): Promise<RawDeal[]> {
    const selectors = this.config.selectors;

    const rawDeals = await page.evaluate(
      (sel) => {
        const deals: Array<{
          name: string;
          brand: string;
          imageUrl: string;
          priceText: string;
          originalPriceText: string;
          discountText: string;
          categorySlug: string;
        }> = [];

        const cards = document.querySelectorAll(sel.dealCard);

        cards.forEach((card) => {
          const nameEl = card.querySelector(sel.dealName);
          const priceEl = card.querySelector(sel.dealPrice);
          const originalPriceEl = card.querySelector(sel.originalPrice);
          const imageEl = card.querySelector(sel.dealImage) as HTMLImageElement;
          const discountEl = card.querySelector(sel.discount);
          const categoryEl = card.querySelector(sel.category);

          const name = nameEl?.textContent?.trim() || '';
          const priceText = priceEl?.textContent?.trim() || '';

          if (name && priceText) {
            const brandMatch = name.match(/^([A-Z][a-zA-Z&\s]+?)\s+/);
            deals.push({
              name,
              brand: brandMatch ? brandMatch[1].trim() : '',
              imageUrl: imageEl?.src || '',
              priceText,
              originalPriceText: originalPriceEl?.textContent?.trim() || '',
              discountText: discountEl?.textContent?.trim() || '',
              categorySlug: categoryEl?.textContent?.toLowerCase().replace(/\s+/g, '-') || 'sonstiges',
            });
          }
        });

        return deals;
      },
      selectors
    );

    return rawDeals.map((deal) => {
      const currentPrice = parsePriceText(deal.priceText) || 0;
      const originalPrice = parsePriceText(deal.originalPriceText);
      let discountPercent: number | null = null;

      if (deal.discountText) {
        const discountMatch = deal.discountText.match(/(\d+)\s*%/);
        if (discountMatch) {
          discountPercent = parseInt(discountMatch[1], 10);
        }
      }

      if (!discountPercent && originalPrice && currentPrice) {
        discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
      }

      return {
        productName: deal.name,
        productBrand: deal.brand || undefined,
        productImageUrl: deal.imageUrl,
        currentPrice,
        originalPrice,
        discountPercent,
        unitType: 'piece' as const,
        priceText: deal.priceText,
        originalPriceText: deal.originalPriceText || undefined,
        startDate: validityDates.startDate,
        endDate: validityDates.endDate,
        source: 'flyer' as const,
        sourceRef: `${sourceRef} Seite ${pageNum}`,
        sourceUrl: this.flyerUrl,
        categorySlug: deal.categorySlug,
      };
    });
  }

  private async extractDealsFromCurrentPage(
    page: Awaited<ReturnType<typeof this.createPage>>,
    validityDates: { startDate: Date; endDate: Date },
    sourceRef: string
  ): Promise<RawDeal[]> {
    return this.extractDeals(page, validityDates, sourceRef, 1);
  }
}

export default GlobusDealsCrawler;
