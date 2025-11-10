// src/wishlist/wishlist.model.ts

import prisma from "../db";
import { Product } from "@prisma/client";

/**
 * Interface for the detailed Wishlist Item returned to the frontend.
 */
export interface WishlistItem {
  product: Product;
  dateAdded: Date;
}

// --- Helper Functions ---

/**
 * Retrieves the user's detailed wishlist.
 */
export async function getDetailedWishlist(userId: number): Promise<WishlistItem[]> {
    const wishlist = await prisma.wishlist.findUnique({
        where: { userId },
        include: {
            products: {
                include: {
                    product: true,
                },
                orderBy: {
                    dateAdded: 'desc', // Matches frontend sorting expectation
                }
            },
        },
    });

    if (!wishlist) return [];

    return wishlist.products.map(wp => ({
        product: wp.product,
        dateAdded: wp.dateAdded,
    }));
}

/**
 * Adds a product to the user's wishlist.
 */
export async function addProductToWishlist(userId: number, productId: number): Promise<void> {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error("Product not found.");

    // Find or create the user's wishlist record
    const wishlist = await prisma.wishlist.upsert({
        where: { userId },
        update: {},
        create: { userId },
    });

    // Add the product to the junction table
    try {
        await prisma.wishlistProducts.create({
            data: {
                wishlistId: wishlist.id,
                productId: productId,
                // dateAdded is automatically set by @default(now()) - don't pass it manually
            },
        });
    } catch (error: any) {
        // Ignore if already exists (unique constraint violation)
        if (!error.message.includes('Unique constraint failed')) {
             throw error;
        }
    }
}

/**
 * Removes a product from the user's wishlist.
 */
export async function removeProductFromWishlist(userId: number, productId: number): Promise<void> {
    const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
    
    if (wishlist) {
        await prisma.wishlistProducts.deleteMany({
            where: {
                wishlistId: wishlist.id,
                productId: productId,
            },
        });
    }
}