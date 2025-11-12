// src/cart/cart.model.ts

import prisma from "../db";
import { Product, Cart as PrismaCart, CartItem as PrismaCartItem } from "@prisma/client";
import { getValidDiscount } from '../discounts/discount.model'; // Import discount validation

// --- Cart Utility Constants (Securely defined on the backend) ---
const SHIPPING_STANDARD_COST = 15.00;
const SHIPPING_EXPRESS_COST = 25.00;
const FREE_SHIPPING_THRESHOLD = 100.00;
const TAX_RATE = 0.08;

// Define the core structures for external use
export interface CartDetailItem {
  productId: number;
  quantity: number;
  product: Product;
  subtotal: number;
}

export interface FinalTotals {
    subtotal: number;
    shipping: number;
    tax: number;
    discountAmount: number;
    grandTotal: number;
}

// --- Cart Retrieval ---

/**
 * Processes raw cart items into a detailed structure for the frontend.
 */
export async function getDetailedCart(userId: number): Promise<{ items: CartDetailItem[], cartSubtotal: number }> {
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

    if (!cartWithItems) return { items: [], cartSubtotal: 0 };

    const detailedItems: CartDetailItem[] = cartWithItems.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        product: item.product,
        subtotal: item.product.price * item.quantity,
    }));

    const cartSubtotal = detailedItems.reduce((sum, item) => sum + item.subtotal, 0);

    return { items: detailedItems, cartSubtotal };
}


/**
 * CRITICAL SECURITY FUNCTION: Calculates all final totals on the server.
 */
export async function calculateFinalTotals(
    userId: number, 
    shippingOption: 'standard' | 'express', 
    discountCode?: string | null
): Promise<FinalTotals & { discountCode?: string }> {
    
    // 1. Get Base Subtotal
    const { cartSubtotal } = await getDetailedCart(userId);
    let subtotal = cartSubtotal;
    let discountAmount = 0;
    let appliedCode = discountCode || null;

    if (subtotal === 0) {
        return { subtotal: 0, shipping: 0, tax: 0, discountAmount: 0, grandTotal: 0 };
    }

    // 2. Apply Discount
    if (appliedCode) {
        const discount = await getValidDiscount(appliedCode);
        
        if (discount) {
            // Check minimum purchase
            if (discount.minPurchase && subtotal < discount.minPurchase) {
                 // Discount is invalid, treat as null
                 appliedCode = null; 
            } else {
                if (discount.type === 'percentage') {
                    discountAmount = subtotal * (discount.value / 100);
                } else if (discount.type === 'fixed') {
                    discountAmount = discount.value;
                }
                discountAmount = parseFloat(discountAmount.toFixed(2));
                subtotal -= discountAmount; // Discount is applied to the subtotal
                subtotal = parseFloat(subtotal.toFixed(2));
                
                // Ensure subtotal does not go negative
                if (subtotal < 0) subtotal = 0; 
            }
        } else {
            appliedCode = null; // Mark as null if validation failed
        }
    }

    // 3. Calculate Shipping Cost (based on the NEW subtotal)
    let shippingCost: number;
    
    if (shippingOption === 'express') {
        shippingCost = SHIPPING_EXPRESS_COST;
    } else {
        // Free shipping logic applied to the subtotal *before* discount/tax
        shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_STANDARD_COST;
    }
    shippingCost = parseFloat(shippingCost.toFixed(2));

    // 4. Calculate Tax and Grand Total
    const taxableBase = subtotal + shippingCost;
    const tax = parseFloat((taxableBase * TAX_RATE).toFixed(2));
    const grandTotal = parseFloat((taxableBase + tax).toFixed(2));

    // 5. Build return object with proper optional property handling
    const result: FinalTotals & { discountCode?: string } = {
        subtotal: cartSubtotal, // Return original subtotal for display
        shipping: shippingCost,
        tax,
        discountAmount,
        grandTotal,
    };

    // Only add discountCode property if it exists (not null/undefined)
    if (appliedCode) {
        result.discountCode = appliedCode;
    }

    return result;
}


// --- Cart Mutation Functions ---

/**
 * Adds or updates an item in the user's cart using a transaction.
/**
 * Adds or updates an item in the user's cart.
 * Note: Individual upsert operations are atomic. Transaction removed to prevent
 * "Transaction not found" errors when transaction context becomes stale.
 */
export async function updateCartItem(userId: number, productId: number, quantity: number): Promise<PrismaCart> {
    // 1. Check product availability
    const product = await prisma.product.findUnique({ where: { id: productId } });

    if (!product || product.availableStock < quantity) {
        throw new Error("Product not available or quantity exceeds stock.");
    }

    // 2. Find or create the user's cart
    const cart = await prisma.cart.upsert({
        where: { userId },
        update: {},
        create: { userId },
    });

    // 3. Update or delete the item
    if (quantity > 0) {
        await prisma.cartItem.upsert({
            where: {
                cartId_productId: { cartId: cart.id, productId },
            },
            update: { quantity },
            create: { cartId: cart.id, productId, quantity },
        });
    } else {
        // Delete if quantity is 0 or less
        await prisma.cartItem.deleteMany({
            where: { cartId: cart.id, productId },
        });
    }
    
    // 4. Return the updated cart structure
    return prisma.cart.findUniqueOrThrow({ where: { id: cart.id } });
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