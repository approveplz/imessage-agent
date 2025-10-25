import { writeFile } from 'fs/promises';
import { Message } from './types.js';
import { fetchAndEnhanceMessages } from './messageService.js';

interface ExportOptions {
    phoneNumber: string;
    outputPath: string;
    startDate?: Date; // Optional: Only messages after this date
    endDate?: Date; // Optional: Only messages before this date
}

/**
 * Format a single message as markdown
 */
function formatMessage(msg: Message): string {
    const sender = msg.isFromMe ? 'Me' : 'Them';
    const timestamp = msg.date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    return `**${timestamp} - ${sender}:**\n${msg.text}\n`;
}

/**
 * Generate markdown header with metadata
 */
function generateHeader(
    phoneNumber: string,
    messages: Message[],
    startDate?: Date,
    endDate?: Date
): string {
    const totalCount = messages.length;

    // Get date range from actual messages
    const dates = messages.map((m) => m.date);
    const oldestDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const newestDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    const dateRangeStr = `${oldestDate.toLocaleDateString()} - ${newestDate.toLocaleDateString()}`;
    const generatedAt = new Date().toLocaleString();

    let header = `# Message History: ${phoneNumber}\n\n`;
    header += `**Total Messages:** ${totalCount.toLocaleString()}\n`;
    header += `**Date Range:** ${dateRangeStr}\n`;

    if (startDate || endDate) {
        header += `**Filtered:** `;
        if (startDate) header += `From ${startDate.toLocaleDateString()} `;
        if (endDate) header += `To ${endDate.toLocaleDateString()}`;
        header += `\n`;
    }

    header += `**Generated:** ${generatedAt}\n\n`;
    header += `---\n\n`;

    return header;
}

/**
 * Export message history to markdown file
 *
 * @param options - Export configuration
 * @param options.phoneNumber - Contact's phone number
 * @param options.outputPath - Where to save the markdown file
 * @param options.startDate - Optional: Only messages after this date
 * @param options.endDate - Optional: Only messages before this date
 *
 * @example
 * // Export all messages
 * await exportMessageHistory({
 *     phoneNumber: '+18015138197',
 *     outputPath: './conversation.md'
 * });
 *
 * @example
 * // Export messages from last 30 days
 * const thirtyDaysAgo = new Date();
 * thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
 * await exportMessageHistory({
 *     phoneNumber: '+18015138197',
 *     outputPath: './recent-messages.md',
 *     startDate: thirtyDaysAgo
 * });
 */
export async function exportMessageHistory(
    options: ExportOptions
): Promise<void> {
    const { phoneNumber, outputPath, startDate, endDate } = options;

    console.log(`📥 Fetching messages from ${phoneNumber}...`);

    // Fetch and enhance messages using shared service
    let messages = await fetchAndEnhanceMessages({
        phoneNumber,
        startDate,
        endDate,
        // No limit - fetch all messages
    });

    // Additional filter: ensure no blank messages slip through
    messages = messages.filter((msg) => msg.text && msg.text.trim().length > 0);

    // Sort newest first
    messages.sort((a, b) => b.date.getTime() - a.date.getTime());

    console.log(
        `📊 Found ${messages.length} text message${
            messages.length !== 1 ? 's' : ''
        }`
    );

    // Generate markdown content
    const header = generateHeader(phoneNumber, messages, startDate, endDate);
    const messageContent = messages.map(formatMessage).join('\n');
    const markdown = header + messageContent;

    // Write to file
    await writeFile(outputPath, markdown, 'utf-8');

    console.log(`✅ Exported to ${outputPath}`);
}
