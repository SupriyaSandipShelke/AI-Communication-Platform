import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import CallInterface from '../components/CallInterface';
import EmojiPicker from '../components/EmojiPicker';
import { WebRTCService } from '../services/WebRTCService';
import { 
  Send, 
  Mic, 
  Search, 
  MessageSquare, 
  Phone,
  Video,
  Paperclip,
  Smile,
  MoreVertical,
  UserPlus,
  Users,
  Settings,
  Plus,
  X,
  Check,
  CheckCheck,
  UserX,
  Edit3,
  LogOut,
  Info,
  Image,
  Bell,
  BellOff,
  Timer,
  Palette,
  Trash2,
  Download,
  Star,
  List,
  Flag,
  Camera,
  Upload
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: string;
  senderName?: string;
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
  type?: 'text' | 'image' | 'file' | 'emoji';
  isOwn?: boolean;
}

interface GroupMember {
  id: string;
  username: string;
  isOnline: boolean;
  role: 'admin' | 'member';
  avatar?: string;
  lastSeen?: Date;
}

interface Chat {
  roomId: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isGroup?: boolean;
  members?: GroupMember[];
  memberCount?: number;
  description?: string;
  avatar?: string;
  isAdmin?: boolean;
}

interface User {
  id: string;
  username: string;
  isOnline: boolean;
  avatar?: string;
}

export default function Messages() {
  const location = useLocation();
  const [rooms, setRooms] = useState<Chat[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [showAddUser, setShowAddUser] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  
  // Join groups state
  const [showJoinGroups, setShowJoinGroups] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<any[]>([]);
  
  // Enhanced group chat state
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // Menu and modal states
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showGroupMedia, setShowGroupMedia] = useState(false);
  const [showAddUserToGroup, setShowAddUserToGroup] = useState(false);
  const [showEditGroupProfile, setShowEditGroupProfile] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showProfilePictureUpload, setShowProfilePictureUpload] = useState(false);
  
  // Group settings states
  const [isNotificationMuted, setIsNotificationMuted] = useState(false);
  const [disappearingMessageTime, setDisappearingMessageTime] = useState('off');
  const [chatTheme, setChatTheme] = useState('default');
  const [groupProfilePicture, setGroupProfilePicture] = useState<string | null>(null);
  const [editedGroupName, setEditedGroupName] = useState('');
  const [editedGroupDescription, setEditedGroupDescription] = useState('');
  const [groupBackgroundColor, setGroupBackgroundColor] = useState('#3b82f6');
  const [groupBackgroundImage, setGroupBackgroundImage] = useState<string | null>(null);
  const [showBackgroundOptions, setShowBackgroundOptions] = useState(false);

  // Background color options
  const backgroundColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    '#000000', '#ffffff', '#ff6b6b', '#4ecdc4', '#45b7d1',
    '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f'
  ];

  const backgroundGradients = [
    'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(45deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(45deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(45deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(45deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(45deg, #ffecd2 0%, #fcb69f 100%)'
  ];
  
  // Call-related state
  const [showCallInterface, setShowCallInterface] = useState(false);
  const [currentCall, setCurrentCall] = useState<{
    callId: string;
    callType: 'audio' | 'video';
    isIncoming: boolean;
    callerName: string;
  } | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [webrtcService, setWebrtcService] = useState<WebRTCService | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePictureInputRef = useRef<HTMLInputElement>(null);
  const backgroundImageInputRef = useRef<HTMLInputElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userId = localStorage.getItem('user_id');
    
    console.log('Authentication check - Token:', !!token, 'User ID:', userId);
    
    if (!token || !userId) {
      console.log('No authentication found, redirecting to login');
      window.location.href = '/login';
      return;
    }
    
    console.log('User authenticated, loading data...');
    loadRooms();
    loadAvailableUsers();
    connectWebSocket();

    // Handle navigation from WhatsApp Status
    if (location.state) {
      const { selectedUser, selectedGroup } = location.state as any;
      
      if (selectedUser) {
        // Create or find chat with the selected user
        const userChat: Chat = {
          roomId: `user_${selectedUser.id}`,
          name: selectedUser.username,
          lastMessage: '',
          lastMessageTime: new Date(),
          unreadCount: 0,
          isGroup: false,
          isOnline: true
        };
        setSelectedRoom(userChat);
      } else if (selectedGroup) {
        // Create or find chat with the selected group
        const groupChat: Chat = {
          roomId: selectedGroup.id,
          name: selectedGroup.name,
          lastMessage: '',
          lastMessageTime: new Date(),
          unreadCount: 0,
          isGroup: true,
          isOnline: false
        };
        setSelectedRoom(groupChat);
      }
    }

    return () => {
      if (ws) ws.close();
    };
  }, [location.state]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const connectWebSocket = () => {
    console.log('Connecting to WebSocket...');
    const websocket = new WebSocket('ws://localhost:3001');
    
    websocket.onopen = () => {
      console.log('WebSocket connected successfully');
      
      // Authenticate with the server
      const userId = localStorage.getItem('user_id') || 'anonymous';
      const username = localStorage.getItem('username') || 'Anonymous';
      setCurrentUserId(userId);
      
      console.log('Authenticating WebSocket with userId:', userId, 'username:', username);
      
      websocket.send(JSON.stringify({
        type: 'authenticate',
        userId: userId,
        username: username,
        rooms: rooms.map(room => room.roomId)
      }));
      
      // Initialize WebRTC service
      const webrtc = new WebRTCService(websocket);
      webrtc.setCallbacks({
        onLocalStream: setLocalStream,
        onRemoteStream: setRemoteStream,
        onCallEnd: handleCallEnd,
        onIncomingCall: handleIncomingCall
      });
      setWebrtcService(webrtc);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        switch (data.type) {
          case 'authenticated':
            console.log('WebSocket authenticated successfully');
            break;
            
          case 'new_message':
            console.log('New message received:', data.message);
            const newMessage = {
              id: data.message.id,
              content: data.message.content,
              sender: data.message.sender,
              senderName: data.message.senderName || data.message.sender,
              timestamp: new Date(data.message.timestamp),
              status: data.message.status,
              type: data.message.type || 'text',
              isOwn: data.message.sender === currentUserId
            };
            
            setMessages(prev => [...prev, newMessage]);
            
            // Update room's last message
            setRooms(prev => prev.map(room => 
              room.roomId === data.message.roomId 
                ? { 
                    ...room, 
                    lastMessage: data.message.content,
                    lastMessageTime: data.message.timestamp,
                    unreadCount: selectedRoom?.roomId === room.roomId ? 0 : room.unreadCount + 1
                  }
                : room
            ));
            break;

          case 'user_online':
            console.log('User came online:', data.userId);
            setOnlineUsers(prev => new Set([...prev, data.userId]));
            // Update group members online status
            setGroupMembers(prev => prev.map(member => 
              member.id === data.userId ? { ...member, isOnline: true } : member
            ));
            break;

          case 'user_offline':
            console.log('User went offline:', data.userId);
            setOnlineUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.userId);
              return newSet;
            });
            // Update group members online status
            setGroupMembers(prev => prev.map(member => 
              member.id === data.userId ? { ...member, isOnline: false, lastSeen: new Date() } : member
            ));
            break;

          case 'typing_start':
            console.log('Typing started:', data.userId, 'in room:', data.roomId);
            if (data.roomId === selectedRoom?.roomId && data.userId !== currentUserId) {
              setTypingUsers(prev => new Set([...prev, data.userId]));
              
              // Auto-clear typing after 3 seconds
              setTimeout(() => {
                setTypingUsers(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(data.userId);
                  return newSet;
                });
              }, 3000);
            }
            break;

          case 'typing_stop':
            console.log('Typing stopped:', data.userId, 'in room:', data.roomId);
            if (data.roomId === selectedRoom?.roomId) {
              setTypingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(data.userId);
                return newSet;
              });
            }
            break;

          case 'group_members_updated':
            console.log('Group members updated for group:', data.groupId);
            if (data.groupId === selectedRoom?.roomId) {
              setGroupMembers(data.members);
            }
            break;

          case 'user_joined_group':
            console.log('User joined group:', data.userId, 'group:', data.groupId);
            if (data.groupId === selectedRoom?.roomId) {
              loadGroupMembers(selectedRoom.roomId);
            }
            break;

          case 'user_left_group':
            console.log('User left group:', data.userId, 'group:', data.groupId);
            if (data.groupId === selectedRoom?.roomId) {
              setGroupMembers(prev => prev.filter(member => member.id !== data.userId));
            }
            break;

          case 'incoming_call':
            handleIncomingCall(data.callId, data.callerId, data.callType);
            break;

          case 'group_created':
            console.log('Group created notification received');
            loadRooms();
            break;

          case 'call_accepted':
          case 'call_rejected':
          case 'call_ended':
          case 'webrtc_offer':
          case 'webrtc_answer':
          case 'webrtc_ice_candidate':
            if (webrtcService) {
              webrtcService.handleWebSocketMessage(data);
            }
            break;
            
          default:
            console.log('Unknown WebSocket message type:', data.type);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    websocket.onclose = (event) => {
      console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
      setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        connectWebSocket();
      }, 3000);
    };

    setWs(websocket);
  };

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      window.location.href = '/login';
      return null;
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('username');
      window.location.href = '/login';
      return null;
    }
    
    return response.json();
  };
  
  const loadRooms = async () => {
    try {
      const data = await apiCall('/api/whatsapp/chats');
      
      if (data && data.success) {
        const transformedRooms = data.chats.map((chat: any) => ({
          roomId: chat.id,
          name: chat.name || chat.group_name || chat.contact_name || 'Unknown',
          lastMessage: chat.last_message || 'No messages yet',
          lastMessageTime: chat.last_message_time,
          unreadCount: chat.unread_count || 0,
          isGroup: chat.is_group || false,
          members: chat.member_names ? chat.member_names.split(',') : [],
          memberCount: chat.member_count || 0,
          backgroundColor: chat.background_color || '#3b82f6',
          backgroundImage: chat.background_image || null,
          profilePicture: chat.profile_picture || null,
          description: chat.description || ''
        }));
        
        setRooms(transformedRooms);
        
        if (transformedRooms.length > 0 && !selectedRoom) {
          selectRoom(transformedRooms[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const data = await apiCall('/api/auth/users');
      if (data && data.success) {
        setAvailableUsers(data.users);
      } else {
        // Fallback mock users for demo
        const mockUsers: User[] = [
          { id: 'user1', username: 'john.doe@example.com', isOnline: true },
          { id: 'user2', username: 'jane.smith@example.com', isOnline: false },
          { id: 'user3', username: 'bob.johnson@example.com', isOnline: true },
          { id: 'user4', username: 'alice.brown@example.com', isOnline: false },
          { id: 'user5', username: 'charlie.wilson@example.com', isOnline: true }
        ];
        setAvailableUsers(mockUsers);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      // Fallback mock users for demo
      const mockUsers: User[] = [
        { id: 'user1', username: 'john.doe@example.com', isOnline: true },
        { id: 'user2', username: 'jane.smith@example.com', isOnline: false },
        { id: 'user3', username: 'bob.johnson@example.com', isOnline: true },
        { id: 'user4', username: 'alice.brown@example.com', isOnline: false },
        { id: 'user5', username: 'charlie.wilson@example.com', isOnline: true }
      ];
      setAvailableUsers(mockUsers);
    }
  };

  const loadAvailableGroups = async () => {
    try {
      const data = await apiCall('/api/whatsapp/groups/available');
      if (data && data.success) {
        setAvailableGroups(data.groups);
      } else {
        setAvailableGroups([]);
      }
    } catch (error) {
      console.error('Failed to load available groups:', error);
      setAvailableGroups([]);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    try {
      console.log('Loading group members for:', groupId);
      const data = await apiCall(`/api/whatsapp/groups/${groupId}/members`);
      console.log('Group members API response:', data);
      
      if (data && data.success) {
        const members = data.members.map((member: any) => ({
          id: member.user_id || member.id,
          username: member.username || member.name,
          isOnline: onlineUsers.has(member.user_id || member.id),
          role: member.role || 'member',
          avatar: member.avatar,
          lastSeen: member.last_seen ? new Date(member.last_seen) : undefined
        }));
        console.log('Transformed group members:', members);
        setGroupMembers(members);
      } else {
        console.error('Failed to load group members:', data);
        setGroupMembers([]);
      }
    } catch (error) {
      console.error('Failed to load group members:', error);
      setGroupMembers([]);
    }
  };

  const selectRoom = async (room: Chat) => {
    console.log('Selecting room:', room);
    setSelectedRoom(room);
    setTypingUsers(new Set()); // Clear typing indicators when switching rooms
    
    let actualRoomId = room.roomId;
    
    // Handle individual user chats
    if (room.roomId.startsWith('user_')) {
      // For individual chats, we'll use the user_ format for WebSocket
      // but the API will handle creating the actual chat
      actualRoomId = room.roomId;
    }
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'join_room',
        roomId: actualRoomId
      }));
    }
    
    try {
      console.log('Loading messages for room:', actualRoomId);
      const data = await apiCall(`/api/whatsapp/chat/${actualRoomId}/messages?limit=50`);
      console.log('Messages API response:', data);
      
      if (data && data.success) {
        const transformedMessages = data.messages.map((msg: any) => {
          console.log('Processing message:', msg);
          return {
            id: msg.id,
            content: msg.content,
            sender: msg.sender,
            senderName: msg.senderName || msg.sender,
            timestamp: new Date(msg.timestamp),
            status: msg.status || 'sent',
            type: msg.type || 'text',
            isOwn: msg.sender === currentUserId
          };
        });
        console.log('Transformed messages:', transformedMessages);
        setMessages(transformedMessages);
        
        // Update the room ID if it was created (for individual chats)
        if (data.chatId && data.chatId !== room.roomId) {
          setSelectedRoom(prev => prev ? { ...prev, roomId: data.chatId } : null);
        }
      } else {
        console.error('Failed to load messages:', data);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }

    // Load group members if it's a group
    if (room.isGroup) {
      console.log('Loading group members for:', room.roomId);
      await loadGroupMembers(room.roomId);
    } else {
      // Clear group members for individual chats
      setGroupMembers([]);
    }

    if (room.unreadCount > 0) {
      await apiCall(`/api/whatsapp/chat/${actualRoomId}/read`, { method: 'POST' });
      
      setRooms(prev => prev.map(r => 
        r.roomId === room.roomId 
          ? { ...r, unreadCount: 0 }
          : r
      ));
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !ws) return;

    const userId = localStorage.getItem('user_id') || 'anonymous';
    let actualRoomId = selectedRoom.roomId;
    
    // For individual chats, determine if we need to create a chat
    const isIndividualChat = !selectedRoom.isGroup;
    
    const messageData = {
      type: 'send_message',
      roomId: actualRoomId,
      content: newMessage,
      sender: userId,
      senderName: localStorage.getItem('username') || 'You',
      isGroup: selectedRoom.isGroup || false,
      timestamp: new Date().toISOString()
    };

    console.log('Sending message:', messageData);

    // Add message to UI immediately (optimistic update)
    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      content: newMessage,
      sender: userId,
      senderName: 'You',
      timestamp: new Date(),
      status: 'sending',
      type: 'text',
      isOwn: true
    };
    
    setMessages(prev => [...prev, tempMessage]);
    const messageContent = newMessage;
    setNewMessage('');

    // Stop typing indicator
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'typing_stop',
        roomId: actualRoomId,
        userId: userId,
        isGroup: selectedRoom.isGroup
      }));
    }

    // Send through WebSocket for real-time delivery
    ws.send(JSON.stringify(messageData));

    // Also send through API for persistence
    try {
      console.log('Sending message via API to:', `/api/whatsapp/chat/${actualRoomId}/send`);
      const response = await apiCall(`/api/whatsapp/chat/${actualRoomId}/send`, {
        method: 'POST',
        body: JSON.stringify({
          content: messageContent,
          isGroup: selectedRoom.isGroup || false,
          type: 'text'
        })
      });

      console.log('Message API response:', response);

      if (response && response.success) {
        // Update the temporary message with real ID and status
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, id: response.messageId, status: 'sent' }
            : msg
        ));
        
        // Update room ID if it was created (for individual chats)
        if (response.chatId && response.chatId !== selectedRoom.roomId) {
          setSelectedRoom(prev => prev ? { ...prev, roomId: response.chatId } : null);
          
          // Update the room in the rooms list
          setRooms(prev => prev.map(room => 
            room.roomId === selectedRoom.roomId 
              ? { ...room, roomId: response.chatId, lastMessage: messageContent, lastMessageTime: new Date().toISOString() }
              : room
          ));
        } else {
          // Update last message for existing rooms
          setRooms(prev => prev.map(room => 
            room.roomId === selectedRoom.roomId 
              ? { ...room, lastMessage: messageContent, lastMessageTime: new Date().toISOString() }
              : room
          ));
        }
      } else {
        console.error('Message API failed:', response);
        // Mark message as failed
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id 
            ? { ...msg, status: 'failed' }
            : msg
        ));
      }
    } catch (error) {
      console.error('Failed to send message via API:', error);
      // Mark message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessage.id 
          ? { ...msg, status: 'failed' }
          : msg
      ));
    }
  };

  // Typing indicator functions
  const handleTypingStart = () => {
    if (!selectedRoom || !ws || ws.readyState !== WebSocket.OPEN) return;
    
    console.log('Starting typing indicator for room:', selectedRoom.roomId);
    ws.send(JSON.stringify({
      type: 'typing_start',
      roomId: selectedRoom.roomId,
      userId: currentUserId,
      isGroup: selectedRoom.isGroup
    }));
  };

  const handleTypingStop = () => {
    if (!selectedRoom || !ws || ws.readyState !== WebSocket.OPEN) return;
    
    console.log('Stopping typing indicator for room:', selectedRoom.roomId);
    ws.send(JSON.stringify({
      type: 'typing_stop',
      roomId: selectedRoom.roomId,
      userId: currentUserId,
      isGroup: selectedRoom.isGroup
    }));
  };

  // Debounced typing handler
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleInputChange = (value: string) => {
    setNewMessage(value);
    
    if (value.trim() && selectedRoom) {
      handleTypingStart();
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        handleTypingStop();
      }, 2000);
    } else {
      handleTypingStop();
    }
  };

  const handleVoiceCall = async () => {
    if (!selectedRoom || !webrtcService) return;
    
    try {
      const callId = await webrtcService.initiateCall(selectedRoom.roomId, 'audio');
      setCurrentCall({
        callId,
        callType: 'audio',
        isIncoming: false,
        callerName: selectedRoom.name
      });
      setShowCallInterface(true);
    } catch (error) {
      console.error('Failed to initiate voice call:', error);
      alert('Failed to start voice call. Please check your microphone permissions.');
    }
  };

  const handleVideoCall = async () => {
    if (!selectedRoom || !webrtcService) return;
    
    try {
      const callId = await webrtcService.initiateCall(selectedRoom.roomId, 'video');
      setCurrentCall({
        callId,
        callType: 'video',
        isIncoming: false,
        callerName: selectedRoom.name
      });
      setShowCallInterface(true);
    } catch (error) {
      console.error('Failed to initiate video call:', error);
      alert('Failed to start video call. Please check your camera and microphone permissions.');
    }
  };

  const handleIncomingCall = (callId: string, callerId: string, callType: 'audio' | 'video') => {
    // Find caller name from rooms or users
    const caller = rooms.find(room => room.roomId === callerId) || 
                  availableUsers.find(user => user.id === callerId);
    
    setCurrentCall({
      callId,
      callType,
      isIncoming: true,
      callerName: caller?.name || caller?.username || 'Unknown'
    });
    setShowCallInterface(true);
  };

  const handleAcceptCall = async () => {
    if (!currentCall || !webrtcService) return;
    
    try {
      await webrtcService.acceptCall(currentCall.callId);
    } catch (error) {
      console.error('Failed to accept call:', error);
      alert('Failed to accept call. Please check your permissions.');
    }
  };

  const handleRejectCall = () => {
    if (!currentCall || !webrtcService) return;
    
    webrtcService.rejectCall(currentCall.callId);
    handleCallEnd();
  };

  const handleEndCall = () => {
    if (webrtcService) {
      webrtcService.endCall();
    }
    handleCallEnd();
  };

  const handleCallEnd = () => {
    setShowCallInterface(false);
    setCurrentCall(null);
    setLocalStream(null);
    setRemoteStream(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (selectedRoom && ws) {
      ws.send(JSON.stringify({
        type: 'send_message',
        roomId: selectedRoom.roomId,
        content: `📎 ${file.name}`,
        sender: localStorage.getItem('user_id')
      }));
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    await sendMessage();
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      alert('Please enter a group name and select at least one member');
      return;
    }

    try {
      console.log('Creating group:', { name: groupName, participants: selectedUsers });
      
      const data = await apiCall('/api/whatsapp/groups/create', {
        method: 'POST',
        body: JSON.stringify({
          name: groupName,
          participants: selectedUsers
        })
      });
      
      console.log('Group creation response:', data);
      
      if (data && data.success) {
        setShowCreateGroup(false);
        setGroupName('');
        setSelectedUsers([]);
        
        // Reload rooms to show the new group
        await loadRooms();
        alert(`Group "${groupName}" created successfully!`);
      } else {
        console.error('Group creation failed:', data);
        alert('Failed to create group: ' + (data?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Failed to create group. Please try again.');
    }
  };

  const addUser = async () => {
    if (!newUserEmail.trim()) return;

    try {
      // In a real app, this would send an invitation or add user to system
      const response = await apiCall('/api/auth/invite', {
        method: 'POST',
        body: JSON.stringify({
          email: newUserEmail,
          invitedBy: localStorage.getItem('user_id')
        })
      });
      
      if (response && response.success) {
        // Add to available users list for immediate use
        const newUser: User = {
          id: `user_${Date.now()}`,
          username: newUserEmail,
          isOnline: false
        };
        
        setAvailableUsers(prev => [...prev, newUser]);
        setNewUserEmail('');
        setShowAddUser(false);
        
        // Show success message
        alert('User invitation sent successfully!');
      } else {
        // Fallback for demo mode
        const newUser: User = {
          id: `user_${Date.now()}`,
          username: newUserEmail,
          isOnline: false
        };
        
        setAvailableUsers(prev => [...prev, newUser]);
        setNewUserEmail('');
        setShowAddUser(false);
        
        alert('User added to your contacts!');
      }
    } catch (error) {
      console.error('Failed to add user:', error);
      
      // Fallback for demo mode - still add the user locally
      const newUser: User = {
        id: `user_${Date.now()}`,
        username: newUserEmail,
        isOnline: false
      };
      
      setAvailableUsers(prev => [...prev, newUser]);
      setNewUserEmail('');
      setShowAddUser(false);
      
      alert('User added to your contacts!');
    }
  };

  const joinGroup = async (groupId: string) => {
    try {
      const response = await apiCall(`/api/whatsapp/groups/${groupId}/join`, {
        method: 'POST'
      });
      
      if (response && response.success) {
        setShowJoinGroups(false);
        loadRooms(); // Refresh rooms to show the newly joined group
        alert('Successfully joined the group!');
      } else {
        alert('Failed to join group: ' + (response?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to join group:', error);
      alert('Failed to join group. Please try again.');
    }
  };

  // Options menu handlers
  const handleAddUserToGroup = async (userId: string) => {
    if (!selectedRoom || !selectedRoom.isGroup) return;
    
    try {
      const response = await apiCall(`/api/whatsapp/groups/${selectedRoom.roomId}/members/add`, {
        method: 'POST',
        body: JSON.stringify({ memberId: userId })
      });
      
      if (response && response.success) {
        loadRooms(); // Refresh to get updated member list
        setShowAddUserToGroup(false);
        alert('User added to group successfully!');
      } else {
        alert('Failed to add user to group: ' + (response?.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to add user to group:', error);
      alert('Failed to add user to group. Please try again.');
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (confirm('Are you sure you want to block this user?')) {
      try {
        const response = await apiCall('/api/auth/block-user', {
          method: 'POST',
          body: JSON.stringify({ userId })
        });
        
        if (response && response.success) {
          alert('User blocked successfully');
          loadRooms();
        } else {
          alert('Failed to block user');
        }
      } catch (error) {
        console.error('Failed to block user:', error);
        alert('Failed to block user. Please try again.');
      }
    }
  };

  const handleEditGroupProfile = async () => {
    if (!selectedRoom || !selectedRoom.isGroup) return;
    
    try {
      const formData = new FormData();
      formData.append('name', editedGroupName);
      formData.append('description', editedGroupDescription);
      formData.append('backgroundColor', groupBackgroundColor);
      
      if (groupProfilePicture && groupProfilePicture.startsWith('data:')) {
        // Convert base64 to blob
        const response = await fetch(groupProfilePicture);
        const blob = await response.blob();
        formData.append('profilePicture', blob, 'profile.jpg');
      }
      
      if (groupBackgroundImage && groupBackgroundImage.startsWith('data:')) {
        // Convert base64 to blob
        const response = await fetch(groupBackgroundImage);
        const blob = await response.blob();
        formData.append('backgroundImage', blob, 'background.jpg');
      }
      
      const response = await fetch(`/api/whatsapp/groups/${selectedRoom.roomId}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        loadRooms();
        setShowEditGroupProfile(false);
        alert('Group profile updated successfully!');
      } else {
        alert('Failed to update group profile: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to update group profile:', error);
      alert('Failed to update group profile. Please try again.');
    }
  };

  const handleExitGroup = async () => {
    if (!selectedRoom || !selectedRoom.isGroup) return;
    
    if (confirm('Are you sure you want to exit this group?')) {
      try {
        const response = await apiCall(`/api/whatsapp/groups/${selectedRoom.roomId}/exit`, {
          method: 'POST'
        });
        
        if (response && response.success) {
          loadRooms();
          setSelectedRoom(null);
          alert('You have left the group');
        } else {
          alert('Failed to exit group: ' + (response?.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Failed to exit group:', error);
        alert('Failed to exit group. Please try again.');
      }
    }
  };

  const handleMuteNotifications = async () => {
    try {
      const response = await apiCall(`/api/whatsapp/chat/${selectedRoom?.roomId}/mute`, {
        method: 'POST',
        body: JSON.stringify({ muted: !isNotificationMuted })
      });
      
      if (response && response.success) {
        setIsNotificationMuted(!isNotificationMuted);
        alert(isNotificationMuted ? 'Notifications unmuted' : 'Notifications muted');
      }
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  };

  const handleDisappearingMessages = async (time: string) => {
    try {
      const response = await apiCall(`/api/whatsapp/chat/${selectedRoom?.roomId}/disappearing`, {
        method: 'POST',
        body: JSON.stringify({ disappearingTime: time })
      });
      
      if (response && response.success) {
        setDisappearingMessageTime(time);
        alert(`Disappearing messages set to ${time}`);
      }
    } catch (error) {
      console.error('Failed to set disappearing messages:', error);
    }
  };

  const handleClearChat = async () => {
    if (confirm('Are you sure you want to clear this chat? This action cannot be undone.')) {
      try {
        const response = await apiCall(`/api/whatsapp/chat/${selectedRoom?.roomId}/clear`, {
          method: 'DELETE'
        });
        
        if (response && response.success) {
          setMessages([]);
          alert('Chat cleared successfully');
        }
      } catch (error) {
        console.error('Failed to clear chat:', error);
        alert('Failed to clear chat. Please try again.');
      }
    }
  };

  const handleExportChat = async () => {
    try {
      const response = await apiCall(`/api/whatsapp/chat/${selectedRoom?.roomId}/export`);
      
      if (response && response.success) {
        const blob = new Blob([response.data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedRoom?.name}_chat_export.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export chat:', error);
      alert('Failed to export chat. Please try again.');
    }
  };

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setGroupProfilePicture(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setGroupBackgroundImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredRooms = rooms.filter(room => {
    if (searchQuery) {
      return room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             room.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <Layout>
      <div style={{ display: 'flex', height: '100vh' }}>
        {/* Rooms Sidebar */}
        <div style={{
          width: '300px',
          background: 'var(--bg-primary)',
          borderRight: '1px solid var(--border-medium)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-medium)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                Conversations
              </h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowAddUser(true)}
                  style={{
                    background: '#10b981',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                  title="Add new user"
                >
                  <UserPlus size={14} />
                  Add User
                </button>
                <button
                  onClick={() => {
                    setShowJoinGroups(true);
                    loadAvailableGroups();
                  }}
                  style={{
                    background: '#8b5cf6',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                  title="Join existing groups"
                >
                  <Users size={14} />
                  Join Groups
                </button>
                <button
                  onClick={() => setShowCreateGroup(true)}
                  style={{
                    background: '#3b82f6',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                  title="Create new group"
                >
                  <Plus size={14} />
                  New Group
                </button>
              </div>
            </div>
            
            <div style={{ position: 'relative' }}>
              <Search 
                size={16} 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: 'var(--text-secondary)' 
                }} 
              />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredRooms.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px', 
                color: 'var(--text-secondary)' 
              }}>
                <MessageSquare size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                <h3 style={{ fontSize: '16px', marginBottom: '8px', color: 'var(--text-primary)' }}>No conversations yet</h3>
                <p style={{ fontSize: '14px', marginBottom: '16px' }}>Start by creating a group or joining existing ones</p>
                <button
                  onClick={() => {
                    setShowJoinGroups(true);
                    loadAvailableGroups();
                  }}
                  style={{
                    padding: '8px 16px',
                    background: 'var(--accent-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Join Groups
                </button>
              </div>
            ) : (
              filteredRooms.map((room) => (
              <div
                key={room.roomId}
                onClick={() => selectRoom(room)}
                style={{
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  background: selectedRoom?.roomId === room.roomId ? 'var(--bg-secondary)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: room.isGroup ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  {room.isGroup ? <Users size={18} /> : room.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <h3 style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: 'var(--text-primary)',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {room.name}
                      {room.isGroup && <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>({room.members?.length || 0})</span>}
                    </h3>
                    <span style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-secondary)',
                      flexShrink: 0,
                      marginLeft: '8px'
                    }}>
                      {room.lastMessageTime ? new Date(room.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-secondary)', 
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}>
                      {room.lastMessage || 'No messages yet'}
                    </p>
                    {room.unreadCount > 0 && (
                      <span style={{
                        background: 'var(--accent-primary)',
                        color: 'white',
                        borderRadius: '10px',
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        marginLeft: '8px',
                        minWidth: '16px',
                        textAlign: 'center'
                      }}>
                        {room.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedRoom ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Chat Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-medium)',
              background: 'var(--bg-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  cursor: selectedRoom.isGroup ? 'pointer' : 'default',
                  flex: 1,
                  minWidth: 0
                }}
                onClick={() => selectedRoom.isGroup && setShowGroupInfo(true)}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: selectedRoom.isGroup ? '#10b981' : '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  overflow: 'hidden',
                  backgroundImage: selectedRoom.avatar ? `url(${selectedRoom.avatar})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  flexShrink: 0
                }}>
                  {!selectedRoom.avatar && (selectedRoom.isGroup ? <Users size={20} /> : selectedRoom.name.charAt(0).toUpperCase())}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: 'var(--text-primary)', 
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {selectedRoom.name}
                  </h3>
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-secondary)', 
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {selectedRoom.isGroup ? (
                      <>
                        <span>{groupMembers.length} members</span>
                        {typingUsers.size > 0 && (
                          <span style={{ color: '#10b981', fontStyle: 'italic' }}>
                            {Array.from(typingUsers).slice(0, 2).map(userId => {
                              const member = groupMembers.find(m => m.id === userId);
                              return member?.username || 'Someone';
                            }).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        {onlineUsers.has(selectedRoom.roomId) ? (
                          <span style={{ color: '#10b981' }}>Online</span>
                        ) : (
                          <span>Last seen recently</span>
                        )}
                        {typingUsers.size > 0 && (
                          <span style={{ color: '#10b981', fontStyle: 'italic' }}>typing...</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleVoiceCall}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ':hover': { background: 'var(--bg-secondary)' }
                  }}
                  title="Voice call"
                >
                  <Phone size={18} />
                </button>
                <button
                  onClick={handleVideoCall}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ':hover': { background: 'var(--bg-secondary)' }
                  }}
                  title="Video call"
                >
                  <Video size={18} />
                </button>
                <div style={{ position: 'relative' }} ref={optionsMenuRef}>
                  <button
                    onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="More options"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* Options Dropdown Menu */}
                  {showOptionsMenu && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      minWidth: '200px',
                      zIndex: 1000,
                      marginTop: '4px'
                    }}>
                      {selectedRoom?.isGroup ? (
                        // Group options
                        <>
                          <button
                            onClick={() => {
                              setShowAddUserToGroup(true);
                              setShowOptionsMenu(false);
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              fontSize: '14px',
                              textAlign: 'left'
                            }}
                          >
                            <UserPlus size={16} />
                            Add User
                          </button>
                          
                          <button
                            onClick={() => {
                              setShowEditGroupProfile(true);
                              setEditedGroupName(selectedRoom.name);
                              setEditedGroupDescription(selectedRoom.description || '');
                              setGroupBackgroundColor(selectedRoom.backgroundColor || '#3b82f6');
                              setGroupBackgroundImage(selectedRoom.backgroundImage || null);
                              setGroupProfilePicture(selectedRoom.profilePicture || null);
                              setShowOptionsMenu(false);
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              fontSize: '14px',
                              textAlign: 'left'
                            }}
                          >
                            <Edit3 size={16} />
                            Edit Group Profile
                          </button>
                          
                          <button
                            onClick={() => {
                              setShowGroupInfo(true);
                              setShowOptionsMenu(false);
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              fontSize: '14px',
                              textAlign: 'left'
                            }}
                          >
                            <Info size={16} />
                            Group Info
                          </button>
                          
                          <button
                            onClick={() => {
                              setShowGroupMedia(true);
                              setShowOptionsMenu(false);
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              fontSize: '14px',
                              textAlign: 'left'
                            }}
                          >
                            <Image size={16} />
                            Group Media
                          </button>
                          
                          <button
                            onClick={() => {
                              handleExitGroup();
                              setShowOptionsMenu(false);
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: 'none',
                              background: 'transparent',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              fontSize: '14px',
                              textAlign: 'left'
                            }}
                          >
                            <LogOut size={16} />
                            Exit Group
                          </button>
                        </>
                      ) : (
                        // Individual chat options
                        <>
                          <button
                            onClick={() => {
                              handleBlockUser(selectedRoom?.roomId || '');
                              setShowOptionsMenu(false);
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: 'none',
                              background: 'transparent',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              fontSize: '14px',
                              textAlign: 'left'
                            }}
                          >
                            <UserX size={16} />
                            Block User
                          </button>
                        </>
                      )}
                      
                      {/* Common options */}
                      <div style={{ borderTop: '1px solid var(--border-light)', marginTop: '4px', paddingTop: '4px' }}>
                        <button
                          onClick={() => {
                            handleMuteNotifications();
                            setShowOptionsMenu(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '14px',
                            textAlign: 'left'
                          }}
                        >
                          {isNotificationMuted ? <Bell size={16} /> : <BellOff size={16} />}
                          {isNotificationMuted ? 'Unmute Notifications' : 'Mute Notifications'}
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowOptionsMenu(false);
                            // Show disappearing messages submenu
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '14px',
                            textAlign: 'left'
                          }}
                        >
                          <Timer size={16} />
                          Disappearing Messages
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowOptionsMenu(false);
                            // Show theme selector
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '14px',
                            textAlign: 'left'
                          }}
                        >
                          <Palette size={16} />
                          Chat Theme
                        </button>
                      </div>
                      
                      {/* More submenu */}
                      <div style={{ borderTop: '1px solid var(--border-light)', marginTop: '4px', paddingTop: '4px' }}>
                        <button
                          onClick={() => {
                            handleClearChat();
                            setShowOptionsMenu(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '14px',
                            textAlign: 'left'
                          }}
                        >
                          <Trash2 size={16} />
                          Clear Chat
                        </button>
                        
                        <button
                          onClick={() => {
                            handleExportChat();
                            setShowOptionsMenu(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '14px',
                            textAlign: 'left'
                          }}
                        >
                          <Download size={16} />
                          Export Chat
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowOptionsMenu(false);
                            // Add shortcut functionality
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '14px',
                            textAlign: 'left'
                          }}
                        >
                          <Star size={16} />
                          Add Shortcut
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowOptionsMenu(false);
                            // Add to list functionality
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: 'none',
                            background: 'transparent',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '14px',
                            textAlign: 'left'
                          }}
                        >
                          <List size={16} />
                          Add to List
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowOptionsMenu(false);
                            alert('Report functionality would be implemented here');
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            border: 'none',
                            background: 'transparent',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '14px',
                            textAlign: 'left'
                          }}
                        >
                          <Flag size={16} />
                          Report
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              background: selectedRoom?.isGroup && selectedRoom.backgroundImage 
                ? `url(${selectedRoom.backgroundImage})` 
                : selectedRoom?.isGroup && selectedRoom.backgroundColor 
                  ? selectedRoom.backgroundColor 
                  : 'var(--bg-secondary)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed'
            }}>
              {messages.map((message, index) => {
                const isOwnMessage = message.isOwn || message.sender === currentUserId || message.sender === 'You';
                const showSenderInfo = selectedRoom?.isGroup && !isOwnMessage && 
                  (index === 0 || messages[index - 1].sender !== message.sender);
                const member = groupMembers.find(m => m.id === message.sender);
                
                return (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                      marginBottom: '8px',
                      alignItems: 'flex-end',
                      gap: '8px'
                    }}
                  >
                    {/* Avatar for group messages (left side only) */}
                    {selectedRoom?.isGroup && !isOwnMessage && (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: member?.avatar ? `url(${member.avatar})` : '#3b82f6',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        flexShrink: 0,
                        marginBottom: showSenderInfo ? '0' : '24px'
                      }}>
                        {!member?.avatar && (message.senderName || message.sender).charAt(0).toUpperCase()}
                      </div>
                    )}
                    
                    <div
                      style={{
                        maxWidth: '70%',
                        padding: '8px 12px',
                        borderRadius: isOwnMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: isOwnMessage ? '#dcf8c6' : 'white',
                        color: isOwnMessage ? '#000' : '#000',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                        position: 'relative'
                      }}
                    >
                      {/* Sender name for group messages */}
                      {showSenderInfo && (
                        <div style={{ 
                          fontSize: '12px', 
                          fontWeight: '600', 
                          marginBottom: '4px',
                          color: '#3b82f6'
                        }}>
                          {message.senderName || member?.username || message.sender}
                        </div>
                      )}
                      
                      {/* Message content */}
                      <div style={{ 
                        fontSize: '14px', 
                        lineHeight: '1.4',
                        wordWrap: 'break-word'
                      }}>
                        {message.content}
                      </div>
                      
                      {/* Message timestamp and status */}
                      <div style={{ 
                        fontSize: '11px', 
                        marginTop: '4px',
                        opacity: 0.7,
                        textAlign: 'right',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '4px'
                      }}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isOwnMessage && message.status && (
                          <span>
                            {message.status === 'sent' && <Check size={12} color="#999" />}
                            {message.status === 'delivered' && <CheckCheck size={12} color="#999" />}
                            {message.status === 'read' && <CheckCheck size={12} color="#4ade80" />}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid var(--border-medium)',
              background: 'var(--bg-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Attach file"
              >
                <Paperclip size={18} />
              </button>
              
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '24px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                
                {/* Typing indicator */}
                {typingUsers.size > 0 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '16px',
                    marginBottom: '4px',
                    background: 'var(--bg-primary)',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    {Array.from(typingUsers).slice(0, 3).map(userId => {
                      const member = groupMembers.find(m => m.id === userId);
                      return member?.username || 'Someone';
                    }).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                  </div>
                )}
              </div>

              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Emoji"
                >
                  <Smile size={18} />
                </button>
                
                {showEmojiPicker && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    right: 0,
                    marginBottom: '8px',
                    zIndex: 1000
                  }}>
                    <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                  </div>
                )}
              </div>

              {newMessage.trim() ? (
                <button
                  onClick={handleSendMessage}
                  style={{
                    background: 'var(--accent-primary)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '10px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Send message"
                >
                  <Send size={16} />
                </button>
              ) : (
                <button
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '10px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Voice message"
                >
                  <Mic size={16} />
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
              />
            </div>
          </div>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-secondary)'
          }}>
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              <MessageSquare size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                Select a conversation
              </h3>
              <p style={{ fontSize: '14px' }}>
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
                Add New User
              </h2>
              <button
                onClick={() => setShowAddUser(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                Email Address
              </label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="Enter user's email address"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  background: '#f9fafb',
                  color: '#111827',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', margin: '4px 0 0 0' }}>
                The user will receive an invitation to join the platform
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowAddUser(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: '#f9fafb',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={addUser}
                disabled={!newUserEmail.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: newUserEmail.trim() ? '#10b981' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: newUserEmail.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
                Create New Group
              </h2>
              <button
                onClick={() => setShowCreateGroup(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter group name"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  background: '#f9fafb',
                  color: '#111827',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                Select Members ({selectedUsers.length} selected)
              </label>
              <div style={{ 
                maxHeight: '200px', 
                overflow: 'auto', 
                border: '2px solid #d1d5db', 
                borderRadius: '8px',
                background: '#f9fafb'
              }}>
                {availableUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setSelectedUsers(prev => 
                        prev.includes(user.id) 
                          ? prev.filter(id => id !== user.id)
                          : [...prev, user.id]
                      );
                    }}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: selectedUsers.includes(user.id) ? '#3b82f6' : 'transparent',
                      color: selectedUsers.includes(user.id) ? 'white' : '#374151'
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: selectedUsers.includes(user.id) ? 'rgba(255,255,255,0.2)' : '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500' }}>{user.username}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7 }}>
                        {user.isOnline ? 'Online' : 'Offline'}
                      </div>
                    </div>
                    {selectedUsers.includes(user.id) && <Check size={16} />}
                  </div>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowCreateGroup(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: '#f9fafb',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={createGroup}
                disabled={!groupName.trim() || selectedUsers.length === 0}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: (groupName.trim() && selectedUsers.length > 0) ? '#3b82f6' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (groupName.trim() && selectedUsers.length > 0) ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Groups Modal */}
      {showJoinGroups && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
                Join Available Groups
              </h2>
              <button
                onClick={() => setShowJoinGroups(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            {availableGroups.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px', 
                color: '#6b7280' 
              }}>
                <Users size={48} style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>No groups available</h3>
                <p style={{ fontSize: '14px' }}>There are no groups you can join at the moment.</p>
              </div>
            ) : (
              <div style={{ 
                maxHeight: '400px', 
                overflow: 'auto'
              }}>
                {availableGroups.map((group) => (
                  <div
                    key={group.id}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <Users size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
                        {group.group_name || group.contact_name || 'Unnamed Group'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                        {group.member_count} members
                      </div>
                      {group.member_names && (
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          Members: {group.member_names.split(',').slice(0, 3).join(', ')}
                          {group.member_names.split(',').length > 3 && ` +${group.member_names.split(',').length - 3} more`}
                        </div>
                      )}
                    </div>
                    {group.is_member ? (
                      <span style={{
                        padding: '6px 12px',
                        background: '#10b981',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        Joined
                      </span>
                    ) : (
                      <button
                        onClick={() => joinGroup(group.id)}
                        style={{
                          padding: '8px 16px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        Join
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                onClick={() => setShowJoinGroups(false)}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: '#f9fafb',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call Interface */}
      {showCallInterface && currentCall && (
        <CallInterface
          isOpen={showCallInterface}
          callType={currentCall.callType}
          isIncoming={currentCall.isIncoming}
          callerName={currentCall.callerName}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          onEnd={handleEndCall}
          localStream={localStream}
          remoteStream={remoteStream}
        />
      )}

      {/* Group Info Modal */}
      {showGroupInfo && selectedRoom?.isGroup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
                Group Info
              </h2>
              <button
                onClick={() => setShowGroupInfo(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'var(--accent-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '32px',
                margin: '0 auto 12px',
                backgroundImage: groupProfilePicture ? `url(${groupProfilePicture})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}>
                {!groupProfilePicture && <Users size={32} />}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
                {selectedRoom.name}
              </h3>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                {selectedRoom.members?.length || 0} members
              </p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '12px' }}>
                Members ({groupMembers.length})
              </h4>
              <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                {groupMembers.map((member) => (
                  <div key={member.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 0',
                    borderBottom: '1px solid #f3f4f6'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: member.avatar ? `url(${member.avatar})` : '#3b82f6',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      position: 'relative'
                    }}>
                      {!member.avatar && member.username.charAt(0).toUpperCase()}
                      {/* Online indicator */}
                      {member.isOnline && (
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: '#10b981',
                          border: '2px solid white'
                        }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {member.username}
                        {member.role === 'admin' && (
                          <span style={{
                            fontSize: '10px',
                            background: '#3b82f6',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            fontWeight: '500'
                          }}>
                            Admin
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {member.isOnline ? 'Online' : member.lastSeen ? 
                          `Last seen ${new Date(member.lastSeen).toLocaleString()}` : 
                          'Last seen recently'
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Media Modal */}
      {showGroupMedia && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
                Group Media
              </h2>
              <button
                onClick={() => setShowGroupMedia(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>
              <Image size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>No media files shared in this group yet.</p>
            </div>
          </div>
        </div>
      )}

      {/* Add User to Group Modal */}
      {showAddUserToGroup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
                Add User to Group
              </h2>
              <button
                onClick={() => setShowAddUserToGroup(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                Select Users to Add
              </label>
              <div style={{ 
                maxHeight: '300px', 
                overflow: 'auto', 
                border: '2px solid #d1d5db', 
                borderRadius: '8px',
                background: '#f9fafb'
              }}>
                {availableUsers.filter(user => !selectedRoom?.members?.includes(user.username)).map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleAddUserToGroup(user.id)}
                    style={{
                      padding: '12px',
                      borderBottom: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      ':hover': { background: '#f3f4f6' }
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', color: '#374151' }}>{user.username}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {user.isOnline ? 'Online' : 'Offline'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Profile Modal */}
      {showEditGroupProfile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>
                Edit Group Profile
              </h2>
              <button
                onClick={() => setShowEditGroupProfile(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Profile Picture Section */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: groupBackgroundColor,
                backgroundImage: groupBackgroundImage ? `url(${groupBackgroundImage})` : 
                                groupProfilePicture ? `url(${groupProfilePicture})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '32px',
                margin: '0 auto 12px',
                cursor: 'pointer',
                position: 'relative',
                border: '3px solid white',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
              onClick={() => profilePictureInputRef.current?.click()}
              >
                {!groupProfilePicture && !groupBackgroundImage && <Users size={32} />}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  background: '#3b82f6',
                  borderRadius: '50%',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Camera size={12} color="white" />
                </div>
              </div>
              <input
                ref={profilePictureInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleProfilePictureUpload}
              />
            </div>
            
            {/* Group Name */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                Group Name
              </label>
              <input
                type="text"
                value={editedGroupName}
                onChange={(e) => setEditedGroupName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  background: '#f9fafb',
                  color: '#111827',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            
            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                Description
              </label>
              <textarea
                value={editedGroupDescription}
                onChange={(e) => setEditedGroupDescription(e.target.value)}
                placeholder="Add a group description..."
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  background: '#f9fafb',
                  color: '#111827',
                  fontSize: '14px',
                  outline: 'none',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Background Options */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                  Background Theme
                </label>
                <button
                  onClick={() => setShowBackgroundOptions(!showBackgroundOptions)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    color: '#6b7280',
                    cursor: 'pointer'
                  }}
                >
                  {showBackgroundOptions ? 'Hide Options' : 'Show Options'}
                </button>
              </div>

              {showBackgroundOptions && (
                <div style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px', 
                  padding: '16px',
                  background: '#f9fafb'
                }}>
                  {/* Background Colors */}
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                      Solid Colors
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '6px' }}>
                      {backgroundColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            setGroupBackgroundColor(color);
                            setGroupBackgroundImage(null);
                          }}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: groupBackgroundColor === color ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                            backgroundColor: color,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Gradient Backgrounds */}
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                      Gradients
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      {backgroundGradients.map((gradient, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setGroupBackgroundColor(gradient);
                            setGroupBackgroundImage(null);
                          }}
                          style={{
                            width: '48px',
                            height: '32px',
                            borderRadius: '6px',
                            border: groupBackgroundColor === gradient ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                            background: gradient,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Background Image */}
                  <div>
                    <h4 style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                      Custom Background Image
                    </h4>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => backgroundImageInputRef.current?.click()}
                        style={{
                          padding: '8px 16px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          background: 'white',
                          color: '#374151',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Image size={14} />
                        Upload Image
                      </button>
                      {groupBackgroundImage && (
                        <button
                          onClick={() => setGroupBackgroundImage(null)}
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #ef4444',
                            borderRadius: '6px',
                            background: '#fef2f2',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      ref={backgroundImageInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleBackgroundImageUpload}
                    />
                    {groupBackgroundImage && (
                      <div style={{
                        marginTop: '8px',
                        width: '100%',
                        height: '60px',
                        borderRadius: '6px',
                        backgroundImage: `url(${groupBackgroundImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: '1px solid #e5e7eb'
                      }} />
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowEditGroupProfile(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: '#f9fafb',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleEditGroupProfile}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}