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
    - Update `MIRANDA_PHONE_NUMBER` in `index.ts` with your contact's phone number

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

**How it works:**

-   SMS text is stored in the `attributedBody` binary field instead of the plain `text` field
-   Our enhancer extracts and parses this binary data to retrieve actual message text
-   Filters out metadata (GUIDs, attribute names, etc.) to show only real message content
-   Works seamlessly with the SDK's message objects

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
const MIRANDA_PHONE_NUMBER: string = '+1234567890';
```

## Known Issues

-   Some SMS messages may have truncated or partial text due to binary format complexity
-   Metadata strings may occasionally appear in extracted text (being filtered continuously)

## Documentation

-   SDK Documentation: https://github.com/sg-hq/imessage-kit
-   Database Structure: `~/Library/Messages/chat.db` (SQLite)
