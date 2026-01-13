import { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  MonitorOff,
  Volume2,
  VolumeX,
  Maximize,
  Minimize
} from 'lucide-react';

interface WebRTCCallProps {
  callId: string;
  isInitiator: boolean;
  callType: 'audio' | 'video';
  remoteUserId: string;
  remoteUserName: string;
  onEndCall: () => void;
  ws: WebSocket | null;
}

export default function WebRTCCall({
  callId,
  isInitiator,
  callType,
  remoteUserId,
  remoteUserName,
  onEndCall,
  ws
}: WebRTCCallProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);