# iMessage Agent

A TypeScript-based iMessage automation agent with enhanced SMS support. Built with [@photon-ai/imessage-kit](https://github.com/sg-hq/imessage-kit) and custom text extraction for SMS messages.

## Requirements

-   **macOS** (required for iMessage access)
-   **Node.js >= 18.0.0**
-   **Full Disk Access** for Terminal/iTerm (System Settings → Privacy & Security → Full Disk Access)

## Installation

```bash
npm install
```

## Setup

1. **Grant Full Disk Access:**

    - Open System Settings → Privacy & Security → Full Disk Access
    - Add your terminal app (Terminal.app or iTerm2)
    - Restart your terminal

2. **Configure Environment Variables:**

    ```bash
    # Copy the example environment file
    cp .env.example .env

    # Edit .env and update with your values
    # CONTACT_PHONE_NUMBER=+1234567890
    ```

    Update `CONTACT_PHONE_NUMBER` in `.env` with your contact's phone number (include country code).

## Usage

### Display Recent Messages

```bash
npm run dev
```

### Export All Message History to Markdown

```bash
npm run export
```

This will:

-   Fetch **all** messages from the configured contact
-   Filter out reactions and non-text messages
-   Sort newest first
-   Export to `conversation.md`

**Customize export:**

-   Contact: Update `CONTACT_PHONE_NUMBER` in `.env`
-   Edit `export.ts` to change:
    -   `OUTPUT_PATH`: Where to save the file
    -   `START_DATE` / `END_DATE`: Optional date range filter

### Build

```bash
npm run build
```

### Run compiled code

```bash
npm start
```

### Type check

```bash
npm run type-check
```

## Features

-   ✅ Read messages from iMessage and SMS
-   ✅ **Enhanced SMS text extraction** - reads from `attributedBody` field
-   ✅ **Export full message history** to Markdown
-   ✅ Filter messages by sender, date, and type
-   ✅ Filter out reactions and non-text messages
-   ✅ Send text messages (SDK feature)
-   ✅ Send images (SDK feature)
-   ✅ Automated message handling (SDK feature)

## SMS Text Extraction

This project includes a custom `messageTextEnhancer` module that solves a limitation in the base SDK where SMS messages don't populate the `text` field in newer iOS versions.

**The Problem:**
Starting with macOS Ventura (13.0+), Apple changed how message text is stored:

-   **iMessages**: Text in `message.text` column (works fine)
-   **SMS messages**: Text in `message.attributedBody` binary BLOB (SDK returns `null`)

**Our Solution:**
We use LangChain's battle-tested byte pattern matching algorithm to extract text from the `attributedBody` field:

1. Find the `NSString` marker in the binary data
2. Read the length byte(s) to determine text size
3. Extract and decode the UTF-8 text

**Key Features:**

-   ✅ Simple, reliable byte pattern matching (no complex parsers)
-   ✅ Handles both standard and extended length formats
-   ✅ Production-tested algorithm from LangChain
-   ✅ Zero external dependencies (uses Node.js Buffer API)
-   ✅ Graceful error handling (returns `null` on parse failure)

**Reference:** [LangChain Issue #10680](https://github.com/langchain-ai/langchain/issues/10680)

## Project Structure

```
imessage-agent/
├── .env                      # Environment variables (not in git)
├── .env.example              # Environment template (committed to git)
├── types.ts                  # Shared TypeScript interfaces
├── config.ts                 # Configuration loader (reads from .env)
├── messageService.ts         # Reusable message operations (fetch, filter, etc.)
├── messageTextEnhancer.ts    # SMS text extraction from attributedBody
├── messageExporter.ts        # Markdown export logic
├── index.ts                  # Main app - display recent messages
├── export.ts                 # Export script - save full history
├── package.json
├── tsconfig.json
└── README.md
```

## Configuration

Configuration is managed through environment variables in `.env`:

```bash
# .env
CONTACT_PHONE_NUMBER=+1234567890
```

This value is loaded in `config.ts` and shared across all scripts (`index.ts`, `export.ts`).

## Known Issues

-   **Media-only messages**: Photos/videos without text correctly return `null`
-   **Group chats**: Not tested extensively (focus is on 1-on-1 conversations)

**What's Handled:**

-   ✅ **Reactions filtered**: "Loved", "Liked", "Emphasized" messages are automatically removed
-   ✅ **Emoji/Unicode**: Fully supported via UTF-8 decoding
-   ✅ **SMS & iMessage**: Both message types supported

## Documentation

-   SDK Documentation: https://github.com/sg-hq/imessage-kit
-   Database Structure: `~/Library/Messages/chat.db` (SQLite)
