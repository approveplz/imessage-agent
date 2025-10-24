import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';
import * as bplist from 'bplist-parser';

// Define message interface based on SDK's Message type
interface Message {
    readonly id: string;
    readonly guid: string;
    readonly text: string | null;
    readonly sender: string;
    readonly senderName: string | null;
    readonly chatId: string;
    readonly isGroupChat: boolean;
    readonly service: 'iMessage' | 'SMS' | 'RCS';
    readonly isRead: boolean;
    readonly isFromMe: boolean;
    readonly attachments: readonly any[];
    readonly date: Date;
}

/**
 * Parse binary plist from attributedBody
 */
function parseBinaryPlist(blob: Buffer): any | null {
    try {
        const parsed = bplist.parseBuffer(blob);
        return parsed && parsed.length > 0 ? parsed[0] : null;
    } catch (error) {
        return null;
    }
}

/**
 * Recursively search plist object for actual message text
 */
function findTextInPlist(obj: any, depth: number = 0): string | null {
    // Prevent infinite recursion
    if (depth > 10) return null;
    if (!obj || typeof obj !== 'object') return null;

    // Check if this object has a string value that looks like message text
    if (typeof obj === 'string') {
        return isValidMessageText(obj) ? obj : null;
    }

    // Common keys that might contain the text
    const textKeys = [
        'NSString',
        'NS.string',
        '__kIMMessagePartAttributeName',
        'string',
    ];

    // Try known text keys first
    for (const key of textKeys) {
        if (obj[key] && typeof obj[key] === 'string') {
            const text = obj[key];
            if (isValidMessageText(text)) return text;
        }
    }

    // Recursively search all keys
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const result = findTextInPlist(obj[key], depth + 1);
            if (result) return result;
        }
    }

    // Check array elements
    if (Array.isArray(obj)) {
        for (const item of obj) {
            const result = findTextInPlist(item, depth + 1);
            if (result) return result;
        }
    }

    return null;
}

/**
 * Validate if a string is actual message text (not metadata)
 */
function isValidMessageText(text: string): boolean {
    if (!text || text.length < 2) return false;

    // Filter out Apple metadata
    if (text.startsWith('kIM')) return false;
    if (text.startsWith('NS') && text.includes('Attribute')) return false;
    if (text.startsWith('__kIM')) return false;

    // Filter out GUIDs
    if (/^[A-F0-9-]{36}$/i.test(text)) return false;

    // Filter out common metadata patterns
    if (text.includes('AttributeName')) return false;
    if (text === 'NSString') return false;
    if (text === 'NSParagraphStyle') return false;

    // Must contain at least one letter or number
    if (!/[a-zA-Z0-9]/.test(text)) return false;

    return true;
}

/**
 * Fallback: Extract text using regex (old method)
 */
function extractTextWithRegex(blob: Buffer): string | null {
    try {
        const str = blob.toString('utf8');
        const cleaned = str.replace(/[\x00-\x08\x0B-\x1F\x7F-\x9F]/g, ' ');
        const matches = cleaned.match(/[a-zA-Z0-9\s\.,!?\-'";:()]+/g);

        if (matches && matches.length > 0) {
            const validSegments = matches
                .map((m) => m.trim())
                .filter((m) => {
                    if (m.length < 4) return false;
                    if (m.startsWith('kIM')) return false;
                    if (m.startsWith('NS')) return false;
                    if (/^[A-F0-9-]{36}$/i.test(m)) return false;
                    if (m.includes('AttributeName')) return false;
                    return true;
                });

            if (validSegments.length === 0) return null;

            const longestSegment = validSegments.reduce((a, b) =>
                a.length > b.length ? a : b
            );

            return longestSegment;
        }
    } catch (error) {
        return null;
    }

    return null;
}

/**
 * Extract text from attributedBody binary blob
 * SMS messages in newer iOS versions store text here instead of the text field
 */
function extractTextFromAttributedBody(blob: Buffer | null): string | null {
    if (!blob) return null;

    try {
        // Strategy 1: Parse as binary plist (proper way)
        const parsed = parseBinaryPlist(blob);
        if (parsed) {
            const text = findTextInPlist(parsed);
            if (text) return text;
        }

        // Strategy 2: Fallback to regex-based extraction
        const regexText = extractTextWithRegex(blob);
        if (regexText) return regexText;
    } catch (error) {
        console.error('Error extracting text from attributedBody:', error);
    }

    return null;
}

/**
 * Enhance SDK messages by extracting text from attributedBody for messages with null text
 * This fixes the issue where SMS messages don't populate the text field
 */
export function enhanceMessages(messages: readonly Message[]): Message[] {
    // Open database connection
    const dbPath = join(homedir(), 'Library', 'Messages', 'chat.db');
    let db: Database.Database | null = null;

    try {
        db = new Database(dbPath, { readonly: true });

        // Prepare query to get attributedBody by message ID
        const query = db.prepare(`
            SELECT attributedBody
            FROM message
            WHERE ROWID = ?
        `);

        // Enhance each message
        return messages.map((msg) => {
            // If message already has text, return as-is
            if (msg.text && msg.text.trim().length > 0) {
                return msg;
            }

            // Try to extract text from attributedBody
            try {
                const row = query.get(msg.id) as
                    | { attributedBody: Buffer | null }
                    | undefined;

                if (row?.attributedBody) {
                    const extractedText = extractTextFromAttributedBody(
                        row.attributedBody
                    );

                    if (extractedText) {
                        // Return enhanced message with extracted text
                        return {
                            ...msg,
                            text: extractedText,
                        };
                    }
                }
            } catch (error) {
                console.error(`Error enhancing message ${msg.id}:`, error);
            }

            // Return original message if extraction failed
            return msg;
        });
    } finally {
        // Always close database connection
        if (db) {
            db.close();
        }
    }
}

/**
 * Wrapper to enhance a single message query result
 */
export function enhanceMessageResult(result: {
    messages: readonly Message[];
    total: number;
    unreadCount: number;
}): {
    messages: Message[];
    total: number;
    unreadCount: number;
} {
    return {
        ...result,
        messages: enhanceMessages(result.messages),
    };
}
