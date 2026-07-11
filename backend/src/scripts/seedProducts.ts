
import mongoose from 'mongoose';
import { env } from '@config/env';
import Product from '../models/Product';
import Category from '../models/Category';

const sampleCategories = [
  { name: 'Kitchen', slug: 'kitchen', description: 'Kitchen and dining essentials.' },
  { name: 'Bags', slug: 'bags', description: 'Totes, backpacks, and travel bags.' },
  { name: 'Home', slug: 'home', description: 'Home decor and living essentials.' },
];

const sampleProducts = [
  {
    title: 'Ceramic Pour-Over Coffee Set',
    slug: 'ceramic-pour-over-coffee-set',
    description: 'Hand-thrown ceramic dripper with matching carafe, designed for slow mornings.',
    price: 48,
    currency: 'USD',
    stock: 24,
    sku: 'HOME-COFFEE-001',
    brand: 'Kettle & Clay',
    rating: 4.6,
    reviewCount: 32,
    images: [
      { url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574', alt: 'Pour-over coffee set' },
    ],
    tags: ['kitchen', 'coffee'],
    isFeatured: true,
    categorySlug: 'kitchen',
  },
  {
    title: 'Linen Weekend Tote',
    slug: 'linen-weekend-tote',
    description: 'Heavyweight linen tote with leather straps, roomy enough for an overnight trip.',
    price: 76,
    currency: 'USD',
    stock: 15,
    sku: 'BAG-TOTE-002',
    brand: 'Fieldwork',
    rating: 4.8,
    reviewCount: 51,
    images: [
      { url: 'https://images.unsplash.com/photo-1591561954557-26941169b49e', alt: 'Linen tote bag' },
    ],
    tags: ['bags', 'travel'],
    isFeatured: true,
    categorySlug: 'bags',
  },
  {
    title: 'Walnut Cutting Board',
    slug: 'walnut-cutting-board',
    description: 'End-grain walnut board, oiled and ready for daily use.',
    price: 62,
    currency: 'USD',
    stock: 30,
    sku: 'HOME-BOARD-003',
    brand: 'Kettle & Clay',
    rating: 4.9,
    reviewCount: 18,
    images: [
      { url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7', alt: 'Walnut cutting board' },
    ],
    tags: ['kitchen'],
    isFeatured: true,
    categorySlug: 'kitchen',
  },
  {
    title: 'Merino Wool Throw',
    slug: 'merino-wool-throw',
    description: 'Ultra-soft merino throw, woven in small batches.',
    price: 120,
    currency: 'USD',
    stock: 10,
    sku: 'HOME-THROW-004',
    brand: 'Norrland',
    rating: 4.7,
    reviewCount: 27,
    images: [
      { url: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8', alt: 'Wool throw blanket' },
    ],
    tags: ['home', 'textiles'],
    isFeatured: true,
    categorySlug: 'home',
  },
  {
    title: 'Brass Desk Lamp',
    slug: 'brass-desk-lamp',
    description: 'Adjustable brass lamp with a warm dimmable bulb.',
    price: 95,
    currency: 'USD',
    stock: 12,
    sku: 'HOME-LAMP-005',
    brand: 'Fieldwork',
    rating: 4.5,
    reviewCount: 9,
    images: [
      { url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c', alt: 'Brass desk lamp' },
    ],
    tags: ['home', 'lighting'],
    isFeatured: false,
    categorySlug: 'home',
  },
];

async function seed() {
  await mongoose.connect(env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Product.deleteMany({});
  console.log('Cleared existing products');

  // Upsert categories so re-running the seed doesn't duplicate them
  const categoryMap: Record<string, mongoose.Types.ObjectId> = {};
  for (const cat of sampleCategories) {
    const doc = await Category.findOneAndUpdate(
      { slug: cat.slug },
      { $set: cat },
      { upsert: true, new: true }
    );
    categoryMap[cat.slug] = doc._id as mongoose.Types.ObjectId;
  }
  console.log(`Ensured ${sampleCategories.length} categories`);

  const productsToInsert = sampleProducts.map(({ categorySlug, ...rest }) => ({
    ...rest,
    category: categoryMap[categorySlug],
  }));

  await Product.insertMany(productsToInsert);
  console.log(`Inserted ${productsToInsert.length} products`);

  await mongoose.disconnect();
  console.log('Done');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});