// src/wishlist/wishlist.controllers.ts

import { Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import { getDetailedWishlist, addProductToWishlist, removeProductFromWishlist } from './wishlist.model';

/**
 * GET /api/account/wishlist
 * Retrieves the user's detailed wishlist.
 */
export const getWishlist = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const items = await getDetailedWishlist(userId);
        return res.status(200).json({ items });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to retrieve wishlist.' });
    }
};

/**
 * POST /api/account/wishlist
 * Adds a product to the wishlist.
 */
export const addToWishlist = async (req: AuthRequest, res: Response) => {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: 'Product ID is required.' });

    try {
        const userId = req.user!.id;
        await addProductToWishlist(userId, productId);
        return res.status(200).json({ success: true, message: 'Product added to wishlist.' });
    } catch (error: any) {
        return res.status(400).json({ message: error.message || 'Failed to add item.' });
    }
};

/**
 * DELETE /api/account/wishlist/:productId
 * Removes a product from the wishlist.
 */
export const removeFromWishlist = async (req: AuthRequest, res: Response) => {
    const productIdParam = req.params.productId;
    if (!productIdParam) {
        return res.status(400).json({ message: 'Product ID is required.' });
    }

    const productId = parseInt(productIdParam);
    if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID.' });
    }

    try {
        const userId = req.user!.id;
        await removeProductFromWishlist(userId, productId);
        return res.status(200).json({ success: true, message: 'Product removed from wishlist.' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to remove item.' });
    }
};
