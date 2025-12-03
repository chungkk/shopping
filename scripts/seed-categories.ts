import mongoose from 'mongoose';
import Supermarket from '../src/lib/db/models/Supermarket';
import Category from '../src/lib/db/models/Category';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping-deals';

const categories = [
  { name: 'Getränke', nameVi: 'Đồ uống', slug: 'getraenke', sortOrder: 1 },
  { name: 'Obst & Gemüse', nameVi: 'Rau củ quả', slug: 'obst-gemuese', sortOrder: 2 },
  { name: 'Fleisch & Fisch', nameVi: 'Thịt & Cá', slug: 'fleisch-fisch', sortOrder: 3 },
  { name: 'Tiefkühl', nameVi: 'Đông lạnh', slug: 'tiefkuehl', sortOrder: 4 },
  { name: 'Molkereiprodukte', nameVi: 'Sữa & Phô mai', slug: 'molkereiprodukte', sortOrder: 5 },
  { name: 'Brot & Backwaren', nameVi: 'Bánh mì & Bánh ngọt', slug: 'brot-backwaren', sortOrder: 6 },
  { name: 'Süßes & Salziges', nameVi: 'Bánh kẹo', slug: 'suesses-salziges', sortOrder: 7 },
  { name: 'Haushalt', nameVi: 'Đồ gia dụng', slug: 'haushalt', sortOrder: 8 },
  { name: 'Drogerie', nameVi: 'Mỹ phẩm & Chăm sóc', slug: 'drogerie', sortOrder: 9 },
  { name: 'Sonstiges', nameVi: 'Khác', slug: 'sonstiges', sortOrder: 10 },
];

async function seedCategories() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const supermarket = await Supermarket.findOne({ slug: 'globus' });
    if (!supermarket) {
      console.error('Globus supermarket not found. Run seed-supermarket.ts first.');
      process.exit(1);
    }

    console.log(`Found supermarket: ${supermarket.name} (${supermarket._id})`);

    let created = 0;
    let updated = 0;

    for (const cat of categories) {
      const existing = await Category.findOne({
        supermarketId: supermarket._id,
        slug: cat.slug,
      });

      const categoryData = {
        supermarketId: supermarket._id,
        name: cat.name,
        nameVi: cat.nameVi,
        slug: cat.slug,
        externalId: cat.slug,
        sortOrder: cat.sortOrder,
        productCount: 0,
        isActive: true,
      };

      if (existing) {
        await Category.updateOne(
          { supermarketId: supermarket._id, slug: cat.slug },
          { $set: categoryData }
        );
        updated++;
      } else {
        await Category.create(categoryData);
        created++;
      }
    }

    console.log(`Categories seeded: ${created} created, ${updated} updated`);

    const allCategories = await Category.find({ supermarketId: supermarket._id }).sort({
      sortOrder: 1,
    });
    console.log('\nCategories:');
    allCategories.forEach((c) => {
      console.log(`  - ${c.name} (${c.nameVi}) [${c.slug}]`);
    });
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

seedCategories();
