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

2. **Configure Contact:**
    - Update `CONTACT_PHONE_NUMBER` in `index.ts` with your contact's phone number

## Usage

### Development

```bash
npm run dev
```

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
-   ✅ Filter messages by sender, date, and type
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
├── index.ts                  # Main application entry point
├── messageTextEnhancer.ts    # SMS text extraction module
├── package.json
├── tsconfig.json
└── README.md
```

## Configuration

Update the phone number in `index.ts`:

```typescript
const CONTACT_PHONE_NUMBER: string = '+1234567890';
const MESSAGE_LIMIT: number = 20;
```

## Known Issues

-   **Reactions/Tapbacks**: Messages like "Loved 'text'" are extracted as text (not filtered)
-   **Media-only messages**: Photos/videos without text correctly return `null`
-   **Emoji/Unicode**: Fully supported via UTF-8 decoding

## Documentation

-   SDK Documentation: https://github.com/sg-hq/imessage-kit
-   Database Structure: `~/Library/Messages/chat.db` (SQLite)
