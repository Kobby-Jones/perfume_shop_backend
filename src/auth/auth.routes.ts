// src/auth/auth.routes.ts

import { Router } from 'express';
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    getCurrentUser, 
    updateProfileInfo,
    changePassword 
} from './auth.controllers';
import { authenticateToken } from './auth.middleware';

export const authRouter = Router();

// --- PUBLIC AUTHENTICATION ROUTES ---
authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);
authRouter.post('/logout', logoutUser); // Client-side cleanup

// Note: Forgot password is a frontend-only stub for now.

// --- PROTECTED ACCOUNT ROUTES ---
// GET /api/auth/me (Session verification)
authRouter.get('/me', authenticateToken, getCurrentUser); 

// PUT /api/auth/profile (Update name/email)
authRouter.put('/profile', authenticateToken, updateProfileInfo);

// PUT /api/auth/password (Change password)
authRouter.put('/password', authenticateToken, changePassword);