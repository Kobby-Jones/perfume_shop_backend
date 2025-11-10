// src/admin/admin.user.controllers.ts

import { Response } from 'express';
import bcrypt from 'bcrypt';
import { AuthRequest } from '../auth/auth.middleware';
import prisma from '../db';

/**
 * POST /api/admin/users
 * Admin creates a new user account
 */
export async function createUserController(req: AuthRequest, res: Response) {
    try {
        const { name, email, password, role } = req.body;

        // Validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({ 
                message: 'Name, email, password, and role are required.' 
            });
        }

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ 
                message: 'Role must be either "user" or "admin".' 
            });
        }

        if (password.length < 8) {
            return res.status(400).json({ 
                message: 'Password must be at least 8 characters long.' 
            });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({ 
                message: 'A user with this email already exists.' 
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            }
        });

        return res.status(201).json({ 
            message: `User account created successfully with role: ${role.toUpperCase()}.`,
            user: newUser 
        });

    } catch (error) {
        console.error('Create User Error:', error);
        return res.status(500).json({ 
            message: 'Failed to create user account. Please try again.' 
        });
    }
}

/**
 * DELETE /api/admin/users/:id
 * Admin deletes a user account
 */
export async function deleteUserController(req: AuthRequest, res: Response) {
    try {
        const userId = parseInt(req.params.id || '0');

        if (isNaN(userId) || userId === 0) {
            return res.status(400).json({ message: 'Invalid user ID.' });
        }

        // Prevent admin from deleting themselves
        if (req.user?.id === userId) {
            return res.status(403).json({ 
                message: 'You cannot delete your own account.' 
            });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Delete user (this will cascade delete related records based on your schema)
        await prisma.user.delete({
            where: { id: userId }
        });

        return res.status(200).json({ 
            message: 'User account has been permanently deleted.' 
        });

    } catch (error: any) {
        console.error('Delete User Error:', error);
        
        if (error.code === 'P2003') {
            return res.status(400).json({ 
                message: 'Cannot delete user with existing orders. Please handle orders first.' 
            });
        }

        return res.status(500).json({ 
            message: 'Failed to delete user account.' 
        });
    }
}