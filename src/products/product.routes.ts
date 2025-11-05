// src/products/product.routes.ts

import { Router } from 'express';
import { listProducts, getProduct } from './product.controllers';

export const productRouter = Router();

// GET /api/products
productRouter.get('/', listProducts);

// GET /api/products/:id
productRouter.get('/:id', getProduct);