import { IMessageSDK } from '@photon-ai/imessage-kit';
import { enhanceMessageResult } from './messageTextEnhancer.js';

// Configuration
const CONTACT_PHONE_NUMBER: string = '+18015138197';
const MESSAGE_LIMIT: number = 20;

async function main(): Promise<void> {
    console.log('🚀 Starting iMessage Agent...\n');

    try {
        // Initialize SDK
        const sdk: IMessageSDK = new IMessageSDK({
            debug: true,
            maxConcurrent: 5,
        });

        // Fetch messages from contact
        console.log(`📱 Fetching messages from ${CONTACT_PHONE_NUMBER}...\n`);
        const result = await sdk.getMessages({
            sender: CONTACT_PHONE_NUMBER,
            limit: MESSAGE_LIMIT,
        });

        // Enhance SMS messages to extract text from attributedBody
        console.log('🔧 Enhancing SMS messages...\n');
        const enhanced = enhanceMessageResult(result);

        // Filter for messages with actual text content
        const textMessages = enhanced.messages.filter(
            (msg) => msg.text && msg.text.trim().length > 0
        );

        console.log(
            `📊 Found ${textMessages.length} text message${
                textMessages.length !== 1 ? 's' : ''
            }:\n`
        );

        // Display messages in chronological order (most recent first)
        textMessages.forEach((msg) => {
            const sender = msg.isFromMe ? 'Me' : 'Them';
            const time = msg.date.toLocaleString();

            console.log(`${sender}: ${time}`);
            console.log(`   ${msg.text}\n`);
        });

        // Close SDK
        await sdk.close();
        console.log('✅ Complete!');
    } catch (error: unknown) {
        console.error('\n❌ Error occurred:');
        console.error(error);
        process.exit(1);
    }
}

// Run the agent
main();

/**
 * Documentation:
 * - SDK: https://github.com/sg-hq/imessage-kit
 * - iMessage Database: ~/Library/Messages/chat.db
 */
