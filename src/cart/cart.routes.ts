// src/cart/cart.routes.ts

import { Router } from 'express';
import { authenticateToken } from '../auth/auth.middleware';
import { getCart, addItemOrUpdateQuantity, removeItem } from './cart.controllers';

export const cartRouter = Router();

// All cart routes require authentication
cartRouter.use(authenticateToken); 

// GET /api/cart
cartRouter.get('/', getCart);

// POST /api/cart (used for adding/updating quantity)
cartRouter.post('/', addItemOrUpdateQuantity);

// DELETE /api/cart/:productId
cartRouter.delete('/:productId', removeItem);