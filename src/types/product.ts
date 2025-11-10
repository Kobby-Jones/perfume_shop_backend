// src/types/product.ts

/**
 * Interface for a single product object.
 * This file is kept mostly for client-side type reference, 
 * but the backend uses the Prisma generated client types.
 */
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number; 
  availableStock: number;
  category: 'Men' | 'Women' | 'Unisex';
  brand: string;
  isFeatured: boolean;
  images: string[];
  rating: number; // Avg rating calculated from reviews
  reviewCount: number;
  details: {
      size: string;
      concentration: string;
      scentProfile: string[];
      longevity: string;
      sillage: string;
      season: string[];
      occasion: string[];
      topNotes: string[];
      middleNotes: string[];
      baseNotes: string[];
  };
}

// NOTE: MOCK_PRODUCTS array removed.
// NOTE: getProducts function removed.