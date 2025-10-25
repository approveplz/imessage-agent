/**
 * Shared configuration constants
 * Loaded from environment variables (.env file)
 */

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Contact configuration
export const CONTACT_PHONE_NUMBER: string =
    process.env.CONTACT_PHONE_NUMBER || '';

// SDK configuration
export const DEFAULT_SDK_OPTIONS = {
    maxConcurrent: 5,
} as const;

// Validation: Ensure required environment variables are set
if (!CONTACT_PHONE_NUMBER) {
    throw new Error(
        'CONTACT_PHONE_NUMBER is not set in .env file. ' +
            'Copy .env.example to .env and update with your phone number.'
    );
}
