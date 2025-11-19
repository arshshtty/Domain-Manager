# Domain Manager

AI-powered domain management app that connects to Cloudflare and Porkbun APIs to fetch and manage DNS records.

## Features

- **Multi-Provider Support**: Connect to both Cloudflare and Porkbun
- **Unified Dashboard**: View all your domains from multiple providers in one place
- **DNS Record Management**: Create, update, and delete DNS records
- **Natural Language Interface**: Use Gemini AI to manage domains with natural language commands
- **Secure Credential Storage**: API keys stored locally in SQLite database

## Prerequisites

- Node.js 18 or higher
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd domain-manager
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file:
```bash
cp .env.example .env
```

4. (Optional) Add your API keys to `.env` or configure them through the Settings page.

## Running the App

### Development Mode

```bash
npm run dev
```

This starts both the backend server (port 3001) and frontend dev server (port 5173).

### Production Build

```bash
npm run build
npm start
```

## Configuration

### Cloudflare

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Create an API token with the following permissions:
   - Zone:Zone:Read
   - Zone:DNS:Edit
3. Enter the token in Settings

### Porkbun

1. Go to [Porkbun API Settings](https://porkbun.com/account/api)
2. Enable API access and generate API keys
3. Enter both the API Key and Secret Key in Settings

### Gemini API

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key
3. Enter the key in Settings to enable natural language commands

## Usage

### Dashboard

The dashboard displays all your domains from connected providers. Click on a domain to view and manage its DNS records.

### Natural Language Commands

When Gemini is configured, you can use natural language commands like:

- "List all my domains"
- "Show DNS records for example.com"
- "Add an A record for api.example.com pointing to 192.168.1.1"
- "Delete the TXT record for _dmarc.example.com"
- "Create an MX record with priority 10"

### Managing DNS Records

1. Click on a domain in the dashboard
2. View existing records
3. Click "Add Record" to create a new DNS record
4. Click "Delete" on any record to remove it

## API Endpoints

### Domains

- `GET /api/domains` - List all domains from all providers
- `GET /api/domains/:provider` - List domains from specific provider
- `GET /api/domains/:provider/:domainId/records` - List DNS records
- `POST /api/domains/:provider/:domainId/records` - Create DNS record
- `PUT /api/domains/:provider/:domainId/records/:recordId` - Update DNS record
- `DELETE /api/domains/:provider/:domainId/records/:recordId` - Delete DNS record

### Settings

- `GET /api/settings/credentials` - Get credentials status
- `POST /api/settings/credentials/cloudflare` - Set Cloudflare credentials
- `POST /api/settings/credentials/porkbun` - Set Porkbun credentials
- `POST /api/settings/credentials/gemini` - Set Gemini API key
- `DELETE /api/settings/credentials/:provider` - Remove credentials

### AI

- `POST /api/ai/command` - Execute natural language command
- `POST /api/ai/suggest` - Get DNS record suggestions
- `GET /api/ai/history` - Get command history

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Database**: SQLite (better-sqlite3)
- **AI**: Google Gemini 2.5 Flash
- **APIs**: Cloudflare API v4, Porkbun API v3

## Project Structure

```
domain-manager/
├── src/
│   ├── server/
│   │   ├── index.ts           # Express server entry point
│   │   ├── types/             # TypeScript types
│   │   ├── services/          # Business logic
│   │   │   ├── cloudflare.ts  # Cloudflare API integration
│   │   │   ├── porkbun.ts     # Porkbun API integration
│   │   │   ├── ai.ts          # Gemini AI service
│   │   │   ├── database.ts    # SQLite database
│   │   │   └── domainManager.ts # Unified domain manager
│   │   └── routes/            # API routes
│   └── client/
│       ├── main.tsx           # React entry point
│       ├── App.tsx            # Main app component
│       ├── lib/               # Utilities and API client
│       ├── components/        # React components
│       │   └── ui/            # shadcn/ui components
│       └── pages/             # Page components
├── public/                    # Static assets
├── package.json
└── README.md
```

## Security Notes

- API credentials are stored locally in an SQLite database
- The database file (`domain-manager.db`) is gitignored
- Never commit `.env` files or API keys to version control
- Use environment variables for production deployments

## License

MIT
