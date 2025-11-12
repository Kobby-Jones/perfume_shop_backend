// src/reviews/review.routes.ts

import { Router } from 'express';
import { authenticateToken } from '../auth/auth.middleware';
import { listReviews, createReview, toggleHelpful } from './review.controllers';

export const reviewRouter = Router();

// GET reviews for a product (public access)
reviewRouter.get('/:productId', listReviews);

// POST a new review (protected access)
reviewRouter.post('/', authenticateToken, createReview);

// POST to increment helpful count (protected access)
reviewRouter.post('/:reviewId/helpful', authenticateToken, toggleHelpful);