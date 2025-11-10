// src/db.ts
import { PrismaClient } from "@prisma/client";

// Use a singleton pattern to prevent multiple instances
const prisma = new PrismaClient({
    log: ['warn', 'error'], // Log only warnings and errors in production
});

export default prisma;