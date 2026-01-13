import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Mic, MicOff, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import '../styles/chatMessage.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  isPlaying?: boolean;
}

interface ConversationContext {
  conversationId?: string;
  userId?: string;
  chatHistory?: Array<{role: 'user'|'assistant'; content: string}>;
}

interface AIChatbotProps {
  userId?: string;
  initialContext?: ConversationContext;
  onMessageSubmit?: (message: string) => void;
}

export default function AIChatbot({ 
  userId, 
  initialContext = {},
  onMessageSubmit 
}: AIChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your AI communication assistant. I can help you with message summaries, priority management, and communication insights. Try asking me about your daily summary or what needs attention!',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(initialContext.conversationId);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      setIsVoiceEnabled(false);
    }

    // Check if browser supports speech synthesis
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
    }
  }, []);

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      setAudioChunks([]);
      recorder.start();
      setIsRecording(true);

      // Auto-stop recording after 30 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        stopVoiceRecording();
      }, 30000);

    } catch (error) {
      console.error('Error starting voice recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      
      // Check if speech recognition is supported
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Speech recognition is not supported in this browser. Please try Chrome or Edge.');
        setIsLoading(false);
        return;
      }
      
      // Convert speech to text using Web Speech API
      const recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        
        // Automatically submit the voice input
        await handleSubmit(null, transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsLoading(false);
        
        let errorMessage = 'Speech recognition failed. Please try again.';
        if (event.error === 'no-speech') {
          errorMessage = 'No speech detected. Please try speaking again.';
        } else if (event.error === 'audio-capture') {
          errorMessage = 'Microphone not accessible. Please check permissions.';
        } else if (event.error === 'not-allowed') {
          errorMessage = 'Microphone permission denied. Please allow microphone access.';
        }
        
        alert(errorMessage);
      };

      recognition.onend = () => {
        setIsLoading(false);
      };

      // Create audio URL for playback (optional)
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Start recognition
      recognition.start();

    } catch (error) {
      console.error('Error processing voice input:', error);
      setIsLoading(false);
      alert('Voice processing failed. Please try typing instead.');
    }
  };

  useEffect(() => {
    if (audioChunks.length > 0 && mediaRecorder?.state === 'inactive') {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      processVoiceInput(audioBlob);
      setAudioChunks([]);
    }
  }, [audioChunks, mediaRecorder?.state]);

  const speakText = (text: string, messageId: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech not supported in this browser');
      return;
    }

    // Stop any current speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;

    utterance.onstart = () => {
      setCurrentPlayingId(messageId);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isPlaying: true }
          : { ...msg, isPlaying: false }
      ));
    };

    utterance.onend = () => {
      setCurrentPlayingId(null);
      setMessages(prev => prev.map(msg => ({ ...msg, isPlaying: false })));
    };

    utterance.onerror = () => {
      setCurrentPlayingId(null);
      setMessages(prev => prev.map(msg => ({ ...msg, isPlaying: false })));
    };

    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setCurrentPlayingId(null);
    setMessages(prev => prev.map(msg => ({ ...msg, isPlaying: false })));
  };

  const handleSubmit = async (e: React.FormEvent | null, voiceText?: string) => {
    if (e) e.preventDefault();
    const messageText = voiceText || inputValue.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    // Add user message to UI immediately
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Get auth token
      const token = localStorage.getItem('auth_token');
      
      // Call the AI API
      const response = await fetch('/api/chat/conversation', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: messageText,
          context: {
            ...initialContext,
            userId,
            conversationId,
            chatHistory: messages
              .filter(m => m.id !== 'welcome')
              .map(m => ({ role: m.role, content: m.content }))
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
        setConversationId(data.conversationId);
        
        // Auto-speak AI response if voice is enabled
        if (isVoiceEnabled && voiceText) {
          setTimeout(() => {
            speakText(data.response, aiMessage.id);
          }, 500);
        }
        
        if (onMessageSubmit) {
          onMessageSubmit(messageText);
        }
      } else {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: data.error || 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error chatting with AI:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: "Summarize my day", prompt: "Summarize today's communications" },
    { label: "What needs attention?", prompt: "What messages need my attention?" },
    { label: "Find recent decisions", prompt: "What decisions were made recently?" },
    { label: "Show urgent messages", prompt: "Show me high priority messages" }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '500px',
      border: '1px solid var(--border-medium)',
      borderRadius: '12px',
      background: 'var(--bg-primary)',
      boxShadow: 'var(--shadow-md)'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border-medium)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--bubble-sent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={16} color="white" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
              AI Assistant
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Ask me anything about your communications
            </p>
          </div>
        </div>
        
        {/* Voice Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              background: isVoiceEnabled ? 'var(--bubble-sent)' : 'var(--bg-secondary)',
              color: isVoiceEnabled ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={isVoiceEnabled ? 'Disable voice' : 'Enable voice'}
          >
            {isVoiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
          
          {currentPlayingId && (
            <button
              onClick={stopSpeaking}
              style={{
                padding: '6px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--accent-danger)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Stop speaking"
            >
              <Pause size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: message.role === 'user' ? 'var(--bg-tertiary)' : 'var(--bubble-sent)',
              color: message.role === 'user' ? 'var(--text-secondary)' : 'white'
            }}>
              {message.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div style={{
              maxWidth: 'calc(100% - 44px)',
              background: message.role === 'user' ? 'var(--bg-secondary)' : 'var(--bubble-sent)',
              color: message.role === 'user' ? 'var(--text-primary)' : 'white',
              borderRadius: '18px',
              padding: '12px 16px',
              fontSize: '14px',
              lineHeight: '1.5',
              position: 'relative'
            }}>
              {message.content}
              
              {/* Voice controls for AI messages */}
              {message.role === 'assistant' && message.id !== 'welcome' && isVoiceEnabled && (
                <button
                  onClick={() => message.isPlaying ? stopSpeaking() : speakText(message.content, message.id)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    padding: '4px',
                    borderRadius: '4px',
                    border: 'none',
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.7
                  }}
                  title={message.isPlaying ? 'Stop speaking' : 'Speak message'}
                >
                  {message.isPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
              )}
              
              <div style={{
                fontSize: '11px',
                opacity: 0.7,
                marginTop: '4px',
                textAlign: 'right'
              }}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: 'var(--bubble-sent)',
              color: 'white'
            }}>
              <Bot size={16} />
            </div>
            
            <div style={{
              background: 'var(--bubble-sent)',
              color: 'white',
              borderRadius: '18px',
              padding: '12px 16px',
              fontSize: '14px'
            }}>
              {isRecording ? 'Listening...' : 'Thinking...'}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border-medium)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        backgroundColor: 'var(--bg-secondary)'
      }}>
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => setInputValue(action.prompt)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              background: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ padding: '16px' }}>
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me about your messages, priorities, or decisions..."
            style={{
              flex: 1,
              padding: '12px 16px',
              border: '1px solid var(--border-medium)',
              borderRadius: '24px',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none'
            }}
            disabled={isLoading || isRecording}
          />
          
          {/* Voice Input Button */}
          {isVoiceEnabled && (
            <button
              type="button"
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              disabled={isLoading}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: 'none',
                background: isRecording ? 'var(--accent-danger)' : 'var(--accent-secondary)',
                color: 'white',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                animation: isRecording ? 'pulse 1s infinite' : 'none'
              }}
              title={isRecording ? 'Stop recording' : 'Start voice input'}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading || isRecording}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: 'none',
              background: 'var(--bubble-sent)',
              color: 'white',
              cursor: (!inputValue.trim() || isLoading || isRecording) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {isLoading ? <Sparkles size={18} /> : <Send size={18} />}
          </button>
        </div>
      </form>
      
      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}