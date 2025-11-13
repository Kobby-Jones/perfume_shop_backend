// src/server.ts

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; 
import { authRouter } from './auth/auth.routes';
import { productRouter } from './products/product.routes'; 
import { cartRouter } from './cart/cart.routes'; 
import { orderRouter } from './orders/order.routes'; 
import { wishlistRouter } from './wishlist/wishlist.routes'; 
import { reviewRouter } from './reviews/review.routes'; 
import { adminRouter } from './admin/admin.routes'; 
import { addressRouter } from './addresses/address.routes';
import { publicDiscountRouter } from './discounts/discount.routes';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// --- 1. DEFINE AND EXPORT RATE LIMITERS ---

/**
 * General Limiter: Applied to all API routes by default.
 * Allows 1000 requests per 15 minutes.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, 
  message: 'Too many requests from this IP, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth Limiter: Applied to login, registration, and password reset attempts.
 * Allows 10 attempts per 15 minutes.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, 
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Checkout Limiter: Applied to the order placement endpoint.
 * Allows a maximum of 5 orders per hour to prevent inventory spamming.
 */
export const checkoutLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, 
  message: 'Too many order attempts. You can place up to 5 orders per hour.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors({
  // Use environment variable for frontend URL in production
  origin: process.env.FRONTEND_URL || 'https://scentiaperfume.netlify.app', 
  credentials: true,
}));

app.use(express.json()); 
// --- 2. APPLY GENERAL RATE LIMITING TO ALL PUBLIC ROUTES ---
app.use(generalLimiter); // Applies to all routes by default

// --- API Routes ---
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter); 
app.use('/api/cart', cartRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/discounts', publicDiscountRouter); // Public discount validation route

// Group protected routes under /api, consistent with frontend requests:
app.use('/api', wishlistRouter); // /api/account/wishlist
app.use('/api', orderRouter); // /api/checkout/order, /api/account/orders
app.use('/api', addressRouter); // NEW: /api/account/addresses

// Admin Dashboard Routes (Highly restricted and authenticated by middleware)
app.use('/api/admin', adminRouter);

// Basic health check route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Perfume Shop API is running.' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`\nServer is running on http://localhost:${PORT}`);
  console.log(`API URL: ${process.env.API_BASE_URL || `http://localhost:${PORT}`}\n`);
});