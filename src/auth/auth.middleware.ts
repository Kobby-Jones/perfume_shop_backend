// src/auth/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { findUserByEmail } from './auth.model'; // ✅ Add this so we can validate roles.

/**
 * Extend Express Request to include authenticated user data.
 */
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

// Use environment variable in production.
const JWT_SECRET = process.env.JWT_SECRET || 'a_secret_key_for_development_only';

/**
 * Middleware to verify bearer JWT token.
 */
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token not provided.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token missing in Authorization header.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded || typeof decoded === 'string' || !decoded.id || !decoded.email) {
      return res.status(403).json({ message: 'Invalid token payload.' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

/**
 * Middleware to check if the authenticated user is an admin.
 * Requires authenticateToken to run first.
 */
export const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user?.email) {
    return res.status(401).json({ message: 'User not authenticated.' });
  }

  try {
    const user = await findUserByEmail(req.user.email);

    if (user && user.role === 'admin') {
      return next(); // ✅ Continue to route
    }

    return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ message: 'Authorization check failed.' });
  }
};
