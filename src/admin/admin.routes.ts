// src/admin/admin.routes.ts

import { Router } from 'express';
import { authenticateToken, isAdmin } from '../auth/auth.middleware';
import { createProduct, updateProduct } from './admin.product.controllers';
// NOTE: Order management controllers would be added here (listAllOrders, updateOrderStatus)

export const adminRouter = Router();

// Apply Authentication and Admin Role Check to ALL Admin routes
adminRouter.use(authenticateToken, isAdmin);

// --- Product Management ---
// POST /api/admin/products
adminRouter.post('/products', createProduct);

// PUT /api/admin/products/:id
adminRouter.put('/products/:id', updateProduct);


// --- Order Management ---
adminRouter.get('/orders', async (req, res) => {
    // FIX: Ensure this endpoint is correctly defined and returns structured data
    const { getAllOrders } = require('../orders/order.model'); 
    const allOrders = (await getAllOrders?.()) ?? [];  // Safe fallback if undefined
    const summary = allOrders.map((o: any) => ({

        id: o.id,
        date: o.date,
        status: o.status,
        total: o.total,
        itemCount: o.items.length,
        userId: o.userId,
    }));
    // Returns { orders: [...] }
    return res.status(200).json({ orders: summary }); 
});

// --- User Management ---
adminRouter.get('/users', async (req, res) => {
    // FIX: Ensure this endpoint is correctly defined and returns structured data
    const { mockUsers } = require('../auth/auth.model');
    const userList = mockUsers.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        registrationDate: "2024-10-10", 
        totalOrders: 1, 
    }));
    // Returns { users: [...] }
    return res.status(200).json({ users: userList });
});