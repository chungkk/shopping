import { Types } from 'mongoose';
import { BaseCrawler, CrawlConfig, CrawlResult } from '../base';
import { parseUnitPriceText } from '../../utils/price';

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
  productCard: '.card.product-box',
  productName: 'a.product-name',
  productPrice: '.unit-price.js-unit-price',
  productImage: '.product-image-link img',
  productLink: 'a.product-image-link',
  unitPrice: '.product-price-unit',
  pagination: '.pagination',
  nextPage: '.pagination .page-next',
  categoryLink: '.main-navigation-link, .sidebar-navigation a',
};

export class GlobusProductCrawler extends BaseCrawler<RawProduct> {
  private supermarketId: Types.ObjectId;
  private baseUrl = 'https://produkte.globus.de';
  private locationSlug = 'halle-dieselstrasse';

  constructor(supermarketId: Types.ObjectId, config: Partial<CrawlConfig> = {}) {
    super({
      ...config,
      selectors: { ...DEFAULT_SELECTORS, ...config.selectors },
    });
    this.supermarketId = supermarketId;
  }

  setLocationSlug(slug: string) {
    this.locationSlug = slug;
  }

  async crawl(categorySlug?: string): Promise<CrawlResult<RawProduct>> {
    const result: CrawlResult<RawProduct> = {
      success: false,
      data: [],
      errors: [],
      pagesProcessed: 0,
    };

    try {
      await this.init();
      const page = await this.createPage();

      let categories = await this.fetchCategories(page);
      
      if (categorySlug) {
        categories = categories.filter(c => c.slug === categorySlug);
        if (categories.length === 0) {
          result.errors.push(`Category "${categorySlug}" not found`);
          return result;
        }
      }
      
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
    const locationUrl = `${this.baseUrl}/${this.locationSlug}`;
    const success = await this.navigateWithRetry(page, locationUrl);
    if (!success) {
      throw new Error('Failed to load main page');
    }

    await this.delay(2000);

    const categories = await page.evaluate((locationSlug) => {
      const links = document.querySelectorAll('.navigation-mega-menu-category-link');
      const cats: Array<{ name: string; slug: string; url: string }> = [];
      const seen = new Set<string>();

      const excludeSlugs = ['angebote-der-woche', 'mein-globus-rabatte', 'geschenkgutscheine', 'vorbestellservice'];

      links.forEach((link) => {
        const href = (link as HTMLAnchorElement).href;
        const name = link.textContent?.trim() || '';
        if (href && name && href.includes(`/${locationSlug}/`)) {
          const parts = href.split(`/${locationSlug}/`);
          if (parts[1]) {
            const pathSegments = parts[1].replace(/\/$/, '').split('/');
            if (pathSegments.length === 1) {
              const slug = pathSegments[0];
              if (slug && !seen.has(slug) && !excludeSlugs.includes(slug)) {
                seen.add(slug);
                cats.push({ name, slug, url: href });
              }
            }
          }
        }
      });

      return cats;
    }, this.locationSlug);

    return categories;
  }

  private async crawlCategory(
    page: Awaited<ReturnType<typeof this.createPage>>,
    category: { name: string; slug: string; url: string }
  ): Promise<{ products: RawProduct[]; pagesProcessed: number }> {
    const products: RawProduct[] = [];
    let pagesProcessed = 0;

    const success = await this.navigateWithRetry(page, category.url);
    if (!success) return { products, pagesProcessed };

    await this.delay(1000);

    const totalPages = await this.getTotalPages(page);
    console.log(`  Category "${category.name}" has ${totalPages} pages`);

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const pageUrl = pageNum === 1 ? category.url : `${category.url}?p=${pageNum}`;
      
      if (pageNum > 1) {
        const navSuccess = await this.navigateWithRetry(page, pageUrl);
        if (!navSuccess) {
          console.log(`  Failed to load page ${pageNum}`);
          continue;
        }
        await this.delay(500);
      }

      try {
        await this.waitForSelector(page, this.config.selectors.productCard, 5000);
        const pageData = await this.extractProducts(page, category.slug);
        products.push(...pageData.products);
        pagesProcessed++;
        console.log(`    Page ${pageNum}/${totalPages}: ${pageData.products.length} products`);
      } catch (error) {
        console.log(`  Error on page ${pageNum}: ${error}`);
      }

      await this.delay(500);
    }

    return { products, pagesProcessed };
  }

  private async getTotalPages(
    page: Awaited<ReturnType<typeof this.createPage>>
  ): Promise<number> {
    return page.evaluate(() => {
      const lastPageInput = document.querySelector('.page-last input[name="p"]') as HTMLInputElement;
      if (lastPageInput?.value) {
        return parseInt(lastPageInput.value, 10);
      }
      return 1;
    });
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
          price: number;
          unitPriceText: string;
          sourceUrl: string;
          categorySlug: string;
        }> = [];

        const cards = document.querySelectorAll(sel.productCard);

        cards.forEach((card, index) => {
          const nameEl = card.querySelector(sel.productName);
          const priceEl = card.querySelector(sel.productPrice) as HTMLElement;
          const imageEl = card.querySelector(sel.productImage) as HTMLImageElement;
          const linkEl = card.querySelector(sel.productLink) as HTMLAnchorElement;
          const unitPriceEl = card.querySelector(sel.unitPrice);

          const name = nameEl?.textContent?.trim() || '';
          const priceValue = priceEl?.dataset?.value || priceEl?.getAttribute('data-value') || '0';
          const price = parseFloat(priceValue) || 0;
          const imageUrl = imageEl?.src || '';
          const sourceUrl = linkEl?.href || window.location.href;
          const unitPriceText = unitPriceEl?.textContent?.trim() || '';
          const gtin = linkEl?.dataset?.productGtin || linkEl?.getAttribute('data-product-gtin');

          const urlParts = sourceUrl.split('/');
          const externalId = gtin || urlParts.find((p) => /^\d+$/.test(p)) || `${catSlug}-${index}`;

          if (name && price > 0) {
            products.push({
              externalId,
              name,
              imageUrl,
              price,
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
      const unitPriceData = parseUnitPriceText(p.unitPriceText);

      return {
        externalId: p.externalId,
        name: p.name,
        imageUrl: p.imageUrl,
        basePrice: p.price,
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
