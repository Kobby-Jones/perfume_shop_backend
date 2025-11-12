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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  // Use environment variable for frontend URL in production
  origin: process.env.FRONTEND_URL || 'https://scentiaperfume.netlify.app', 
  credentials: true,
}));

app.use(express.json()); 

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