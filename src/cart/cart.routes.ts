// src/cart/cart.routes.ts

import { Router } from 'express';
import { authenticateToken } from '../auth/auth.middleware';
import { 
    getCart, 
    addItemOrUpdateQuantity, 
    removeItem, 
    calculateFinalCart, 
    clearCartController 
} from './cart.controllers';

export const cartRouter = Router();

// All cart routes require authentication
cartRouter.use(authenticateToken); 

// GET /api/cart - Retrieve cart
cartRouter.get('/', getCart);

// POST /api/cart - Add or update item quantity
cartRouter.post('/', addItemOrUpdateQuantity);

// POST /api/cart/calculate - Calculate final totals (MUST be before /:productId)
cartRouter.post('/calculate', calculateFinalCart);

// DELETE /api/cart/clear - Clear entire cart (MUST be before /:productId)
cartRouter.delete('/clear', clearCartController);

// DELETE /api/cart/:productId - Remove single item (MUST be last)
cartRouter.delete('/:productId', removeItem);