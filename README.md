# WhatsApp-Like Chat Application

A modern, real-time group chat application built with React, Node.js, and WebSocket technology. Features WhatsApp-like UI/UX with group messaging, typing indicators, message status, and comprehensive user management.

![Chat Application](https://img.shields.io/badge/Status-Active-green)
![Node.js](https://img.shields.io/badge/Node.js-18+-blue)
![React](https://img.shields.io/badge/React-18+-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)

## ✨ Features

### 🎯 Core Functionality
- **Real-time messaging** with WebSocket connections
- **Group chat creation** and management
- **User authentication** with JWT tokens
- **Message status indicators** (sent ✓, delivered ✓✓, read ✓✓)
- **Typing indicators** ("User is typing...")
- **Online/offline status** for users
- **Message history** and persistence

### 👥 Group Management
- **Create groups** with multiple users
- **Add/remove members** from groups
- **Admin permissions** and role management
- **Group info panel** with member details
- **Group profile customization** (name, description, avatar)
- **Member count display** and online status

### 🎨 WhatsApp-Like UI/UX
- **Modern chat interface** with message bubbles
- **Sender avatars** and names in group chats
- **Right-aligned messages** for sender (green background)
- **Left-aligned messages** for others (white background)
- **Conversation list** with unread counts and previews
- **Responsive design** for all screen sizes

### 🔧 Technical Features
- **RESTful API** with Express.js
- **SQLite database** for data persistence
- **WebSocket server** for real-time communication
- **JWT authentication** and authorization
- **TypeScript** for type safety
- **Modular architecture** with clean separation of concerns

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SupriyaSandipShelke/whatsapp-like-chat-app.git
   cd whatsapp-like-chat-app
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   cd client && npm install && cd ..
   ```

3. **Start the application**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start them separately:
   # Backend: npm run dev:server
   # Frontend: npm run dev:client
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### First Time Setup

1. **Register a new account** on the login page
2. **Create a group** from the Messages section
3. **Add other users** to test group functionality
4. **Start chatting** with real-time messaging!

## 📁 Project Structure

```
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Main application pages
│   │   ├── services/          # API and WebSocket services
│   │   └── App.tsx            # Main application component
│   ├── package.json
│   └── vite.config.ts
├── src/                       # Node.js backend
│   └── server/
│       ├── routes/            # API route handlers
│       ├── services/          # Business logic services
│       ├── middleware/        # Authentication middleware
│       └── index.ts           # Server entry point
├── data/                      # SQLite database files
├── uploads/                   # File upload storage
├── package.json               # Root package configuration
└── README.md                  # This file
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server code
- **WebSocket (ws)** - Real-time communication
- **SQLite3** - Lightweight database
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Multer** - File upload handling

### Development Tools
- **tsx** - TypeScript execution
- **Concurrently** - Run multiple commands
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token
- `GET /api/auth/users` - Get all users

### Chat Management
- `GET /api/whatsapp/chats` - Get user's chats
- `GET /api/whatsapp/chat/:chatId/messages` - Get chat messages
- `POST /api/whatsapp/chat/:chatId/send` - Send message
- `POST /api/whatsapp/chat/:chatId/read` - Mark messages as read

### Group Management
- `POST /api/whatsapp/groups/create` - Create new group
- `GET /api/whatsapp/groups/:groupId/members` - Get group members
- `POST /api/whatsapp/groups/:groupId/join` - Join group
- `POST /api/whatsapp/groups/:groupId/members/add` - Add member to group
- `POST /api/whatsapp/groups/:groupId/members/remove` - Remove member from group

## 🎯 Usage Examples

### Creating a Group
```javascript
// Frontend API call
const response = await fetch('/api/whatsapp/groups/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'My Group',
    participants: ['user1', 'user2']
  })
});
```

### Sending Messages
```javascript
// WebSocket message
websocket.send(JSON.stringify({
  type: 'send_message',
  roomId: 'group_123',
  content: 'Hello everyone!',
  sender: 'user_456',
  isGroup: true
}));
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Input Validation** - Server-side validation
- **CORS Protection** - Configured for security
- **SQL Injection Prevention** - Parameterized queries

## 🚀 Deployment

### Environment Variables
Create a `.env` file in the root directory:
```env
PORT=3001
DATABASE_PATH=./data/messages.db
JWT_SECRET=your-secret-key-here
NODE_ENV=production
```

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Supriya Sandip Shelke**
- GitHub: [@SupriyaSandipShelke](https://github.com/SupriyaSandipShelke)

## 🙏 Acknowledgments

- Inspired by WhatsApp's user interface and functionality
- Built with modern web technologies and best practices
- Thanks to the open-source community for the amazing tools and libraries

## 📞 Support

If you have any questions or need help, please:
1. Check the [Issues](https://github.com/SupriyaSandipShelke/whatsapp-like-chat-app/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about your environment and the issue

---

⭐ **Star this repository if you found it helpful!**