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
      content: '👋 **Welcome to your AI Communication Assistant!**\n\nI\'m here to help you manage your communications effectively. I can:\n\n• 📊 **Summarize** your daily activity\n• 🚨 **Identify** high-priority messages\n• 📋 **Track** decisions and commitments\n• 🔍 **Search** through your conversations\n• 📈 **Analyze** communication patterns\n• 🎤 **Voice Input** - Click the microphone to speak!\n• 🔊 **Voice Output** - I can read responses aloud!\n\n**Try asking**: "What needs my attention?" or click the 🎤 microphone to speak!',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(initialContext.conversationId);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<any>(null);

  // Simple markdown-like formatting for AI responses
  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      recognitionInstance.maxAlternatives = 1;
      
      recognitionInstance.onstart = () => {
        console.log('Voice recognition started');
        setIsListening(true);
        setIsRecording(true);
        setVoiceStatus('🎤 Listening... Speak clearly!');
      };
      
      recognitionInstance.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Voice input received:', transcript);
        setInputValue(transcript);
        setIsListening(false);
        setIsRecording(false);
        setVoiceStatus(`✅ Heard: "${transcript}"`);
        
        // Clear status after a delay
        setTimeout(() => setVoiceStatus(''), 3000);
        
        // Automatically submit the voice input
        await handleSubmit(null, transcript);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsRecording(false);
        setIsLoading(false);
        
        let errorMessage = 'Voice recognition failed. Please try again.';
        if (event.error === 'no-speech') {
          errorMessage = 'No speech detected. Please speak clearly and try again.';
        } else if (event.error === 'audio-capture') {
          errorMessage = 'Microphone not accessible. Please check permissions.';
        } else if (event.error === 'not-allowed') {
          errorMessage = 'Microphone permission denied. Please allow microphone access and refresh the page.';
        } else if (event.error === 'network') {
          errorMessage = 'Network error. Please check your internet connection.';
        }
        
        // Show error message as AI response
        const errorMsg: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `🎤 ${errorMessage}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
      };
      
      recognitionInstance.onend = () => {
        console.log('Voice recognition ended');
        setIsListening(false);
        setIsRecording(false);
        if (voiceStatus.includes('Listening')) {
          setVoiceStatus('');
        }
      };
      
      setRecognition(recognitionInstance);
      recognitionRef.current = recognitionInstance;
    } else {
      console.warn('Speech recognition not supported');
      setIsVoiceEnabled(false);
    }

    // Check if browser supports speech synthesis
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      setIsVoiceEnabled(false);
    }

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startVoiceRecording = async () => {
    if (!recognition) {
      alert('Voice recognition is not available in this browser. Please try Chrome, Edge, or Safari.');
      return;
    }

    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop any ongoing recognition
      if (isListening) {
        recognition.stop();
        return;
      }
      
      // Start voice recognition
      recognition.start();
      console.log('Starting voice recognition...');
      
    } catch (error) {
      console.error('Error starting voice recording:', error);
      let errorMessage = 'Could not access microphone. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow microphone access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No microphone found. Please connect a microphone.';
      } else {
        errorMessage += 'Please check your microphone settings.';
      }
      
      alert(errorMessage);
    }
  };

  const stopVoiceRecording = () => {
    if (recognition && isListening) {
      recognition.stop();
      console.log('Stopping voice recognition...');
    }
  };

  // Remove the old processVoiceInput function and audioChunks effect since we're using direct speech recognition

  const speakText = (text: string, messageId: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech not supported in this browser');
      return;
    }

    // Stop any current speech
    speechSynthesis.cancel();

    // Clean text for better speech (remove markdown and special characters)
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic markdown
      .replace(/#{1,6}\s/g, '')        // Remove headers
      .replace(/[•·]/g, '')            // Remove bullet points
      .replace(/\n/g, ' ')             // Replace newlines with spaces
      .replace(/\s+/g, ' ')            // Normalize whitespace
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Configure voice settings for better quality
    utterance.rate = 0.85;  // Slightly slower for clarity
    utterance.pitch = 1.0;  // Normal pitch
    utterance.volume = 0.9; // High volume
    
    // Try to use a more natural voice if available
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && 
      (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.name.includes('Natural'))
    ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      console.log('Started speaking:', cleanText.substring(0, 50) + '...');
      setCurrentPlayingId(messageId);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, isPlaying: true }
          : { ...msg, isPlaying: false }
      ));
    };

    utterance.onend = () => {
      console.log('Finished speaking');
      setCurrentPlayingId(null);
      setMessages(prev => prev.map(msg => ({ ...msg, isPlaying: false })));
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setCurrentPlayingId(null);
      setMessages(prev => prev.map(msg => ({ ...msg, isPlaying: false })));
    };

    // Ensure voices are loaded before speaking
    if (voices.length === 0) {
      speechSynthesis.addEventListener('voiceschanged', () => {
        speechSynthesis.speak(utterance);
      }, { once: true });
    } else {
      speechSynthesis.speak(utterance);
    }
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
    
    // Show typing indicator for better UX
    setIsTyping(true);

    try {
      // Get auth token
      const token = localStorage.getItem('auth_token');
      
      // Simulate realistic response time (1-3 seconds)
      const responseDelay = Math.random() * 2000 + 1000;
      
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

      // Wait for minimum response time for better UX
      await new Promise(resolve => setTimeout(resolve, Math.max(0, responseDelay - 500)));
      
      setIsTyping(false);

      if (data.success) {
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
        setConversationId(data.conversationId);
        
        // Auto-speak AI response if voice input was used
        if (isVoiceEnabled && voiceText) {
          setTimeout(() => {
            speakText(data.response, aiMessage.id);
          }, 800); // Slightly longer delay for better UX
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
      setIsTyping(false);
      
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting. Please try again in a moment.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: "📊 Summarize my day", prompt: "Summarize today's communications and activity" },
    { label: "🚨 What needs attention?", prompt: "Show me high priority messages that need my attention" },
    { label: "📋 Recent decisions", prompt: "What decisions were made recently in my conversations?" },
    { label: "👥 Team updates", prompt: "Give me updates on team activity and meetings" },
    { label: "📈 Communication stats", prompt: "Show me my communication statistics and patterns" },
    { label: "🔍 Search messages", prompt: "Help me find specific messages or conversations" }
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
              {isRecording ? '🎤 Listening for your voice...' : 'Ask me anything about your communications'}
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

      {/* Voice Status Indicator */}
      {voiceStatus && (
        <div style={{
          padding: '8px 16px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderBottom: '1px solid var(--border-light)',
          fontSize: '12px',
          color: '#3b82f6',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          {voiceStatus}
        </div>
      )}

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
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: message.role === 'assistant' ? formatMessage(message.content) : message.content 
                }} 
              />
              
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
        
        {(isLoading || isTyping) && (
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
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {isRecording ? '🎤 Listening...' : isTyping ? '🤔 Thinking...' : '⚡ Processing...'}
              <div style={{
                display: 'flex',
                gap: '2px'
              }}>
                <div style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.8)',
                  animation: 'pulse 1.4s ease-in-out infinite'
                }} />
                <div style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.8)',
                  animation: 'pulse 1.4s ease-in-out infinite 0.2s'
                }} />
                <div style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.8)',
                  animation: 'pulse 1.4s ease-in-out infinite 0.4s'
                }} />
              </div>
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
            placeholder={isRecording ? "🎤 Listening... Speak now!" : "Ask me about your messages, priorities, or decisions..."}
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
                background: isRecording ? '#ef4444' : '#3b82f6',
                color: 'white',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                animation: isRecording ? 'recordingPulse 1s infinite' : 'none',
                boxShadow: isRecording ? '0 0 20px rgba(239, 68, 68, 0.5)' : '0 2px 8px rgba(59, 130, 246, 0.3)'
              }}
              title={isRecording ? 'Click to stop recording' : 'Click and speak your message'}
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
      
      {/* CSS for animations */}
      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { 
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% { 
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes recordingPulse {
          0% { 
            transform: scale(1);
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
          }
          50% { 
            transform: scale(1.1);
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.8);
          }
          100% { 
            transform: scale(1);
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
          }
        }
        
        /* Voice input placeholder animation */
        input:disabled {
          background: var(--bg-secondary) !important;
          color: var(--text-tertiary) !important;
        }
      `}</style>
    </div>
  );
}