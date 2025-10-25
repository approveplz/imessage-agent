/**
 * Shared type definitions for iMessage agent
 */

import { IMessage } from '@photon-ai/imessage-kit';

/**
 * Re-export SDK types to avoid duplication and stay in sync with SDK updates
 */
export type Message = IMessage.Message;
export type Attachment = IMessage.Attachment;
export type ServiceType = IMessage.ServiceType;

/**
 * Custom type for message query results
 * Note: SDK might have this too, but we define it for clarity
 */
export interface MessageQueryResult {
    messages: readonly Message[];
    total: number;
    unreadCount: number;
}

/**
 * Custom type for our message fetching operations
 * Extends SDK's capabilities with date filtering
 */
export interface MessageQueryOptions {
    phoneNumber: string;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
}
