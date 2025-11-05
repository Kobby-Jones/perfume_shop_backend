// src/auth/auth.controllers.ts

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { findUserByEmail, saveUser, User } from './auth.model';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'a_secret_key_for_development_only';

/**
 * Generates a JWT for a user.
 * @param user - User object containing id, name, and email.
 * @returns The generated JWT token.
 */
const generateToken = (user: { id: number; name: string; email: string }): string => {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
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
    if (await findUserByEmail(email)) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    // 2. Hash the password securely
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Save user to database
    const newUser = await saveUser({ name, email, passwordHash });

    // 4. Generate token and return success response
    const token = generateToken(newUser);

    return res.status(201).json({
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
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
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 2. Compare the provided password with the stored hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 3. Generate token and return success response
    const token = generateToken(user);

    return res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
};

/**
 * POST /api/auth/logout
 * Handles user logout (client side removes token, backend simply confirms).
 */
export const logoutUser = (req: Request, res: Response) => {
  // In a token-based system, the backend doesn't usually do much for logout 
  // unless maintaining a blocklist of tokens. For this project, we simply confirm.
  return res.status(200).json({ success: true, message: "Logged out successfully." });
};