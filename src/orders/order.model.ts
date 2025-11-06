// src/orders/order.model.ts

import { CartDetailItem, clearUserCart } from '../cart/cart.model';

/**
 * Interface for a complete Order record.
 */
export interface Order {
    id: number;
    userId: number;
    date: string;
    status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Failed';
    items: CartDetailItem[];
    shippingAddress: any;
    shippingCost: number;
    tax: number;
    total: number;
    paymentReference?: string; // NEW: Store Paystack reference
    paymentStatus?: 'pending' | 'success' | 'failed'; // NEW: Track payment
}

// In-memory mock database for orders
const mockOrders: Order[] = [];

/**
 * Create a new order (before payment).
 */
export const createOrder = async (
    userId: number, 
    items: CartDetailItem[], 
    address: any, 
    totals: { tax: number, shipping: number, grandTotal: number }
): Promise<Order> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newOrder: Order = {
        id: mockOrders.length + 1000,
        userId,
        date: new Date().toISOString().split('T')[0] ?? '',
        status: 'Pending', // Start as Pending until payment verified
        items,
        shippingAddress: address,
        shippingCost: totals.shipping,
        tax: totals.tax,
        total: totals.grandTotal,
        paymentStatus: 'pending',
    };
    
    mockOrders.push(newOrder);
    return newOrder;
};

/**
 * Update order with payment reference.
 */
export const updateOrderPaymentReference = async (
    orderId: number,
    reference: string
): Promise<Order | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const order = mockOrders.find(o => o.id === orderId);
    if (order) {
        order.paymentReference = reference;
    }
    return order;
};

/**
 * Verify and complete order payment.
 */
export const verifyOrderPayment = async (
    orderId: number,
    reference: string
): Promise<Order | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const order = mockOrders.find(o => o.id === orderId);
    
    if (!order) return undefined;
    
    if (order.paymentReference !== reference) {
        throw new Error('Payment reference mismatch');
    }
    
    // Update order status to Processing after successful payment
    order.paymentStatus = 'success';
    order.status = 'Processing';
    
    // Clear the user's cart after successful payment
    await clearUserCart(order.userId);
    
    return order;
};

/**
 * Mark order as failed.
 */
export const markOrderFailed = async (orderId: number): Promise<void> => {
    const order = mockOrders.find(o => o.id === orderId);
    if (order) {
        order.paymentStatus = 'failed';
        order.status = 'Cancelled';
    }
};

/**
 * Retrieve a user's order history.
 */
export const getUserOrders = async (userId: number): Promise<Order[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockOrders.filter(o => o.userId === userId).reverse();
};

/**
 * Retrieve a single order.
 */
export const getOrderById = async (orderId: number): Promise<Order | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockOrders.find(o => o.id === orderId);
};

export const getAllOrders = async (): Promise<Order[]> => { 
    await new Promise(resolve => setTimeout(resolve, 300));
    // Return a reverse copy of ALL orders
    return mockOrders.slice().reverse(); 
};