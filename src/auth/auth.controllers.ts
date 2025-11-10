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

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'a_secure_default_secret_for_dev_only';

/**
 * Generates a JWT for a user.
 */
const generateToken = (user: { id: number; email: string; role: string }): string => {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * POST /api/auth/register
 * Handles new user registration.
 */
export const registerUser = async (req: Request, res: Response) => {
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
 * POST /api/auth/logout
 * Confirms logout.
 */
export const logoutUser = (req: Request, res: Response) => {
  return res.status(200).json({ success: true, message: "Logged out successfully." });
};

/**
 * GET /api/auth/me
 * Verifies the token and returns the current authenticated user data.
 * Used by frontend to re-validate session on app load.
 */
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

/**
 * PUT /api/account/profile
 * Updates user name and email.
 */
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


/**
 * PUT /api/account/password
 * Changes the user's password.
 */
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