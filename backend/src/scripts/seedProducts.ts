import mongoose from 'mongoose';
import { env } from '@config/env';
import Product from '../models/Product';
import Category from '../models/Category';

const sampleCategories = [
  { name: 'Kitchen', slug: 'kitchen', description: 'Kitchen and dining essentials.' },
  { name: 'Bags', slug: 'bags', description: 'Totes, backpacks, and travel bags.' },
  { name: 'Home', slug: 'home', description: 'Home decor and living essentials.' },
  { name: 'Office', slug: 'office', description: 'Desk and workspace goods.' },
  { name: 'Outdoors', slug: 'outdoors', description: 'Gear for camping and outdoor life.' },
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
      {
        url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574',
        alt: 'Pour-over coffee set',
      },
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
      {
        url: 'https://images.unsplash.com/photo-1591561954557-26941169b49e',
        alt: 'Linen tote bag',
      },
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
      {
        url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7',
        alt: 'Walnut cutting board',
      },
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
      {
        url: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8',
        alt: 'Wool throw blanket',
      },
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
      {
        url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c',
        alt: 'Brass desk lamp',
      },
    ],
    tags: ['home', 'lighting'],
    isFeatured: false,
    categorySlug: 'home',
  },
  {
    title: 'Stainless Pour Kettle',
    slug: 'stainless-pour-kettle',
    description: 'Gooseneck kettle with precision spout for even, controlled pouring.',
    price: 54,
    currency: 'USD',
    stock: 20,
    sku: 'HOME-KETTLE-006',
    brand: 'Kettle & Clay',
    rating: 4.4,
    reviewCount: 21,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574',
        alt: 'Stainless pour-over kettle',
      },
    ],
    tags: ['kitchen', 'coffee'],
    isFeatured: false,
    categorySlug: 'kitchen',
  },
  {
    title: 'Leather Crossbody Bag',
    slug: 'leather-crossbody-bag',
    description: 'Compact full-grain leather crossbody with adjustable strap.',
    price: 88,
    currency: 'USD',
    stock: 18,
    sku: 'BAG-CROSS-007',
    brand: 'Fieldwork',
    rating: 4.6,
    reviewCount: 40,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1591561954557-26941169b49e',
        alt: 'Leather crossbody bag',
      },
    ],
    tags: ['bags'],
    isFeatured: false,
    categorySlug: 'bags',
  },
  {
    title: 'Canvas Rolltop Backpack',
    slug: 'canvas-rolltop-backpack',
    description: 'Water-resistant canvas backpack with rolltop closure and laptop sleeve.',
    price: 98,
    currency: 'USD',
    stock: 22,
    sku: 'BAG-ROLL-008',
    brand: 'Norrland',
    rating: 4.7,
    reviewCount: 33,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa',
        alt: 'Canvas rolltop backpack',
      },
    ],
    tags: ['bags', 'travel'],
    isFeatured: true,
    categorySlug: 'bags',
  },
  {
    title: 'Ceramic Table Vase',
    slug: 'ceramic-table-vase',
    description: 'Matte-glazed stoneware vase, hand-finished with a soft speckled texture.',
    price: 42,
    currency: 'USD',
    stock: 26,
    sku: 'HOME-VASE-009',
    brand: 'Kettle & Clay',
    rating: 4.5,
    reviewCount: 14,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d',
        alt: 'Ceramic table vase',
      },
    ],
    tags: ['home', 'decor'],
    isFeatured: false,
    categorySlug: 'home',
  },
  {
    title: 'Oak Bookshelf Ladder',
    slug: 'oak-bookshelf-ladder',
    description: '5-tier solid oak ladder shelf for books and display pieces.',
    price: 165,
    currency: 'USD',
    stock: 8,
    sku: 'HOME-SHELF-010',
    brand: 'Norrland',
    rating: 4.8,
    reviewCount: 22,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1594620302200-9a762244a156',
        alt: 'Oak ladder bookshelf',
      },
    ],
    tags: ['home', 'furniture'],
    isFeatured: true,
    categorySlug: 'home',
  },
  {
    title: 'Walnut Desk Organizer',
    slug: 'walnut-desk-organizer',
    description: 'Modular walnut tray for pens, cards, and small desk essentials.',
    price: 38,
    currency: 'USD',
    stock: 34,
    sku: 'OFFICE-ORG-011',
    brand: 'Fieldwork',
    rating: 4.3,
    reviewCount: 11,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1544816155-12df9643f363',
        alt: 'Walnut desk organizer',
      },
    ],
    tags: ['office'],
    isFeatured: false,
    categorySlug: 'office',
  },
  {
    title: 'Ergonomic Task Chair',
    slug: 'ergonomic-task-chair',
    description: 'Breathable mesh-back chair with adjustable lumbar support and armrests.',
    price: 245,
    currency: 'USD',
    stock: 9,
    sku: 'OFFICE-CHAIR-012',
    brand: 'Norrland',
    rating: 4.6,
    reviewCount: 47,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8',
        alt: 'Ergonomic task chair',
      },
    ],
    tags: ['office', 'furniture'],
    isFeatured: true,
    categorySlug: 'office',
  },
  {
    title: 'Recycled Wool Desk Mat',
    slug: 'recycled-wool-desk-mat',
    description: 'Felted wool desk mat that protects surfaces and dampens keyboard noise.',
    price: 34,
    currency: 'USD',
    stock: 40,
    sku: 'OFFICE-MAT-013',
    brand: 'Fieldwork',
    rating: 4.4,
    reviewCount: 16,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1518444065439-e933c06ce9cd',
        alt: 'Wool desk mat',
      },
    ],
    tags: ['office'],
    isFeatured: false,
    categorySlug: 'office',
  },
  {
    title: 'Insulated Camp Mug',
    slug: 'insulated-camp-mug',
    description: 'Double-wall stainless mug that keeps drinks hot or cold for hours outdoors.',
    price: 28,
    currency: 'USD',
    stock: 50,
    sku: 'OUT-MUG-014',
    brand: 'Norrland',
    rating: 4.7,
    reviewCount: 60,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574',
        alt: 'Insulated camp mug',
      },
    ],
    tags: ['outdoors', 'travel'],
    isFeatured: false,
    categorySlug: 'outdoors',
  },
  {
    title: 'Packable Camp Blanket',
    slug: 'packable-camp-blanket',
    description: 'Lightweight, water-resistant blanket that packs down into its own pouch.',
    price: 58,
    currency: 'USD',
    stock: 16,
    sku: 'OUT-BLANKET-015',
    brand: 'Fieldwork',
    rating: 4.5,
    reviewCount: 29,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1445307806294-bff7f67ff225',
        alt: 'Packable outdoor blanket',
      },
    ],
    tags: ['outdoors'],
    isFeatured: true,
    categorySlug: 'outdoors',
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
      { upsert: true, new: true },
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