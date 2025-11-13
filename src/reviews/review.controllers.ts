// src/reviews/review.controllers.ts

import { Request, Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import { getReviewsByProductId, addReview, getAverageRating, incrementReviewHelpfulCount } from './review.model';
import sanitizeHtml from 'sanitize-html'; // <-- NEW IMPORT

/**
 * GET /api/reviews/:productId
 * Retrieves all reviews and average rating for a product.
 */
export const listReviews = async (req: Request, res: Response) => {
    const productIdStr = req.params.productId;
    
    if (!productIdStr) {
        return res.status(400).json({ message: 'Product ID is required.' });
    }
    
    const productId = parseInt(productIdStr, 10);
    
    if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID.' });
    }

    try {
        const reviews = await getReviewsByProductId(productId);
        const { average, count } = await getAverageRating(productId);

        return res.status(200).json({ 
            reviews,
            averageRating: average,
            reviewCount: count,
        });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to retrieve reviews.' });
    }
};

/**
 * POST /api/reviews
 * Creates a new review (requires authentication).
 */
export const createReview = async (req: AuthRequest, res: Response) => {
    const { productId, rating, title, comment } = req.body;
    const userId = req.user!.id; 

    if (!productId || !rating || !title || !comment || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Missing or invalid review fields.' });
    }

    try {
        // --- START OF SANITIZATION ---
        const sanitizedTitle = sanitizeHtml(title, {
            allowedTags: [], // Strip all HTML tags
            allowedAttributes: {}
        });
        const sanitizedComment = sanitizeHtml(comment, {
            allowedTags: [], // Strip all HTML tags
            allowedAttributes: {}
        });
        // --- END OF SANITIZATION ---
        
        const newReview = await addReview({
            productId,
            userId,
            rating,
            title: sanitizedTitle, // <-- USE SANITIZED VALUE
            comment: sanitizedComment, // <-- USE SANITIZED VALUE
        });

        return res.status(201).json(newReview);
    } catch (error: any) {
        return res.status(409).json({ message: error.message || 'Failed to submit review.' });
    }
};

/**
 * POST /api/reviews/:reviewId/helpful
 * Increments the helpful count for a review.
 */
export const toggleHelpful = async (req: AuthRequest, res: Response) => {
    const reviewId = parseInt(req.params.reviewId || '0');

    if (isNaN(reviewId) || reviewId === 0) {
        return res.status(400).json({ message: 'Invalid review ID.' });
    }

    try {
        await incrementReviewHelpfulCount(reviewId);
        return res.status(200).json({ message: 'Helpful count updated.' });
    } catch (error) {
        console.error('Toggle Helpful Error:', error);
        return res.status(500).json({ message: 'Failed to update helpful status.' });
    }
};
