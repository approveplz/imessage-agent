import { exportMessageHistory } from './messageExporter.js';
import { CONTACT_PHONE_NUMBER } from './config.js';

// Configuration
const OUTPUT_PATH: string = './conversation.md';

// Optional: Date range filter
// const START_DATE = new Date('2024-10-01'); // Only messages after this date
// const END_DATE = new Date('2024-10-31');   // Only messages before this date

async function main(): Promise<void> {
    console.log('📤 Starting message export...\n');

    try {
        await exportMessageHistory({
            phoneNumber: CONTACT_PHONE_NUMBER,
            outputPath: OUTPUT_PATH,
            // startDate: START_DATE,  // Uncomment to filter by date
            // endDate: END_DATE,
        });

        console.log('\n✅ Export complete!');
    } catch (error: unknown) {
        console.error('\n❌ Export failed:');
        console.error(error);
        process.exit(1);
    }
}

// Run the export
main();
