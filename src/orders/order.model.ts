// src/orders/order.model.ts

import { CartDetailItem, clearUserCart, getDetailedCart } from '../cart/cart.model';

/**
 * Interface for a complete Order record.
 */
export interface Order {
    id: number;
    userId: number;
    date: string;
    status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
    items: CartDetailItem[];
    shippingAddress: any; // Placeholder for Address data structure
    shippingCost: number;
    tax: number;
    total: number;
}

// In-memory mock database for orders
const mockOrders: Order[] = [];

/**
 * Mock function to save a finalized order.
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
        status: 'Processing',
        items,
        shippingAddress: address,
        shippingCost: totals.shipping,
        tax: totals.tax,
        total: totals.grandTotal,
    };
    
    mockOrders.push(newOrder);
    await clearUserCart(userId); // Clear cart after order placement
    return newOrder;
};

/**
 * Mock function to retrieve a user's order history.
 */
export const getUserOrders = async (userId: number): Promise<Order[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Reverse the order to show most recent first
    return mockOrders.filter(o => o.userId === userId).reverse();
};

/**
 * Mock function to retrieve a single order.
 */
export const getOrderById = async (orderId: number): Promise<Order | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockOrders.find(o => o.id === orderId);
};