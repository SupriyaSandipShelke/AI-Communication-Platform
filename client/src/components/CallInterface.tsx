import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface CallInterfaceProps {
  isOpen: boolean;
  callType: 'audio' | 'video';
  isIncoming: boolean;
  callerName: string;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  localStream?: MediaStream;
  remoteStream?: MediaStream;
}

export default function CallInterface({
  isOpen,
  callType,
  isIncoming,
  callerName,
  onAccept,
  onReject,
  onEnd,
  localStream,
  remoteStream
}: CallInterfaceProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'ringing' | 'connecting' | 'connected'>('ringing');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callStartTime = useRef<number>(0);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      setCallStatus('connected');
      callStartTime.current = Date.now();
    }
  }, [remoteStream]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream && callType === 'video') {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // In a real implementation, this would control audio output routing
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    }}>
      {/* Call Header */}
      <div style={{
        position: 'absolute',
        top: '40px',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          {callerName}
        </h2>
        <p style={{ fontSize: '16px', opacity: 0.8 }}>
          {callStatus === 'ringing' && (isIncoming ? 'Incoming call...' : 'Calling...')}
          {callStatus === 'connecting' && 'Connecting...'}
          {callStatus === 'connected' && formatDuration(callDuration)}
        </p>
      </div>

      {/* Video Area */}
      {callType === 'video' && (
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          
          {/* Local Video (Picture-in-Picture) */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '200px',
              height: '150px',
              borderRadius: '12px',
              objectFit: 'cover',
              border: '2px solid white',
              display: isVideoOff ? 'none' : 'block'
            }}
          />

          {/* Video Off Placeholder */}
          {isVideoOff && (
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '200px',
              height: '150px',
              borderRadius: '12px',
              background: '#374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white'
            }}>
              <VideoOff size={40} />
            </div>
          )}
        </div>
      )}

      {/* Audio Call Avatar */}
      {callType === 'audio' && (
        <div style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '80px',
          fontWeight: 'bold',
          marginBottom: '40px'
        }}>
          {callerName.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Call Controls */}
      <div style={{
        position: 'absolute',
        bottom: '60px',
        display: 'flex',
        gap: '20px',
        alignItems: 'center'
      }}>
        {/* Incoming Call Controls */}
        {isIncoming && callStatus === 'ringing' && (
          <>
            <button
              onClick={onReject}
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: '#ef4444',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PhoneOff size={30} />
            </button>
            
            <button
              onClick={onAccept}
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: '#10b981',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Phone size={30} />
            </button>
          </>
        )}

        {/* Active Call Controls */}
        {(callStatus === 'connected' || (callStatus === 'ringing' && !isIncoming)) && (
          <>
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: isMuted ? '#ef4444' : 'rgba(255,255,255,0.2)',
                border: '2px solid white',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            {/* Video Toggle (for video calls) */}
            {callType === 'video' && (
              <button
                onClick={toggleVideo}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: isVideoOff ? '#ef4444' : 'rgba(255,255,255,0.2)',
                  border: '2px solid white',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
              </button>
            )}

            {/* Speaker Toggle (for audio calls) */}
            {callType === 'audio' && (
              <button
                onClick={toggleSpeaker}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: isSpeakerOn ? 'rgba(255,255,255,0.2)' : '#6b7280',
                  border: '2px solid white',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
              </button>
            )}

            {/* End Call Button */}
            <button
              onClick={onEnd}
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: '#ef4444',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PhoneOff size={30} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}