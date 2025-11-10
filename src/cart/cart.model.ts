// src/cart/cart.model.ts

import prisma from "../db";
import { Product, Cart as PrismaCart, CartItem as PrismaCartItem } from "@prisma/client";

// Define the core structures for external use
export interface CartDetailItem {
  productId: number;
  quantity: number;
  product: Product;
  subtotal: number;
}

// --- Cart Retrieval ---

/**
 * Processes raw cart items into a detailed structure for the frontend.
 */
export async function getDetailedCart(userId: number): Promise<{ items: CartDetailItem[], cartTotal: number }> {
    const cartWithItems = await prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: true,
                },
            },
        },
    });

    if (!cartWithItems) return { items: [], cartTotal: 0 };

    const detailedItems: CartDetailItem[] = cartWithItems.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        product: item.product,
        subtotal: item.product.price * item.quantity,
    }));

    const cartTotal = detailedItems.reduce((sum, item) => sum + item.subtotal, 0);

    return { items: detailedItems, cartTotal };
}

// --- Cart Mutation Functions ---

/**
 * Adds or updates an item in the user's cart using a transaction.
 */
export async function updateCartItem(userId: number, productId: number, quantity: number): Promise<PrismaCart> {
    return prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({ where: { id: productId } });

        if (!product || product.availableStock < quantity) {
            throw new Error("Product not available or quantity exceeds stock.");
        }

        // 1. Find or create the user's cart
        const cart = await tx.cart.upsert({
            where: { userId },
            update: {},
            create: { userId },
        });

        // 2. Update or delete the item
        if (quantity > 0) {
            await tx.cartItem.upsert({
                where: {
                    cartId_productId: { cartId: cart.id, productId },
                },
                update: { quantity },
                create: { cartId: cart.id, productId, quantity },
            });
        } else {
            // Delete if quantity is 0 or less
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id, productId },
            });
        }
        
        // 3. Return the updated cart structure
        return tx.cart.findUniqueOrThrow({ where: { id: cart.id } });
    });
}

/**
 * Removes an item from the user's cart.
 */
export async function removeCartItem(userId: number, productId: number): Promise<PrismaCart> {
    const cart = await prisma.cart.findUnique({ where: { userId } });

    if (!cart) {
        throw new Error("Cart not found.");
    }

    // Attempt to delete the item
    await prisma.cartItem.deleteMany({
        where: { cartId: cart.id, productId },
    });

    return prisma.cart.findUniqueOrThrow({ where: { id: cart.id } });
}

/**
 * Clears the user's cart by deleting all associated items.
 */
export async function clearUserCart(userId: number): Promise<void> {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
        await prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
        });
        // Note: We keep the parent Cart record, just clear the items.
    }
}