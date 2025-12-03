import mongoose from 'mongoose';
import Product from '../src/lib/db/models/Product';
import Category from '../src/lib/db/models/Category';
import Supermarket from '../src/lib/db/models/Supermarket';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping-deals';

interface SubCategoryInfo {
  slug: string;
  name: string;
  parentSlug: string;
  count: number;
}

async function extractSubCategories() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);

  const supermarket = await Supermarket.findOne({ slug: 'globus' });
  if (!supermarket) {
    console.error('Globus supermarket not found');
    process.exit(1);
  }

  const products = await Product.find({ supermarketId: supermarket._id }).lean();
  console.log(`Found ${products.length} products to analyze\n`);

  const subCategories = new Map<string, SubCategoryInfo>();
  const productSubCategoryMap = new Map<string, string>(); // productId -> subCategorySlug

  for (const product of products) {
    if (!product.sourceUrl) continue;

    // URL format: /halle-dieselstrasse/obst-gemuese/frisches-gemuese/frischer-salat/2000491193005/...
    const urlParts = product.sourceUrl.split('/').filter(Boolean);
    const locationIndex = urlParts.findIndex(p => p === 'halle-dieselstrasse');
    
    if (locationIndex === -1) continue;

    const pathParts = urlParts.slice(locationIndex + 1);
    // pathParts: [category, subcategory?, sub-subcategory?, productId, productSlug]
    
    if (pathParts.length >= 3) {
      const mainCategorySlug = pathParts[0];
      const subCategorySlug = pathParts[1];
      
      // Skip if subcategory looks like a product ID (all numbers)
      if (/^\d+$/.test(subCategorySlug)) continue;

      const fullSlug = `${mainCategorySlug}/${subCategorySlug}`;
      
      if (subCategories.has(fullSlug)) {
        subCategories.get(fullSlug)!.count++;
      } else {
        // Convert slug to name (e.g., "frisches-gemuese" -> "Frisches Gemüse")
        const name = subCategorySlug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
          .replace(/ue/g, 'ü')
          .replace(/ae/g, 'ä')
          .replace(/oe/g, 'ö');

        subCategories.set(fullSlug, {
          slug: subCategorySlug,
          name,
          parentSlug: mainCategorySlug,
          count: 1,
        });
      }

      productSubCategoryMap.set(String(product._id), fullSlug);
    }
  }

  // Print discovered sub-categories
  console.log('Discovered sub-categories:\n');
  const sortedCategories = Array.from(subCategories.entries()).sort((a, b) => {
    if (a[1].parentSlug !== b[1].parentSlug) {
      return a[1].parentSlug.localeCompare(b[1].parentSlug);
    }
    return b[1].count - a[1].count;
  });

  let currentParent = '';
  for (const [fullSlug, info] of sortedCategories) {
    if (info.parentSlug !== currentParent) {
      currentParent = info.parentSlug;
      const parentCat = await Category.findOne({ 
        supermarketId: supermarket._id, 
        slug: currentParent,
        parentId: null 
      });
      console.log(`\n📁 ${parentCat?.nameVi || parentCat?.name || currentParent}`);
    }
    console.log(`   └── ${info.name} (${info.slug}): ${info.count} sản phẩm`);
  }

  // Ask to create sub-categories
  console.log(`\n\nFound ${subCategories.size} sub-categories.`);
  console.log('Creating sub-categories in database...\n');

  let created = 0;
  let updated = 0;

  for (const [fullSlug, info] of subCategories) {
    const parentCategory = await Category.findOne({
      supermarketId: supermarket._id,
      slug: info.parentSlug,
      parentId: null,
    });

    if (!parentCategory) {
      console.log(`  ⚠ Parent category not found: ${info.parentSlug}`);
      continue;
    }

    const existing = await Category.findOne({
      supermarketId: supermarket._id,
      slug: info.slug,
      parentId: parentCategory._id,
    });

    if (existing) {
      existing.productCount = info.count;
      await existing.save();
      updated++;
    } else {
      await Category.create({
        supermarketId: supermarket._id,
        parentId: parentCategory._id,
        name: info.name,
        nameVi: info.name, // Can be translated later
        slug: info.slug,
        externalId: info.slug,
        productCount: info.count,
        isActive: true,
        sortOrder: 0,
      });
      created++;
    }
  }

  console.log(`\nSub-categories: ${created} created, ${updated} updated`);

  // Update products with subCategoryId
  console.log('\nUpdating products with sub-category...');
  
  let productsUpdated = 0;
  for (const [productId, fullSlug] of productSubCategoryMap) {
    const [parentSlug, subSlug] = fullSlug.split('/');
    
    const parentCategory = await Category.findOne({
      supermarketId: supermarket._id,
      slug: parentSlug,
      parentId: null,
    });

    if (!parentCategory) continue;

    const subCategory = await Category.findOne({
      supermarketId: supermarket._id,
      slug: subSlug,
      parentId: parentCategory._id,
    });

    if (subCategory) {
      await Product.updateOne(
        { _id: productId },
        { $set: { subCategoryId: subCategory._id } }
      );
      productsUpdated++;
    }
  }

  console.log(`Products updated with sub-category: ${productsUpdated}`);

  await mongoose.disconnect();
  console.log('\nDone!');
}

extractSubCategories().catch(console.error);
