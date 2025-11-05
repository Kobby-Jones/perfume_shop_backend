// src/products/product.controllers.ts

import { Request, Response } from 'express';
import { getFilteredProducts, getProductById } from './product.model';

/**
 * GET /api/products
 * Retrieves a list of products based on query parameters (filtering, sorting, pagination).
 */
export const listProducts = async (req: Request, res: Response) => {
  try {
    const { products, totalCount } = await getFilteredProducts(req.query);

    return res.status(200).json({
      products,
      totalCount,
      message: 'Products fetched successfully.'
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ message: 'Internal server error while fetching products.' });
  }
};

/**
 * GET /api/products/:id
 * Retrieves a single product by its unique ID.
 */
export const getProduct = async (req: Request, res: Response) => {
  const id = parseInt(req.params.id || '');

  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid product ID provided.' });
  }

  try {
    const product = await getProductById(id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};