// src/orders/order.controllers.ts

import { Request, Response } from 'express';
import { createOrder, getUserOrders, getOrderById } from './order.model';
import { getDetailedCart } from '../cart/cart.model';
import { calculateTotals } from '../cart/cart.controllers'; // Reuse total calculation logic
import { AuthRequest } from '../auth/auth.middleware';

/**
 * POST /api/checkout/order
 * Creates a new order record from the user's cart. Simulates payment preparation.
 */
export const placeOrder = async (req: AuthRequest, res: Response) => {
    const { shippingAddress, shippingOption } = req.body;
    const userId = req.user!.id;

    if (!shippingAddress || !shippingOption) {
        return res.status(400).json({ message: 'Shipping details are incomplete.' });
    }

    try {
        const { items, cartTotal } = await getDetailedCart(userId);
        if (items.length === 0) {
            return res.status(400).json({ message: 'Cannot place order, cart is empty.' });
        }

        const totals = calculateTotals(cartTotal, shippingOption);

        // 1. Create the order record (status: Processing)
        const newOrder = await createOrder(userId, items, shippingAddress, totals);
        
        // 2. Prepare mock payment response (mimicking Paystack)
        const paymentGatewayUrl = `https://mock-paystack.com/pay/${newOrder.id}`;

        // The response tells the frontend where to redirect for payment
        return res.status(201).json({
            orderId: newOrder.id,
            orderTotal: newOrder.total,
            paymentGatewayUrl,
            message: 'Order created successfully. Proceed to payment.'
        });

    } catch (error) {
        console.error('Place Order Error:', error);
        return res.status(500).json({ message: 'Failed to place order.' });
    }
};


/**
 * GET /api/account/orders
 * Retrieves a user's entire order history.
 */
export const getOrdersHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const orders = await getUserOrders(userId);
        
        // Return only the necessary summary details for the history list
        const summary = orders.map(o => ({
            id: o.id,
            date: o.date,
            status: o.status,
            total: o.total,
            itemCount: o.items.length
        }));

        return res.status(200).json({ orders: summary });
    } catch (error) {
        console.error('Order History Error:', error);
        return res.status(500).json({ message: 'Failed to retrieve order history.' });
    }
};

/**
 * GET /api/account/orders/:id
 * Retrieves details for a specific order.
 */
export const getOrderDetail = async (req: AuthRequest, res: Response) => {
    const orderId = parseInt(req.params.id || '');
    const userId = req.user!.id;

    if (isNaN(orderId)) {
        return res.status(400).json({ message: 'Invalid order ID.' });
    }

    try {
        const order = await getOrderById(orderId);

        if (!order || order.userId !== userId) {
            // Important security check: users can only view their own orders
            return res.status(404).json({ message: 'Order not found or access denied.' });
        }

        return res.status(200).json(order);
    } catch (error) {
        console.error('Order Detail Error:', error);
        return res.status(500).json({ message: 'Failed to retrieve order details.' });
    }
};