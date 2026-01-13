# Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies (2 min)

Open PowerShell in the project directory:

```powershell
# Install backend dependencies
npm install

# Install frontend dependencies
cd client ; npm install ; cd ..
```

### 2. Configure Environment (1 min)

```powershell
# Create .env file from example
copy .env.example .env

# Open .env in notepad
notepad .env
```

**Minimum configuration** (for demo mode):
```env
PORT=3001
JWT_SECRET=change-this-to-something-secure
```

**For full features**, add:
- OpenAI API key (get from https://platform.openai.com)
- Matrix credentials (create account at https://app.element.io)

### 3. Start the Application (1 min)

```powershell
npm run dev
```

This starts both backend and frontend servers.

### 4. Access the App (1 min)

1. Open browser: **http://localhost:5173**
2. Click "Need an account? Register"
3. Create username and password
4. Start using the platform!

## What You Get

### Without API Keys (Demo Mode)
- ✅ User authentication
- ✅ Message interface
- ✅ Analytics dashboard
- ✅ Settings page
- ⚠️ Matrix features disabled (no real messages)
- ⚠️ AI features disabled

### With OpenAI API Key
- ✅ Everything above, plus:
- ✅ AI message summaries
- ✅ Priority classification
- ✅ Auto-responses
- ✅ Voice-to-text transcription

### With Matrix Account
- ✅ Everything above, plus:
- ✅ Real-time messaging
- ✅ Matrix room integration
- ✅ End-to-end encryption
- ✅ Cross-platform messaging

## Next Steps

### Add Slack Integration

1. Create Slack App: https://api.slack.com/apps
2. Add scopes: `channels:history`, `channels:read`, `chat:write`
3. Install to workspace
4. Copy Bot Token to `.env`:
```env
SLACK_BOT_TOKEN=xoxb-your-token-here
```
5. Restart server

### Get API Keys

**OpenAI (For AI Features)**
1. Visit: https://platform.openai.com
2. Sign up → API Keys → Create new key
3. Copy to `.env`: `OPENAI_API_KEY=sk-...`

**Matrix (For Messaging)**
1. Visit: https://app.element.io
2. Register account
3. Settings → Help & About → Copy Access Token
4. Add to `.env`:
```env
MATRIX_USER_ID=@yourusername:matrix.org
MATRIX_ACCESS_TOKEN=your-token-here
```

## Troubleshooting

### PowerShell Command Errors
If you see errors with `&&`, use semicolons instead:
```powershell
# Wrong (doesn't work in PowerShell)
npm install && npm run dev

# Correct
npm install ; npm run dev
```

### Port Already in Use
If port 3001 or 5173 is busy:
```powershell
# Change PORT in .env
PORT=3002
```

### Dependencies Not Installing
```powershell
# Clear cache and reinstall
npm cache clean --force
rm -r node_modules
npm install
```

### Can't Access Application
- Check backend: http://localhost:3001/api/health
- Check frontend: http://localhost:5173
- Ensure both servers are running
- Check firewall settings

## Commands Reference

```powershell
# Development (runs both servers)
npm run dev

# Backend only
npm run dev:server

# Frontend only
npm run dev:client

# Build for production
npm run build

# Install all dependencies
npm run install:all
```

## Features Demo

### Test Message System
1. Go to Messages page
2. If Matrix is configured, select a room
3. Type a message and send
4. See real-time updates via WebSocket

### Test AI Features
1. Go to Dashboard
2. Click "Get Daily Summary"
3. View AI-generated insights
4. Check priority distribution

### Test Analytics
1. Go to Analytics page
2. View message volume charts
3. Check platform distribution
4. Monitor response times

## Production Deployment

### Build Application
```powershell
npm run build
```

### Start Production Server
```powershell
npm start
```

### Environment Setup
1. Change `NODE_ENV=production`
2. Set secure `JWT_SECRET`
3. Configure production database
4. Update `ALLOWED_ORIGINS`
5. Use HTTPS in production

## Support

- README.md - Full documentation
- Code comments - Inline explanations
- GitHub Issues - Report bugs
- Email support - [your-email]

---

**Ready to win Startupathon?** Start building! 🚀
