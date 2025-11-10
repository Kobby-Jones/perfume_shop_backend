// src/addresses/address.model.ts

import prisma from "../db";
import { UserAddress } from '@prisma/client';

/**
 * Creates a new address for a user. Sets it as default if no other addresses exist.
 */
export async function createAddress(userId: number, data: Omit<UserAddress, 'id' | 'userId' | 'isDefault'>): Promise<UserAddress> {
    const existingAddresses = await prisma.userAddress.count({ where: { userId } });
    const isDefault = existingAddresses === 0;

    return prisma.userAddress.create({
        data: {
            userId,
            ...data,
            isDefault,
        },
    });
}

/**
 * Retrieves all saved addresses for a user.
 */
export async function getAddresses(userId: number): Promise<UserAddress[]> {
    return prisma.userAddress.findMany({
        where: { userId },
        orderBy: { isDefault: 'desc' },
    });
}

/**
 * Updates an existing address. Includes logic to manage the default status.
 */
export async function updateAddress(userId: number, addressId: number, data: Partial<Omit<UserAddress, 'id' | 'userId'>>): Promise<UserAddress> {
    // Start transaction to handle default flag update atomically
    return prisma.$transaction(async (tx) => {
        if (data.isDefault === true) {
            // 1. Unset the current default address for this user
            await tx.userAddress.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
        }

        // 2. Update the specific address
        const updated = await tx.userAddress.update({
            where: { id: addressId, userId },
            data,
        });

        return updated;
    });
}

/**
 * Deletes a user's address. Prevents deleting the last remaining address unless handled carefully.
 */
export async function deleteAddress(userId: number, addressId: number): Promise<void> {
    const addressToDelete = await prisma.userAddress.findUnique({ where: { id: addressId, userId } });
    if (!addressToDelete) {
        throw new Error("Address not found or access denied.");
    }
    
    // Check if it's the only one, or if it's the default, requiring reassignment
    const count = await prisma.userAddress.count({ where: { userId } });
    
    if (count === 1) {
        // Allow deleting the last address
        await prisma.userAddress.delete({ where: { id: addressId } });
        return;
    }
    
    // If we delete the default one, we must reassign default status
    if (addressToDelete.isDefault) {
        await prisma.$transaction(async (tx) => {
            // Delete the default address
            await tx.userAddress.delete({ where: { id: addressId } });
            
            // Find the first remaining address and set it as default
            const nextAddress = await tx.userAddress.findFirst({
                where: { userId, id: { not: addressId } },
            });
            
            if (nextAddress) {
                await tx.userAddress.update({
                    where: { id: nextAddress.id },
                    data: { isDefault: true },
                });
            }
        });
    } else {
        await prisma.userAddress.delete({ where: { id: addressId } });
    }
}