// lib/data/mock-products.ts

/**
 * Interface for a single product object.
 * Defines the structure for product data used throughout the application.
 */
export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    images: string[];
    availableStock: number;
    category: 'Men' | 'Women' | 'Unisex';
    brand: string;
    isFeatured: boolean;
  }
  
  /**
   * Mock data representing the perfume shop's product inventory.
   * This will be used dynamically by all pages and components.
   */
  export const MOCK_PRODUCTS: Product[] = [
    {
      id: 1,
      name: "Midnight Rose EDP",
      description: "A delicate floral scent with notes of Bulgarian rose, vanilla, and amber. Perfect for evening wear.",
      price: 99.99,
      images: ["/images/product-1a.jpg", "/images/product-1b.jpg"],
      availableStock: 12,
      category: "Women",
      brand: "AromaLux",
      isFeatured: true,
    },
    {
      id: 2,
      name: "Coastal Breeze Cologne",
      description: "Fresh, aquatic fragrance reminiscent of a sea breeze with hints of citrus and cedarwood.",
      price: 75.5,
      images: ["/images/product-2a.jpg", "/images/product-2b.jpg"],
      availableStock: 5,
      category: "Men",
      brand: "The Scent Co.",
      isFeatured: true,
    },
    {
      id: 3,
      name: "Velvet Oud (Unisex)",
      description: "Rich, deep oud fragrance balanced with sweet jasmine and musk. Highly concentrated and long-lasting.",
      price: 149.0,
      images: ["/images/product-3a.jpg", "/images/product-3b.jpg"],
      availableStock: 24,
      category: "Unisex",
      brand: "Oud Masters",
      isFeatured: false,
    },
    {
      id: 4,
      name: "Summer Citrus Spritz",
      description: "A bright, energetic mix of lemon, grapefruit, and peppermint. Ideal for daily, casual use.",
      price: 49.99,
      images: ["/images/product-4a.jpg", "/images/product-4b.jpg"],
      availableStock: 0,
      category: "Women",
      brand: "Citrus Bliss",
      isFeatured: false,
    },
    {
      id: 5,
      name: "Noir Essence Parfum",
      description: "Dark and sensual blend of black orchid, patchouli, and amber wood. Perfect for night occasions.",
      price: 129.99,
      images: ["/images/product-5a.jpg", "/images/product-5b.jpg"],
      availableStock: 10,
      category: "Women",
      brand: "Elite Fragrances",
      isFeatured: true,
    },
    {
      id: 6,
      name: "Royal Leather Intense",
      description: "Sophisticated mix of smoky leather, vetiver, and sandalwood. Bold, masculine signature scent.",
      price: 110.0,
      images: ["/images/product-6a.jpg", "/images/product-6b.jpg"],
      availableStock: 8,
      category: "Men",
      brand: "Urban Essence",
      isFeatured: false,
    },
    {
      id: 7,
      name: "Golden Dusk EDP",
      description: "Elegant fragrance combining warm amber, vanilla, and soft jasmine for a radiant evening touch.",
      price: 95.5,
      images: ["/images/product-7a.jpg", "/images/product-7b.jpg"],
      availableStock: 15,
      category: "Women",
      brand: "Lumière Parfum",
      isFeatured: false,
    },
    {
      id: 8,
      name: "Aqua Horizon Sport",
      description: "Dynamic blend of mint, bergamot, and sea minerals for an invigorating, sporty freshness.",
      price: 70.0,
      images: ["/images/product-8a.jpg", "/images/product-8b.jpg"],
      availableStock: 20,
      category: "Men",
      brand: "BlueWave",
      isFeatured: true,
    },
    {
      id: 9,
      name: "Amber Woods Unisex",
      description: "Warm, woody fragrance featuring amber, vanilla bean, and spiced cardamom for universal appeal.",
      price: 89.99,
      images: ["/images/product-9a.jpg", "/images/product-9b.jpg"],
      availableStock: 18,
      category: "Unisex",
      brand: "Scentory Labs",
      isFeatured: false,
    },
    {
      id: 10,
      name: "Blooming Petals",
      description: "Sweet bouquet of peony, lily, and white musk. Captures the freshness of a spring garden.",
      price: 65.0,
      images: ["/images/product-10a.jpg", "/images/product-10b.jpg"],
      availableStock: 30,
      category: "Women",
      brand: "Flora Essence",
      isFeatured: true,
    },
    {
      id: 11,
      name: "Cedar Noir",
      description: "Mysterious and woody scent infused with smoky cedar, sage, and tonka bean. Long-lasting projection.",
      price: 115.25,
      images: ["/images/product-11a.jpg", "/images/product-11b.jpg"],
      availableStock: 6,
      category: "Men",
      brand: "Maison Verdant",
      isFeatured: false,
    },
    {
      id: 12,
      name: "Pure Musk Essence",
      description: "Minimalist unisex perfume centered on clean musk, soft powder, and a touch of iris root.",
      price: 79.0,
      images: ["/images/product-12a.jpg", "/images/product-12b.jpg"],
      availableStock: 13,
      category: "Unisex",
      brand: "Scentology",
      isFeatured: false,
    },
    {
      id: 13,
      name: "Cherry Bloom Mist",
      description: "Playful scent featuring cherry blossom, rose water, and sweet mandarin for a refreshing daily wear.",
      price: 58.99,
      images: ["/images/product-13a.jpg", "/images/product-13b.jpg"],
      availableStock: 27,
      category: "Women",
      brand: "AromaLux",
      isFeatured: false,
    },
    {
      id: 14,
      name: "Midnight Ember",
      description: "Smoky and warm notes of incense, tobacco leaf, and oud wood. A bold evening statement.",
      price: 139.0,
      images: ["/images/product-14a.jpg", "/images/product-14b.jpg"],
      availableStock: 7,
      category: "Men",
      brand: "Oud Masters",
      isFeatured: true,
    },
    {
      id: 15,
      name: "Coconut Sands EDT",
      description: "Tropical blend of coconut milk, vanilla flower, and driftwood for a sunny beach escape.",
      price: 52.5,
      images: ["/images/product-15a.jpg", "/images/product-15b.jpg"],
      availableStock: 25,
      category: "Women",
      brand: "Island Vibes",
      isFeatured: false,
    },
    {
      id: 16,
      name: "Silver Mist Cologne",
      description: "Cool, metallic freshness of lavender, citrus zest, and oakmoss for a refined daily fragrance.",
      price: 78.0,
      images: ["/images/product-16a.jpg", "/images/product-16b.jpg"],
      availableStock: 9,
      category: "Men",
      brand: "The Scent Co.",
      isFeatured: false,
    },
    {
      id: 17,
      name: "Vanilla Smoke Unisex",
      description: "Creamy Madagascar vanilla blended with smoky vetiver and cedar for a cozy unisex allure.",
      price: 120.0,
      images: ["/images/product-17a.jpg", "/images/product-17b.jpg"],
      availableStock: 14,
      category: "Unisex",
      brand: "Artisan Blends",
      isFeatured: true,
    },
    {
      id: 18,
      name: "Jasmine Whisper",
      description: "Soft and graceful jasmine petals with a hint of white tea and ambergris. Romantic and elegant.",
      price: 85.99,
      images: ["/images/product-18a.jpg", "/images/product-18b.jpg"],
      availableStock: 11,
      category: "Women",
      brand: "Lumière Parfum",
      isFeatured: false,
    },
    {
      id: 19,
      name: "Urban Spirit",
      description: "Modern masculine fragrance featuring bergamot, sage, and suede — made for the confident man.",
      price: 95.0,
      images: ["/images/product-19a.jpg", "/images/product-19b.jpg"],
      availableStock: 19,
      category: "Men",
      brand: "Urban Essence",
      isFeatured: true,
    },
    {
      id: 20,
      name: "Amber Driftwood",
      description: "Smooth unisex scent with warm amber, driftwood, and soft musk notes. Balanced and long-lasting.",
      price: 89.5,
      images: ["/images/product-20a.jpg", "/images/product-20b.jpg"],
      availableStock: 17,
      category: "Unisex",
      brand: "Scentory Labs",
      isFeatured: false,
    },
  ];
  
  /**
   * Mock function to simulate fetching all products from an API.
   * @returns A promise that resolves with the list of products.
   */
  export async function getProducts(): Promise<Product[]> {
    // Simulate network delay for a real-world scenario
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_PRODUCTS;
  }