// src/auth/auth.middleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { findUserByEmailWithHash } from './auth.model'; 
import { UserSafe } from './auth.model'; // Import the safe user type

/**
 * Extend Express Request to include authenticated user data.
 */
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: 'user' | 'admin'; // Include role in the request object
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'a_secure_default_secret_for_dev_only';

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
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { id: number; email: string; role: 'user' | 'admin' };

    if (!decoded || !decoded.id || !decoded.email || !decoded.role) {
      return res.status(403).json({ message: 'Invalid token payload or missing user data.' });
    }

    // Set authenticated user data on the request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

/**
 * Middleware to check if the authenticated user is an admin.
 * Performs a database lookup for the most up-to-date role information.
 */
export const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check if token already provided basic role info
  if (req.user?.role === 'admin') {
      // Re-verify role from DB for hardened security, preventing role tampering via token spoofing
      try {
          const user = await findUserByEmailWithHash(req.user.email);
          if (user?.role === 'admin') {
              return next();
          }
      } catch (error) {
          console.error('Admin DB check failed:', error);
          return res.status(500).json({ message: 'Authorization check failed.' });
      }
  }

  // If initial check failed or DB role is not admin
  return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
};