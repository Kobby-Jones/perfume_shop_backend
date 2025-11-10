// src/admin/admin.product.controllers.ts

import { Request, Response } from 'express';
import { getProductById } from '../products/product.model'; 
import { AuthRequest } from '../auth/auth.middleware';
import prisma from '../db';
import { Prisma } from '@prisma/client';

/**
 * POST /api/admin/products
 * Creates a new product.
 */
export const createProduct = async (req: AuthRequest, res: Response) => {
    const { name, description, price, availableStock, category, brand, originalPrice, details, images } = req.body;

    if (!name || !price || !category || !description || availableStock === undefined) {
        return res.status(400).json({ message: 'Missing required product fields (name, price, category, stock, description).' });
    }

    try {
        const newProduct = await prisma.product.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                availableStock: parseInt(availableStock),
                category,
                brand,
                originalPrice: originalPrice ? parseFloat(originalPrice) : null,
                details: details as Prisma.InputJsonValue,
                images: images || [], // Expects an array of URLs or empty array
                isFeatured: req.body.isFeatured ?? false,
            },
        });
        
        return res.status(201).json({ message: 'Product created successfully.', product: newProduct });
    } catch (error: any) {
        if (error.code === 'P2002') {
             return res.status(409).json({ message: 'Product name already exists.' });
        }
        console.error('Create Product Error:', error);
        return res.status(500).json({ message: 'Internal server error during product creation.' });
    }
};

/**
 * PUT /api/admin/products/:id
 * Updates an existing product.
 */
export const updateProduct = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body; // Add this line
    
    // Check if id exists before parsing
    if (!id) {
        return res.status(400).json({ message: 'Product ID is required.' });
    }
    
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID.' });
    }

    try {
        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                ...updates,
                price: updates.price ? parseFloat(updates.price) : undefined,
                availableStock: updates.availableStock !== undefined ? parseInt(updates.availableStock) : undefined,
                originalPrice: updates.originalPrice ? parseFloat(updates.originalPrice) : null,
                details: updates.details as Prisma.InputJsonValue,
            },
        });

        return res.status(200).json({
            message: 'Product updated successfully.',
            product: updatedProduct
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Product not found.' });
        }
        console.error('Update Product Error:', error);
        return res.status(500).json({ message: 'Internal server error during product update.' });
    }
};

/**
 * DELETE /api/admin/products/:id
 * Deletes a product.
 */
export const deleteProduct = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    
    // Check if id exists before parsing
    if (!id) {
        return res.status(400).json({ message: 'Product ID is required.' });
    }
    
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID.' });
    }
    
    try {
        await prisma.product.delete({ where: { id: productId } });
        return res.status(204).json({ message: 'Product deleted successfully.' });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Product not found.' });
        }
        console.error('Delete Product Error:', error);
        return res.status(500).json({ message: 'Internal server error during product deletion.' });
    }
};