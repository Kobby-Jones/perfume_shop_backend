// src/auth/auth.routes.ts

import { Router } from 'express';
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    getCurrentUser, 
    updateProfileInfo,
    changePassword,
    forgotPassword,
    resetPassword,
    getAccountStatsController // ← NEW
} from './auth.controllers';
import { authenticateToken } from './auth.middleware';

export const authRouter = Router();

// --- PUBLIC AUTHENTICATION ROUTES ---
authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);
authRouter.post('/logout', logoutUser);

// NEW: Password Recovery Routes
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);

// --- PROTECTED ACCOUNT ROUTES ---
authRouter.get('/me', authenticateToken, getCurrentUser);
authRouter.put('/profile', authenticateToken, updateProfileInfo);
authRouter.put('/password', authenticateToken, changePassword);

// NEW: Account Stats (Dashboard Data)
authRouter.get('/account/stats', authenticateToken, getAccountStatsController); // ← ADDED
