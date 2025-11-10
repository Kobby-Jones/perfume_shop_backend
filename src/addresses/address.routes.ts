// src/addresses/address.routes.ts

import { Router } from 'express';
import { authenticateToken } from '../auth/auth.middleware';
import { listAddresses, addAddress, updateAddressDetails, removeAddress } from './address.controllers';

export const addressRouter = Router();

// All user address routes must be authenticated
addressRouter.use(authenticateToken);

// GET /api/account/addresses
addressRouter.get('/account/addresses', listAddresses);

// POST /api/account/addresses
addressRouter.post('/account/addresses', addAddress);

// PUT /api/account/addresses/:id
addressRouter.put('/account/addresses/:id', updateAddressDetails);

// DELETE /api/account/addresses/:id
addressRouter.delete('/account/addresses/:id', removeAddress);