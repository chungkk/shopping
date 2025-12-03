import mongoose from 'mongoose';
import Supermarket from '../src/lib/db/models/Supermarket';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping-deals';

const supermarkets = [
  {
    name: 'Globus',
    slug: 'globus',
    logo: 'https://www.globus.de/resource/blob/16932/53a1c76db73ce8b8ebeeef9cf89a24e2/globus-logo-data.png',
    website: 'https://www.globus.de',
    productCatalogUrl: 'https://produkte.globus.de',
    flyerUrl: 'https://www.globus.de/de/standorte/halle-dieselstrasse/aktuelles-prospekt.php',
    locations: [
      {
        name: 'Halle-Dieselstraße',
        slug: 'halle-dieselstrasse',
        address: 'Dieselstraße 8, 06112 Halle (Saale)',
        flyerUrl: 'https://www.globus.de/de/standorte/halle-dieselstrasse/aktuelles-prospekt.php',
      },
    ],
    isActive: true,
    crawlConfig: {
      delayMs: 3000,
      userAgent: 'ShoppingDeals Bot/1.0',
      selectors: {
        productCard: '.product-card',
        productName: '.product-name',
        productPrice: '.product-price',
        productImage: '.product-image img',
        dealCard: '.deal-card',
        dealName: '.deal-name',
        dealPrice: '.deal-price',
      },
    },
    lastCrawl: { status: 'pending' as const },
  },
  {
    name: 'Aldi Süd',
    slug: 'aldi-sued',
    logo: 'https://www.aldi-sued.de/etc.clientlibs/aldi-sued/clientlibs/clientlib-uikit/resources/favicons/android-chrome-192x192.png',
    website: 'https://www.aldi-sued.de',
    isActive: false,
    crawlConfig: { delayMs: 3000, userAgent: 'ShoppingDeals Bot/1.0', selectors: {} },
    lastCrawl: { status: 'pending' as const },
  },
  {
    name: 'Lidl',
    slug: 'lidl',
    logo: 'https://www.lidl.de/assets/favicons/android-chrome-192x192.png',
    website: 'https://www.lidl.de',
    isActive: false,
    crawlConfig: { delayMs: 3000, userAgent: 'ShoppingDeals Bot/1.0', selectors: {} },
    lastCrawl: { status: 'pending' as const },
  },
  {
    name: 'Rewe',
    slug: 'rewe',
    logo: 'https://www.rewe.de/assets/favicons/android-chrome-192x192.png',
    website: 'https://www.rewe.de',
    isActive: false,
    crawlConfig: { delayMs: 3000, userAgent: 'ShoppingDeals Bot/1.0', selectors: {} },
    lastCrawl: { status: 'pending' as const },
  },
  {
    name: 'Edeka',
    slug: 'edeka',
    logo: 'https://www.edeka.de/etc.clientlibs/edeka/clientlibs/clientlib-base/resources/img/favicons/android-chrome-192x192.png',
    website: 'https://www.edeka.de',
    isActive: false,
    crawlConfig: { delayMs: 3000, userAgent: 'ShoppingDeals Bot/1.0', selectors: {} },
    lastCrawl: { status: 'pending' as const },
  },
  {
    name: 'Kaufland',
    slug: 'kaufland',
    logo: 'https://www.kaufland.de/apple-touch-icon.png',
    website: 'https://www.kaufland.de',
    isActive: false,
    crawlConfig: { delayMs: 3000, userAgent: 'ShoppingDeals Bot/1.0', selectors: {} },
    lastCrawl: { status: 'pending' as const },
  },
  {
    name: 'Penny',
    slug: 'penny',
    logo: 'https://www.penny.de/assets/favicons/android-chrome-192x192.png',
    website: 'https://www.penny.de',
    isActive: false,
    crawlConfig: { delayMs: 3000, userAgent: 'ShoppingDeals Bot/1.0', selectors: {} },
    lastCrawl: { status: 'pending' as const },
  },
  {
    name: 'Netto',
    slug: 'netto',
    logo: 'https://www.netto-online.de/favicon-192x192.png',
    website: 'https://www.netto-online.de',
    isActive: false,
    crawlConfig: { delayMs: 3000, userAgent: 'ShoppingDeals Bot/1.0', selectors: {} },
    lastCrawl: { status: 'pending' as const },
  },
];

async function seedSupermarkets() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const data of supermarkets) {
      const existing = await Supermarket.findOne({ slug: data.slug });

      if (existing) {
        console.log(`${data.name} already exists, updating...`);
        await Supermarket.updateOne({ slug: data.slug }, { $set: data });
      } else {
        console.log(`Creating ${data.name}...`);
        await Supermarket.create(data);
      }
    }

    console.log(`\nSeeded ${supermarkets.length} supermarkets`);
    console.log('Active: Globus');
    console.log('Inactive: Aldi Süd, Lidl, Rewe, Edeka, Kaufland, Penny, Netto');
  } catch (error) {
    console.error('Error seeding supermarkets:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

seedSupermarkets();
