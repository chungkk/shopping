#!/usr/bin/env npx ts-node

import connectDB from '../src/lib/db/mongodb';
import Supermarket from '../src/lib/db/models/Supermarket';
import Category from '../src/lib/db/models/Category';
import Deal from '../src/lib/db/models/Deal';

const sampleDeals = [
  {
    productName: 'Barilla Spaghetti No.5',
    productBrand: 'Barilla',
    categorySlug: 'lebensmittel',
    currentPrice: 129,
    originalPrice: 179,
    discountPercent: 28,
    unitType: '500g',
    priceText: '1,29 €',
    originalPriceText: '1,79 €',
    productImageUrl: 'https://produkte.globus.de/media/images/product/barilla-spaghetti.jpg',
  },
  {
    productName: 'Coca-Cola Classic',
    productBrand: 'Coca-Cola',
    categorySlug: 'getraenke',
    currentPrice: 99,
    originalPrice: 149,
    discountPercent: 34,
    unitType: '1.5L',
    priceText: '0,99 €',
    originalPriceText: '1,49 €',
    productImageUrl: 'https://produkte.globus.de/media/images/product/coca-cola.jpg',
  },
  {
    productName: 'Milka Alpenmilch Schokolade',
    productBrand: 'Milka',
    categorySlug: 'suessigkeiten',
    currentPrice: 89,
    originalPrice: 119,
    discountPercent: 25,
    unitType: '100g',
    priceText: '0,89 €',
    originalPriceText: '1,19 €',
    productImageUrl: 'https://produkte.globus.de/media/images/product/milka.jpg',
  },
  {
    productName: 'Rinderhackfleisch',
    productBrand: 'Metzgerei Globus',
    categorySlug: 'fleisch',
    currentPrice: 499,
    originalPrice: 699,
    discountPercent: 29,
    unitType: '500g',
    priceText: '4,99 €',
    originalPriceText: '6,99 €',
    productImageUrl: 'https://produkte.globus.de/media/images/product/hackfleisch.jpg',
  },
  {
    productName: 'Bio Vollmilch 3.8%',
    productBrand: 'Weihenstephan',
    categorySlug: 'milchprodukte',
    currentPrice: 149,
    originalPrice: 179,
    discountPercent: 17,
    unitType: '1L',
    priceText: '1,49 €',
    originalPriceText: '1,79 €',
    productImageUrl: 'https://produkte.globus.de/media/images/product/milch.jpg',
  },
  {
    productName: 'Frische Brötchen',
    productBrand: 'Globus Bäckerei',
    categorySlug: 'backwaren',
    currentPrice: 39,
    originalPrice: 49,
    discountPercent: 20,
    unitType: 'Stück',
    priceText: '0,39 €',
    originalPriceText: '0,49 €',
    productImageUrl: 'https://produkte.globus.de/media/images/product/broetchen.jpg',
  },
  {
    productName: 'Tiefkühl Pizza Margherita',
    productBrand: 'Dr. Oetker',
    categorySlug: 'tiefkuehl',
    currentPrice: 199,
    originalPrice: 299,
    discountPercent: 33,
    unitType: '320g',
    priceText: '1,99 €',
    originalPriceText: '2,99 €',
    productImageUrl: 'https://produkte.globus.de/media/images/product/pizza.jpg',
  },
  {
    productName: 'Bio Äpfel',
    productBrand: 'Regional',
    categorySlug: 'obst-gemuese',
    currentPrice: 199,
    originalPrice: 299,
    discountPercent: 33,
    unitType: '1kg',
    priceText: '1,99 €',
    originalPriceText: '2,99 €',
    productImageUrl: 'https://produkte.globus.de/media/images/product/aepfel.jpg',
  },
  {
    productName: 'Persil Waschmittel',
    productBrand: 'Persil',
    categorySlug: 'haushalt',
    currentPrice: 899,
    originalPrice: 1299,
    discountPercent: 31,
    unitType: '1.8L',
    priceText: '8,99 €',
    originalPriceText: '12,99 €',
    productImageUrl: 'https://produkte.globus.de/media/images/product/persil.jpg',
  },
  {
    productName: 'Pampers Baby-Dry',
    productBrand: 'Pampers',
    categorySlug: 'drogerie',
    currentPrice: 1499,
    originalPrice: 1999,
    discountPercent: 25,
    unitType: '60 Stück',
    priceText: '14,99 €',
    originalPriceText: '19,99 €',
    productImageUrl: 'https://produkte.globus.de/media/images/product/pampers.jpg',
  },
];

async function main() {
  console.log('Connecting to database...');
  await connectDB();

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
      discountPercent: deal.discountPercent,
      unitType: deal.unitType,
      priceText: deal.priceText,
      originalPriceText: deal.originalPriceText,
      startDate,
      endDate,
      isActive: true,
      source: 'demo',
      sourceRef: `KW${calendarWeek} Demo`,
      sourceUrl: 'https://www.globus.de/angebote',
    });

    created++;
    console.log(`  + ${deal.productName} (-${deal.discountPercent}%)`);
  }

  console.log(`\nDone: ${created} deals created, ${skipped} skipped`);
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
