import mongoose from 'mongoose';
import Product from '../src/lib/db/models/Product';
import Category from '../src/lib/db/models/Category';
import Supermarket from '../src/lib/db/models/Supermarket';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping-deals';

async function updateProductSubCategories() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);

  const supermarket = await Supermarket.findOne({ slug: 'globus' });
  if (!supermarket) {
    console.error('Globus not found');
    process.exit(1);
  }

  // Load all categories into memory for fast lookup
  const categories = await Category.find({ supermarketId: supermarket._id }).lean();
  const parentCatMap = new Map<string, typeof categories[0]>();
  const subCatMap = new Map<string, typeof categories[0]>();

  for (const cat of categories) {
    if (!cat.parentId) {
      parentCatMap.set(cat.slug, cat);
    } else {
      const key = `${cat.parentId.toString()}/${cat.slug}`;
      subCatMap.set(key, cat);
    }
  }

  console.log(`Loaded ${parentCatMap.size} parent categories, ${subCatMap.size} sub-categories`);

  // Process products in batches
  const batchSize = 1000;
  let processed = 0;
  let updated = 0;

  const totalProducts = await Product.countDocuments({ 
    supermarketId: supermarket._id,
    $or: [{ subCategoryId: null }, { subCategoryId: { $exists: false } }]
  });
  console.log(`Products to process: ${totalProducts}\n`);

  while (processed < totalProducts) {
    const products = await Product.find({ 
      supermarketId: supermarket._id,
      $or: [{ subCategoryId: null }, { subCategoryId: { $exists: false } }]
    })
      .skip(0) // Always start from 0 since we're updating
      .limit(batchSize)
      .lean();

    if (products.length === 0) break;

    const bulkOps: mongoose.mongo.AnyBulkWriteOperation<typeof Product>[] = [];

    for (const product of products) {
      if (!product.sourceUrl) continue;

      const urlParts = product.sourceUrl.split('/').filter(Boolean);
      const locationIndex = urlParts.findIndex(p => p === 'halle-dieselstrasse');
      if (locationIndex === -1) continue;

      const pathParts = urlParts.slice(locationIndex + 1);
      if (pathParts.length < 3) continue;

      const mainCategorySlug = pathParts[0];
      const subCategorySlug = pathParts[1];
      if (/^\d+$/.test(subCategorySlug)) continue;

      const parentCat = parentCatMap.get(mainCategorySlug);
      if (!parentCat) continue;

      const subCatKey = `${parentCat._id.toString()}/${subCategorySlug}`;
      const subCat = subCatMap.get(subCatKey);

      if (subCat) {
        bulkOps.push({
          updateOne: {
            filter: { _id: product._id },
            update: { $set: { subCategoryId: subCat._id } },
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      const result = await Product.bulkWrite(bulkOps);
      updated += result.modifiedCount;
    }

    processed += products.length;
    console.log(`Processed: ${processed}/${totalProducts}, Updated: ${updated}`);
  }

  console.log(`\nDone! Updated ${updated} products with sub-categories`);
  await mongoose.disconnect();
}

updateProductSubCategories().catch(console.error);
