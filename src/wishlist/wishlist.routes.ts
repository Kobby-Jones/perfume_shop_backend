// src/wishlist/wishlist.routes.ts

import { Router } from 'express';
import { authenticateToken } from '../auth/auth.middleware';
import { getWishlist, addToWishlist, removeFromWishlist } from './wishlist.controllers';

export const wishlistRouter = Router();

// All routes require authentication
wishlistRouter.use(authenticateToken); 

// GET /api/account/wishlist
wishlistRouter.get('/account/wishlist', getWishlist);

// POST /api/account/wishlist
wishlistRouter.post('/account/wishlist', addToWishlist);

// DELETE /api/account/wishlist/:productId
wishlistRouter.delete('/account/wishlist/:productId', removeFromWishlist);