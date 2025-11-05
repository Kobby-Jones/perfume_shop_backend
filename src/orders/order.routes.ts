// src/orders/order.routes.ts

import { Router } from 'express';
import { getOrdersHistory, getOrderDetail, placeOrder } from './order.controllers';
import { authenticateToken } from '../auth/auth.middleware';

export const orderRouter = Router();

// Checkout endpoint (requires authentication)
orderRouter.post('/checkout/order', authenticateToken, placeOrder); 

// Order History endpoints (requires authentication)
orderRouter.get('/account/orders', authenticateToken, getOrdersHistory);
orderRouter.get('/account/orders/:id', authenticateToken, getOrderDetail);