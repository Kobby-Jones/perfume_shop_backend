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
import { getDetailedCart, calculateFinalTotals } from '../cart/cart.model'; // Use the secure model function
import { AuthRequest } from '../auth/auth.middleware';

/**
 * POST /api/checkout/order
 * Creates a new order record from the user's cart, securely validating totals.
 */
export const placeOrder = async (req: AuthRequest, res: Response) => {
    const { shippingAddress, shippingOption, discountCode } = req.body; // Expecting discountCode from FE
    const userId = req.user!.id;

    if (!shippingAddress || !shippingOption) {
        return res.status(400).json({ message: 'Shipping details are incomplete.' });
    }

    try {
        // 1. Get detailed cart and CRITICALLY calculate final totals server-side
        const { items } = await getDetailedCart(userId);
        if (items.length === 0) {
            return res.status(400).json({ message: 'Cannot place order, cart is empty.' });
        }

        const finalTotals = await calculateFinalTotals(userId, shippingOption, discountCode);
        
        // Extract the original subtotal (cartSubtotal) before discount from the finalTotals object
        // NOTE: We rely on the model to return the original subtotal which it now does.
        const orderSubtotal = finalTotals.subtotal; 
        
 // 2. Create the order and deduct inventory in a transaction
const newOrder = await createOrder(
    userId, 
    items, 
    shippingAddress, 
    {
        subtotal: orderSubtotal,
        tax: finalTotals.tax, 
        shipping: finalTotals.shipping, 
        grandTotal: finalTotals.grandTotal,
        discountCode: finalTotals.discountCode ?? null,
        discountAmount: finalTotals.discountAmount ?? null,
    }
);
        
        // 3. Generate unique payment reference
        const paymentReference = `PS-${newOrder.id}-${Date.now()}`;
        
        // 4. Store the reference in the order
        await updateOrderPaymentReference(newOrder.id, paymentReference);

        return res.status(201).json({
            orderId: newOrder.id,
            orderTotal: newOrder.orderTotal,
            orderTotalCents: Math.round(newOrder.orderTotal * 100), // For Paystack
            userEmail: req.user!.email,
            paymentReference: paymentReference,
            message: 'Order created successfully. Proceed to payment.'
        });
    } catch (error: any) {
        // Catch transaction errors (like insufficient stock)
        console.error('Place Order Error:', error.message);
        return res.status(400).json({ message: error.message || 'Failed to place order due to insufficient stock or database error.' });
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
        const order = await getOrderById(orderId);
        if (!order || order.userId !== userId) {
            return res.status(404).json({ message: 'Order not found or access denied.' });
        }

        // --- 1. Paystack API Verification ---
        const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
        if (!paystackSecretKey) throw new Error('PAYSTACK_SECRET_KEY not configured on server.');

        const verificationUrl = `https://api.paystack.co/transaction/verify/${reference}`;
        
        const paystackResponse = await axios.get(verificationUrl, {
            headers: { Authorization: `Bearer ${paystackSecretKey}` },
        });

        const { data: paystackData } = paystackResponse.data;

        // --- 2. Security Checks (Status and Amount) ---
        if (paystackData.status !== 'success') {
            await markOrderFailed(orderId);
            return res.status(400).json({ message: 'Payment failed or was not successful.' });
        }

        const expectedAmountInKobo = Math.round(order.orderTotal * 100);
        if (paystackData.amount !== expectedAmountInKobo) {
            await markOrderFailed(orderId);
            return res.status(400).json({ message: 'Payment amount mismatch. Potential fraud alert.' });
        }
        
        // --- 3. Finalize Order (Atomically clears cart and sets status) ---
        const updatedOrder = await verifyOrderPayment(orderId, reference, userId);

        return res.status(200).json({
            message: 'Payment verified successfully and order confirmed.',
            order: {
                id: updatedOrder.id,
                status: updatedOrder.status,
                total: updatedOrder.orderTotal,
            },
        });
    } catch (error: any) {
        console.error('Paystack Verification Critical Error:', error.response?.data || error.message);
        
        // Attempt to mark order as failed regardless of error source
        const orderIdInBody = req.body.orderId;
        if (orderIdInBody && !isNaN(parseInt(orderIdInBody))) {
            markOrderFailed(parseInt(orderIdInBody)).catch(e => console.error('Failed to mark order as failed:', e));
        }

        return res.status(500).json({ 
            message: 'Payment verification failed due to system error. Please contact support.',
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
            // Format dates as strings for consistent frontend consumption
            date: o.createdAt.toISOString().split('T')[0], 
            status: o.status as 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled',
            total: o.orderTotal,
            itemCount: (o as any)._count.items,
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
        
        // Map order items to frontend structure
        const items = order.items.map(item => ({
            product: { name: item.name, price: item.price },
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
        }));

        // Return a cleaner structure for the frontend detail page
        return res.status(200).json({
            id: order.id,
            date: order.createdAt.toISOString().split('T')[0],
            status: order.status as 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled',
            items: items,
            shippingAddress: order.shippingAddress,
            shippingCost: order.shippingCost,
            tax: order.taxAmount,
            total: order.orderTotal,
        });
    } catch (error) {
        console.error('Order Detail Error:', error);
        return res.status(500).json({ message: 'Failed to retrieve order details.' });
    }
};