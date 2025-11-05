// src/auth/auth.routes.ts

import { Router } from 'express';
import { registerUser, loginUser, logoutUser } from './auth.controllers';

export const authRouter = Router();

// Routes corresponding to the API specification
authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);
authRouter.post('/logout', logoutUser);

// Note: Forgot password is not implemented here but the endpoint is ready
// authRouter.post('/forgot-password', forgotPassword);