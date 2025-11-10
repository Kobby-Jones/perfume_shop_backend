// src/products/product.model.ts

import prisma from "../db";
import { Product as PrismaProduct } from "@prisma/client";

/**
 * Interface for extended product data (matches frontend expectation)
 */
export interface ProductExtended extends PrismaProduct {
    // Add any virtual fields the frontend expects here if needed, 
    // but the updated schema covers most.
}

/**
 * Retrieves a list of products based on query parameters (filtering, sorting, pagination).
 */
export const getFilteredProducts = async (query: any) => {
    const where: any = {};
    const orderBy: any = {};
    
    // 1. Filtering Logic
    if (query.category) {
        where.category = { in: Array.isArray(query.category) ? query.category : [query.category] };
    }
    if (query.brand) {
        where.brand = { in: Array.isArray(query.brand) ? query.brand : [query.brand] };
    }
    if (query.minPrice || query.maxPrice) {
        where.price = {};
        if (query.minPrice) where.price.gte = parseFloat(query.minPrice);
        if (query.maxPrice) where.price.lte = parseFloat(query.maxPrice);
    }
    if (query.search) {
        where.OR = [
            { name: { contains: query.search, mode: 'insensitive' as const } },
            { brand: { contains: query.search, mode: 'insensitive' as const } },
            { description: { contains: query.search, mode: 'insensitive' as const } },
        ];
    }

    // 2. Sorting Logic
    switch (query.sort) {
        case "price-asc":
            orderBy.price = 'asc';
            break;
        case "price-desc":
            orderBy.price = 'desc';
            break;
        case "name-asc":
            orderBy.name = 'asc';
            break;
        case "name-desc":
            orderBy.name = 'desc';
            break;
        case "newest":
        default:
            orderBy.id = 'desc';
    }

    // 3. Pagination Logic
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [products, totalCount] = await prisma.$transaction([
        prisma.product.findMany({
            where,
            orderBy,
            skip,
            take: limit,
        }),
        prisma.product.count({ where }),
    ]);

    return { products, totalCount };
};

/**
 * Retrieves a single product by its ID.
 */
export const getProductById = async (id: number): Promise<PrismaProduct | null> => {
    return prisma.product.findUnique({
        where: { id },
    });
};