// src/auth/auth.model.ts

import prisma from "../db";
import { User as PrismaUser } from "@prisma/client";

// Define the core User type returned by the models
export interface UserSafe {
    id: number;
    name: string;
    email: string;
    role: 'user' | 'admin';
    createdAt: Date;
}

export interface AccountStats {
    totalOrders: number;
    totalSpent: number;
    wishlistItems: number;
    rewardPoints: number;
    accountTier: 'Bronze' | 'Silver' | 'Gold';
}

/**
 * Retrieves a user's details for safe external consumption.
 */
export const toUserSafe = (user: PrismaUser): UserSafe => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as 'user' | 'admin',
    createdAt: user.createdAt,
});

/**
 * Finds a user by email, including the password hash for internal authentication.
 */
export const findUserByEmailWithHash = async (email: string): Promise<PrismaUser | null> => {
    return prisma.user.findUnique({
        where: { email },
    });
};

/**
 * Finds a user by ID and returns safe data.
 */
export const findUserById = async (id: number): Promise<UserSafe | null> => {
    const user = await prisma.user.findUnique({
        where: { id },
    });
    return user ? toUserSafe(user) : null;
};

/**
 * Saves a new user to the database.
 */
export const saveUser = async (data: { name: string; email: string; passwordHash: string }): Promise<PrismaUser> => {
    return prisma.user.create({
        data: {
            ...data,
            role: 'user',
        },
    });
};

/**
 * Updates a user's profile information.
 */
export const updateProfile = async (userId: number, data: { name?: string; email?: string }): Promise<UserSafe> => {
    const updateData: { name?: string; email?: string } = {};
    
    if (data.name !== undefined) {
        updateData.name = data.name;
    }
    if (data.email !== undefined) {
        updateData.email = data.email;
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
    });

    return toUserSafe(updatedUser);
};

/**
 * Updates a user's password hash.
 */
export const updatePasswordHash = async (userId: number, passwordHash: string): Promise<void> => {
    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
    });
};

/**
 * Retrieves all user summaries for admin dashboard.
 */
export const findAllUsersWithStats = async () => {
    return prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            _count: {
                select: {
                    orders: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
};

/**
 * Fetches consolidated statistics for the user's dashboard.
 */
export const getAccountStats = async (userId: number): Promise<AccountStats> => {
    const [orders, wishlistCount] = await prisma.$transaction([
        prisma.order.findMany({
            where: { 
                userId,
                paymentStatus: 'success',
            },
            select: { 
                orderTotal: true,
            },
        }),
        prisma.wishlistProducts.count({
            where: {
                wishlist: { userId }
            }
        })
    ]);

    const totalOrders = await prisma.order.count({ where: { userId } });
    const totalSpent = orders.reduce((sum, order) => sum + order.orderTotal, 0);

    const rewardPoints = Math.floor(totalSpent / 10);

    let accountTier: AccountStats['accountTier'] = 'Bronze';
    if (totalSpent >= 5000) accountTier = 'Gold';
    else if (totalSpent >= 2000) accountTier = 'Silver';

    return {
        totalOrders,
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        wishlistItems: wishlistCount,
        rewardPoints,
        accountTier,
    };
};
