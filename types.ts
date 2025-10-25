/**
 * Shared type definitions for iMessage agent
 */

export interface Message {
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

export interface MessageQueryResult {
    messages: readonly Message[];
    total: number;
    unreadCount: number;
}

export interface MessageQueryOptions {
    phoneNumber: string;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
}
