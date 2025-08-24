# TLDR Board is Running! 🚀

## Access the app:
**http://localhost:5173**

## What's running:
- **Client**: Vite dev server on port 5173
- **Sync Server**: WebSocket server on port 3001

## How to use:
1. Open http://localhost:5173 in your browser
2. You'll see the collaborative canvas with opportunity assessment templates
3. Choose a stage: 0→1, 1→n, or n^x
4. Share the URL with teammates to collaborate
5. Everyone in the same room sees real-time changes

## Troubleshooting:
If the page doesn't load, run these commands in separate terminals:

**Terminal 1:**
```bash
cd /Users/rachelwolan/prd-new/tldr-board
pnpm dev
```

**Terminal 2:**
```bash
cd /Users/rachelwolan/prd-new/tldr-board
node server.mjs
```

The Node.js version warning can be ignored - Vite still runs fine.
