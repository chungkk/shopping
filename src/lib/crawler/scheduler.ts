import { Types } from 'mongoose';
import connectDB from '../db/mongodb';
import Supermarket, { ISupermarket } from '../db/models/Supermarket';
import CrawlLog from '../db/models/CrawlLog';
import Product from '../db/models/Product';
import Deal from '../db/models/Deal';
import Category from '../db/models/Category';
import { GlobusProductCrawler } from './globus/products';
import { GlobusDealsCrawler } from './globus/deals';

export interface SchedulerConfig {
  maxRetries: number;
  retryIntervalMs: number;
  crawlIntervalMs: number;
}

const DEFAULT_CONFIG: SchedulerConfig = {
  maxRetries: 3,
  retryIntervalMs: 60 * 60 * 1000,
  crawlIntervalMs: 24 * 60 * 60 * 1000,
};

export type CrawlType = 'products' | 'deals';

export class CrawlerScheduler {
  private config: SchedulerConfig;
  private runningCrawls: Map<string, boolean> = new Map();

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async runCrawl(
    supermarketId: Types.ObjectId,
    type: CrawlType
  ): Promise<{ success: boolean; message: string }> {
    const crawlKey = `${supermarketId.toString()}-${type}`;

    if (this.runningCrawls.get(crawlKey)) {
      return { success: false, message: 'Crawl already in progress' };
    }

    this.runningCrawls.set(crawlKey, true);

    try {
      await connectDB();

      const supermarket = await Supermarket.findById(supermarketId);
      if (!supermarket) {
        return { success: false, message: 'Supermarket not found' };
      }

      if (!supermarket.isActive) {
        return { success: false, message: 'Supermarket is not active' };
      }

      const crawlLog = await CrawlLog.create({
        supermarketId,
        type,
        status: 'started',
        startedAt: new Date(),
        stats: {
          pagesProcessed: 0,
          itemsFound: 0,
          itemsCreated: 0,
          itemsUpdated: 0,
          errors: 0,
        },
      });

      try {
        const result =
          type === 'products'
            ? await this.crawlProducts(supermarket)
            : await this.crawlDeals(supermarket);

        crawlLog.status = result.success ? 'success' : 'failed';
        crawlLog.completedAt = new Date();
        crawlLog.duration = crawlLog.completedAt.getTime() - crawlLog.startedAt.getTime();
        crawlLog.stats = {
          pagesProcessed: result.pagesProcessed,
          itemsFound: result.itemsFound,
          itemsCreated: result.itemsCreated,
          itemsUpdated: result.itemsUpdated,
          errors: result.errors.length,
        };

        if (!result.success && result.errors.length > 0) {
          crawlLog.errorDetails = {
            message: result.errors[0],
            failedUrls: result.errors.slice(1),
          };
        }

        await crawlLog.save();

        if (type === 'products') {
          supermarket.lastCrawl.productsAt = new Date();
        } else {
          supermarket.lastCrawl.dealsAt = new Date();
        }
        supermarket.lastCrawl.status = result.success ? 'success' : 'failed';
        supermarket.lastCrawl.errorMessage = result.success ? undefined : result.errors[0];
        await supermarket.save();

        return {
          success: result.success,
          message: result.success
            ? `Crawled ${result.itemsFound} items, created ${result.itemsCreated}, updated ${result.itemsUpdated}`
            : `Crawl failed: ${result.errors[0]}`,
        };
      } catch (error) {
        crawlLog.status = 'failed';
        crawlLog.completedAt = new Date();
        crawlLog.duration = crawlLog.completedAt.getTime() - crawlLog.startedAt.getTime();
        crawlLog.errorDetails = {
          message: error instanceof Error ? error.message : String(error),
        };
        await crawlLog.save();

        supermarket.lastCrawl.status = 'failed';
        supermarket.lastCrawl.errorMessage =
          error instanceof Error ? error.message : String(error);
        await supermarket.save();

        throw error;
      }
    } finally {
      this.runningCrawls.set(crawlKey, false);
    }
  }

  private async crawlProducts(supermarket: ISupermarket): Promise<{
    success: boolean;
    pagesProcessed: number;
    itemsFound: number;
    itemsCreated: number;
    itemsUpdated: number;
    errors: string[];
  }> {
    const crawler = new GlobusProductCrawler(
      supermarket._id as Types.ObjectId,
      supermarket.crawlConfig
    );

    const result = await crawler.crawl();

    let itemsCreated = 0;
    let itemsUpdated = 0;

    for (const rawProduct of result.data) {
      try {
        const category = await Category.findOne({
          supermarketId: supermarket._id,
          slug: rawProduct.categorySlug,
        });

        const existingProduct = await Product.findOne({
          supermarketId: supermarket._id,
          externalId: rawProduct.externalId,
        });

        if (existingProduct) {
          existingProduct.name = rawProduct.name;
          existingProduct.imageUrl = rawProduct.imageUrl;
          existingProduct.basePrice = rawProduct.basePrice;
          existingProduct.unitType = rawProduct.unitType;
          existingProduct.unitPrice = rawProduct.unitPrice;
          existingProduct.unitPriceText = rawProduct.unitPriceText;
          existingProduct.sourceUrl = rawProduct.sourceUrl;
          existingProduct.lastSeenAt = new Date();
          existingProduct.isAvailable = true;
          await existingProduct.save();
          itemsUpdated++;
        } else {
          await Product.create({
            supermarketId: supermarket._id,
            categoryId: category?._id,
            externalId: rawProduct.externalId,
            name: rawProduct.name,
            imageUrl: rawProduct.imageUrl,
            basePrice: rawProduct.basePrice,
            unitType: rawProduct.unitType,
            unitPrice: rawProduct.unitPrice,
            unitPriceText: rawProduct.unitPriceText,
            sourceUrl: rawProduct.sourceUrl,
            isAvailable: true,
            firstSeenAt: new Date(),
            lastSeenAt: new Date(),
          });
          itemsCreated++;
        }
      } catch (error) {
        console.error(`Error saving product ${rawProduct.name}:`, error);
        result.errors.push(`Failed to save product: ${rawProduct.name}`);
      }
    }

    return {
      success: result.success,
      pagesProcessed: result.pagesProcessed,
      itemsFound: result.data.length,
      itemsCreated,
      itemsUpdated,
      errors: result.errors,
    };
  }

  private async crawlDeals(supermarket: ISupermarket): Promise<{
    success: boolean;
    pagesProcessed: number;
    itemsFound: number;
    itemsCreated: number;
    itemsUpdated: number;
    errors: string[];
  }> {
    const location = supermarket.locations[0];
    const flyerUrl = location?.flyerUrl || supermarket.flyerUrl;

    const crawler = new GlobusDealsCrawler(
      supermarket._id as Types.ObjectId,
      flyerUrl,
      location?.slug || 'default',
      supermarket.crawlConfig
    );

    const result = await crawler.crawl();

    let itemsCreated = 0;
    let itemsUpdated = 0;

    await Deal.updateMany(
      {
        supermarketId: supermarket._id,
        endDate: { $lt: new Date() },
      },
      { isActive: false }
    );

    for (const rawDeal of result.data) {
      try {
        const category = await Category.findOne({
          supermarketId: supermarket._id,
          slug: rawDeal.categorySlug,
        });

        const existingDeal = await Deal.findOne({
          supermarketId: supermarket._id,
          productName: rawDeal.productName,
          startDate: rawDeal.startDate,
          endDate: rawDeal.endDate,
        });

        const dealData = {
          supermarketId: supermarket._id,
          categoryId: category?._id,
          productName: rawDeal.productName,
          productBrand: rawDeal.productBrand,
          productImageUrl: rawDeal.productImageUrl,
          currentPrice: rawDeal.currentPrice,
          originalPrice: rawDeal.originalPrice,
          discountPercent: rawDeal.discountPercent,
          unitType: rawDeal.unitType,
          unitPrice: rawDeal.unitPrice,
          priceText: rawDeal.priceText,
          originalPriceText: rawDeal.originalPriceText,
          startDate: rawDeal.startDate,
          endDate: rawDeal.endDate,
          isActive: new Date() >= rawDeal.startDate && new Date() <= rawDeal.endDate,
          source: rawDeal.source,
          sourceRef: rawDeal.sourceRef,
          sourceUrl: rawDeal.sourceUrl,
        };

        if (existingDeal) {
          Object.assign(existingDeal, dealData);
          await existingDeal.save();
          itemsUpdated++;
        } else {
          await Deal.create(dealData);
          itemsCreated++;
        }
      } catch (error) {
        console.error(`Error saving deal ${rawDeal.productName}:`, error);
        result.errors.push(`Failed to save deal: ${rawDeal.productName}`);
      }
    }

    return {
      success: result.success,
      pagesProcessed: result.pagesProcessed,
      itemsFound: result.data.length,
      itemsCreated,
      itemsUpdated,
      errors: result.errors,
    };
  }

  async runWithRetry(
    supermarketId: Types.ObjectId,
    type: CrawlType,
    attempt: number = 1
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.runCrawl(supermarketId, type);

    if (!result.success && attempt < this.config.maxRetries) {
      console.log(
        `Crawl failed, scheduling retry ${attempt + 1}/${this.config.maxRetries} in ${
          this.config.retryIntervalMs / 1000
        }s`
      );

      await new Promise((resolve) => setTimeout(resolve, this.config.retryIntervalMs));
      return this.runWithRetry(supermarketId, type, attempt + 1);
    }

    return result;
  }

  async scheduleDaily(supermarketId: Types.ObjectId, type: CrawlType): Promise<void> {
    const runAndSchedule = async () => {
      await this.runWithRetry(supermarketId, type);
      setTimeout(runAndSchedule, this.config.crawlIntervalMs);
    };

    runAndSchedule();
  }
}

export default CrawlerScheduler;
