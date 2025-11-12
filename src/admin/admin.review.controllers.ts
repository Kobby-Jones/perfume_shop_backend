// src/admin/admin.review.controllers.ts

import { Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import prisma from '../db';
import { Review } from '@prisma/client';

// Define the precise type structure returned by the Prisma query
interface ReviewWithDetails extends Review {
    product: { name: string; id: number };
    user: { name: string; email: string };
}

/**
 * GET /api/admin/reviews
 * Retrieves all reviews for moderation.
 */
export const listAllReviews = async (req: AuthRequest, res: Response) => {
    try {
        const reviews = await prisma.review.findMany({
            include: {
                product: { select: { name: true, id: true } },
                user: { select: { name: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        }) as ReviewWithDetails[]; // Apply the accurate type cast

        // Map to a cleaner, flat structure for the frontend table
        const formattedReviews = reviews.map(r => ({
            id: r.id,
            // Pass the original objects for safety checks in the frontend filter
            product: r.product, 
            user: r.user,
            rating: r.rating,
            title: r.title,
            comment: r.comment,
            // IMPORTANT: Use ISOString and split to match existing FE format
            createdAt: r.createdAt.toISOString(), 
            status: r.status,
        }));

        return res.status(200).json({ reviews: formattedReviews });
    } catch (error) {
        console.error("List All Reviews Error:", error);
        return res.status(500).json({ message: 'Failed to retrieve all reviews.' });
    }
};

/**
 * PUT /api/admin/reviews/:id/status
 * Updates the moderation status of a review.
 */
export const updateReviewStatus = async (req: AuthRequest, res: Response) => {
// ... (Controller logic remains the same, as it was already correct)
    // Check if id exists before parsing
    if (!req.params.id) {
        return res.status(400).json({ message: 'Review ID is required.' });
    }

    const reviewId = parseInt(req.params.id);
    const { status } = req.body; // Expects 'approved' or 'rejected'
    
    if (isNaN(reviewId) || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid review ID or status.' });
    }
    
    try {
        const updatedReview = await prisma.review.update({
            where: { id: reviewId },
            data: { status },
        });

        // Trigger recalculation of product rating only if status is approved
        if (status === 'approved') {
            await prisma.$executeRaw`
                UPDATE "Product"
                SET "rating" = (SELECT AVG(rating) FROM "Review" WHERE "productId" = ${updatedReview.productId} AND status = 'approved'),
                "reviewCount" = (SELECT COUNT(*) FROM "Review" WHERE "productId" = ${updatedReview.productId} AND status = 'approved')
                WHERE id = ${updatedReview.productId};
            `;
        }
        
        return res.status(200).json({ message: `Review status set to ${status}.`, review: updatedReview });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Review not found.' });
        }
        console.error('Update Review Status Error:', error);
        return res.status(500).json({ message: 'Failed to update review status.' });
    }
};