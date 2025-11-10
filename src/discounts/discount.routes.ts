// src/discounts/discount.routes.ts

import { Router } from 'express';
import { authenticateToken } from '../auth/auth.middleware';
import { validateCoupon } from './discount.controllers';

export const publicDiscountRouter = Router();

// POST /api/discounts/validate (Requires authentication to check against user's cart)
publicDiscountRouter.post('/discounts/validate', authenticateToken, validateCoupon);