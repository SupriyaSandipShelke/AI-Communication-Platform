# System Architecture & Design

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER DEVICES                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Browser │  │  Mobile  │  │  Desktop │  │  Tablet  │           │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘           │
└───────┼─────────────┼─────────────┼─────────────┼─────────────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
         ┌────────────▼────────────┐
         │   React Frontend        │
         │   (Port 5173)          │
         │  • Login/Dashboard     │
         │  • Messages UI         │
         │  • Analytics           │
         │  • Settings            │
         └────────────┬────────────┘
                      │
            HTTP/WebSocket
                      │
┌─────────────────────▼────────────────────────────────────────────┐
│                    EXPRESS API SERVER                            │
│                     (Port 3001)                                  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    API ROUTES                             │ │
│  │  /api/auth    /api/messages    /api/analytics            │ │
│  └───────────────────────┬───────────────────────────────────┘ │
│                          │                                      │
│  ┌───────────────────────▼───────────────────────────────────┐ │
│  │                CORE SERVICES LAYER                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │ │
│  │  │   Matrix     │  │  AI Service  │  │   Database   │   │ │
│  │  │   Service    │  │   (OpenAI)   │  │   Service    │   │ │
│  │  │              │  │              │  │   (SQLite)   │   │ │
│  │  │ • Connect    │  │ • Summaries  │  │ • Messages   │   │ │
│  │  │ • Sync       │  │ • Priority   │  │ • Analytics  │   │ │
│  │  │ • Rooms      │  │ • Auto-resp  │  │ • Cache      │   │ │
│  │  │ • Messages   │  │ • Voice-txt  │  │ • Queries    │   │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │ │
│  │         │                  │                  │            │ │
│  └─────────┼──────────────────┼──────────────────┼───────────┘ │
│            │                  │                  │              │
└────────────┼──────────────────┼──────────────────┼─────────────┘
             │                  │                  │
             │                  │                  ▼
             │                  │          ┌─────────────┐
             │                  │          │  SQLite DB  │
             │                  │          │ messages.db │
             │                  │          └─────────────┘
             │                  │
             │                  ▼
             │          ┌─────────────────┐
             │          │   OpenAI API    │
             │          │  • GPT-4        │
             │          │  • GPT-3.5      │
             │          │  • Whisper      │
             │          └─────────────────┘
             │
             ▼
┌────────────────────────┐
│   Matrix Homeserver    │
│   (matrix.org)         │
│  • Federation          │
│  • E2E Encryption      │
│  • Real-time sync      │
└────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│              PLATFORM ADAPTERS (Extensible)                   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Slack  │  │WhatsApp │  │ Signal  │  │ Custom  │        │
│  │ Adapter │  │ Adapter │  │ Adapter │  │ Adapter │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└──────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Backend Services

```
┌─────────────────────────────────────────────────────────────┐
│                    MatrixService                            │
├─────────────────────────────────────────────────────────────┤
│  State:                                                     │
│  • client: Matrix client instance                          │
│  • isReady: Connection status                              │
│  • messageHandlers: Array of callback functions            │
│                                                             │
│  Methods:                                                   │
│  • initialize(): Connect to homeserver                     │
│  • onMessage(handler): Register message callback           │
│  • sendMessage(roomId, content): Send to Matrix            │
│  • getRooms(): Fetch all rooms                             │
│  • getMessages(roomId, limit): Fetch room messages         │
│  • createRoom(name, invites): Create new room              │
│  • joinRoom(roomId): Join existing room                    │
│  • stop(): Disconnect client                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     AIService                               │
├─────────────────────────────────────────────────────────────┤
│  State:                                                     │
│  • openai: OpenAI client instance                          │
│  • configured: API key validation status                   │
│                                                             │
│  Methods:                                                   │
│  • classifyPriority(message): Returns high/medium/low      │
│  • generateAutoResponse(message): Returns response object  │
│  • generateDailySummary(messages): Returns summary object  │
│  • transcribeAudio(buffer): Returns transcript text        │
│  • extractIntent(text): Returns intent and entities        │
│                                                             │
│  AI Models Used:                                            │
│  • GPT-4: Daily summaries (high quality)                   │
│  • GPT-3.5: Priority classification (fast, cost-effective) │
│  • Whisper-1: Voice transcription                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  DatabaseService                            │
├─────────────────────────────────────────────────────────────┤
│  Database Schema:                                           │
│                                                             │
│  messages:                                                  │
│  • id (TEXT PRIMARY KEY)                                    │
│  • platform (TEXT)                                          │
│  • room_id (TEXT)                                           │
│  • sender (TEXT)                                            │
│  • content (TEXT)                                           │
│  • timestamp (DATETIME)                                     │
│  • priority (TEXT: high/medium/low)                         │
│  • read (BOOLEAN)                                           │
│                                                             │
│  summaries:                                                 │
│  • id (INTEGER PRIMARY KEY)                                 │
│  • date (DATE UNIQUE)                                       │
│  • summary (TEXT)                                           │
│  • key_topics (JSON)                                        │
│  • sentiment (TEXT)                                         │
│  • action_items (JSON)                                      │
│  • message_count (INTEGER)                                  │
│                                                             │
│  analytics:                                                 │
│  • id (INTEGER PRIMARY KEY)                                 │
│  • date (DATE)                                              │
│  • platform (TEXT)                                          │
│  • message_count (INTEGER)                                  │
│  • high_priority_count (INTEGER)                            │
│  • response_time_avg (INTEGER)                              │
│                                                             │
│  Indexes:                                                   │
│  • idx_messages_timestamp                                   │
│  • idx_messages_priority                                    │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Incoming Message Flow

```
External Platform (Slack/WhatsApp/Matrix)
           │
           ▼
   Platform Adapter
           │
           ├─► Store in Database
           │   (DatabaseService.saveMessage)
           │
           ├─► AI Priority Classification
           │   (AIService.classifyPriority)
           │   └─► Update message priority
           │
           ├─► Check Auto-Response Rules
           │   (AIService.generateAutoResponse)
           │   └─► If shouldRespond: Send reply
           │
           └─► Broadcast via WebSocket
               (to all connected clients)
               └─► React UI updates in real-time
```

### User Sends Message Flow

```
React UI (User types message)
           │
           ▼
   POST /api/messages/send
           │
           ▼
   Express Route Handler
           │
           ├─► Validate input
           ├─► Check authentication
           │
           ▼
   MatrixService.sendMessage()
           │
           ▼
   Matrix Homeserver API
           │
           ▼
   Message delivered to room
           │
           ▼
   Matrix sync receives own message
           │
           ▼
   Broadcast to WebSocket clients
           │
           ▼
   UI shows message instantly
```

### Daily Summary Generation Flow

```
Scheduled Time (6 PM) OR User Request
           │
           ▼
   GET /api/messages/summary/daily
           │
           ├─► Check if summary exists in cache
           │   (DatabaseService.getDailySummary)
           │
           │   If exists: Return cached
           │   If not exists:
           │
           ├─► Fetch today's messages
           │   (DatabaseService.getMessages)
           │
           ├─► Send to OpenAI GPT-4
           │   (AIService.generateDailySummary)
           │   │
           │   ├─► Analyze content
           │   ├─► Extract key topics
           │   ├─► Determine sentiment
           │   ├─► Identify action items
           │   └─► Generate summary text
           │
           ├─► Cache in database
           │   (DatabaseService.saveDailySummary)
           │
           └─► Return to client
               └─► Display on Dashboard
```

## Frontend Architecture

### React Component Hierarchy

```
App
 ├── Router
 │    ├── /login → Login (unprotected)
 │    │             └── LoginForm
 │    │
 │    ├── /dashboard → Layout + Dashboard (protected)
 │    │                 ├── Sidebar Navigation
 │    │                 ├── Stats Cards
 │    │                 ├── Daily Summary
 │    │                 └── Quick Actions
 │    │
 │    ├── /messages → Layout + Messages (protected)
 │    │                ├── Sidebar Navigation
 │    │                ├── Room List
 │    │                ├── Message List
 │    │                │   └── Message Component
 │    │                └── Message Input
 │    │                    ├── Text Input
 │    │                    ├── Send Button
 │    │                    └── Voice Button
 │    │
 │    ├── /analytics → Layout + Analytics (protected)
 │    │                 ├── Sidebar Navigation
 │    │                 ├── Platform Chart
 │    │                 ├── Priority Chart
 │    │                 └── Stats Grid
 │    │
 │    └── /settings → Layout + Settings (protected)
 │                     ├── Sidebar Navigation
 │                     ├── Matrix Config
 │                     ├── AI Config
 │                     └── Platform Config
 │
 └── Layout (wrapper for protected routes)
      ├── Sidebar
      │   ├── Logo
      │   ├── Navigation Links
      │   └── Logout Button
      └── Main Content Area
```

### State Management

```
App Component State:
• isAuthenticated: boolean
• loading: boolean

Dashboard State:
• summary: SummaryObject | null
• stats: StatsObject
• loading: boolean

Messages State:
• rooms: Room[]
• selectedRoom: Room | null
• messages: Message[]
• newMessage: string
• ws: WebSocket | null
• filterPriority: string

Analytics State:
• platforms: Record<string, number>
• priorityStats: PriorityStats
• loading: boolean

Settings State:
• settings: SettingsObject
• saved: boolean
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: Transport Security                                │
│  • HTTPS in production                                      │
│  • TLS 1.2+ encryption                                      │
│  • Secure WebSocket (WSS)                                   │
│                                                             │
│  Layer 2: Authentication                                    │
│  • JWT tokens (HS256)                                       │
│  • 7-day expiry                                             │
│  • Secure token storage                                     │
│  • bcrypt password hashing (10 rounds)                      │
│                                                             │
│  Layer 3: Authorization                                     │
│  • Route-level protection                                   │
│  • Token verification middleware                            │
│  • User ownership validation                                │
│                                                             │
│  Layer 4: Data Protection                                   │
│  • Environment variables for secrets                        │
│  • .env files gitignored                                    │
│  • No API keys in client code                               │
│  • SQLite file permissions                                  │
│                                                             │
│  Layer 5: Matrix E2E Encryption                             │
│  • End-to-end encrypted messages                            │
│  • Federation security                                      │
│  • Device verification                                      │
│                                                             │
│  Layer 6: Input Validation                                  │
│  • Request body validation                                  │
│  • SQL injection prevention (parameterized queries)         │
│  • XSS protection (React auto-escaping)                     │
│  • CORS configuration                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

### Current MVP Architecture
- Single server instance
- SQLite database
- In-memory user store
- Direct Matrix connection

### Production Scaling Path

```
┌─────────────────────────────────────────────────────────────┐
│                   Load Balancer (nginx)                      │
└─────────────┬───────────────────────┬───────────────────────┘
              │                       │
      ┌───────▼───────┐       ┌───────▼───────┐
      │  API Server 1 │       │  API Server 2 │
      └───────┬───────┘       └───────┬───────┘
              │                       │
              └───────────┬───────────┘
                          │
                  ┌───────▼───────┐
                  │  PostgreSQL   │
                  │  (Replicated) │
                  └───────────────┘
                          │
                  ┌───────▼───────┐
                  │     Redis     │
                  │  (Caching)    │
                  └───────────────┘
```

### Scalability Improvements
1. **Database:** Migrate SQLite → PostgreSQL
2. **Caching:** Add Redis for sessions and summaries
3. **Queue:** Add message queue (RabbitMQ/Kafka)
4. **Storage:** S3 for voice files and attachments
5. **CDN:** CloudFlare for static assets
6. **Monitoring:** Prometheus + Grafana
7. **Logging:** ELK Stack (Elasticsearch, Logstash, Kibana)

## Performance Metrics

### Response Times (Target)
- Authentication: < 100ms
- Message fetch: < 200ms
- Message send: < 300ms
- Daily summary: < 2s (first time), < 100ms (cached)
- WebSocket latency: < 50ms

### Throughput (Target)
- 1000 messages/minute
- 100 concurrent WebSocket connections
- 50 API requests/second

### Database Performance
- Message insertion: < 10ms
- Message query (with filters): < 50ms
- Analytics query: < 200ms
- Summary cache: < 20ms

---

**Architecture Version:** 1.0.0 (MVP)  
**Last Updated:** January 9, 2026
