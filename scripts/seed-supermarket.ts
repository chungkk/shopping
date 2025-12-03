import mongoose from 'mongoose';
import Supermarket from '../src/lib/db/models/Supermarket';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping-deals';

const globusData = {
  name: 'Globus',
  slug: 'globus',
  logo: 'https://www.globus.de/static/images/logo.svg',
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
    userAgent: 'ShoppingDeals Bot/1.0 (+https://shopping-deals.app)',
    selectors: {
      productCard: '[data-testid="product-card"], .product-card, .product-tile',
      productName: '[data-testid="product-name"], .product-name, .product-title, h2, h3',
      productPrice: '[data-testid="product-price"], .product-price, .price',
      productImage: '[data-testid="product-image"] img, .product-image img',
      dealCard: '[data-testid="deal-card"], .deal-card, .offer-card, .flyer-item',
      dealName: '[data-testid="deal-name"], .deal-name, .offer-title',
      dealPrice: '[data-testid="deal-price"], .deal-price, .offer-price',
    },
  },
  lastCrawl: {
    productsAt: null,
    dealsAt: null,
    status: 'pending' as const,
  },
};

async function seedSupermarket() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await Supermarket.findOne({ slug: globusData.slug });

    if (existing) {
      console.log('Globus supermarket already exists, updating...');
      await Supermarket.updateOne({ slug: globusData.slug }, { $set: globusData });
      console.log('Globus supermarket updated');
    } else {
      console.log('Creating Globus supermarket...');
      await Supermarket.create(globusData);
      console.log('Globus supermarket created');
    }

    const supermarket = await Supermarket.findOne({ slug: globusData.slug });
    console.log('Supermarket ID:', supermarket?._id);
  } catch (error) {
    console.error('Error seeding supermarket:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedSupermarket();
