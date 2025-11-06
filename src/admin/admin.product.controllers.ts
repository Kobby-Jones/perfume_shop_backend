// src/admin/admin.product.controllers.ts

import { Request, Response } from 'express';
import { getProductById } from '../products/product.model'; // Reusing types/logic
import { AuthRequest } from '../auth/auth.middleware';
import { Product } from '../types/product'

// MOCK: Array to simulate new product creation
let nextProductId = 10; 

/**
 * POST /api/admin/products
 * Creates a new product.
 */
export const createProduct = async (req: AuthRequest, res: Response) => {
    // NOTE: Full validation (Joi/Zod) would be used here
    const { name, description, price, availableStock, category, brand } = req.body;

    if (!name || !price || !category) {
        return res.status(400).json({ message: 'Missing required product fields.' });
    }

    // MOCK: Create new product and add to model's list
    const newProduct: Product = {
        id: nextProductId++,
        name,
        description: description || 'New product added by admin.',
        price: parseFloat(price),
        images: req.body.images || ['/images/placeholder.jpg'],
        availableStock: parseInt(availableStock) || 0,
        category,
        brand: brand || 'Scentia Internal',
        isFeatured: false,
    };
    
    // In a real app, this calls a database INSERT and invalidates cache
    // For mock: MOCK_PRODUCTS.push(newProduct); 
    
    return res.status(201).json({ message: 'Product created successfully.', product: newProduct });
};

/**
 * PUT /api/admin/products/:id
 * Updates an existing product.
 */
export const updateProduct = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: 'Product ID is required in URL.' });
    }

    const productId = parseInt(id, 10);
    const updates = req.body;

    if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID.' });
    }

    const existingProduct = await getProductById(productId);

    if (!existingProduct) {
        return res.status(404).json({ message: 'Product not found.' });
    }

    const updatedProduct = { ...existingProduct, ...updates };

    return res.status(200).json({
        message: 'Product updated successfully.',
        product: updatedProduct
    });
};
