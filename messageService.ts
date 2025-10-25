import { IMessageSDK } from '@photon-ai/imessage-kit';
import { enhanceMessageResult } from './messageTextEnhancer.js';
import { Message, MessageQueryOptions } from './types.js';
import { DEFAULT_SDK_OPTIONS } from './config.js';

/**
 * Create and initialize an IMessageSDK instance
 */
export function createSDK(debug: boolean = false): IMessageSDK {
    return new IMessageSDK({
        debug,
        ...DEFAULT_SDK_OPTIONS,
    });
}

/**
 * Check if a message is a reaction (Loved, Liked, etc.)
 */
export function isReaction(msg: Message): boolean {
    if (!msg.text) return false;

    const text = msg.text.toLowerCase().trim();

    // Check for reaction patterns (handle both regular and smart quotes)
    const hasQuotes =
        text.includes('"') || text.includes('"') || text.includes('"');

    if (!hasQuotes) return false;

    // Common reaction patterns
    if (text.startsWith('loved ')) return true;
    if (text.startsWith('liked ')) return true;
    if (text.startsWith('disliked ')) return true;
    if (text.startsWith('laughed at ')) return true;
    if (text.startsWith('emphasized ')) return true;
    if (text.startsWith('questioned ')) return true;
    if (text.startsWith('removed a heart from ')) return true;
    if (text.startsWith('removed a like from ')) return true;

    return false;
}

/**
 * Check if a message is a valid text message (not empty, not a reaction)
 */
export function isTextMessage(
    msg: Message,
    filterReactions: boolean = true
): boolean {
    // Must have text content
    if (!msg.text || msg.text.trim().length === 0) {
        return false;
    }

    // Optionally filter out reactions
    if (filterReactions && isReaction(msg)) {
        return false;
    }

    return true;
}

/**
 * Filter messages to only include text messages
 */
export function filterTextMessages(
    messages: readonly Message[],
    filterReactions: boolean = true
): Message[] {
    return messages.filter((msg) => isTextMessage(msg, filterReactions));
}

/**
 * Fetch and enhance messages from a contact
 * Handles SDK initialization, message fetching, SMS enhancement, and filtering
 */
export async function fetchAndEnhanceMessages(
    options: MessageQueryOptions
): Promise<Message[]> {
    const { phoneNumber, limit, startDate, endDate } = options;

    // Initialize SDK
    const sdk = createSDK(false);

    try {
        // Fetch messages
        const result = await sdk.getMessages({
            sender: phoneNumber,
            limit: limit ?? 999999, // Default to effectively unlimited
        });

        // Enhance SMS messages to extract text from attributedBody
        const enhanced = enhanceMessageResult(result);

        // Filter for text messages
        let messages = filterTextMessages(enhanced.messages);

        // Apply date range filters if specified
        if (startDate) {
            messages = messages.filter((msg) => msg.date >= startDate);
        }
        if (endDate) {
            messages = messages.filter((msg) => msg.date <= endDate);
        }

        return messages;
    } finally {
        // Always close SDK
        await sdk.close();
    }
}
