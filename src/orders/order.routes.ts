// src/orders/order.routes.ts

import { Router } from 'express';
import { 
    getOrdersHistory, 
    getOrderDetail, 
    placeOrder,
    verifyPaystackPayment // NEW: Add verification endpoint
} from './order.controllers';
import { authenticateToken } from '../auth/auth.middleware';

export const orderRouter = Router();

// Checkout endpoints (requires authentication)
orderRouter.post('/checkout/order', authenticateToken, placeOrder); 
orderRouter.post('/checkout/paystack-verify', authenticateToken, verifyPaystackPayment); // NEW

// Order History endpoints (requires authentication)
orderRouter.get('/account/orders', authenticateToken, getOrdersHistory);
orderRouter.get('/account/orders/:id', authenticateToken, getOrderDetail);