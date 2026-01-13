# API Documentation

## Base URL
```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Authentication Endpoints

### Register User
Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "johndoe"
}
```

**Errors:**
- `400` - Username/password missing or user already exists
- `500` - Server error

---

### Login
Authenticate existing user.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "johndoe"
}
```

**Errors:**
- `400` - Missing credentials
- `401` - Invalid credentials
- `500` - Server error

---

### Verify Token
Verify JWT token validity.

**Endpoint:** `GET /api/auth/verify`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "success": true,
  "user": {
    "username": "johndoe"
  }
}
```

**Errors:**
- `401` - No token provided or invalid token

---

## Message Endpoints

### Get Messages
Retrieve messages with optional filters.

**Endpoint:** `GET /api/messages`

**Query Parameters:**
- `platform` (optional) - Filter by platform (e.g., "matrix", "slack")
- `roomId` (optional) - Filter by room/channel ID
- `startDate` (optional) - ISO date string
- `endDate` (optional) - ISO date string
- `priority` (optional) - "high", "medium", or "low"
- `limit` (optional) - Number of messages (default: 100)

**Example:**
```
GET /api/messages?platform=matrix&priority=high&limit=50
```

**Response:** `200 OK`
```json
{
  "success": true,
  "messages": [
    {
      "id": "matrix_1234567890_abc123",
      "platform": "matrix",
      "room_id": "!roomid:matrix.org",
      "sender": "@user:matrix.org",
      "content": "Important meeting at 3 PM",
      "timestamp": "2026-01-09T14:30:00.000Z",
      "priority": "high",
      "read": 0
    }
  ]
}
```

---

### Send Message
Send a message to a specific platform and room.

**Endpoint:** `POST /api/messages/send`

**Request Body:**
```json
{
  "platform": "matrix",
  "roomId": "!roomid:matrix.org",
  "content": "Hello, world!"
}
```

**Response:** `200 OK`
```json
{
  "success": true
}
```

**Errors:**
- `400` - Missing required fields or unsupported platform
- `500` - Failed to send message

---

### Get Daily Summary
Retrieve AI-generated daily communication summary.

**Endpoint:** `GET /api/messages/summary/daily`

**Query Parameters:**
- `date` (optional) - ISO date string (default: today)

**Example:**
```
GET /api/messages/summary/daily?date=2026-01-09
```

**Response:** `200 OK`
```json
{
  "success": true,
  "summary": {
    "date": "2026-01-09",
    "summary": "You received 47 messages today. Key discussions included the product launch, team meeting scheduling, and client feedback. Most activity was in the morning hours.",
    "keyTopics": [
      "Product Launch",
      "Team Meeting",
      "Client Feedback",
      "Project Timeline"
    ],
    "sentiment": "positive",
    "actionItems": [
      "Schedule team meeting for next week",
      "Review client feedback document",
      "Prepare product launch materials"
    ],
    "messageCount": 47
  }
}
```

**Note:** If summary doesn't exist, it will be generated on the fly.

---

### Mark Message as Read
Update message read status.

**Endpoint:** `PATCH /api/messages/:messageId/read`

**Response:** `200 OK`
```json
{
  "success": true
}
```

---

### Transcribe Voice
Convert voice audio to text using Whisper AI.

**Endpoint:** `POST /api/messages/transcribe`

**Request Body:**
```json
{
  "audio": "base64_encoded_audio_data"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "transcript": "This is the transcribed text from the audio."
}
```

**Errors:**
- `400` - No audio data provided
- `500` - Transcription failed (OpenAI not configured or error)

---

### Get Rooms
List all available chat rooms/channels.

**Endpoint:** `GET /api/messages/rooms`

**Response:** `200 OK`
```json
{
  "success": true,
  "rooms": [
    {
      "roomId": "!abc123:matrix.org",
      "name": "General Discussion",
      "members": 5,
      "unreadCount": 3
    },
    {
      "roomId": "!def456:matrix.org",
      "name": "Project Alpha",
      "members": 8,
      "unreadCount": 0
    }
  ]
}
```

---

### Get Room Messages
Retrieve messages from a specific room.

**Endpoint:** `GET /api/messages/rooms/:roomId`

**Query Parameters:**
- `limit` (optional) - Number of messages (default: 50)

**Example:**
```
GET /api/messages/rooms/!abc123:matrix.org?limit=100
```

**Response:** `200 OK`
```json
{
  "success": true,
  "messages": [
    {
      "id": "$event123",
      "sender": "@alice:matrix.org",
      "content": "Hey everyone!",
      "timestamp": "2026-01-09T14:30:00.000Z",
      "type": "m.text"
    }
  ]
}
```

---

## Analytics Endpoints

### Get Analytics
Retrieve analytics for a date range.

**Endpoint:** `GET /api/analytics`

**Query Parameters:**
- `startDate` (optional) - ISO date string (default: 30 days ago)
- `endDate` (optional) - ISO date string (default: today)

**Example:**
```
GET /api/analytics?startDate=2026-01-01&endDate=2026-01-09
```

**Response:** `200 OK`
```json
{
  "success": true,
  "analytics": [
    {
      "date": "2026-01-09",
      "platform": "matrix",
      "message_count": 45,
      "high_priority_count": 8
    },
    {
      "date": "2026-01-09",
      "platform": "slack",
      "message_count": 23,
      "high_priority_count": 3
    }
  ]
}
```

---

### Get Priority Statistics
Get message counts by priority level.

**Endpoint:** `GET /api/analytics/priority`

**Response:** `200 OK`
```json
{
  "success": true,
  "counts": {
    "high": 156,
    "medium": 342,
    "low": 789
  }
}
```

---

### Get Platform Distribution
Get message counts by platform.

**Endpoint:** `GET /api/analytics/platforms`

**Query Parameters:**
- `startDate` (optional) - ISO date string (default: 7 days ago)
- `endDate` (optional) - ISO date string (default: today)

**Example:**
```
GET /api/analytics/platforms?startDate=2026-01-01
```

**Response:** `200 OK`
```json
{
  "success": true,
  "platforms": {
    "matrix": 450,
    "slack": 320,
    "whatsapp": 180
  }
}
```

---

## Health Check

### System Health
Check if the server and services are running.

**Endpoint:** `GET /api/health`

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2026-01-09T15:30:00.000Z",
  "services": {
    "matrix": true,
    "database": true,
    "ai": true
  }
}
```

---

## WebSocket API

### Connection
Connect to WebSocket for real-time updates.

**URL:** `ws://localhost:3001`

**Connection Example (JavaScript):**
```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  console.log('Connected to WebSocket');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

---

### Subscribe to Room
Subscribe to messages from a specific room.

**Send:**
```json
{
  "type": "subscribe",
  "roomId": "!abc123:matrix.org"
}
```

**Response:**
```json
{
  "type": "subscribed",
  "roomId": "!abc123:matrix.org"
}
```

---

### Send Message via WebSocket
Send a message through WebSocket connection.

**Send:**
```json
{
  "type": "send_message",
  "roomId": "!abc123:matrix.org",
  "content": "Hello from WebSocket!"
}
```

---

### Receive New Messages
Listen for incoming messages in real-time.

**Received Event:**
```json
{
  "type": "new_message",
  "platform": "matrix",
  "message": {
    "body": "New message content",
    "sender": "@user:matrix.org",
    "timestamp": "2026-01-09T15:30:00.000Z"
  }
}
```

---

## Error Handling

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Currently no rate limiting implemented (MVP).

**Recommended for Production:**
- 100 requests per minute per IP
- 1000 requests per hour per user
- Implement using `express-rate-limit`

---

## CORS Configuration

**Development:**
- Allowed origins: `http://localhost:5173`, `http://localhost:3000`

**Production:**
- Configure `ALLOWED_ORIGINS` in `.env`
- Example: `ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com`

---

## Authentication Flow

1. **Register/Login** → Receive JWT token
2. **Store token** → `localStorage.setItem('auth_token', token)`
3. **Include in requests** → `Authorization: Bearer ${token}`
4. **Token expiry** → 7 days (configurable)
5. **Refresh** → Login again after expiry

---

## Best Practices

### Security
- Always use HTTPS in production
- Store tokens securely
- Never expose API keys in client code
- Implement rate limiting
- Validate all inputs

### Performance
- Use pagination for large datasets
- Cache daily summaries
- Implement WebSocket for real-time updates
- Compress responses

### Error Handling
- Check response status codes
- Handle network errors gracefully
- Provide user-friendly error messages
- Log errors for debugging

---

## Example Client Implementation

### Axios Setup
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Fetch Messages
```javascript
async function fetchMessages() {
  try {
    const response = await api.get('/messages', {
      params: {
        priority: 'high',
        limit: 50
      }
    });
    return response.data.messages;
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    throw error;
  }
}
```

### Send Message
```javascript
async function sendMessage(roomId, content) {
  try {
    const response = await api.post('/messages/send', {
      platform: 'matrix',
      roomId,
      content
    });
    return response.data;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
}
```

---

## Testing with cURL

### Register User
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'
```

### Get Messages
```bash
curl -X GET "http://localhost:3001/api/messages?priority=high" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Analytics
```bash
curl -X GET http://localhost:3001/api/analytics/platforms \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

**API Version:** 1.0.0 (MVP)  
**Last Updated:** January 9, 2026
