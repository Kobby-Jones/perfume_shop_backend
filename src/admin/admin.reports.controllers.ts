// src/admin/admin.reports.controllers.ts

import { Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import prisma from '../db';

/**
 * GET /api/admin/reports/overview
 * Get key metrics for the reports dashboard
 */
export async function getReportsOverview(req: AuthRequest, res: Response) {
    try {
        // Get date range (default to last 6 months)
        const monthsBack = parseInt(req.query.months as string) || 6;
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - monthsBack);

        // 1. Total Revenue in period
        const revenueData = await prisma.order.aggregate({
            where: {
                createdAt: { gte: startDate },
                paymentStatus: { in: ['completed', 'paid', 'success'] }
            },
            _sum: {
                orderTotal: true
            },
            _count: {
                id: true
            }
        });

        const totalRevenue = revenueData._sum.orderTotal || 0;
        const totalOrders = revenueData._count.id || 0;

        // 2. Average Order Value
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // 3. New Customers in period
        const newCustomers = await prisma.user.count({
            where: {
                createdAt: { gte: startDate },
                role: 'user'
            }
        });

        // 4. Total Customers
        const totalCustomers = await prisma.user.count({
            where: { role: 'user' }
        });

        return res.status(200).json({
            metrics: {
                totalRevenue,
                totalOrders,
                avgOrderValue,
                newCustomers,
                totalCustomers,
                period: `${monthsBack} months`
            }
        });
    } catch (error) {
        console.error('Reports Overview Error:', error);
        return res.status(500).json({ message: 'Failed to fetch reports overview.' });
    }
}

/**
 * GET /api/admin/reports/monthly-sales
 * Get monthly revenue and order data
 */
export async function getMonthlySales(req: AuthRequest, res: Response) {
    try {
        const monthsBack = parseInt(req.query.months as string) || 6;
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - monthsBack);

        // Get all orders in the period
        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startDate },
                paymentStatus: { in: ['completed', 'paid', 'success'] }
            },
            select: {
                createdAt: true,
                orderTotal: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Group by month
        const monthlyData = new Map<string, { revenue: number; orders: number }>();
        
        orders.forEach(order => {
            const monthKey = order.createdAt.toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
            });
            
            const existing = monthlyData.get(monthKey) || { revenue: 0, orders: 0 };
            monthlyData.set(monthKey, {
                revenue: existing.revenue + order.orderTotal,
                orders: existing.orders + 1
            });
        });

        // Convert to array format for charts
        const salesData = Array.from(monthlyData.entries()).map(([month, data]) => ({
            month,
            revenue: Math.round(data.revenue * 100) / 100,
            orders: data.orders
        }));

        return res.status(200).json({ salesData });
    } catch (error) {
        console.error('Monthly Sales Error:', error);
        return res.status(500).json({ message: 'Failed to fetch monthly sales data.' });
    }
}

/**
 * GET /api/admin/reports/category-sales
 * Get sales breakdown by product category
 */
export async function getCategorySales(req: AuthRequest, res: Response) {
    try {
        const monthsBack = parseInt(req.query.months as string) || 6;
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - monthsBack);

        // Get all order items with product categories
        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: {
                    createdAt: { gte: startDate },
                    paymentStatus: { in: ['completed', 'paid'] }
                }
            },
            include: {
                product: {
                    select: {
                        category: true
                    }
                }
            }
        });

        // Group by category
        const categoryData = new Map<string, number>();
        
        orderItems.forEach(item => {
            const category = item.product.category;
            const itemTotal = item.price * item.quantity;
            categoryData.set(category, (categoryData.get(category) || 0) + itemTotal);
        });

        // Convert to array format with colors
        const colors: Record<string, string> = {
            'Women': '#DB2777',
            'Men': '#3B82F6',
            'Unisex': '#F59E0B'
        };

        const categorySales = Array.from(categoryData.entries()).map(([name, value]) => ({
            name,
            value: Math.round(value * 100) / 100,
            color: colors[name] || '#6B7280'
        }));

        return res.status(200).json({ categorySales });
    } catch (error) {
        console.error('Category Sales Error:', error);
        return res.status(500).json({ message: 'Failed to fetch category sales data.' });
    }
}

/**
 * GET /api/admin/reports/top-products
 * Get best selling products
 */
export async function getTopProducts(req: AuthRequest, res: Response) {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const monthsBack = parseInt(req.query.months as string) || 6;
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - monthsBack);

        // Get top selling products
        const topProducts = await prisma.orderItem.groupBy({
            by: ['productId', 'name'],
            where: {
                order: {
                    createdAt: { gte: startDate },
                    paymentStatus: { in: ['completed', 'paid'] }
                }
            },
            _sum: {
                quantity: true,
                price: true
            },
            orderBy: {
                _sum: {
                    quantity: 'desc'
                }
            },
            take: limit
        });

        const products = topProducts.map(item => ({
            productId: item.productId,
            name: item.name,
            totalSold: item._sum.quantity || 0,
            totalRevenue: Math.round((item._sum.price || 0) * 100) / 100
        }));

        return res.status(200).json({ topProducts: products });
    } catch (error) {
        console.error('Top Products Error:', error);
        return res.status(500).json({ message: 'Failed to fetch top products.' });
    }
}