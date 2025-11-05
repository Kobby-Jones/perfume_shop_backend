// src/server.ts

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors'; // Important for connecting frontend and backend
import { authRouter } from './auth/auth.routes';
import { productRouter } from './products/product.routes'; // Import product routes
import { cartRouter } from './cart/cart.routes'; // Import cart routes
import { orderRouter } from './orders/order.routes'; // Import order routes
import { wishlistRouter } from './wishlist/wishlist.routes'; // Import wishlist routes

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
// Allow communication between Next.js frontend (e.g., http://localhost:3000) and backend
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true,
}));

// Parses incoming JSON requests
app.use(express.json()); 

// --- API Routes ---
// The authentication routes
app.use('/api/auth', authRouter);

// Product routes
app.use('/api/products', productRouter); // Connect product router

// Cart and Orders routes (grouped under /api)
app.use('/api/cart', cartRouter);

// Wishlist routes
app.use('/api', wishlistRouter); // Note: /api/account/wishlist starts here

app.use('/api', orderRouter); // Note: /api/checkout/order and /api/account/orders start here

// Basic health check route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Perfume Shop API is running.' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`\nServer is running on http://localhost:${PORT}`);
  console.log(`API URL: ${process.env.API_BASE_URL || `http://localhost:${PORT}`}\n`);
});