import { createServer } from 'http'
import { WebSocketServer } from 'ws'

const PORT = 3001

// Simple in-memory room storage
const rooms = new Map()

const server = createServer()
const wss = new WebSocketServer({ server })

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const roomId = url.pathname.slice(1) || 'default'
  
  console.log(`Client connected to room: ${roomId}`)
  
  // Get or create room
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set())
  }
  const room = rooms.get(roomId)
  room.add(ws)
  
  // Send connect acknowledgment
  ws.send(JSON.stringify({
    type: 'connect',
    message: 'Connected to sync server'
  }))
  
  ws.on('message', (data) => {
    const message = data.toString()
    
    // Broadcast to all other clients in the room
    room.forEach((client) => {
      if (client !== ws && client.readyState === 1) {
        client.send(message)
      }
    })
  })
  
  ws.on('close', () => {
    room.delete(ws)
    console.log(`Client disconnected from room: ${roomId}`)
    
    // Clean up empty rooms
    if (room.size === 0) {
      rooms.delete(roomId)
    }
  })
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })
})

server.listen(PORT, () => {
  console.log(`Sync server running on ws://localhost:${PORT}`)
  console.log('Clients can connect to different rooms using ws://localhost:3001/[room-name]')
})
