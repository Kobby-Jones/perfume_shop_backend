// src/discounts/discount.controllers.ts

import { Request, Response } from 'express';
import { getValidDiscount } from './discount.model';
import { getDetailedCart } from '../cart/cart.model';
import { AuthRequest } from '../auth/auth.middleware';

/**
 * POST /api/discounts/validate
 * Validates a coupon code against the cart total and maximum uses.
 */
export const validateCoupon = async (req: AuthRequest, res: Response) => {
    const { code } = req.body;
    const userId = req.user!.id;
    
    if (!code) {
        return res.status(400).json({ message: 'Coupon code is required.' });
    }

    try {
        // 1. Check if the coupon is valid and active
        const discount = await getValidDiscount(code);

        if (!discount) {
            return res.status(404).json({ message: 'Invalid, expired, or fully redeemed coupon code.' });
        }

        // 2. Get cart subtotal to check minimum purchase requirement
        const { cartSubtotal } = await getDetailedCart(userId);
        
        if (discount.minPurchase && cartSubtotal < discount.minPurchase) {
            return res.status(400).json({ 
                message: `Minimum purchase of GHS ${discount.minPurchase.toFixed(2)} required.`,
                minPurchaseRequired: discount.minPurchase,
                currentCartTotal: cartSubtotal,
            });
        }

        // 3. Calculate discount amount for preview
        let discountAmount = 0;
        if (discount.type === 'percentage') {
            discountAmount = cartSubtotal * (discount.value / 100);
        } else if (discount.type === 'fixed') {
            discountAmount = Math.min(discount.value, cartSubtotal); // Can't discount more than cart total
        }
        discountAmount = parseFloat(discountAmount.toFixed(2));

        // 4. Success: return the discount details
        return res.status(200).json({
            message: 'Coupon applied successfully.',
            discount: {
                code: discount.code,
                type: discount.type,
                value: discount.value,
                discountAmount, // Show user how much they'll save
            },
        });
        
    } catch (error) {
        console.error("Coupon Validation Error:", error);
        return res.status(500).json({ message: 'Internal server error during coupon validation.' });
    }
};