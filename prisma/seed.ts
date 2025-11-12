// prisma/seed.ts

import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Detailed product data matching the new schema
const productData: Prisma.ProductCreateInput[] = [
    {
      name: "Midnight Rose EDP",
      description: "A delicate floral scent with notes of Bulgarian rose, vanilla, and amber. Perfect for evening wear.",
      price: 99.99,
      originalPrice: 129.99,
      images: ["/images/product-1a.jpg", "/images/product-1b.jpg"],
      availableStock: 12,
      category: "Women",
      brand: "AromaLux",
      isFeatured: true,
      rating: 4.8,
      reviewCount: 234,
      details: {
        size: "100ml", concentration: "Eau de Parfum (EDP)", scentProfile: ["Floral", "Oriental", "Sweet"], longevity: "8-10 hours", sillage: "Moderate to Strong", season: ["Fall", "Winter"], occasion: ["Evening", "Special Events", "Date Night"], topNotes: ["Bulgarian Rose", "Bergamot", "Pink Pepper"], middleNotes: ["Jasmine", "Iris", "Orange Blossom"], baseNotes: ["Vanilla", "Amber", "Musk"],
      } as Prisma.InputJsonValue,
    },
    {
      name: "Coastal Breeze Cologne",
      description: "Fresh, aquatic fragrance reminiscent of a sea breeze with hints of citrus and cedarwood.",
      price: 75.5,
      images: ["/images/product-2a.jpg", "/images/product-2b.jpg"],
      availableStock: 5,
      category: "Men",
      brand: "The Scent Co.",
      isFeatured: true,
      rating: 4.5,
      reviewCount: 127,
      details: {
        size: "75ml", concentration: "Eau de Cologne (EDC)", scentProfile: ["Aquatic", "Fresh", "Citrus"], longevity: "4-6 hours", sillage: "Light to Moderate", season: ["Spring", "Summer"], occasion: ["Daily Wear", "Office", "Casual"], topNotes: ["Sea Salt", "Bergamot", "Lemon"], middleNotes: ["Marine Accord", "Lavender", "Rosemary"], baseNotes: ["Cedarwood", "Musk", "Amber"],
      } as Prisma.InputJsonValue,
    },
    {
      name: "Velvet Oud (Unisex)",
      description: "Rich, deep oud fragrance balanced with sweet jasmine and musk. Highly concentrated and long-lasting.",
      price: 149.0,
      originalPrice: 189.0,
      images: ["/images/product-3a.jpg", "/images/product-3b.jpg"],
      availableStock: 24,
      category: "Unisex",
      brand: "Oud Masters",
      isFeatured: false,
      rating: 4.9,
      reviewCount: 412,
      details: {
        size: "50ml", concentration: "Parfum (Extrait)", scentProfile: ["Oud", "Oriental", "Woody"], longevity: "12+ hours", sillage: "Very Strong", season: ["Fall", "Winter"], occasion: ["Evening", "Special Events", "Formal"], topNotes: ["Saffron", "Cardamom", "Rose"], middleNotes: ["Oud Wood", "Jasmine", "Patchouli"], baseNotes: ["Musk", "Amber", "Sandalwood"],
      } as Prisma.InputJsonValue,
    },
    {
      name: "Summer Citrus Spritz",
      description: "A bright, energetic mix of lemon, grapefruit, and peppermint. Ideal for daily, casual use.",
      price: 49.99,
      images: ["/images/product-4a.jpg", "/images/product-4b.jpg"],
      availableStock: 0,
      category: "Women",
      brand: "Citrus Bliss",
      isFeatured: false,
      rating: 4.2,
      reviewCount: 89,
      details: {
        size: "100ml", concentration: "Eau de Toilette (EDT)", scentProfile: ["Citrus", "Fresh", "Green"], longevity: "3-5 hours", sillage: "Light", season: ["Spring", "Summer"], occasion: ["Daily Wear", "Sport", "Casual"], topNotes: ["Lemon", "Grapefruit", "Mandarin"], middleNotes: ["Peppermint", "Green Tea", "Neroli"], baseNotes: ["White Musk", "Cedarwood"],
      } as Prisma.InputJsonValue,
    },
    {
      name: "Noir Essence Parfum",
      description: "Dark and sensual blend of black orchid, patchouli, and amber wood. Perfect for night occasions.",
      price: 129.99,
      originalPrice: 159.99,
      images: ["/images/product-5a.jpg", "/images/product-5b.jpg"],
      availableStock: 10,
      category: "Women",
      brand: "Elite Fragrances",
      isFeatured: true,
      rating: 4.7,
      reviewCount: 156,
      details: {
        size: "75ml", concentration: "Eau de Parfum (EDP)", scentProfile: ["Oriental", "Woody", "Floral"], longevity: "10-12 hours", sillage: "Strong", season: ["Fall", "Winter"], occasion: ["Evening", "Date Night", "Special Events"], topNotes: ["Black Orchid", "Black Truffle", "Bergamot"], middleNotes: ["Patchouli", "Black Plum", "Orchid"], baseNotes: ["Amber Wood", "Vanilla", "Incense"],
      } as Prisma.InputJsonValue,
    },
    {
      name: "Royal Leather Intense",
      description: "Sophisticated mix of smoky leather, vetiver, and sandalwood. Bold, masculine signature scent.",
      price: 110.0,
      images: ["/images/product-6a.jpg", "/images/product-6b.jpg"],
      availableStock: 8,
      category: "Men",
      brand: "Urban Essence",
      isFeatured: false,
      rating: 4.6,
      reviewCount: 198,
      details: {
        size: "100ml", concentration: "Eau de Parfum (EDP)", scentProfile: ["Leather", "Woody", "Smoky"], longevity: "8-10 hours", sillage: "Strong", season: ["Fall", "Winter", "Spring"], occasion: ["Evening", "Business", "Formal"], topNotes: ["Black Pepper", "Cardamom", "Bergamot"], middleNotes: ["Leather", "Vetiver", "Clary Sage"], baseNotes: ["Sandalwood", "Patchouli", "Amber"],
      } as Prisma.InputJsonValue,
    },
    // Adding more products with mock data to satisfy frontend's filtering needs
    {
      name: "Golden Dusk EDP",
      description: "Elegant fragrance combining warm amber, vanilla, and soft jasmine for a radiant evening touch.",
      price: 95.5,
      images: ["/images/product-7a.jpg", "/images/product-7b.jpg"],
      availableStock: 15,
      category: "Women",
      brand: "Lumière Parfum",
      isFeatured: false,
      rating: 4.4,
      reviewCount: 142,
      details: {
        size: "100ml", concentration: "Eau de Parfum (EDP)", scentProfile: ["Oriental", "Amber", "Floral"], longevity: "7-9 hours", sillage: "Moderate", season: ["Fall", "Winter"], occasion: ["Evening", "Date Night", "Casual"], topNotes: ["Mandarin", "Pink Pepper", "Peach"], middleNotes: ["Jasmine", "Tuberose", "Orange Blossom"], baseNotes: ["Amber", "Vanilla", "Tonka Bean"],
      } as Prisma.InputJsonValue,
    },
    {
      name: "Aqua Horizon Sport",
      description: "Dynamic blend of mint, beribbon, and sea minerals for an invigorating, sporty freshness.",
      price: 70.0,
      originalPrice: 90.0,
      images: ["/images/product-8a.jpg", "/images/product-8b.jpg"],
      availableStock: 20,
      category: "Men",
      brand: "BlueWave",
      isFeatured: true,
      rating: 4.6,
      reviewCount: 287,
      details: {
        size: "125ml", concentration: "Eau de Toilette (EDT)", scentProfile: ["Aquatic", "Fresh", "Aromatic"], longevity: "5-7 hours", sillage: "Moderate", season: ["Spring", "Summer"], occasion: ["Sport", "Daily Wear", "Active"], topNotes: ["Mint", "Bergamot", "Grapefruit"], middleNotes: ["Sea Minerals", "Lavender", "Geranium"], baseNotes: ["Cedar", "Musk", "Tonka Bean"],
      } as Prisma.InputJsonValue,
    },
    {
      name: "Amber Woods Unisex",
      description: "Warm, woody fragrance featuring amber, vanilla bean, and spiced cardamom for universal appeal.",
      price: 89.99,
      images: ["/images/product-9a.jpg", "/images/product-9b.jpg"],
      availableStock: 18,
      category: "Unisex",
      brand: "Scentory Labs",
      isFeatured: false,
      rating: 4.5,
      reviewCount: 176,
      details: {
        size: "100ml", concentration: "Eau de Parfum (EDP)", scentProfile: ["Woody", "Amber", "Spicy"], longevity: "8-10 hours", sillage: "Moderate to Strong", season: ["Fall", "Winter", "Spring"], occasion: ["Daily Wear", "Evening", "Casual"], topNotes: ["Cardamom", "Pink Pepper", "Bergamot"], middleNotes: ["Cedarwood", "Cypress", "Violet"], baseNotes: ["Amber", "Vanilla Bean", "Sandalwood"],
      } as Prisma.InputJsonValue,
    },
    {
      name: "Blooming Petals",
      description: "Sweet bouquet of peony, lily, and white musk. Captures the freshness of a spring garden.",
      price: 65.0,
      images: ["/images/product-10a.jpg", "/images/product-10b.jpg"],
      availableStock: 30,
      category: "Women",
      brand: "Flora Essence",
      isFeatured: true,
      rating: 4.8,
      reviewCount: 321,
      details: {
        size: "100ml", concentration: "Eau de Parfum (EDP)", scentProfile: ["Floral", "Fresh", "Sweet"], longevity: "6-8 hours", sillage: "Moderate", season: ["Spring", "Summer"], occasion: ["Daily Wear", "Office", "Casual"], topNotes: ["Peony", "Freesia", "Litchi"], middleNotes: ["Lily", "Rose", "Magnolia"], baseNotes: ["White Musk", "Cedar", "Amber"],
      } as Prisma.InputJsonValue,
    },
    {
        name: "Vanilla Smoke Unisex",
        description: "Creamy Madagascar vanilla blended with smoky vetiver and cedar for a cozy unisex allure.",
        price: 120.0,
        originalPrice: 149.0,
        images: ["/images/product-17a.jpg", "/images/product-17b.jpg"],
        availableStock: 14,
        category: "Unisex",
        brand: "Artisan Blends",
        isFeatured: true,
        rating: 4.8,
        reviewCount: 356,
        details: {
          size: "100ml", concentration: "Eau de Parfum (EDP)", scentProfile: ["Oriental", "Woody", "Gourmand"], longevity: "9-11 hours", sillage: "Strong", season: ["Fall", "Winter"], occasion: ["Evening", "Daily Wear", "Date Night"], topNotes: ["Pink Pepper", "Cardamom", "Bergamot"], middleNotes: ["Madagascar Vanilla", "Tobacco", "Iris"], baseNotes: ["Vetiver", "Cedar", "Amber"],
        } as Prisma.InputJsonValue,
      },
  ];
 

async function main() {
  console.log("Seeding database...");

  // Securely hash the admin password "kobby@2662"
  // Hashed using hash-password.js from previous context: $2b$10$TvrT7EfrNHct5KWT4W.xE.36cJy7fmNDMUw6ZpgRYt3yQXuuK.lai
  const adminPasswordHash = "$2b$10$H98I.Wa9CKUGlAwlTXe48uuGM5veFB9pLEvOZixfqPemmt88UfbJK";

  // Create Admin User (CRITICAL)
  await prisma.user.upsert({
    where: { email: "admin@scentia.com" },
    update: { passwordHash: adminPasswordHash, name: "Admin Staff", role: "admin" },
    create: {
      email: "admin@scentia.com",
      passwordHash: adminPasswordHash,
      name: "Admin Staff",
      role: "admin",
    },
  });
  
  // Create a Sample Customer
  const customerPasswordHash = await bcrypt.hash("customer123", 10);
  const customer = await prisma.user.upsert({
      where: { email: "user@example.com" },
      update: { passwordHash: customerPasswordHash, name: "Test Customer" },
      create: {
          email: "user@example.com",
          passwordHash: customerPasswordHash,
          name: "Test Customer",
          role: "user",
      },
  });

  // Seed Products (using explicit IDs only if needed for mock integration, otherwise Prisma handles)
  for (const p of productData) {
    await prisma.product.upsert({
      where: { name: p.name },
      update: p,
      create: p,
    });
  }
  
  // Seed an initial User Address (for the new customer)
  await prisma.userAddress.upsert({
      where: { userId_name: { userId: customer.id, name: 'Home' } },
      update: {},
      create: {
          userId: customer.id,
          name: 'Home',
          firstName: 'Test',
          lastName: 'Customer',
          street: '123 Palm Street',
          city: 'Sunyani',
          zip: '00233',
          country: 'Ghana',
          isDefault: true,
      },
  });

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });