// src/discounts/discount.model.ts

import prisma from "../db";
import { Discount } from "@prisma/client";

// --- Admin CRUD Operations ---

/**
 * Retrieves all discounts for the admin panel with filtering and searching.
 */
export async function getAllDiscounts(query: any): Promise<Discount[]> {
    const where: any = {};
    
    if (query.search) {
        where.OR = [
            { code: { contains: query.search, mode: 'insensitive' as const } },
            { description: { contains: query.search, mode: 'insensitive' as const } },
        ];
    }
    if (query.status) {
        where.status = query.status;
    }

    return prisma.discount.findMany({
        where,
        orderBy: { endDate: 'desc' },
    });
}

/**
 * Creates a new discount code.
 */
export async function createDiscount(data: Omit<Discount, 'id' | 'currentUses' | 'createdAt' | 'updatedAt'>): Promise<Discount> {
    const status = new Date(data.startDate) > new Date() ? 'scheduled' : 'active';
    
    return prisma.discount.create({
        data: {
            code: data.code,
            description: data.description,
            type: data.type,
            value: parseFloat(data.value.toString()),
            minPurchase: data.minPurchase ? parseFloat(data.minPurchase.toString()) : null,
            maxUses: data.maxUses,
            startDate: data.startDate,
            endDate: data.endDate,
            status,
        },
    });
}

/**
 * Updates an existing discount code.
 */
export async function updateDiscount(id: number, data: Partial<Omit<Discount, 'id' | 'currentUses' | 'createdAt' | 'updatedAt'>>): Promise<Discount> {
    const discount = await prisma.discount.findUnique({ where: { id } });
    if (!discount) throw new Error("Discount not found.");
    
    let status = data.status || discount.status;

    // Recalculate status if dates were updated
    if (data.startDate || data.endDate) {
        const startDate = data.startDate ? new Date(data.startDate) : discount.startDate;
        const endDate = data.endDate ? new Date(data.endDate) : discount.endDate;
        const now = new Date();

        if (endDate < now) {
            status = 'expired';
        } else if (startDate > now) {
            status = 'scheduled';
        } else {
            status = 'active';
        }
    }
    
    // Build update data object with only defined fields
    const updateData: any = {
        status,
    };

    if (data.code !== undefined) updateData.code = data.code;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = parseFloat(data.value.toString());
    if (data.minPurchase !== undefined) {
        updateData.minPurchase = data.minPurchase ? parseFloat(data.minPurchase.toString()) : null;
    }
    if (data.maxUses !== undefined) updateData.maxUses = data.maxUses;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    
    return prisma.discount.update({
        where: { id },
        data: updateData,
    });
}

/**
 * Deletes a discount code.
 */
export async function deleteDiscount(id: number): Promise<void> {
    await prisma.discount.delete({ where: { id } });
}

// --- Public / Checkout Operations ---

/**
 * Finds a valid, active discount by code.
 * Exported for use in cart calculation logic.
 */
export async function getValidDiscount(code: string): Promise<Discount | null> {
    const discount = await prisma.discount.findUnique({
        where: { code },
    });
    
    // Check if discount is valid
    if (!discount) return null;
    if (discount.status !== 'active') return null;
    if (discount.endDate < new Date()) return null;
    if (discount.maxUses && discount.currentUses >= discount.maxUses) return null;

    return discount;
}

/**
 * Increments the use count for a discount (called upon successful payment/order completion).
 */
export async function incrementDiscountUse(id: number): Promise<void> {
    await prisma.discount.update({
        where: { id },
        data: { currentUses: { increment: 1 } },
    });
}

export { 
    getAllDiscounts as getAllDiscountsModel, 
    createDiscount as createDiscountModel,
    updateDiscount as updateDiscountModel,
    deleteDiscount as deleteDiscountModel,
}