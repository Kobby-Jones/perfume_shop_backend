// src/reviews/review.model.ts

import prisma from "../db";
import { Review as PrismaReview } from "@prisma/client";
import { UserSafe } from "../auth/auth.model";

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
    // Add verification or helpfulness if implemented later
}

/**
 * Fetches reviews for a single product.
 */
export async function getReviewsByProductId(productId: number): Promise<ReviewDetail[]> {
    const reviewsWithUser = await prisma.review.findMany({
        where: { productId },
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
    }));
}

/**
 * Adds a new review, ensuring a unique constraint per user/product.
 */
export async function addReview(reviewData: {
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
            },
        });
        
        // **CRITICAL:** Update product rating/count after submission (Optional/Advanced: implement proper average calculation)
        await prisma.$executeRaw`
            UPDATE "Product"
            SET "reviewCount" = (SELECT COUNT(*) FROM "Review" WHERE "productId" = ${reviewData.productId}),
            "rating" = (SELECT AVG(rating) FROM "Review" WHERE "productId" = ${reviewData.productId})
            WHERE id = ${reviewData.productId};
        `;

        return newReview;
    } catch (e: any) {
        if (e.code === 'P2002') { // Prisma unique constraint violation code
            throw new Error("You have already submitted a review for this product.");
        }
        throw e;
    }
}

/**
 * Calculates the average rating and count for a product directly from the database.
 */
export async function getAverageRating(productId: number): Promise<{ average: number, count: number }> {
    const result = await prisma.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { _all: true },
    });

    const average = parseFloat((result._avg.rating || 0).toFixed(1));
    const count = result._count._all;
    
    // Fallback if no reviews exist, or use the pre-calculated fields
    if (count === 0) {
        const product = await prisma.product.findUnique({ where: { id: productId }, select: { rating: true, reviewCount: true } });
        return { average: product?.rating || 0, count: product?.reviewCount || 0 };
    }

    return { average, count };
}