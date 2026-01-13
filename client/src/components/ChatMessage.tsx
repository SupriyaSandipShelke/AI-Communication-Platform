import { useState, useRef, useEffect } from 'react';
import { 
  Reply, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Forward, 
  Star, 
  Copy,
  Download,
  Volume2,
  Play,
  Pause,
  Phone,
  Video,
  Check,
  CheckCheck
} from 'lucide-react';
import '../styles/chatMessage.css';

interface ChatMessageProps {
  content: string;
  sender: string;
  timestamp: Date;
  isSent: boolean;
  isRead?: boolean;
  priority?: 'high' | 'medium' | 'low';
  status?: 'sent' | 'delivered' | 'read';
  id?: string;
  isEdited?: boolean;
  messageType?: 'text' | 'image' | 'voice' | 'document' | 'call';
  mediaUrl?: string;
  duration?: number;
  reactions?: { emoji: string; users: string[] }[];
  replyTo?: { id: string; content: string; sender: string };
  isStarred?: boolean;
  onReply?: () => void;
  onReact?: (emoji: string) => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onForward?: () => void;
  onStar?: () => void;
  onCopy?: () => void;
  onDownload?: () => void;
}

export default function ChatMessage({
  content,
  sender,
  timestamp,
  isSent,
  isRead,
  priority,
  status,
  id,
  isEdited = false,
  messageType = 'text',
  mediaUrl,
  duration,
  reactions = [],
  replyTo,
  isStarred = false,
  onReply,
  onReact,
  onDelete,
  onEdit,
  onForward,
  onStar,
  onCopy,
  onDownload,
}: ChatMessageProps) {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥'];

  const handleLongPressStart = () => {
    const timer = setTimeout(() => {
      setShowActions(true);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handlePlayVoice = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'sent':
        return <Check size={16} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={16} className="text-gray-400" />;
      case 'read':
        return <CheckCheck size={16} className="text-blue-500" />;
      default:
        return null;
    }
  };

  const renderMessageContent = () => {
    switch (messageType) {
      case 'image':
        return (
          <div className="message-image">
            <img 
              src={mediaUrl} 
              alt="Shared image" 
              className="max-w-xs rounded-lg cursor-pointer"
              onClick={() => window.open(mediaUrl, '_blank')}
            />
            {content && <p className="mt-2">{content}</p>}
          </div>
        );

      case 'voice':
        return (
          <div className="voice-message flex items-center space-x-3 bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
            <button 
              onClick={handlePlayVoice}
              className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <div className="flex-1">
              <div className="voice-waveform h-8 bg-blue-200 dark:bg-blue-800 rounded"></div>
              <p className="text-xs text-gray-500 mt-1">{formatDuration(duration || 0)}</p>
            </div>
            <Volume2 size={16} className="text-gray-400" />
            {mediaUrl && (
              <audio ref={audioRef} src={mediaUrl} onEnded={() => setIsPlaying(false)} />
            )}
          </div>
        );

      case 'document':
        return (
          <div className="document-message flex items-center space-x-3 bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
              📄
            </div>
            <div className="flex-1">
              <p className="font-medium">{content}</p>
              <p className="text-xs text-gray-500">Document</p>
            </div>
            {onDownload && (
              <button 
                onClick={onDownload}
                className="flex-shrink-0 p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                <Download size={16} />
              </button>
            )}
          </div>
        );

      case 'call':
        const isVideoCall = content.includes('video');
        return (
          <div className="call-message flex items-center space-x-3 bg-green-100 dark:bg-green-900 rounded-lg p-3">
            <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
              {isVideoCall ? <Video size={16} /> : <Phone size={16} />}
            </div>
            <div className="flex-1">
              <p className="font-medium">{content}</p>
              {duration && <p className="text-xs text-gray-500">{formatDuration(duration)}</p>}
            </div>
          </div>
        );

      default:
        return <p className="message-text">{content}</p>;
    }
  };

  return (
    <div 
      className={`message-container ${isSent ? 'sent' : 'received'} ${priority === 'high' ? 'high-priority' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onTouchStart={handleLongPressStart}
      onTouchEnd={handleLongPressEnd}
    >
      <div className="message-wrapper">
        {/* Reply indicator */}
        {replyTo && (
          <div className="reply-indicator bg-gray-100 dark:bg-gray-700 rounded-t-lg p-2 border-l-4 border-blue-500">
            <p className="text-xs text-blue-500 font-medium">{replyTo.sender}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{replyTo.content}</p>
          </div>
        )}

        <div className={`message-bubble ${isSent ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'} rounded-lg p-3 shadow-sm`}>
          {/* Sender name for group chats */}
          {!isSent && (
            <p className="sender-name text-xs font-medium text-blue-500 mb-1">{sender}</p>
          )}

          {/* Message content */}
          {renderMessageContent()}

          {/* Message metadata */}
          <div className="message-meta flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <span className="timestamp text-xs opacity-70">
                {formatTime(timestamp)}
              </span>
              {isEdited && (
                <span className="edited-indicator text-xs opacity-70">edited</span>
              )}
              {isStarred && (
                <Star size={12} className="text-yellow-400 fill-current" />
              )}
            </div>
            
            {isSent && (
              <div className="message-status">
                {getStatusIcon()}
              </div>
            )}
          </div>
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div className="reactions flex flex-wrap gap-1 mt-1">
            {reactions.map((reaction, index) => (
              <div 
                key={index}
                className="reaction bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-1 text-xs flex items-center space-x-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                onClick={() => onReact?.(reaction.emoji)}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.users.length}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {showActions && (
          <div className="message-actions absolute top-0 right-0 transform -translate-y-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 flex items-center p-1">
            <button 
              onClick={() => setShowReactions(!showReactions)}
              className="action-btn p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="React"
            >
              😊
            </button>
            {onReply && (
              <button 
                onClick={onReply}
                className="action-btn p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Reply"
              >
                <Reply size={16} />
              </button>
            )}
            {onForward && (
              <button 
                onClick={onForward}
                className="action-btn p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Forward"
              >
                <Forward size={16} />
              </button>
            )}
            {onStar && (
              <button 
                onClick={onStar}
                className="action-btn p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title={isStarred ? "Unstar" : "Star"}
              >
                <Star size={16} className={isStarred ? "text-yellow-400 fill-current" : ""} />
              </button>
            )}
            {onCopy && (
              <button 
                onClick={onCopy}
                className="action-btn p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Copy"
              >
                <Copy size={16} />
              </button>
            )}
            <div className="relative">
              <button 
                className="action-btn p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="More"
              >
                <MoreHorizontal size={16} />
              </button>
              {/* More actions dropdown */}
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1 min-w-32 z-10">
                {isSent && onEdit && (
                  <button 
                    onClick={onEdit}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <Edit size={14} />
                    <span>Edit</span>
                  </button>
                )}
                {onDelete && (
                  <button 
                    onClick={onDelete}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 text-red-500"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reaction picker */}
        {showReactions && (
          <div className="reaction-picker absolute bottom-0 left-0 transform translate-y-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 p-2 flex space-x-1 z-10">
            {reactionEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onReact?.(emoji);
                  setShowReactions(false);
                }}
                className="reaction-emoji p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
