// src/addresses/address.controllers.ts

import { Response } from 'express';
import { AuthRequest } from '../auth/auth.middleware';
import { createAddress, getAddresses, updateAddress, deleteAddress } from './address.model';

/**
 * GET /api/account/addresses
 * Retrieves all saved addresses for the authenticated user.
 */
export const listAddresses = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    try {
        const addresses = await getAddresses(userId);
        return res.status(200).json({ addresses });
    } catch (error) {
        console.error("List Addresses Error:", error);
        return res.status(500).json({ message: 'Failed to retrieve addresses.' });
    }
};

/**
 * POST /api/account/addresses
 * Creates a new address.
 */
export const addAddress = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { firstName, lastName, street, city, zip, country, name } = req.body;

    if (!firstName || !lastName || !street || !city || !zip || !country || !name) {
        return res.status(400).json({ message: 'Missing required address fields.' });
    }

    try {
        const newAddress = await createAddress(userId, req.body);
        return res.status(201).json({ message: 'Address added successfully.', address: newAddress });
    } catch (error: any) {
        if (error.code === 'P2002') {
             return res.status(409).json({ message: `Address name '${name}' already exists.` });
        }
        console.error("Add Address Error:", error);
        return res.status(500).json({ message: 'Failed to add address.' });
    }
};

/**
 * PUT /api/account/addresses/:id
 * Updates an existing address.
 */
export const updateAddressDetails = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ message: 'Address ID is required.' });
    }
    
    const addressId = parseInt(id, 10);
    const updates = req.body;

    if (isNaN(addressId)) {
        return res.status(400).json({ message: 'Invalid address ID.' });
    }

    try {
        const updatedAddress = await updateAddress(userId, addressId, updates);
        return res.status(200).json({ message: 'Address updated successfully.', address: updatedAddress });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Address not found.' });
        }
        console.error("Update Address Error:", error);
        return res.status(500).json({ message: error.message || 'Failed to update address.' });
    }
};

/**
 * DELETE /api/account/addresses/:id
 * Deletes an address.
 */
export const removeAddress = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ message: 'Address ID is required.' });
    }
    
    const addressId = parseInt(id, 10);

    if (isNaN(addressId)) {
        return res.status(400).json({ message: 'Invalid address ID.' });
    }

    try {
        await deleteAddress(userId, addressId);
        return res.status(204).send(); // HTTP 204 No Content for successful deletion
    } catch (error: any) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Address not found.' });
        }
        console.error("Delete Address Error:", error);
        return res.status(500).json({ message: error.message || 'Failed to delete address.' });
    }
};