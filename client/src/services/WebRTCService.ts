export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private ws: WebSocket | null = null;
  private callId: string | null = null;
  
  private onLocalStreamCallback?: (stream: MediaStream) => void;
  private onRemoteStreamCallback?: (stream: MediaStream) => void;
  private onCallEndCallback?: () => void;
  private onIncomingCallCallback?: (callId: string, callerId: string, callType: 'audio' | 'video') => void;

  constructor(websocket: WebSocket) {
    this.ws = websocket;
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners() {
    if (!this.ws) return;

    // Note: WebSocket message handling is now done through handleWebSocketMessage method
    // to avoid duplicate event listeners
  }

  public handleWebSocketMessage(data: any) {
    switch (data.type) {
      case 'incoming_call':
        this.handleIncomingCall(data);
        break;
      case 'call_accepted':
        this.handleCallAccepted(data);
        break;
      case 'call_rejected':
        this.handleCallRejected(data);
        break;
      case 'call_ended':
        this.handleCallEnded(data);
        break;
      case 'webrtc_offer':
        this.handleOffer(data);
        break;
      case 'webrtc_answer':
        this.handleAnswer(data);
        break;
      case 'webrtc_ice_candidate':
        this.handleIceCandidate(data);
        break;
    }
  }

  public setCallbacks(callbacks: {
    onLocalStream?: (stream: MediaStream) => void;
    onRemoteStream?: (stream: MediaStream) => void;
    onCallEnd?: () => void;
    onIncomingCall?: (callId: string, callerId: string, callType: 'audio' | 'video') => void;
  }) {
    this.onLocalStreamCallback = callbacks.onLocalStream;
    this.onRemoteStreamCallback = callbacks.onRemoteStream;
    this.onCallEndCallback = callbacks.onCallEnd;
    this.onIncomingCallCallback = callbacks.onIncomingCall;
  }

  public async initiateCall(calleeId: string, callType: 'audio' | 'video'): Promise<string> {
    try {
      // Get user media
      const constraints = {
        audio: true,
        video: callType === 'video'
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.onLocalStreamCallback?.(this.localStream);

      // Create peer connection
      this.createPeerConnection();

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // Generate call ID
      this.callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Send call initiation through WebSocket
      this.ws?.send(JSON.stringify({
        type: 'initiate_call',
        callId: this.callId,
        calleeId,
        callType,
        callerId: localStorage.getItem('user_id')
      }));

      return this.callId;
    } catch (error) {
      console.error('Failed to initiate call:', error);
      throw error;
    }
  }

  public async acceptCall(callId: string): Promise<void> {
    try {
      this.callId = callId;

      // Get user media
      const constraints = {
        audio: true,
        video: true // Always request video permission, can be disabled later
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.onLocalStreamCallback?.(this.localStream);

      // Create peer connection
      this.createPeerConnection();

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // Send acceptance through WebSocket
      this.ws?.send(JSON.stringify({
        type: 'accept_call',
        callId
      }));

    } catch (error) {
      console.error('Failed to accept call:', error);
      throw error;
    }
  }

  public rejectCall(callId: string): void {
    this.ws?.send(JSON.stringify({
      type: 'reject_call',
      callId
    }));
  }

  public endCall(): void {
    if (this.callId) {
      this.ws?.send(JSON.stringify({
        type: 'end_call',
        callId: this.callId
      }));
    }
    
    this.cleanup();
  }

  private createPeerConnection(): void {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.onRemoteStreamCallback?.(this.remoteStream);
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.callId) {
        this.ws?.send(JSON.stringify({
          type: 'webrtc_ice_candidate',
          callId: this.callId,
          candidate: event.candidate
        }));
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      if (this.peerConnection?.connectionState === 'disconnected' || 
          this.peerConnection?.connectionState === 'failed') {
        this.onCallEndCallback?.();
        this.cleanup();
      }
    };
  }

  private async handleIncomingCall(data: any): Promise<void> {
    this.onIncomingCallCallback?.(data.callId, data.callerId, data.callType);
  }

  private async handleCallAccepted(data: any): Promise<void> {
    if (!this.peerConnection) return;

    try {
      // Create and send offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      this.ws?.send(JSON.stringify({
        type: 'webrtc_offer',
        callId: data.callId,
        offer
      }));
    } catch (error) {
      console.error('Failed to create offer:', error);
    }
  }

  private handleCallRejected(data: any): void {
    this.onCallEndCallback?.();
    this.cleanup();
  }

  private handleCallEnded(data: any): void {
    this.onCallEndCallback?.();
    this.cleanup();
  }

  private async handleOffer(data: any): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(data.offer);
      
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      this.ws?.send(JSON.stringify({
        type: 'webrtc_answer',
        callId: data.callId,
        answer
      }));
    } catch (error) {
      console.error('Failed to handle offer:', error);
    }
  }

  private async handleAnswer(data: any): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(data.answer);
    } catch (error) {
      console.error('Failed to handle answer:', error);
    }
  }

  private async handleIceCandidate(data: any): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.addIceCandidate(data.candidate);
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
    }
  }

  private cleanup(): void {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.callId = null;
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }
}