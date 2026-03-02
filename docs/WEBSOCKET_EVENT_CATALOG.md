# Shhh — WebSocket Event Catalog

> **Purpose:** Reference for all WebSocket events emitted and consumed by the Shhh backend.  
> **Source:** `backend/src/websocket/index.ts` and callers (`emitToUser`, `emitNewMessage`, etc.).

---

## 1. Connection & Auth

### Handshake

- **Auth:** Client must pass `auth.token` (JWT access token) in the Socket.io handshake.
- **Reject:** Missing or invalid token → connection rejected with `Error('Authentication required')` or `Error('Invalid token')`.

### Rooms (auto-join)

| Room | Format | Joined | Purpose |
|------|--------|--------|---------|
| User room | `user:${userId}` | On connect | Receive user-scoped events (whispers, albums, notifications, distress) |
| Conversation room | `conversation:${conversationId}` | On `join_conversation` | Receive conversation-scoped events (messages, typing, read) |

---

## 2. Client → Server (incoming)

| Event | Payload | Purpose |
|-------|---------|---------|
| `join_conversation` | `conversationId: string` | Join a conversation room to receive `new_message`, `user_typing`, etc. |
| `leave_conversation` | `conversationId: string` | Leave a conversation room |
| `typing` | `{ conversationId: string }` | Broadcast typing indicator to others in conversation |
| `stop_typing` | `{ conversationId: string }` | Clear typing indicator |
| `message_read` | `{ conversationId: string; messageId: string }` | Mark message as read; notify others |

---

## 3. Server → Client (outgoing)

### Conversation-scoped (room: `conversation:${id}`)

| Event | Payload | Emitted when |
|-------|---------|--------------|
| `new_message` | `message` (full message object) | New message saved to MongoDB; sent to conversation room |
| `user_typing` | `{ userId, conversationId }` | Another user sent `typing` |
| `user_stop_typing` | `{ userId, conversationId }` | Another user sent `stop_typing` |
| `message_read` | `{ userId, conversationId, messageId }` | Another user marked message as read |
| `media_self_destructed` | `{ mediaId }` | Self-destructing media expired |
| `conversation_wiped` | `{ conversationId }` | Panic-wipe cleared conversation; sent to participants |

### User-scoped (room: `user:${userId}`)

| Event | Payload | Emitted when |
|-------|---------|--------------|
| `whisper_received` | `{ whisperId, fromUserId?, message, ... }` | New whisper received |
| `whisper_revealed` | `{ whisperId, ... }` | Recipient revealed identity |
| `whisper_response` | `{ whisperId, response }` | Recipient responded to whisper |
| `presence_expired` | `{ message }` | Presence TTL expired (decay worker) |
| `venue_distress` | `{ userId, venueId }` | User signaled distress at venue; sent to venue staff |
| `album_shared` | `albumData` | Album shared with user |
| `album_revoked` | `{ albumId }` | Album share revoked |
| `notification` | (varies) | Generic notification (e.g. new conversation) |

---

## 4. Emit Helpers (backend)

| Helper | Target | Use |
|--------|---------|-----|
| `emitNewMessage(conversationId, message)` | `conversation:${id}` | After saving message to MongoDB |
| `emitToUser(userId, event, data)` | `user:${userId}` | User-scoped events |
| `emitMediaSelfDestructed(conversationId, mediaId)` | `conversation:${id}` | Media TTL expired |
| `emitAlbumShared(userId, albumData)` | `user:${userId}` | Album share created |
| `emitAlbumRevoked(userId, albumId)` | `user:${userId}` | Album share revoked |

---

## 5. Mobile Integration

- **Hook:** `mobile/src/hooks/useSocket.ts` — connects with token, exposes `joinConversation`, `onNewMessage`, typing handlers.
- **Chat screen:** Must call `joinConversation(conversationId)` when entering chat to receive real-time messages.
- **Delivery:** No acks or retries; fire-and-forget. Client should poll or refetch if delivery is critical and socket was disconnected.
