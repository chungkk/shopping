import { Types } from 'mongoose';
import { BaseCrawler, CrawlConfig, CrawlResult } from '../base';
import { parsePriceText, parseUnitPriceText } from '../../utils/price';

export interface RawProduct {
  externalId: string;
  name: string;
  brand?: string;
  description?: string;
  imageUrl: string;
  basePrice: number;
  unitType: 'piece' | 'kg' | 'liter' | '100g' | '100ml';
  unitPrice?: number;
  unitPriceText?: string;
  sourceUrl: string;
  categorySlug: string;
}

interface ProductPageData {
  products: RawProduct[];
  hasNextPage: boolean;
}

const DEFAULT_SELECTORS = {
  productCard: '[data-testid="product-card"], .product-card, .product-tile',
  productName: '[data-testid="product-name"], .product-name, .product-title, h2, h3',
  productPrice: '[data-testid="product-price"], .product-price, .price',
  productImage: '[data-testid="product-image"] img, .product-image img, img[src*="produkte"]',
  productLink: 'a[href*="/produkt/"], a[href*="produkt"]',
  unitPrice: '.unit-price, .base-price, [data-testid="unit-price"]',
  pagination: '.pagination, [data-testid="pagination"]',
  nextPage: '.pagination-next, [data-testid="next-page"], a[rel="next"]',
  categoryLink: 'nav a[href*="/sortiment/"], .category-nav a',
};

export class GlobusProductCrawler extends BaseCrawler<RawProduct> {
  private supermarketId: Types.ObjectId;
  private baseUrl = 'https://produkte.globus.de';

  constructor(supermarketId: Types.ObjectId, config: Partial<CrawlConfig> = {}) {
    super({
      ...config,
      selectors: { ...DEFAULT_SELECTORS, ...config.selectors },
    });
    this.supermarketId = supermarketId;
  }

  async crawl(): Promise<CrawlResult<RawProduct>> {
    const result: CrawlResult<RawProduct> = {
      success: false,
      data: [],
      errors: [],
      pagesProcessed: 0,
    };

    try {
      await this.init();
      const page = await this.createPage();

      const categories = await this.fetchCategories(page);
      console.log(`Found ${categories.length} categories to crawl`);

      for (const category of categories) {
        try {
          const categoryProducts = await this.crawlCategory(page, category);
          result.data.push(...categoryProducts.products);
          result.pagesProcessed += categoryProducts.pagesProcessed;
          console.log(
            `Crawled ${categoryProducts.products.length} products from ${category.name}`
          );
        } catch (error) {
          const errorMsg = `Error crawling category ${category.name}: ${error}`;
          console.error(errorMsg);
          result.errors.push(errorMsg);
        }

        await this.delay();
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.errors.push(`Crawler error: ${error}`);
    } finally {
      await this.close();
    }

    return result;
  }

  private async fetchCategories(
    page: Awaited<ReturnType<typeof this.createPage>>
  ): Promise<Array<{ name: string; slug: string; url: string }>> {
    const success = await this.navigateWithRetry(page, this.baseUrl);
    if (!success) {
      throw new Error('Failed to load main page');
    }

    await this.waitForSelector(page, this.config.selectors.categoryLink);

    const categories = await page.evaluate((selector) => {
      const links = document.querySelectorAll(selector);
      const cats: Array<{ name: string; slug: string; url: string }> = [];

      links.forEach((link) => {
        const href = (link as HTMLAnchorElement).href;
        const name = link.textContent?.trim() || '';
        if (href && name && href.includes('/sortiment/')) {
          const slug = href.split('/sortiment/')[1]?.split('/')[0] || '';
          if (slug) {
            cats.push({ name, slug, url: href });
          }
        }
      });

      return cats;
    }, this.config.selectors.categoryLink);

    return categories;
  }

  private async crawlCategory(
    page: Awaited<ReturnType<typeof this.createPage>>,
    category: { name: string; slug: string; url: string }
  ): Promise<{ products: RawProduct[]; pagesProcessed: number }> {
    const products: RawProduct[] = [];
    let pagesProcessed = 0;
    let currentUrl = category.url;

    while (currentUrl) {
      const success = await this.navigateWithRetry(page, currentUrl);
      if (!success) break;

      await this.waitForSelector(page, this.config.selectors.productCard, 5000);

      const pageData = await this.extractProducts(page, category.slug);
      products.push(...pageData.products);
      pagesProcessed++;

      if (pageData.hasNextPage) {
        const nextUrl = await this.getNextPageUrl(page);
        if (nextUrl && nextUrl !== currentUrl) {
          currentUrl = nextUrl;
          await this.delay();
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return { products, pagesProcessed };
  }

  private async extractProducts(
    page: Awaited<ReturnType<typeof this.createPage>>,
    categorySlug: string
  ): Promise<ProductPageData> {
    const selectors = this.config.selectors;

    const data = await page.evaluate(
      (sel, catSlug) => {
        const products: Array<{
          externalId: string;
          name: string;
          imageUrl: string;
          priceText: string;
          unitPriceText: string;
          sourceUrl: string;
          categorySlug: string;
        }> = [];

        const cards = document.querySelectorAll(sel.productCard);

        cards.forEach((card, index) => {
          const nameEl = card.querySelector(sel.productName);
          const priceEl = card.querySelector(sel.productPrice);
          const imageEl = card.querySelector(sel.productImage) as HTMLImageElement;
          const linkEl = card.querySelector(sel.productLink) as HTMLAnchorElement;
          const unitPriceEl = card.querySelector(sel.unitPrice);

          const name = nameEl?.textContent?.trim() || '';
          const priceText = priceEl?.textContent?.trim() || '';
          const imageUrl = imageEl?.src || '';
          const sourceUrl = linkEl?.href || window.location.href;
          const unitPriceText = unitPriceEl?.textContent?.trim() || '';

          const urlParts = sourceUrl.split('/');
          const externalId =
            urlParts.find((p) => /^\d+$/.test(p)) || `${catSlug}-${index}`;

          if (name && priceText) {
            products.push({
              externalId,
              name,
              imageUrl,
              priceText,
              unitPriceText,
              sourceUrl,
              categorySlug: catSlug,
            });
          }
        });

        const hasNextPage = !!document.querySelector(sel.nextPage);

        return { products, hasNextPage };
      },
      selectors,
      categorySlug
    );

    const parsedProducts: RawProduct[] = data.products.map((p) => {
      const basePrice = parsePriceText(p.priceText) || 0;
      const unitPriceData = parseUnitPriceText(p.unitPriceText);

      return {
        externalId: p.externalId,
        name: p.name,
        imageUrl: p.imageUrl,
        basePrice,
        unitType: (unitPriceData?.unitType as RawProduct['unitType']) || 'piece',
        unitPrice: unitPriceData?.unitPrice,
        unitPriceText: p.unitPriceText || undefined,
        sourceUrl: p.sourceUrl,
        categorySlug: p.categorySlug,
      };
    });

    return { products: parsedProducts, hasNextPage: data.hasNextPage };
  }

  private async getNextPageUrl(
    page: Awaited<ReturnType<typeof this.createPage>>
  ): Promise<string | null> {
    return page.evaluate((selector) => {
      const nextLink = document.querySelector(selector) as HTMLAnchorElement;
      return nextLink?.href || null;
    }, this.config.selectors.nextPage);
  }
}

export default GlobusProductCrawler;
