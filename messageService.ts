import { IMessageSDK } from '@photon-ai/imessage-kit';
import { enhanceMessageResult } from './messageTextEnhancer.js';
import { Message, MessageQueryOptions } from './types.js';
import { DEFAULT_SDK_OPTIONS } from './config.js';

/**
 * iMessage reaction verbs
 * These are the words that appear at the start of reaction messages
 */
const REACTION_VERBS = [
    'loved',
    'liked',
    'disliked',
    'laughed at',
    'emphasized',
    'questioned',
    'removed a heart from',
    'removed a like from',
    'removed an emphasis from',
] as const;

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
 *
 * Reactions have the format:
 * - "Loved "original message"" (has quotes)
 * - "Liked an image" (image/video reaction)
 *
 * Real messages don't have quotes:
 * - "Loved the movie last night!" (no quotes = kept as real message)
 *
 * We check for quotes to avoid filtering legitimate messages.
 */
export function isReaction(msg: Message): boolean {
    if (!msg.text) return false;

    const text = msg.text.trim();
    const lowerText = text.toLowerCase();

    // Check if starts with any reaction verb
    for (const verb of REACTION_VERBS) {
        if (lowerText.startsWith(verb + ' ')) {
            // Must contain quotes OR the word "image" to be a reaction
            // This prevents filtering legitimate messages like "Loved the movie"
            const hasQuotes =
                text.includes('"') || text.includes('"') || text.includes('"');
            const isImageReaction =
                text.includes('an image') || text.includes('a video');

            if (hasQuotes || isImageReaction) {
                return true;
            }
        }
    }

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
