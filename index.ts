import { CONTACT_PHONE_NUMBER } from './config.js';
import { fetchAndEnhanceMessages } from './messageService.js';

// Display configuration
const MESSAGE_LIMIT = 20;

async function main(): Promise<void> {
    console.log('🚀 Starting iMessage Agent...\n');

    try {
        // Fetch messages from contact
        console.log(`📱 Fetching messages from ${CONTACT_PHONE_NUMBER}...\n`);

        const messages = await fetchAndEnhanceMessages({
            phoneNumber: CONTACT_PHONE_NUMBER,
            limit: MESSAGE_LIMIT,
        });

        console.log(
            `📊 Found ${messages.length} text message${
                messages.length !== 1 ? 's' : ''
            }:\n`
        );

        // Display messages in chronological order (most recent first)
        messages.forEach((msg) => {
            const sender = msg.isFromMe ? 'Me' : 'Them';
            const time = msg.date.toLocaleString();

            console.log(`${sender}: ${time}`);
            console.log(`   ${msg.text}\n`);
        });

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
 * - Export messages: See export.ts
 */
