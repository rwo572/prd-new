# TLDR Board (Collaborative Opportunity Assessment)

- React + Vite + TypeScript
- Infinite canvas powered by tldraw ([tldraw/tldraw](https://github.com/tldraw/tldraw))
- Real-time collaboration with presence cursors

## Run

```bash
pnpm install
pnpm dev:all  # Starts both client (5173) and sync server (3001)
```

Or run separately:
```bash
pnpm dev     # Client only
pnpm server  # Sync server only
```

## Features

### Collaboration
- Open http://localhost:5173 to start
- Share the URL with room parameter (e.g., `?room=project-x`)
- See live cursors and changes from all participants
- Change rooms using the "Change" button

### Templates
- Stage selector: 0→1 / 1→n / n^x
- Pre-filled opportunity assessment framework
- Warning before loading new template (clears canvas)

### Data Management
- Export/Import JSON for git-backed snapshots
- Room-based organization
- Persistent storage per room (while server runs)

## Architecture
- Client: tldraw with @tldraw/sync for multiplayer
- Server: WebSocket server for room-based sync
- Protocol: Yjs CRDT for conflict-free collaboration
