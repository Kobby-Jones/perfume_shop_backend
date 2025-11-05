// src/cart/cart.model.ts

import { getProductById } from '../products/product.model';
import { Product } from '../types/product';

/**
 * Interface for a single item in the cart database table.
 */
interface CartItemDB {
  productId: number;
  quantity: number;
}

/**
 * Interface for the entire cart state associated with a user.
 */
interface CartDB {
  userId: number;
  items: CartItemDB[];
}

/**
 * Interface for the detailed Cart Item returned to the frontend.
 * Includes derived product details and calculated subtotal.
 */
export interface CartDetailItem extends CartItemDB {
  product: Product;
  subtotal: number;
}

// In-memory mock database for all carts (keyed by userId)
const mockCarts = new Map<number, CartDB>();

// --- Helper Functions ---

/**
 * Processes the raw cart items into a detailed structure for the frontend.
 */
export async function getDetailedCart(userId: number): Promise<{ items: CartDetailItem[], cartTotal: number }> {
    const cart = mockCarts.get(userId);
    if (!cart) return { items: [], cartTotal: 0 };

    // Look up product details for each item
    const detailPromises = cart.items.map(async (item) => {
        const product = await getProductById(item.productId);
        if (!product) return null;

        return {
            ...item,
            product,
            subtotal: product.price * item.quantity,
        } as CartDetailItem;
    });

    const detailedItems = (await Promise.all(detailPromises)).filter(item => item !== null) as CartDetailItem[];
    const cartTotal = detailedItems.reduce((sum, item) => sum + item.subtotal, 0);

    return { items: detailedItems, cartTotal };
}

// --- Cart Mutation Functions ---

/**
 * Adds or updates an item in the user's cart.
 */
export async function updateCartItem(userId: number, productId: number, quantity: number): Promise<CartDB> {
    const cart = mockCarts.get(userId) || { userId, items: [] };
    const product = await getProductById(productId);

    if (!product || product.availableStock < quantity) {
        throw new Error("Product not available or quantity exceeds stock.");
    }
    
    // Find or create item index
    const existingIndex = cart.items.findIndex(item => item.productId === productId);

    if (existingIndex > -1) {
        // Update quantity
        if (cart.items[existingIndex]) {
            cart.items[existingIndex].quantity = quantity;
        }
    } else {
        // Add new item
        cart.items.push({ productId, quantity });
    }
    
    // Filter out items with zero quantity
    cart.items = cart.items.filter(item => item.quantity > 0);

    mockCarts.set(userId, cart);
    return cart;
}

/**
 * Removes an item from the user's cart.
 */
export async function removeCartItem(userId: number, productId: number): Promise<CartDB> {
    const cart = mockCarts.get(userId);

    if (cart) {
        cart.items = cart.items.filter(item => item.productId !== productId);
        mockCarts.set(userId, cart);
    }
    return cart || { userId, items: [] };
}

/**
 * Clears the user's cart.
 */
export async function clearUserCart(userId: number): Promise<void> {
    mockCarts.delete(userId);
}