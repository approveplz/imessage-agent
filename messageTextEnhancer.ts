import Database from 'better-sqlite3';
import { homedir } from 'os';
import { join } from 'path';
import { Message, MessageQueryResult } from './types.js';

/**
 * Extract text from attributedBody using byte pattern matching
 * Based on LangChain's production-tested algorithm for parsing Apple's typedstream format
 *
 * Algorithm:
 * 1. Find "NSString" marker in binary data (where text begins)
 * 2. Skip 5 bytes after marker (header data)
 * 3. Read length byte:
 *    - If < 129: byte value is the text length
 *    - If = 129 (0x81): next 2 bytes are length (little-endian 16-bit)
 * 4. Extract that many bytes and decode as UTF-8
 *
 * Reference: https://github.com/langchain-ai/langchain/issues/10680
 */
function extractTextFromAttributedBody(blob: Buffer | null): string | null {
    if (!blob || blob.length === 0) return null;

    try {
        // Find the NSString marker
        const markerIndex = blob.indexOf('NSString');
        if (markerIndex === -1) {
            // No NSString marker = not a text message
            return null;
        }

        // Skip past "NSString" (8 bytes) + header (5 bytes)
        const contentStart = markerIndex + 8 + 5;

        // Check if buffer has enough data
        if (contentStart >= blob.length) {
            return null;
        }

        // Read the length byte
        const lengthByte = blob[contentStart];
        let textLength: number;
        let textStart: number;

        if (lengthByte === 0x81) {
            // Extended length format: next 2 bytes are length (little-endian)
            if (contentStart + 2 >= blob.length) {
                return null; // Not enough data
            }
            textLength = blob.readUInt16LE(contentStart + 1);
            textStart = contentStart + 3;
        } else {
            // Normal format: byte value is the length
            textLength = lengthByte;
            textStart = contentStart + 1;
        }

        // Check if buffer has enough data for the text
        if (textStart + textLength > blob.length) {
            return null;
        }

        // Extract and decode the text
        const textBuffer = blob.subarray(textStart, textStart + textLength);
        const text = textBuffer.toString('utf-8').trim();

        return text.length > 0 ? text : null;
    } catch (error) {
        // Parse failed - return null gracefully
        return null;
    }
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
export function enhanceMessageResult(result: MessageQueryResult): {
    messages: Message[];
    total: number;
    unreadCount: number;
} {
    return {
        ...result,
        messages: enhanceMessages(result.messages),
    };
}
