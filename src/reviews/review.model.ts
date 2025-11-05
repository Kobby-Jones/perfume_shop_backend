// src/reviews/review.model.ts

/**
 * Interface for a single Review entry.
 */
export interface Review {
    id: number;
    productId: number;
    userId: number;
    userName: string; // Stored for display convenience
    rating: number; // 1 to 5 stars
    title: string;
    comment: string;
    date: string;
}

// In-memory mock database for all reviews
const mockReviews: Review[] = [
    { 
        id: 1, 
        productId: 1, 
        userId: 101, 
        userName: "AromaFan", 
        rating: 5, 
        title: "Absolutely exquisite!", 
        comment: "The Midnight Rose scent is rich and lasts all day. Worth every penny.", 
        date: "2025-10-25" 
    },
    { 
        id: 2, 
        productId: 1, 
        userId: 102, 
        userName: "ScentLover", 
        rating: 4, 
        title: "Great daily perfume", 
        comment: "A light floral, perfect for the office. Packaging was very elegant.", 
        date: "2025-11-01" 
    },
    { 
        id: 3, 
        productId: 3, 
        userId: 103, 
        userName: "OudMaster", 
        rating: 5, 
        title: "Deep and luxurious", 
        comment: "Velvet Oud is my new signature scent. Incredible longevity and complexity.", 
        date: "2025-10-10" 
    },
];

/**
 * Mock function to fetch reviews for a single product.
 */
export async function getReviewsByProductId(productId: number): Promise<Review[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    // Filter by product ID and show newest first
    return mockReviews
        .filter(r => r.productId === productId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Mock function to add a new review.
 */
export async function addReview(reviewData: {
    productId: number;
    userId: number;
    userName: string;
    rating: number;
    title: string;
    comment: string;
}): Promise<Review> {
    // Simulate async delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Prevent duplicate reviews by same user on the same product
    const existingReview = mockReviews.find(
        r => r.userId === reviewData.userId && r.productId === reviewData.productId
    );
    if (existingReview) {
        throw new Error("You have already reviewed this product.");
    }

    // Construct new review explicitly
    const newReview: Review = {
        id: mockReviews.length + 1,
        productId: reviewData.productId,
        userId: reviewData.userId,
        userName: reviewData.userName,
        rating: reviewData.rating,
        title: reviewData.title,
        comment: reviewData.comment,
        date: new Date().toISOString().split('T')[0] ?? '',};

    mockReviews.push(newReview);
    return newReview;
}

/**
 * Calculates the average rating for a product.
 */
export function getAverageRating(productId: number): { average: number, count: number } {
    const productReviews = mockReviews.filter(r => r.productId === productId);
    const count = productReviews.length;
    
    if (count === 0) return { average: 0, count: 0 };
    
    const sum = productReviews.reduce((total, r) => total + r.rating, 0);
    const average = parseFloat((sum / count).toFixed(1));
    
    return { average, count };
}