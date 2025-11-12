// src/orders/order.model.ts

import prisma from "../db";
import { Order as PrismaOrder, OrderItem as PrismaOrderItem, Prisma } from '@prisma/client';
import { CartDetailItem } from '../cart/cart.model';

// Define types for orders with relations
type OrderWithItems = Prisma.OrderGetPayload<{
    include: { items: true }
}>;

type OrderWithCount = Prisma.OrderGetPayload<{
    include: { _count: { select: { items: true } } }
}>;

// --- Order Creation & Transaction ---

/**
 * Creates a new order record and moves items from the cart in an atomic transaction.
 * Also performs the critical inventory deduction.
 */
export const createOrder = async (
    userId: number, 
    items: CartDetailItem[], 
    shippingAddress: any, 
    totals: { 
        subtotal: number, 
        tax: number, 
        shipping: number, 
        grandTotal: number,
        discountCode?: string | null, // NEW: Include discount data
        discountAmount?: number | null 
    }
): Promise<PrismaOrder> => {
    
    // We wrap this entire critical operation in a Prisma transaction for atomicity
    return prisma.$transaction(async (tx) => {
        
        // 1. Check inventory and prepare OrderItems (including price snapshot)
        for (const item of items) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });

            if (!product || product.availableStock < item.quantity) {
                throw new Error(`Insufficient stock for product ID ${item.productId}`);
            }
            
            // Deduct inventory (CRITICAL STEP)
            await tx.product.update({
                where: { id: item.productId },
                data: { availableStock: { decrement: item.quantity } },
            });
        }
        
      // 2. Create the Order record
const newOrder = await tx.order.create({
    data: {
        userId,
        orderTotal: totals.grandTotal,
        shippingCost: totals.shipping,
        taxAmount: totals.tax,
        shippingAddress: shippingAddress as Prisma.InputJsonValue,
        status: 'Pending', 
        paymentStatus: 'pending',
        discountCode: totals.discountCode ?? null, // Convert undefined to null
        discountAmount: totals.discountAmount ?? null, // Convert undefined to null
    },
});
        
        // 3. Create Order Items using price snapshot from cart details
        await tx.orderItem.createMany({
            data: items.map(item => ({
                orderId: newOrder.id,
                productId: item.productId,
                name: item.product.name,
                price: item.product.price,
                quantity: item.quantity,
            })),
        });

        return newOrder;
    });
};

/**
 * Update order with payment reference.
 */
export const updateOrderPaymentReference = async (
    orderId: number,
    reference: string
): Promise<PrismaOrder> => {
    return prisma.order.update({
        where: { id: orderId },
        data: { paymentRef: reference },
    });
};

/**
 * Verify and complete order payment. Clears the cart *after* success.
 */
export const verifyOrderPayment = async (
    orderId: number,
    reference: string,
    userId: number
): Promise<PrismaOrder> => {
    return prisma.$transaction(async (tx) => {
        // 1. Update order status to Processing
        const updatedOrder = await tx.order.update({
            where: { id: orderId, paymentRef: reference, userId },
            data: { 
                paymentStatus: 'success', 
                status: 'Processing'
            },
        });
        
        // 2. Clear the user's cart (soft clear by deleting items)
        const userCart = await tx.cart.findUnique({ where: { userId } });
        if (userCart) {
            await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
        }
        
        return updatedOrder;
    });
};

/**
 * Mark order as failed (revert inventory is complex, for production, handle manually).
 */
export const markOrderFailed = async (orderId: number): Promise<void> => {
    await prisma.order.updateMany({
        where: { id: orderId, paymentStatus: { in: ['pending', 'failed'] } },
        data: { paymentStatus: 'failed', status: 'Cancelled' },
    });
};

// --- Order Retrieval ---

/**
 * Retrieve a user's order history summary.
 */
export const getUserOrders = async (userId: number): Promise<OrderWithCount[]> => {
    return prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
            _count: { select: { items: true } }
        }
    });
};

/**
 * Retrieve a single order with item details.
 */
export const getOrderById = async (orderId: number): Promise<OrderWithItems | null> => {
    return prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: true,
        },
    });
};

/**
 * Retrieve all orders for Admin.
 */
export const getAllOrders = async (): Promise<OrderWithCount[]> => { 
    return prisma.order.findMany({ 
        orderBy: { createdAt: 'desc' },
        include: {
            _count: { select: { items: true } }
        }
    });
};

/**
 * Admin: Updates the status of an order.
 */
export const updateOrderStatus = async (orderId: number, status: string): Promise<PrismaOrder> => {
    return prisma.order.update({
        where: { id: orderId },
        data: { status },
    });
};