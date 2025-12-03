#!/usr/bin/env npx ts-node

import { Types } from 'mongoose';
import connectDB from '../src/lib/db/mongodb';
import Supermarket from '../src/lib/db/models/Supermarket';
import CrawlerScheduler, { CrawlType } from '../src/lib/crawler/scheduler';

async function main() {
  const args = process.argv.slice(2);

  const typeArg = args.find((a) => a.startsWith('--type='));
  const slugArg = args.find((a) => a.startsWith('--supermarket='));
  const categoryArg = args.find((a) => a.startsWith('--category='));
  const allFlag = args.includes('--all');
  const helpFlag = args.includes('--help') || args.includes('-h');

  if (helpFlag) {
    console.log(`
Usage: npx ts-node scripts/crawl.ts [options]

Options:
  --type=<products|deals>   Type of crawl (default: deals)
  --supermarket=<slug>      Supermarket slug to crawl (e.g., globus)
  --category=<slug>         Category slug to crawl (e.g., obst-gemuese)
  --all                     Crawl all active supermarkets
  --help, -h                Show this help message

Examples:
  npx ts-node scripts/crawl.ts --type=deals --supermarket=globus
  npx ts-node scripts/crawl.ts --type=products --supermarket=globus --category=obst-gemuese
  npx ts-node scripts/crawl.ts --type=products --all
  npx ts-node scripts/crawl.ts --all
`);
    process.exit(0);
  }

  const type: CrawlType = (typeArg?.split('=')[1] as CrawlType) || 'deals';
  const supermarketSlug = slugArg?.split('=')[1];
  const categorySlug = categoryArg?.split('=')[1];

  if (!['products', 'deals'].includes(type)) {
    console.error('Error: Invalid type. Use "products" or "deals".');
    process.exit(1);
  }

  if (!supermarketSlug && !allFlag) {
    console.error('Error: Provide --supermarket=<slug> or use --all.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await connectDB();

  const scheduler = new CrawlerScheduler({
    maxRetries: 3,
    retryIntervalMs: 5 * 60 * 1000,
  });

  let supermarkets;

  if (allFlag) {
    supermarkets = await Supermarket.find({ isActive: true });
    if (supermarkets.length === 0) {
      console.error('No active supermarkets found.');
      process.exit(1);
    }
    console.log(`Found ${supermarkets.length} active supermarket(s)`);
  } else {
    const supermarket = await Supermarket.findOne({ slug: supermarketSlug });
    if (!supermarket) {
      console.error(`Supermarket "${supermarketSlug}" not found.`);
      process.exit(1);
    }
    if (!supermarket.isActive) {
      console.error(`Supermarket "${supermarketSlug}" is not active.`);
      process.exit(1);
    }
    supermarkets = [supermarket];
  }

  console.log(`Starting ${type} crawl...`);
  console.log('---');

  let successCount = 0;
  let failCount = 0;

  for (const supermarket of supermarkets) {
    console.log(`\nCrawling ${supermarket.name} (${type})...`);

    try {
      const result = await scheduler.runWithRetry(
        supermarket._id as Types.ObjectId,
        type,
        1,
        categorySlug
      );

      if (result.success) {
        console.log(`  ✓ ${result.message}`);
        successCount++;
      } else {
        console.log(`  ✗ ${result.message}`);
        failCount++;
      }
    } catch (error) {
      console.error(`  ✗ Error: ${error instanceof Error ? error.message : String(error)}`);
      failCount++;
    }
  }

  console.log('\n---');
  console.log(`Crawl complete: ${successCount} succeeded, ${failCount} failed`);

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
