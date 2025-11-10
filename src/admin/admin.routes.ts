// src/admin/admin.routes.ts

import { Router, Response } from 'express';
import { authenticateToken, isAdmin, AuthRequest } from '../auth/auth.middleware';
import { createProduct, updateProduct, deleteProduct } from './admin.product.controllers';
import { getAllOrders, updateOrderStatus } from '../orders/order.model'; 
import { findAllUsersWithStats } from '../auth/auth.model';
import { 
    getDashboardStats, 
    getSalesData,
    getAllDiscountsController,
    createDiscountController,
    updateDiscountController,
    deleteDiscountController,
} from './admin.controllers';
import { listAllReviews, updateReviewStatus } from './admin.review.controllers';
import { createUserController, deleteUserController } from './admin.user.controllers';
import prisma from '../db';

export const adminRouter = Router();

// Apply Authentication and Admin Role Check to ALL Admin routes
adminRouter.use(authenticateToken, isAdmin);

// --- Dashboard & Reports ---
adminRouter.get('/dashboard-stats', getDashboardStats);
adminRouter.get('/reports/sales', getSalesData);

// --- Product Management ---
// GET /api/admin/products (Uses standard listProducts controller)
adminRouter.get('/products', async (req, res) => {
    // Reusing logic, but allowing fetching more data here if needed
    const { products, totalCount } = await require('../products/product.model').getFilteredProducts(req.query);
    return res.status(200).json({ products, totalCount });
});
adminRouter.post('/products', createProduct);
adminRouter.put('/products/:id', updateProduct);
adminRouter.delete('/products/:id', deleteProduct);

// --- Order Management ---
// GET /api/admin/orders
adminRouter.get('/orders', async (req, res) => {
    try {
        const allOrders = await getAllOrders();
        
        const summary = allOrders.map(o => ({
            id: o.id,
            date: o.createdAt.toISOString().split('T')[0],
            status: o.status,
            total: o.orderTotal,
            itemCount: (o as any)._count.items,
            userId: o.userId,
            paymentStatus: o.paymentStatus,
        }));
        
        return res.status(200).json({ orders: summary });
    } catch (error) {
        console.error('Admin Orders Error:', error);
        return res.status(500).json({ message: 'Failed to retrieve all orders.' });
    }
});

// PUT /api/admin/orders/:id/status (Admin action to update fulfillment status)
adminRouter.put('/orders/:id/status', async (req, res) => {
    const orderId = parseInt(req.params.id || '0');
    const { status } = req.body;
    if (isNaN(orderId) || !status) {
        return res.status(400).json({ message: 'Invalid order ID or status.' });
    }
    
    try {
        const updatedOrder = await updateOrderStatus(orderId, status);
        return res.status(200).json({ message: `Order ${orderId} status updated to ${updatedOrder.status}.` });
    } catch (error) {
        console.error('Update Order Status Error:', error);
        return res.status(500).json({ message: 'Failed to update order status.' });
    }
});

// --- User Management ---
// GET /api/admin/users
adminRouter.get('/users', async (req, res) => {
    try {
        const usersWithCount = await findAllUsersWithStats();
        
        const userList = usersWithCount.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt, // Changed from registrationDate to match frontend
            totalOrders: u._count.orders,
        }));

        return res.status(200).json({ users: userList });
    } catch (error) {
        console.error('Admin Users Error:', error);
        return res.status(500).json({ message: 'Failed to retrieve user list.' });
    }
});

// POST /api/admin/users (Admin creating a new user)
adminRouter.post('/users', createUserController);

// DELETE /api/admin/users/:id (Admin deleting a user)
adminRouter.delete('/users/:id', deleteUserController);

// --- Inventory Management ---
// GET /api/admin/inventory
adminRouter.get('/inventory', async (req, res) => {
    const { products } = await require('../products/product.model').getFilteredProducts(req.query);
    return res.status(200).json({ products });
});

// PUT /api/admin/inventory/:id/stock
adminRouter.put('/inventory/:id/stock', async (req, res) => {
    const productId = parseInt(req.params.id || '0');
    const { availableStock } = req.body;
    
    if (isNaN(productId) || availableStock === undefined) {
        return res.status(400).json({ message: 'Invalid product ID or stock amount.' });
    }

    try {
        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: { availableStock: parseInt(availableStock) },
        });
        return res.status(200).json({ message: "Stock updated successfully.", product: updatedProduct });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Product not found.' });
        }
        return res.status(500).json({ message: 'Failed to update stock.' });
    }
});

// --- Review Moderation ---
// GET /api/admin/reviews
adminRouter.get('/reviews', listAllReviews);

// PUT /api/admin/reviews/:id/status
adminRouter.put('/reviews/:id/status', updateReviewStatus);

// --- Discount Management ---
// GET /api/admin/discounts
adminRouter.get('/discounts', getAllDiscountsController);

// POST /api/admin/discounts
adminRouter.post('/discounts', createDiscountController);

// PUT /api/admin/discounts/:id
adminRouter.put('/discounts/:id', updateDiscountController);

// DELETE /api/admin/discounts/:id
adminRouter.delete('/discounts/:id', deleteDiscountController);