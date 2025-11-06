// src/orders/order.controllers.ts

import { Request, Response } from 'express';
import axios from 'axios';
import { 
    createOrder, 
    getUserOrders, 
    getOrderById, 
    updateOrderPaymentReference,
    verifyOrderPayment,
    markOrderFailed
} from './order.model';
import { getDetailedCart } from '../cart/cart.model';
import { calculateTotals } from '../cart/cart.controllers';
import { AuthRequest } from '../auth/auth.middleware';

/**
 * POST /api/checkout/order
 * Creates a new order record from the user's cart.
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

        // Create the order with Pending status
        const newOrder = await createOrder(userId, items, shippingAddress, totals);
        
        // Generate unique payment reference
        const paymentReference = `PS-${newOrder.id}-${Date.now()}`;
        
        // Store the reference in the order
        await updateOrderPaymentReference(newOrder.id, paymentReference);

        return res.status(201).json({
            orderId: newOrder.id,
            orderTotal: newOrder.total,
            orderTotalCents: Math.round(newOrder.total * 100), // For Paystack
            userEmail: req.user!.email,
            paymentReference: paymentReference,
            message: 'Order created successfully. Proceed to payment.'
        });
    } catch (error) {
        console.error('Place Order Error:', error);
        return res.status(500).json({ message: 'Failed to place order.' });
    }
};

/**
 * POST /api/checkout/paystack-verify
 * Verifies Paystack payment and finalizes the order.
 */
export const verifyPaystackPayment = async (req: AuthRequest, res: Response) => {
    const { reference, orderId } = req.body;
    const userId = req.user!.id;

    if (!reference || !orderId) {
        return res.status(400).json({ message: 'Missing payment reference or order ID.' });
    }

    try {
        // 1. Verify the order exists and belongs to this user
        const order = await getOrderById(orderId);
        if (!order || order.userId !== userId) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // 2. Verify with Paystack API
        const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
        
        if (!paystackSecretKey) {
            console.error('PAYSTACK_SECRET_KEY not configured');
            return res.status(500).json({ message: 'Payment configuration error.' });
        }

        const verificationUrl = `https://api.paystack.co/transaction/verify/${reference}`;
        
        const paystackResponse = await axios.get(verificationUrl, {
            headers: {
                Authorization: `Bearer ${paystackSecretKey}`,
            },
        });

        const { data: paystackData } = paystackResponse.data;

        // 3. Check if payment was successful
        if (paystackData.status !== 'success') {
            await markOrderFailed(orderId);
            return res.status(400).json({ 
                message: 'Payment verification failed.',
                status: paystackData.status 
            });
        }

        // 4. Verify the amount matches
        const expectedAmountInKobo = Math.round(order.total * 100);
        if (paystackData.amount !== expectedAmountInKobo) {
            await markOrderFailed(orderId);
            return res.status(400).json({ 
                message: 'Payment amount mismatch.',
                expected: expectedAmountInKobo,
                received: paystackData.amount
            });
        }

        // 5. Update order status to Processing
        const updatedOrder = await verifyOrderPayment(orderId, reference);

        return res.status(200).json({
            message: 'Payment verified successfully.',
            order: {
                id: updatedOrder!.id,
                status: updatedOrder!.status,
                total: updatedOrder!.total,
            },
        });
    } catch (error: any) {
        console.error('Paystack Verification Error:', error.response?.data || error.message);
        
        // Mark order as failed
        try {
            await markOrderFailed(orderId);
        } catch (e) {
            console.error('Failed to mark order as failed:', e);
        }

        return res.status(500).json({ 
            message: 'Payment verification failed.',
            error: error.response?.data?.message || error.message 
        });
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
        
        const summary = orders.map(o => ({
            id: o.id,
            date: o.date,
            status: o.status,
            total: o.total,
            itemCount: o.items.length,
            paymentStatus: o.paymentStatus,
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
            return res.status(404).json({ message: 'Order not found or access denied.' });
        }

        return res.status(200).json(order);
    } catch (error) {
        console.error('Order Detail Error:', error);
        return res.status(500).json({ message: 'Failed to retrieve order details.' });
    }
};