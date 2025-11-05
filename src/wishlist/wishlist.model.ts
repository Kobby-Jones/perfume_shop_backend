// src/wishlist/wishlist.model.ts

import { getProductById } from '../products/product.model';
// Import the products
import { Product } from '../types/product';

/**
 * Interface for the Wishlist state associated with a user.
 */
interface WishlistDB {
  userId: number;
  productIds: number[]; // Array of product IDs saved by the user
}

// In-memory mock database for all wishlists (keyed by userId)
const mockWishlists = new Map<number, WishlistDB>();

/**
 * Interface for the detailed Wishlist Item returned to the frontend.
 */
export interface WishlistItem {
  product: Product;
  dateAdded: string; // Used for sorting/display
}

// --- Helper Functions ---

/**
 * Processes the raw product IDs into a detailed Wishlist structure for the frontend.
 */
export async function getDetailedWishlist(userId: number): Promise<WishlistItem[]> {
    // Simulate database retrieval
    await new Promise(resolve => setTimeout(resolve, 300));
    const wishlist = mockWishlists.get(userId);
    if (!wishlist) return [];

    // Reverse the list to show most recently added first
    const detailPromises = wishlist.productIds.slice().reverse().map(async (productId) => {
        const product = await getProductById(productId);
        if (!product) return null;

        return {
            product,
            dateAdded: new Date().toISOString(), // Mock date
        } as WishlistItem;
    });

    return (await Promise.all(detailPromises)).filter(item => item !== null) as WishlistItem[];
}

/**
 * Adds a product to the user's wishlist.
 */
export async function addProductToWishlist(userId: number, productId: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const wishlist = mockWishlists.get(userId) || { userId, productIds: [] };

    if (!wishlist.productIds.includes(productId)) {
        wishlist.productIds.push(productId);
    }
    mockWishlists.set(userId, wishlist);
}

/**
 * Removes a product from the user's wishlist.
 */
export async function removeProductFromWishlist(userId: number, productId: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    const wishlist = mockWishlists.get(userId);

    if (wishlist) {
        wishlist.productIds = wishlist.productIds.filter(id => id !== productId);
        mockWishlists.set(userId, wishlist);
    }
}