// src/cart/cart.controllers.ts

import { Request, Response } from 'express';
import { getDetailedCart, updateCartItem, removeCartItem } from './cart.model';
import { AuthRequest } from '../auth/auth.middleware';

// --- Cart Utility Constants ---
// In a real app, these would come from config or a tax service
const SHIPPING_STANDARD_COST = 15.00;
const SHIPPING_EXPRESS_COST = 25.00;
const FREE_SHIPPING_THRESHOLD = 100.00;
const TAX_RATE = 0.08;

/**
 * Calculates totals for the order summary.
 */
export const calculateTotals = (subtotal: number, shippingOption: 'standard' | 'express') => {
    let shippingCost: number;
    
    if (shippingOption === 'express') {
        shippingCost = SHIPPING_EXPRESS_COST;
    } else {
        shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_STANDARD_COST;
    }

    const grandTax = (subtotal + shippingCost) * TAX_RATE;
    const grandTotal = subtotal + shippingCost + grandTax;

    return {
        subtotal,
        tax: parseFloat(grandTax.toFixed(2)),
        shipping: parseFloat(shippingCost.toFixed(2)),
        grandTotal: parseFloat(grandTotal.toFixed(2)),
    };
};

/**
 * GET /api/cart
 * Retrieves the user's current cart details.
 */
export const getCart = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id; // Authenticated user ID is guaranteed
        const { items, cartTotal } = await getDetailedCart(userId);
        
        // Default totals (assumes standard shipping for initial cart view)
        const totals = calculateTotals(cartTotal, 'standard');

        return res.status(200).json({ items, totals });
    } catch (error) {
        console.error("Get Cart Error:", error);
        return res.status(500).json({ message: 'Failed to retrieve cart.' });
    }
};

/**
 * POST /api/cart - Adds a new item or updates quantity.
 */
export const addItemOrUpdateQuantity = async (req: AuthRequest, res: Response) => {
    const { productId, quantity } = req.body;
    const userId = req.user!.id;

    if (!productId || typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ message: 'Invalid product ID or quantity.' });
    }

    try {
        await updateCartItem(userId, productId, quantity);
        const { items, cartTotal } = await getDetailedCart(userId);
        const totals = calculateTotals(cartTotal, 'standard'); 
        
        return res.status(200).json({ items, totals });
    } catch (error: any) {
        return res.status(400).json({ message: error.message || 'Failed to update cart.' });
    }
};

/**
 * DELETE /api/cart/:productId - Removes an item from the cart.
 */
export const removeItem = async (req: AuthRequest, res: Response) => {
    const productId = parseInt(req.params.productId || '');
    const userId = req.user!.id;

    if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID.' });
    }

    try {
        await removeCartItem(userId, productId);
        const { items, cartTotal } = await getDetailedCart(userId);
        const totals = calculateTotals(cartTotal, 'standard'); 

        return res.status(200).json({ items, totals });
    } catch (error) {
        console.error("Remove Cart Item Error:", error);
        return res.status(500).json({ message: 'Failed to remove item from cart.' });
    }
};