// src/admin/admin.controllers.ts

import { Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import prisma from '../db';

// ==================== DASHBOARD & REPORTS ====================

/**
 * GET /api/admin/dashboard-stats
 * Fetches key metrics for the dashboard overview.
 */
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const today = new Date();
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        const stats = await prisma.$transaction([
            // 1. Total Revenue (Sum of 'orderTotal' for Delivered orders)
            prisma.order.aggregate({
                where: { status: 'Delivered' },
                _sum: { orderTotal: true },
            }),
            // 2. New Orders (Count of orders placed in the last 7 days)
            prisma.order.count({
                where: { createdAt: { gte: sevenDaysAgo } },
            }),
            // 3. Low Stock Items (Count of products where stock < 10)
            prisma.product.count({
                where: { availableStock: { gt: 0, lte: 10 } },
            }),
            // 4. Total Customers (Count of all users)
            prisma.user.count({
                where: { role: 'user' },
            }),
        ]);

        // Calculate Total Inventory Value (sum of price * stock)
        const rawProducts = await prisma.product.findMany({ 
            select: { price: true, availableStock: true } 
        });
        const totalInventoryValue = rawProducts.reduce(
            (sum, p) => sum + (p.price * p.availableStock), 
            0
        );

        return res.status(200).json({
            totalRevenue: stats[0]._sum.orderTotal || 0,
            newOrdersLast7D: stats[1],
            lowStockItems: stats[2],
            totalCustomers: stats[3],
            totalInventoryValue: totalInventoryValue,
            message: 'Dashboard stats fetched successfully.',
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        return res.status(500).json({ message: 'Failed to retrieve dashboard stats.' });
    }
};

/**
 * GET /api/admin/reports/sales
 * Fetches sales data for reporting (e.g., monthly revenue chart data).
 */
export const getSalesData = async (req: AuthRequest, res: Response) => {
    try {
        // Mock data structure matching frontend /admin/reports/page.tsx needs
        // In production, this would aggregate real order data by month
        return res.status(200).json({
            monthlySales: [
                { month: 'Oct', revenue: 4500, orders: 120 },
                { month: 'Nov', revenue: 6200, orders: 180 },
                { month: 'Dec', revenue: 8800, orders: 250 },
                { month: 'Jan', revenue: 5100, orders: 150 },
                { month: 'Feb', revenue: 4900, orders: 140 },
            ],
            categorySales: [
                { name: 'Women', value: 4000 },
                { name: 'Men', value: 3000 },
                { name: 'Unisex', value: 2500 },
            ],
            message: 'Report data generated.',
        });
    } catch (error) {
        console.error("Report Error:", error);
        return res.status(500).json({ message: 'Failed to retrieve report data.' });
    }
};

// ==================== DISCOUNT MANAGEMENT ====================

/**
 * GET /api/admin/discounts
 * Retrieves all discounts with optional filtering and searching.
 */
export const getAllDiscountsController = async (req: AuthRequest, res: Response) => {
    try {
        const { search, status } = req.query;
        
        const where: any = {};
        
        // Search by code or description
        if (search && typeof search === 'string') {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        
        // Filter by status
        if (status && typeof status === 'string') {
            where.status = status;
        }

        const discounts = await prisma.discount.findMany({
            where,
            orderBy: { endDate: 'desc' },
        });

        return res.status(200).json({ 
            discounts,
            message: 'Discounts fetched successfully.' 
        });
    } catch (error) {
        console.error('Get Discounts Error:', error);
        return res.status(500).json({ message: 'Failed to retrieve discounts.' });
    }
};

/**
 * POST /api/admin/discounts
 * Creates a new discount code.
 */
export const createDiscountController = async (req: AuthRequest, res: Response) => {
    try {
        const { 
            code, 
            description, 
            type, 
            value, 
            minPurchase, 
            maxUses, 
            startDate, 
            endDate 
        } = req.body;

        // Validation
        if (!code || !description || !type || !value || !startDate || !endDate) {
            return res.status(400).json({ 
                message: 'Missing required fields: code, description, type, value, startDate, endDate' 
            });
        }

        if (type !== 'percentage' && type !== 'fixed') {
            return res.status(400).json({ 
                message: 'Type must be either "percentage" or "fixed"' 
            });
        }

        // Check if code already exists
        const existing = await prisma.discount.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (existing) {
            return res.status(409).json({ 
                message: 'Discount code already exists.' 
            });
        }

        // Determine initial status based on start date
        const now = new Date();
        const start = new Date(startDate);
        const status = start > now ? 'scheduled' : 'active';

        const discount = await prisma.discount.create({
            data: {
                code: code.toUpperCase(),
                description,
                type,
                value: parseFloat(value.toString()),
                minPurchase: minPurchase ? parseFloat(minPurchase.toString()) : null,
                maxUses: maxUses ? parseInt(maxUses.toString()) : null,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                status,
            },
        });

        return res.status(201).json({ 
            discount,
            message: 'Discount created successfully.' 
        });
    } catch (error) {
        console.error('Create Discount Error:', error);
        return res.status(500).json({ message: 'Failed to create discount.' });
    }
};

/**
 * PUT /api/admin/discounts/:id
 * Updates an existing discount code.
 */
export const updateDiscountController = async (req: AuthRequest, res: Response) => {
    try {
        const discountId = parseInt(req.params.id || '0');
        
        if (isNaN(discountId) || discountId === 0) {
            return res.status(400).json({ message: 'Invalid discount ID.' });
        }

        const discount = await prisma.discount.findUnique({ 
            where: { id: discountId } 
        });

        if (!discount) {
            return res.status(404).json({ message: 'Discount not found.' });
        }

        const { 
            code,
            description, 
            type, 
            value, 
            minPurchase, 
            maxUses, 
            startDate, 
            endDate,
            status 
        } = req.body;

        // Recalculate status if dates were updated
        let newStatus = status || discount.status;
        
        if (startDate || endDate) {
            const now = new Date();
            const start = startDate ? new Date(startDate) : discount.startDate;
            const end = endDate ? new Date(endDate) : discount.endDate;

            if (end < now) {
                newStatus = 'expired';
            } else if (start > now) {
                newStatus = 'scheduled';
            } else if (newStatus === 'scheduled' || newStatus === 'expired') {
                // If dates changed to make it valid now, set to active
                newStatus = 'active';
            }
        }

        // Build update data object with only defined fields
        const updateData: any = {
            status: newStatus,
        };

        if (code) updateData.code = code.toUpperCase();
        if (description) updateData.description = description;
        if (type) updateData.type = type;
        if (value !== undefined) updateData.value = parseFloat(value.toString());
        if (minPurchase !== undefined) {
            updateData.minPurchase = minPurchase ? parseFloat(minPurchase.toString()) : null;
        }
        if (maxUses !== undefined) {
            updateData.maxUses = maxUses ? parseInt(maxUses.toString()) : null;
        }
        if (startDate) updateData.startDate = new Date(startDate);
        if (endDate) updateData.endDate = new Date(endDate);

        const updatedDiscount = await prisma.discount.update({
            where: { id: discountId },
            data: updateData,
        });

        return res.status(200).json({ 
            discount: updatedDiscount,
            message: 'Discount updated successfully.' 
        });
    } catch (error: any) {
        console.error('Update Discount Error:', error);
        
        if (error.code === 'P2002') {
            return res.status(409).json({ 
                message: 'Discount code already exists.' 
            });
        }
        
        return res.status(500).json({ message: 'Failed to update discount.' });
    }
};

/**
 * DELETE /api/admin/discounts/:id
 * Deletes a discount code.
 */
export const deleteDiscountController = async (req: AuthRequest, res: Response) => {
    try {
        const discountId = parseInt(req.params.id || '0');
        
        if (isNaN(discountId) || discountId === 0) {
            return res.status(400).json({ message: 'Invalid discount ID.' });
        }

        await prisma.discount.delete({
            where: { id: discountId },
        });

        return res.status(200).json({ 
            message: 'Discount deleted successfully.' 
        });
    } catch (error: any) {
        console.error('Delete Discount Error:', error);
        
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Discount not found.' });
        }
        
        return res.status(500).json({ message: 'Failed to delete discount.' });
    }
};