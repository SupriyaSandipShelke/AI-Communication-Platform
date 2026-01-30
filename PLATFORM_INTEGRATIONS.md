# Platform Integrations Guide

This unified communication hub now supports multiple messaging platforms. Here's how to set up and use each integration.

## 🚀 Supported Platforms

- ✅ **WhatsApp** - Business API integration
- ✅ **Telegram** - Bot API integration  
- ✅ **Instagram** - Business Messaging API
- ✅ **Matrix** - Decentralized messaging protocol
- ✅ **Slack** - Workspace messaging

## 📱 Telegram Integration

### Setup Steps

1. **Create a Telegram Bot**
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Use `/newbot` command
   - Choose a name and username for your bot
   - Copy the bot token provided

2. **Configure the Application**
   ```bash
   npm run setup:telegram
   ```
   Or manually add to `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/telegram/webhook
   ```

3. **Features Available**
   - ✅ Receive messages from users
   - ✅ Send messages to users
   - ✅ Auto-polling for new messages
   - ✅ Webhook support for production
   - ✅ Media message detection
   - ✅ AI-powered auto-responses

### API Endpoints

- `POST /api/telegram/send` - Send message
- `GET /api/telegram/chats` - Get chat list
- `GET /api/telegram/status` - Check connection status
- `POST /api/telegram/webhook` - Webhook endpoint

## 📷 Instagram Integration

### Setup Steps

1. **Create Facebook App**
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app
   - Add Instagram Basic Display or Instagram Messaging product

2. **Get Credentials**
   - Create Instagram Business Account
   - Generate Page Access Token
   - Get Instagram Page ID

3. **Configure the Application**
   ```bash
   npm run setup:instagram
   ```
   Or manually add to `.env`:
   ```env
   INSTAGRAM_ACCESS_TOKEN=your_access_token_here
   INSTAGRAM_PAGE_ID=your_page_id_here
   INSTAGRAM_WEBHOOK_VERIFY_TOKEN=your_verify_token_here
   ```

4. **Setup Webhooks**
   - Webhook URL: `https://yourdomain.com/api/instagram/webhook`
   - Subscribe to messaging events
   - Use the verify token from your configuration

### Features Available

- ✅ Receive Instagram Direct Messages
- ✅ Send messages to users
- ✅ Webhook verification
- ✅ Media message support
- ✅ AI-powered responses

### API Endpoints

- `POST /api/instagram/send` - Send message
- `GET /api/instagram/conversations` - Get conversations
- `GET /api/instagram/status` - Check connection status
- `GET /api/instagram/webhook` - Webhook verification
- `POST /api/instagram/webhook` - Webhook endpoint

## 🔧 Development & Testing

### Local Development

1. **Start the Application**
   ```bash
   npm run dev
   ```

2. **Check Platform Status**
   Visit `http://localhost:3001/api/health` to see all platform connection statuses

3. **Test Integrations**
   - Telegram: Message your bot directly
   - Instagram: Send DM to your business account
   - Use the platform selector in the frontend

### Frontend Integration

The frontend includes a `PlatformSelector` component that shows:
- ✅ Real-time connection status for each platform
- 🎨 Visual platform selection interface
- 🔄 Automatic status updates every 30 seconds

## 📊 Message Flow

```
User Message → Platform API → Adapter → Database → WebSocket → Frontend
                    ↓
              AI Processing → Auto-Response (if enabled)
```

## 🛠️ Troubleshooting

### Telegram Issues

- **Bot not responding**: Check bot token in `.env`
- **Messages not received**: Verify polling is working in logs
- **Webhook not working**: Ensure HTTPS and correct webhook URL

### Instagram Issues

- **API errors**: Verify access token and page ID
- **Webhook not verified**: Check verify token matches
- **Messages not received**: Ensure webhook is subscribed to messaging events

### General Issues

- **Platform shows disconnected**: Check credentials in `.env`
- **Messages not syncing**: Verify WebSocket connection
- **AI features not working**: Check OpenAI API key configuration

## 🔐 Security Considerations

- Keep all API tokens secure and never commit them to version control
- Use environment variables for all sensitive configuration
- Implement rate limiting for webhook endpoints
- Validate all incoming webhook payloads
- Use HTTPS for all webhook URLs in production

## 📈 Monitoring

The application provides several monitoring endpoints:

- `/api/health` - Overall system health
- `/api/telegram/status` - Telegram connection status
- `/api/instagram/status` - Instagram connection status

## 🚀 Production Deployment

1. **Environment Setup**
   - Set all required environment variables
   - Configure webhook URLs with your domain
   - Ensure HTTPS is enabled

2. **Platform Configuration**
   - Update webhook URLs in platform settings
   - Test webhook delivery
   - Monitor logs for any issues

3. **Scaling Considerations**
   - Consider using Redis for session storage
   - Implement proper error handling and retries
   - Set up monitoring and alerting

## 📚 Additional Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Facebook Webhook Guide](https://developers.facebook.com/docs/graph-api/webhooks)

## 🤝 Contributing

To add support for additional platforms:

1. Create a new adapter in `src/server/adapters/`
2. Implement the `PlatformAdapter` interface
3. Add routes in `src/server/routes/`
4. Update the main server file to initialize the adapter
5. Add frontend integration in `PlatformService.ts`
6. Update this documentation

---

**Need help?** Check the logs for detailed error messages or create an issue in the repository.