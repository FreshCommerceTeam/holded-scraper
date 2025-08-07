# Holded Employee Leave Data Scraper

A Node.js API that logs into Holded, scrapes employee absence data, and returns it as JSON.

## Setup

1. Clone the project
2. Run `npm install`
3. Add a `.env` file with your Holded credentials
4. Run `npx playwright install`
5. Start the server: `node server.js`

## Endpoints

- `GET /health` - Basic status check
- `GET /ausencias` - Get employee leave data from Holded