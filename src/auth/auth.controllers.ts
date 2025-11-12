// src/auth/auth.controllers.ts

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { 
    findUserByEmailWithHash, 
    saveUser, 
    updateProfile,
    updatePasswordHash,
    findUserById,
    toUserSafe
} from './auth.model';
import { AuthRequest } from './auth.middleware';
import prisma from '../db'; // Assuming you import prisma client
import crypto from 'crypto'; // For generating tokens
import { getAccountStats } from './auth.model';


const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'a_secure_default_secret_for_dev_only';
const RESET_TOKEN_EXPIRY_HOURS = 1; // Token expires in 1 hour

/**
 * Generates a JWT for a user.
 */
const generateToken = (user: { id: number; email: string; role: string }): string => {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * --- UTILITY STUB (Needs External Integration) ---
 * Sends a password reset email to the user.
 */
const sendPasswordResetEmail = (email: string, token: string) => {
    // In production, integrate with SendGrid, Mailgun, or Nodemailer here.
    const resetLink = `${process.env.FRONTEND_URL}/account/auth/reset-password?token=${token}`;
    
    console.log(`\n======================================================`);
    console.log(`!! MOCK EMAIL SENT TO ${email} !!`);
    console.log(`Password Reset Link (valid for ${RESET_TOKEN_EXPIRY_HOURS}hr): ${resetLink}`);
    console.log(`======================================================\n`);
    
    // NOTE: This part must be replaced by actual email API calls in production
    // e.g., sendEmail({ to: email, subject: 'Password Reset', body: `Click here: ${resetLink}` });
    
    return resetLink;
};


// --- PUBLIC AUTHENTICATION ROUTES ---

/**
 * POST /api/auth/register
 * Handles new user registration.
 */
export const registerUser = async (req: Request, res: Response) => {
// ... (Existing registerUser logic remains unchanged)
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  try {
    // 1. Check if user already exists
    if (await findUserByEmailWithHash(email)) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    // 2. Hash the password securely
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Save user to database
    const newUser = await saveUser({ name, email, passwordHash });

    // 4. Generate token and return safe user data
    const token = generateToken(newUser);

    return res.status(201).json({
      token,
      user: toUserSafe(newUser),
      message: 'Registration successful.',
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ message: 'Internal server error during registration.' });
  }
};

/**
 * POST /api/auth/login
 * Handles user login.
 */
export const loginUser = async (req: Request, res: Response) => {
// ... (Existing loginUser logic remains unchanged)
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // 1. Find user by email
    const user = await findUserByEmailWithHash(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 2. Compare the provided password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 3. Generate token and return safe user data
    const token = generateToken(user);

    return res.status(200).json({
      token,
      user: toUserSafe(user),
      message: 'Login successful.',
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
};

/**
 * POST /api/auth/forgot-password
 * Initiates the password reset process by generating a token.
 */
export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        const user = await findUserByEmailWithHash(email);

        // SECURITY NOTE: We respond with success even if the user is not found to prevent email enumeration.
        if (!user) {
             return res.status(200).json({ message: 'If an account exists, a reset link has been sent to your email.' });
        }
        
        // 1. Generate a secure, URL-safe reset token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

        // 2. Save the token, replacing any old ones
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token,
                expiresAt,
            }
        });

        // 3. Send the reset link (uses stub)
        sendPasswordResetEmail(user.email, token);

        return res.status(200).json({ 
            message: 'If an account exists, a reset link has been sent to your email.' 
        });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        return res.status(500).json({ message: 'Internal server error during password reset request.' });
    }
};

/**
 * POST /api/auth/reset-password
 * Resets the password using a valid token and new password.
 */
export const resetPassword = async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required.' });
    }
    
    if (newPassword.length < 6) {
         return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    try {
        // 1. Find and validate the token
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: true }
        });

        const now = new Date();
        if (!resetToken || resetToken.expiresAt < now) {
            return res.status(400).json({ message: 'Invalid or expired reset token.' });
        }
        
        const userId = resetToken.userId;
        
        // 2. Hash the new password
        const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // 3. Update the password and delete the token in a transaction
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { passwordHash: newPasswordHash },
            }),
            prisma.passwordResetToken.delete({ where: { token } })
        ]);

        return res.status(200).json({ message: 'Password successfully reset. You can now log in.' });

    } catch (error) {
        console.error('Reset Password Error:', error);
        return res.status(500).json({ message: 'Failed to reset password.' });
    }
};

// ... (Existing logoutUser, getCurrentUser, updateProfileInfo, changePassword remain unchanged)
export const logoutUser = (req: Request, res: Response) => {
  return res.status(200).json({ success: true, message: "Logged out successfully." });
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    try {
        const user = await findUserById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        return res.status(200).json({ user });
    } catch (error) {
        console.error('Get Current User Error:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

export const updateProfileInfo = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required.' });
    }
    
    try {
        // Prevent changing email to one that already exists (unless it's their current one)
        const existingUser = await findUserByEmailWithHash(email);
        if (existingUser && existingUser.id !== userId) {
            return res.status(409).json({ message: 'Email address is already taken.' });
        }

        const updatedUser = await updateProfile(userId, { name, email });

        return res.status(200).json({ 
            user: updatedUser, 
            message: 'Profile updated successfully.' 
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        return res.status(500).json({ message: 'Failed to update profile.' });
    }
};


export const changePassword = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required.' });
    }
    
    try {
        const user = await findUserByEmailWithHash(req.user!.email);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // 1. Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid current password.' });
        }

        // 2. Hash new password
        const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

        // 3. Update password in DB
        await updatePasswordHash(userId, newPasswordHash);

        return res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Change Password Error:', error);
        return res.status(500).json({ message: 'Failed to update password.' });
    }
};

/**
 * GET /api/auth/account/stats
 * Returns user's account dashboard statistics.
 */
export const getAccountStatsController = async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
      const stats = await getAccountStats(userId);
      return res.status(200).json({ stats });
  } catch (error) {
      console.error('Get Account Stats Error:', error);
      return res.status(500).json({ message: 'Failed to retrieve account statistics.' });
  }
};
