// src/cart/cart.controllers.ts

import { Request, Response } from 'express';
import { 
    getDetailedCart, 
    updateCartItem, 
    removeCartItem, 
    calculateFinalTotals, 
    clearUserCart 
} from './cart.model';
import { AuthRequest } from '../auth/auth.middleware';

/**
 * GET /api/cart
 * Retrieves the user's current cart details.
 * NOTE: This now uses the secure server-side calculation for the final totals
 * but defaults to 'standard' shipping for the non-checkout page view.
 */
export const getCart = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id; 
        const { items, cartSubtotal } = await getDetailedCart(userId);
        
        // Calculate totals with default standard shipping (no discount for generic view)
        const totals = await calculateFinalTotals(userId, 'standard', null);

        return res.status(200).json({ items, totals, cartTotal: cartSubtotal });
    } catch (error) {
        console.error("Get Cart Error:", error);
        return res.status(500).json({ message: 'Failed to retrieve cart.' });
    }
};

/**
 * POST /api/cart - Adds a new item or updates quantity.
 * OPTIMIZED: Returns 204 No Content for faster response times.
 * Client will refetch cart data using React Query invalidation.
 */
export const addItemOrUpdateQuantity = async (req: AuthRequest, res: Response) => {
    const { productId, quantity } = req.body;
    const userId = req.user!.id;

    if (!productId || typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ message: 'Invalid product ID or quantity.' });
    }

    try {
        await updateCartItem(userId, productId, quantity);
        
        // Return 204 No Content - client will refetch via React Query
        return res.status(204).send();
    } catch (error: any) {
        return res.status(400).json({ message: error.message || 'Failed to update cart.' });
    }
};

/**
 * DELETE /api/cart/:productId - Removes an item from the cart.
 * OPTIMIZED: Returns 204 No Content for faster response times.
 */
export const removeItem = async (req: AuthRequest, res: Response) => {
    const productId = parseInt(req.params.productId || '');
    const userId = req.user!.id;

    if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID.' });
    }

    try {
        await removeCartItem(userId, productId);
        
        // Return 204 No Content - client will refetch via React Query
        return res.status(204).send();
    } catch (error) {
        console.error("Remove Cart Item Error:", error);
        return res.status(500).json({ message: 'Failed to remove item from cart.' });
    }
};

/**
 * POST /api/cart/calculate - CRITICAL NEW ENDPOINT
 * Calculates final totals based on user's cart, shipping option, and discount code.
 * Ensures all financial calculations are serverside.
 */
export const calculateFinalCart = async (req: AuthRequest, res: Response) => {
    const { shippingOption, discountCode } = req.body;
    const userId = req.user!.id;
    
    if (!shippingOption || !['standard', 'express'].includes(shippingOption)) {
        return res.status(400).json({ message: 'Invalid shipping option provided.' });
    }

    try {
        const finalTotals = await calculateFinalTotals(userId, shippingOption, discountCode);
        
        // IMPORTANT: We only return the calculated totals, not the cart items themselves.
        return res.status(200).json(finalTotals);
    } catch (error: any) {
        console.error("Calculate Final Cart Error:", error);
        return res.status(500).json({ message: error.message || 'Failed to calculate final totals.' });
    }
};

/**
 * DELETE /api/cart/clear - NEW ENDPOINT
 * Clears all items from the user's cart.
 * OPTIMIZED: Returns 204 No Content for faster response times.
 */
export const clearCartController = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    try {
        await clearUserCart(userId);
        
        // Return 204 No Content - client will refetch via React Query
        return res.status(204).send();
    } catch (error) {
        console.error("Clear Cart Error:", error);
        return res.status(500).json({ message: 'Failed to clear cart.' });
    }
};