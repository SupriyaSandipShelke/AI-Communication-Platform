import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Menu, 
  Phone, 
  MoreVertical, 
  Paperclip, 
  Smile, 
  Send, 
  Mic,
  Settings,
  Users,
  Archive,
  Bookmark,
  Moon,
  User,
  MessageSquare,
  Plus,
  X,
  ArrowLeft,
  Download,
  Play,
  Pause,
  Check,
  CheckCheck,
  Pin,
  VolumeX,
  Clock,
  Forward,
  Reply,
  Copy,
  Trash2,
  Edit3,
  Share,
  Info
} from 'lucide-react';

interface TelegramChat {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  isOnline: boolean;
  avatar?: string;
  isGroup: boolean;
  isPinned: boolean;
  isMuted: boolean;
  phoneNumber?: string;
  isArchived?: boolean;
}

interface TelegramMessage {
  id: string;
  content: string;
  sender: string;
  senderName: string;
  timestamp: Date;
  isOwn: boolean;
  type: 'text' | 'image' | 'video' | 'file' | 'forwarded' | 'birthday';
  forwardedFrom?: string;
  fileSize?: string;
  fileName?: string;
  mediaUrl?: string;
  downloadProgress?: number;
  isPlaying?: boolean;
  duration?: string;
  views?: number;
}

export default function Telegram() {
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState<TelegramChat | null>(null);
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chats] = useState<TelegramChat[]>([
    {
      id: '1',
      name: "Aniket Pathade(dcc)",
      lastMessage: "It's Aniket Pathade(dcc)'s birthday today! 🎂",
      time: '11:47 PM',
      unreadCount: 0,
      isOnline: true,
      isGroup: false,
      isPinned: true,
      isMuted: false,
      phoneNumber: '+91 94229 06795'
    },
    {
      id: '2',
      name: 'Sakshi Hase',
      lastMessage: 'Border 2 2026 Hindi HDTC 1080p x264.AAC',
      time: '4:06 PM',
      unreadCount: 0,
      isOnline: true,
      isGroup: false,
      isPinned: false,
      isMuted: false,
      phoneNumber: '+91 94229 06795'
    },
    {
      id: '3',
      name: 'Mangesh Navale',
      lastMessage: 'Border 2 2026 Hindi HDTC 1080p x264.AAC',
      time: 'Wed',
      unreadCount: 0,
      isOnline: false,
      isGroup: false,
      isPinned: false,
      isMuted: false
    },
    {
      id: '4',
      name: 'Dailyfix Hackathon: Career+ Challenge',
      lastMessage: 'Aditya Dodal: Thanks for sharing. Team will review your submission...',
      time: 'Sat',
      unreadCount: 0,
      isOnline: false,
      isGroup: true,
      isPinned: false,
      isMuted: false
    },
    {
      id: '5',
      name: 'Amar gangurde',
      lastMessage: 'Yes I also',
      time: '1/19/2026',
      unreadCount: 0,
      isOnline: false,
      isGroup: false,
      isPinned: false,
      isMuted: false
    },
    {
      id: '6',
      name: 'Deleted Account',
      lastMessage: 'Deleted Account joined Telegram',
      time: '1/17/2026',
      unreadCount: 1,
      isOnline: false,
      isGroup: false,
      isPinned: false,
      isMuted: false
    },
    {
      id: '7',
      name: 'Vaishnavi Sheike',
      lastMessage: 'Vaishnavi Sheike joined Telegram',
      time: '1/17/2026',
      unreadCount: 0,
      isOnline: false,
      isGroup: false,
      isPinned: false,
      isMuted: false
    },
    {
      id: '8',
      name: 'Shruti Tambe',
      lastMessage: 'Sru',
      time: '1/15/2026',
      unreadCount: 0,
      isOnline: false,
      isGroup: false,
      isPinned: false,
      isMuted: false
    },
    {
      id: '9',
      name: 'Rani Mavshi(telegav)',
      lastMessage: 'Rani Mavshi(telegav) joined Telegram',
      time: '1/13/2026',
      unreadCount: 1,
      isOnline: false,
      isGroup: false,
      isPinned: false,
      isMuted: false
    },
    {
      id: '10',
      name: 'Tejasvini Kawade(mummy)',
      lastMessage: 'Tejasvini Kawade(mummy) joined Telegram',
      time: '12/23/2025',
      unreadCount: 0,
      isOnline: false,
      isGroup: false,
      isPinned: false,
      isMuted: false
    }
  ]);

  const [archivedChats] = useState<TelegramChat[]>([
    {
      id: 'arch1',
      name: 'Kaushal Dighe(mamu)',
      lastMessage: 'Last message from archived chat',
      time: '2 days ago',
      unreadCount: 0,
      isOnline: false,
      isGroup: false,
      isPinned: false,
      isMuted: false,
      isArchived: true
    }
  ]);

  useEffect(() => {
    if (selectedChat) {
      // Load messages for selected chat based on chat ID
      let sampleMessages: TelegramMessage[] = [];
      
      if (selectedChat.id === '2') { // Sakshi Hase
        sampleMessages = [
          {
            id: '1',
            content: 'Dhurandhar.2025.1080p.V2.HDTC.Hindi-LINE.x264-HDHub4u.Mkv',
            sender: 'sakshi',
            senderName: 'Sakshi Hase',
            timestamp: new Date('2026-01-29T16:06:00'),
            isOwn: false,
            type: 'video',
            fileSize: '3459 MB',
            fileName: 'Dhurandhar.2025.1080p.V2.HDTC.Hindi-LINE.x264-HDHub4u.Mkv',
            mediaUrl: 'https://via.placeholder.com/400x225/FF0000/FFFFFF?text=DHURANDHAR',
            duration: '2:15:30',
            views: 233
          },
          {
            id: '2',
            content: 'Forwarded from Only movies 4.0 (ОПТГЕВНИН)',
            sender: 'forwarder',
            senderName: 'Forwarded from',
            timestamp: new Date('2026-01-29T16:10:00'),
            isOwn: false,
            type: 'forwarded',
            forwardedFrom: 'Only movies 4.0 (ОПТГЕВНИН)'
          },
          {
            id: '3',
            content: 'Border 2 2026 Hindi HDTC 1080p x264.AAC',
            sender: 'sakshi',
            senderName: 'Sakshi Hase',
            timestamp: new Date('2026-01-29T16:15:00'),
            isOwn: false,
            type: 'video',
            fileSize: '3290.8 MB',
            fileName: 'Border 2 2026 Hindi HDTC 1080p x264.AAC',
            mediaUrl: 'https://via.placeholder.com/400x225/000000/FFFFFF?text=BORDER+2',
            duration: '2:45:20',
            views: 233
          }
        ];
      } else if (selectedChat.id === '1') { // Aniket Pathade
        sampleMessages = [
          {
            id: '1',
            content: "It's Aniket Pathade(dcc)'s birthday today! 🎂",
            sender: 'system',
            senderName: 'Telegram',
            timestamp: new Date('2026-01-29T23:47:00'),
            isOwn: false,
            type: 'birthday'
          }
        ];
      } else {
        sampleMessages = [
          {
            id: '1',
            content: 'Hello! How are you?',
            sender: selectedChat.id,
            senderName: selectedChat.name,
            timestamp: new Date(Date.now() - 3600000),
            isOwn: false,
            type: 'text'
          }
        ];
      }
      
      setMessages(sampleMessages);
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const message: TelegramMessage = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'me',
      senderName: 'You',
      timestamp: new Date(),
      isOwn: true,
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleDownload = (fileName: string) => {
    // Simulate download
    console.log('Downloading:', fileName);
  };

  const toggleVideoPlay = (messageId: string) => {
    setPlayingVideo(playingVideo === messageId ? null : messageId);
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const index = name.length % colors.length;
    return colors[index];
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayChats = showArchived ? archivedChats : filteredChats;

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      background: '#17212B',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{
        width: showSidebar ? '260px' : '0',
        background: '#2B5278',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1000
      }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #1E3A5F' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#FF6B6B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>
              SS
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: '500' }}>Supriya Sheike</div>
              <div style={{ color: '#8BB3D9', fontSize: '13px', cursor: 'pointer' }}>Set Emoji Status</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              color: 'white', 
              cursor: 'pointer', 
              padding: '8px', 
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <User size={20} />
              <span>My Profile</span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              color: 'white', 
              cursor: 'pointer', 
              padding: '8px', 
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Users size={20} />
              <span>New Group</span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              color: 'white', 
              cursor: 'pointer', 
              padding: '8px', 
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <MessageSquare size={20} />
              <span>New Channel</span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              color: 'white', 
              cursor: 'pointer', 
              padding: '8px', 
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <User size={20} />
              <span>Contacts</span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              color: 'white', 
              cursor: 'pointer', 
              padding: '8px', 
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Phone size={20} />
              <span>Calls</span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              color: 'white', 
              cursor: 'pointer', 
              padding: '8px', 
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Bookmark size={20} />
              <span>Saved Messages</span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              color: 'white', 
              cursor: 'pointer', 
              padding: '8px', 
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Settings size={20} />
              <span>Settings</span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              color: 'white', 
              cursor: 'pointer', 
              padding: '8px', 
              borderRadius: '8px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Moon size={20} />
                <span>Night Mode</span>
              </div>
              <div style={{
                width: '40px',
                height: '20px',
                background: '#0088cc',
                borderRadius: '10px',
                position: 'relative',
                cursor: 'pointer'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  background: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  transition: 'all 0.3s ease'
                }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: '20px', left: '20px', color: '#8BB3D9', fontSize: '12px' }}>
          <div>Telegram Desktop</div>
          <div>Version 6.4.2 x64 – About</div>
        </div>
      </div>

      {/* Chat List */}
      <div style={{
        width: '420px',
        background: '#17212B',
        borderRight: '1px solid #0F1419',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          background: '#17212B',
          borderBottom: '1px solid #0F1419',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8BB3D9',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            <Menu size={20} />
          </button>
          
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#8BB3D9'
            }} />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                background: '#0F1419',
                border: 'none',
                borderRadius: '20px',
                color: 'white',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Archived Chats Toggle */}
        <div 
          onClick={() => setShowArchived(!showArchived)}
          style={{
            padding: '12px 16px',
            background: showArchived ? '#1E3A5F' : 'transparent',
            borderBottom: '1px solid #0F1419',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          <Archive size={20} style={{ color: '#8BB3D9' }} />
          <span style={{ color: '#8BB3D9', fontSize: '14px' }}>
            {showArchived ? 'Back to Chats' : 'Archived chats'}
          </span>
        </div>

        {/* Chat List */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {displayChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => {
                setSelectedChat(chat);
                setShowContactInfo(false);
              }}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #0F1419',
                cursor: 'pointer',
                background: selectedChat?.id === chat.id ? '#1E3A5F' : 'transparent',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                if (selectedChat?.id !== chat.id) {
                  e.currentTarget.style.background = '#0F1419';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedChat?.id !== chat.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: getAvatarColor(chat.name),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}>
                  {chat.isGroup ? (
                    <Users size={24} />
                  ) : (
                    getInitials(chat.name)
                  )}
                </div>
                {chat.isOnline && !chat.isGroup && (
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '14px',
                    height: '14px',
                    background: '#4CAF50',
                    borderRadius: '50%',
                    border: '2px solid #17212B'
                  }} />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ 
                    color: 'white', 
                    fontWeight: '500',
                    fontSize: '15px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1
                  }}>
                    {chat.name}
                  </span>
                  {chat.isPinned && <Pin size={14} style={{ color: '#8BB3D9' }} />}
                  {chat.isMuted && <VolumeX size={14} style={{ color: '#8BB3D9' }} />}
                </div>
                <div style={{
                  color: '#8BB3D9',
                  fontSize: '13px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {chat.lastMessage}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <span style={{ color: '#8BB3D9', fontSize: '12px' }}>
                  {chat.time}
                </span>
                {chat.unreadCount > 0 && (
                  <div style={{
                    background: '#0088cc',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    minWidth: '18px',
                    textAlign: 'center'
                  }}>
                    {chat.unreadCount}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div style={{
              padding: '12px 16px',
              background: '#17212B',
              borderBottom: '1px solid #0F1419',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: getAvatarColor(selectedChat.name),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold'
              }}>
                {selectedChat.isGroup ? (
                  <Users size={20} />
                ) : (
                  getInitials(selectedChat.name)
                )}
              </div>

              <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setShowContactInfo(!showContactInfo)}>
                <div style={{ color: 'white', fontWeight: '500', fontSize: '15px' }}>
                  {selectedChat.name}
                </div>
                <div style={{ color: '#8BB3D9', fontSize: '13px' }}>
                  {selectedChat.phoneNumber || (selectedChat.isOnline ? 'last seen recently' : 'last seen yesterday at 11:47 PM')}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#8BB3D9',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%'
                }}>
                  <Search size={20} />
                </button>
                <button style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#8BB3D9',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%'
                }}>
                  <Phone size={20} />
                </button>
                <button style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#8BB3D9',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%'
                }}>
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Contact Info Panel */}
            {showContactInfo && selectedChat.phoneNumber && (
              <div style={{
                position: 'absolute',
                top: '60px',
                right: '16px',
                background: '#2B5278',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                zIndex: 1000,
                minWidth: '200px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ color: '#0088cc', fontSize: '14px', fontWeight: '500' }}>
                    ADD {selectedChat.name.split(' ')[0].toUpperCase()} TO CONTACTS
                  </span>
                  <button
                    onClick={() => setShowContactInfo(false)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#8BB3D9',
                      cursor: 'pointer'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div style={{ color: 'white', fontSize: '13px' }}>
                  {selectedChat.phoneNumber}
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div style={{
              flex: 1,
              background: 'linear-gradient(135deg, #8BC34A 0%, #4CAF50 100%)',
              padding: '16px',
              overflow: 'auto',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat',
                opacity: 0.1
              }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                {messages.map((message) => (
                  <div key={message.id} style={{ marginBottom: '16px' }}>
                    {message.type === 'birthday' && (
                      <div style={{
                        textAlign: 'center',
                        padding: '12px',
                        background: 'rgba(255,255,255,0.9)',
                        borderRadius: '12px',
                        margin: '0 auto',
                        maxWidth: '300px'
                      }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎂</div>
                        <div style={{ color: '#333', fontSize: '14px' }}>
                          {message.content}
                        </div>
                      </div>
                    )}

                    {message.type === 'forwarded' && (
                      <div style={{
                        maxWidth: '70%',
                        marginLeft: message.isOwn ? 'auto' : '0',
                        background: message.isOwn ? '#DCF8C6' : 'white',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ 
                          color: '#0088cc', 
                          fontSize: '12px', 
                          marginBottom: '4px',
                          fontWeight: '500'
                        }}>
                          Forwarded from {message.forwardedFrom}
                        </div>
                        <div style={{ color: '#333', fontSize: '14px' }}>
                          {message.content}
                        </div>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#999', 
                          textAlign: 'right', 
                          marginTop: '4px' 
                        }}>
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    )}

                    {message.type === 'video' && (
                      <div style={{
                        maxWidth: '400px',
                        marginLeft: message.isOwn ? 'auto' : '0',
                        background: 'white',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ position: 'relative' }}>
                          <img 
                            src={message.mediaUrl} 
                            alt={message.fileName}
                            style={{
                              width: '100%',
                              height: '225px',
                              objectFit: 'cover'
                            }}
                          />
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            background: 'rgba(0,0,0,0.7)',
                            borderRadius: '50%',
                            padding: '12px',
                            cursor: 'pointer'
                          }}
                          onClick={() => toggleVideoPlay(message.id)}
                          >
                            {playingVideo === message.id ? (
                              <Pause size={24} style={{ color: 'white' }} />
                            ) : (
                              <Play size={24} style={{ color: 'white' }} />
                            )}
                          </div>
                          <div style={{
                            position: 'absolute',
                            bottom: '8px',
                            right: '8px',
                            background: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            {message.duration}
                          </div>
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            {message.fileSize}
                          </div>
                        </div>
                        <div style={{ padding: '12px' }}>
                          <div style={{ 
                            color: '#333', 
                            fontSize: '14px', 
                            fontWeight: '500',
                            marginBottom: '4px',
                            wordBreak: 'break-all'
                          }}>
                            {message.fileName}
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                          }}>
                            <div style={{ 
                              fontSize: '11px', 
                              color: '#999',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <span>{formatTime(message.timestamp)}</span>
                              {message.views && (
                                <>
                                  <span>•</span>
                                  <span>{message.views} views</span>
                                </>
                              )}
                            </div>
                            <button
                              onClick={() => handleDownload(message.fileName!)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#0088cc',
                                cursor: 'pointer',
                                padding: '4px'
                              }}
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {message.type === 'text' && (
                      <div style={{
                        maxWidth: '70%',
                        marginLeft: message.isOwn ? 'auto' : '0',
                        background: message.isOwn ? '#DCF8C6' : 'white',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ color: '#333', fontSize: '14px' }}>
                          {message.content}
                        </div>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#999', 
                          textAlign: 'right', 
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '4px'
                        }}>
                          <span>{formatTime(message.timestamp)}</span>
                          {message.isOwn && (
                            <CheckCheck size={12} style={{ color: '#0088cc' }} />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div style={{
              padding: '16px',
              background: '#17212B',
              borderTop: '1px solid #0F1419',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <button style={{
                background: 'transparent',
                border: 'none',
                color: '#8BB3D9',
                cursor: 'pointer',
                padding: '8px'
              }}>
                <Paperclip size={20} />
              </button>

              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Write a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 16px',
                    background: '#0F1419',
                    border: 'none',
                    borderRadius: '24px',
                    color: 'white',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#8BB3D9',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <Smile size={20} />
                </button>
              </div>

              {newMessage.trim() ? (
                <button
                  onClick={handleSendMessage}
                  style={{
                    background: '#0088cc',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Send size={20} />
                </button>
              ) : (
                <button style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#8BB3D9',
                  cursor: 'pointer',
                  padding: '8px'
                }}>
                  <Mic size={20} />
                </button>
              )}
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #8BC34A 0%, #4CAF50 100%)',
            color: 'white',
            fontSize: '18px'
          }}>
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
        