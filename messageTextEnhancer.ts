import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';

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
 * Extract text from attributedBody binary blob
 * SMS messages in newer iOS versions store text here instead of the text field
 */
function extractTextFromAttributedBody(blob: Buffer | null): string | null {
    if (!blob) return null;

    try {
        // Convert buffer to string and try to extract readable text
        const str = blob.toString('utf8');

        // Remove control characters but keep spaces
        const cleaned = str.replace(/[\x00-\x08\x0B-\x1F\x7F-\x9F]/g, ' ');

        // Extract all readable text segments
        const matches = cleaned.match(/[a-zA-Z0-9\s\.,!?\-'";:()]+/g);

        if (matches && matches.length > 0) {
            // Filter out metadata and find the actual message text
            const validSegments = matches
                .map((m) => m.trim())
                .filter((m) => {
                    // Filter out very short segments
                    if (m.length < 4) return false;

                    // Filter out Apple metadata strings
                    if (m.startsWith('kIM')) return false;
                    if (m.startsWith('NS')) return false;

                    // Filter out GUIDs (hex pattern with dashes)
                    if (/^[A-F0-9-]{36}$/i.test(m)) return false;

                    // Filter out common metadata patterns
                    if (m.includes('AttributeName')) return false;

                    return true;
                });

            if (validSegments.length === 0) return null;

            // Return the longest valid segment as it's likely the actual message
            const longestSegment = validSegments.reduce((a, b) =>
                a.length > b.length ? a : b
            );

            return longestSegment;
        }
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
