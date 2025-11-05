import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Extend the Express Request type to include a user property.
// This allows downstream middleware and route handlers to access the authenticated user's data.
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

// Fallback secret for development. In production, always use a strong secret from environment variables.
const JWT_SECRET = process.env.JWT_SECRET || 'a_secret_key_for_development_only';

// Middleware for verifying JWT tokens in Authorization headers.
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  // Ensure the request has a Bearer token in the Authorization header.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token not provided.' });
  }

  // Extract the token part from the header.
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token missing in Authorization header.' });
  }

  try {
    // Verify the JWT using the configured secret.
    // jwt.verify may return either a string or a JwtPayload depending on how the token was signed.
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload | string;

    // Reject tokens that don’t contain the expected user payload.
    if (typeof decoded === 'string' || !decoded.id || !decoded.email) {
      return res.status(403).json({ message: 'Invalid token payload.' });
    }

    // Attach the decoded user info to the request object so it can be used later in route handlers.
    req.user = {
      id: decoded.id as number,
      email: decoded.email as string,
    };

    // Token is valid; continue to the next middleware or route handler.
    next();
  } catch (error) {
    // Handle cases where the token is invalid, malformed, or expired.
    console.error('JWT Verification Error:', error);
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};
