#!/usr/bin/env npx ts-node

import mongoose from 'mongoose';
import Supermarket from '../src/lib/db/models/Supermarket';
import Category from '../src/lib/db/models/Category';
import Deal from '../src/lib/db/models/Deal';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping-deals';

const sampleDeals = [
  {
    productName: 'Barilla Spaghetti No.5',
    productBrand: 'Barilla',
    categorySlug: 'sonstiges',
    currentPrice: 129,
    originalPrice: 179,
    unitType: 'piece',
    priceText: '1,29 €',
    originalPriceText: '1,79 €',
    productImageUrl: 'https://via.placeholder.com/300x300?text=Spaghetti',
  },
  {
    productName: 'Coca-Cola Classic 1.5L',
    productBrand: 'Coca-Cola',
    categorySlug: 'getraenke',
    currentPrice: 99,
    originalPrice: 149,
    unitType: 'liter',
    priceText: '0,99 €',
    originalPriceText: '1,49 €',
    productImageUrl: 'https://via.placeholder.com/300x300?text=Coca-Cola',
  },
  {
    productName: 'Milka Alpenmilch Schokolade',
    productBrand: 'Milka',
    categorySlug: 'suesses-salziges',
    currentPrice: 89,
    originalPrice: 119,
    unitType: '100g',
    priceText: '0,89 €',
    originalPriceText: '1,19 €',
    productImageUrl: 'https://via.placeholder.com/300x300?text=Milka',
  },
  {
    productName: 'Rinderhackfleisch',
    productBrand: 'Metzgerei Globus',
    categorySlug: 'fleisch-fisch',
    currentPrice: 499,
    originalPrice: 699,
    unitType: 'kg',
    priceText: '4,99 €',
    originalPriceText: '6,99 €',
    productImageUrl: 'https://via.placeholder.com/300x300?text=Hackfleisch',
  },
  {
    productName: 'Bio Vollmilch 3.8%',
    productBrand: 'Weihenstephan',
    categorySlug: 'molkereiprodukte',
    currentPrice: 149,
    originalPrice: 179,
    unitType: 'liter',
    priceText: '1,49 €',
    originalPriceText: '1,79 €',
    productImageUrl: 'https://via.placeholder.com/300x300?text=Milch',
  },
  {
    productName: 'Frische Brötchen',
    productBrand: 'Globus Bäckerei',
    categorySlug: 'brot-backwaren',
    currentPrice: 39,
    originalPrice: 49,
    unitType: 'piece',
    priceText: '0,39 €',
    originalPriceText: '0,49 €',
    productImageUrl: 'https://via.placeholder.com/300x300?text=Broetchen',
  },
  {
    productName: 'Tiefkühl Pizza Margherita',
    productBrand: 'Dr. Oetker',
    categorySlug: 'tiefkuehl',
    currentPrice: 199,
    originalPrice: 299,
    unitType: 'piece',
    priceText: '1,99 €',
    originalPriceText: '2,99 €',
    productImageUrl: 'https://via.placeholder.com/300x300?text=Pizza',
  },
  {
    productName: 'Bio Äpfel',
    productBrand: 'Regional',
    categorySlug: 'obst-gemuese',
    currentPrice: 199,
    originalPrice: 299,
    unitType: 'kg',
    priceText: '1,99 €',
    originalPriceText: '2,99 €',
    productImageUrl: 'https://via.placeholder.com/300x300?text=Aepfel',
  },
  {
    productName: 'Persil Waschmittel',
    productBrand: 'Persil',
    categorySlug: 'haushalt',
    currentPrice: 899,
    originalPrice: 1299,
    unitType: 'liter',
    priceText: '8,99 €',
    originalPriceText: '12,99 €',
    productImageUrl: 'https://via.placeholder.com/300x300?text=Persil',
  },
  {
    productName: 'Pampers Baby-Dry',
    productBrand: 'Pampers',
    categorySlug: 'drogerie',
    currentPrice: 1499,
    originalPrice: 1999,
    unitType: 'piece',
    priceText: '14,99 €',
    originalPriceText: '19,99 €',
    productImageUrl: 'https://via.placeholder.com/300x300?text=Pampers',
  },
];

async function main() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const supermarket = await Supermarket.findOne({ slug: 'globus' });
  if (!supermarket) {
    console.error('Globus supermarket not found. Run seed-supermarket.ts first.');
    process.exit(1);
  }

  const categories = await Category.find({ supermarketId: supermarket._id });
  if (categories.length === 0) {
    console.error('No categories found. Run seed-categories.ts first.');
    process.exit(1);
  }

  const categoryMap = new Map(categories.map((c) => [c.slug, c._id]));

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - today.getDay() + 1);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const calendarWeek = getCalendarWeek(startDate);

  console.log(`Creating sample deals for KW${calendarWeek}...`);
  console.log(`Valid from ${startDate.toLocaleDateString('de-DE')} to ${endDate.toLocaleDateString('de-DE')}`);

  let created = 0;
  let skipped = 0;

  for (const deal of sampleDeals) {
    const categoryId = categoryMap.get(deal.categorySlug);

    const existing = await Deal.findOne({
      supermarketId: supermarket._id,
      productName: deal.productName,
      startDate,
      endDate,
    });

    if (existing) {
      skipped++;
      continue;
    }

    await Deal.create({
      supermarketId: supermarket._id,
      categoryId,
      productName: deal.productName,
      productBrand: deal.productBrand,
      productImageUrl: deal.productImageUrl,
      currentPrice: deal.currentPrice,
      originalPrice: deal.originalPrice,
      unitType: deal.unitType,
      priceText: deal.priceText,
      originalPriceText: deal.originalPriceText,
      startDate,
      endDate,
      isActive: true,
      source: 'website',
      sourceRef: `KW${calendarWeek} Demo`,
      sourceUrl: 'https://www.globus.de/angebote',
    });

    created++;
    const discount = deal.originalPrice ? Math.round(((deal.originalPrice - deal.currentPrice) / deal.originalPrice) * 100) : 0;
    console.log(`  + ${deal.productName} (-${discount}%)`);
  }

  console.log(`\nDone: ${created} deals created, ${skipped} skipped`);
  await mongoose.disconnect();
  process.exit(0);
}

function getCalendarWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
