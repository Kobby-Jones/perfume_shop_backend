// src/reviews/review.model.ts

import prisma from "../db";
import { Review as PrismaReview } from "@prisma/client";

/**
 * Interface for a detailed Review entry returned to the frontend.
 */
export interface ReviewDetail {
    id: number;
    productId: number;
    userId: number;
    userName: string;
    rating: number; 
    title: string;
    comment: string;
    date: Date;
    helpfulCount: number; // NEW
}

/**
 * Fetches reviews for a single product.
 */
export async function getReviewsByProductId(productId: number): Promise<ReviewDetail[]> {
    const reviewsWithUser = await prisma.review.findMany({
        where: { productId, status: 'approved' }, // Only fetch approved reviews for public display
        include: {
            user: {
                select: { name: true } // Select only the name
            }
        },
        orderBy: { createdAt: 'desc' },
    });

    return reviewsWithUser.map(r => ({
        id: r.id,
        productId: r.productId,
        userId: r.userId,
        userName: r.user.name, // Use the user's actual name
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        date: r.createdAt,
        helpfulCount: r.helpfulCount, // NEW
    }));
}

/**
 * Adds a new review, ensuring a unique constraint per user/product.
 */
export async function addReview(reviewData: {
// ... (signature remains the same)
    productId: number;
    userId: number;
    rating: number;
    title: string;
    comment: string;
}): Promise<PrismaReview> {
    try {
        const newReview = await prisma.review.create({
            data: {
                productId: reviewData.productId,
                userId: reviewData.userId,
                rating: reviewData.rating,
                title: reviewData.title,
                comment: reviewData.comment,
                status: 'pending', // Default to pending for admin moderation
            },
        });
        
        // Note: Product rating update moved to admin.review.controllers.ts (when approved)

        return newReview;
    } catch (e: any) {
        if (e.code === 'P2002') { // Prisma unique constraint violation code
            throw new Error("You have already submitted a review for this product.");
        }
        throw e;
    }
}

/**
 * Calculates the average rating and count for a product directly from approved reviews.
 */
export async function getAverageRating(productId: number): Promise<{ average: number, count: number }> {
    const result = await prisma.review.aggregate({
        where: { productId, status: 'approved' }, // IMPORTANT: Only aggregate approved reviews
        _avg: { rating: true },
        _count: { _all: true },
    });

    const average = parseFloat((result._avg.rating || 0).toFixed(1));
    const count = result._count._all;
    
    // We rely on the aggregated result from approved reviews.
    return { average, count };
}

/**
 * Increments the helpfulCount for a review.
 */
export async function incrementReviewHelpfulCount(reviewId: number): Promise<void> {
    await prisma.review.update({
        where: { id: reviewId },
        data: { helpfulCount: { increment: 1 } },
    });
}