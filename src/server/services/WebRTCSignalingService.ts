import { WebSocket } from 'ws';

// WebRTC type definitions for Node.js environment
interface RTCSessionDescriptionInit {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback';
  sdp?: string;
}

interface RTCIceCandidateInit {
  candidate?: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
  usernameFragment?: string | null;
}

interface CallParticipant {
  userId: string;
  ws: WebSocket;
  peerId?: string;
}

interface ActiveCall {
  callId: string;
  callerId: string;
  calleeId: string;
  callType: 'audio' | 'video';
  status: 'initiated' | 'ringing' | 'connected' | 'ended';
  participants: Map<string, CallParticipant>;
  startTime?: Date;
  endTime?: Date;
}

export class WebRTCSignalingService {
  private activeCalls: Map<string, ActiveCall> = new Map();
  private userConnections: Map<string, WebSocket> = new Map();

  setUserConnection(userId: string, ws: WebSocket) {
    this.userConnections.set(userId, ws);
  }

  removeUserConnection(userId: string) {
    this.userConnections.delete(userId);
    
    // End any active calls for this user
    this.activeCalls.forEach((call, callId) => {
      if (call.participants.has(userId)) {
        this.endCall(callId, userId);
      }
    });
  }

  async initiateCall(callId: string, callerId: string, calleeId: string, callType: 'audio' | 'video') {
    const callerWs = this.userConnections.get(callerId);
    const calleeWs = this.userConnections.get(calleeId);

    if (!callerWs || !calleeWs) {
      throw new Error('One or both participants are not connected');
    }

    const call: ActiveCall = {
      callId,
      callerId,
      calleeId,
      callType,
      status: 'initiated',
      participants: new Map([
        [callerId, { userId: callerId, ws: callerWs }],
        [calleeId, { userId: calleeId, ws: calleeWs }]
      ])
    };

    this.activeCalls.set(callId, call);

    // Notify callee about incoming call
    this.sendToUser(calleeId, {
      type: 'incoming_call',
      callId,
      callerId,
      callType,
      timestamp: new Date()
    });

    // Update call status to ringing
    call.status = 'ringing';

    return call;
  }

  async acceptCall(callId: string, userId: string) {
    const call = this.activeCalls.get(callId);
    
    if (!call || !call.participants.has(userId)) {
      throw new Error('Call not found or user not part of call');
    }

    call.status = 'connected';
    call.startTime = new Date();

    // Notify all participants that call was accepted
    call.participants.forEach((participant, participantId) => {
      this.sendToUser(participantId, {
        type: 'call_accepted',
        callId,
        acceptedBy: userId,
        participants: Array.from(call.participants.keys())
      });
    });

    return call;
  }

  async rejectCall(callId: string, userId: string) {
    const call = this.activeCalls.get(callId);
    
    if (!call || !call.participants.has(userId)) {
      throw new Error('Call not found or user not part of call');
    }

    // Notify all participants that call was rejected
    call.participants.forEach((participant, participantId) => {
      if (participantId !== userId) {
        this.sendToUser(participantId, {
          type: 'call_rejected',
          callId,
          rejectedBy: userId
        });
      }
    });

    this.activeCalls.delete(callId);
    return call;
  }

  async endCall(callId: string, userId: string) {
    const call = this.activeCalls.get(callId);
    
    if (!call) {
      return null;
    }

    call.status = 'ended';
    call.endTime = new Date();

    const duration = call.startTime ? 
      Math.floor((call.endTime.getTime() - call.startTime.getTime()) / 1000) : 0;

    // Notify all participants that call ended
    call.participants.forEach((participant, participantId) => {
      this.sendToUser(participantId, {
        type: 'call_ended',
        callId,
        endedBy: userId,
        duration
      });
    });

    this.activeCalls.delete(callId);
    return { call, duration };
  }

  // WebRTC Signaling Methods
  async handleOffer(callId: string, userId: string, offer: RTCSessionDescriptionInit) {
    const call = this.activeCalls.get(callId);
    
    if (!call || !call.participants.has(userId)) {
      throw new Error('Call not found or user not part of call');
    }

    // Forward offer to other participant
    call.participants.forEach((participant, participantId) => {
      if (participantId !== userId) {
        this.sendToUser(participantId, {
          type: 'webrtc_offer',
          callId,
          offer,
          from: userId
        });
      }
    });
  }

  async handleAnswer(callId: string, userId: string, answer: RTCSessionDescriptionInit) {
    const call = this.activeCalls.get(callId);
    
    if (!call || !call.participants.has(userId)) {
      throw new Error('Call not found or user not part of call');
    }

    // Forward answer to other participant
    call.participants.forEach((participant, participantId) => {
      if (participantId !== userId) {
        this.sendToUser(participantId, {
          type: 'webrtc_answer',
          callId,
          answer,
          from: userId
        });
      }
    });
  }

  async handleIceCandidate(callId: string, userId: string, candidate: RTCIceCandidateInit) {
    const call = this.activeCalls.get(callId);
    
    if (!call || !call.participants.has(userId)) {
      throw new Error('Call not found or user not part of call');
    }

    // Forward ICE candidate to other participant
    call.participants.forEach((participant, participantId) => {
      if (participantId !== userId) {
        this.sendToUser(participantId, {
          type: 'webrtc_ice_candidate',
          callId,
          candidate,
          from: userId
        });
      }
    });
  }

  // Group call support (for future enhancement)
  async addParticipantToCall(callId: string, userId: string) {
    const call = this.activeCalls.get(callId);
    const userWs = this.userConnections.get(userId);
    
    if (!call || !userWs) {
      throw new Error('Call not found or user not connected');
    }

    call.participants.set(userId, { userId, ws: userWs });

    // Notify existing participants about new participant
    call.participants.forEach((participant, participantId) => {
      if (participantId !== userId) {
        this.sendToUser(participantId, {
          type: 'participant_joined',
          callId,
          userId,
          participants: Array.from(call.participants.keys())
        });
      }
    });

    // Notify new participant about existing participants
    this.sendToUser(userId, {
      type: 'call_joined',
      callId,
      participants: Array.from(call.participants.keys()).filter(id => id !== userId)
    });

    return call;
  }

  async removeParticipantFromCall(callId: string, userId: string) {
    const call = this.activeCalls.get(callId);
    
    if (!call || !call.participants.has(userId)) {
      return null;
    }

    call.participants.delete(userId);

    // If no participants left, end the call
    if (call.participants.size === 0) {
      this.activeCalls.delete(callId);
      return { call, ended: true };
    }

    // Notify remaining participants
    call.participants.forEach((participant, participantId) => {
      this.sendToUser(participantId, {
        type: 'participant_left',
        callId,
        userId,
        participants: Array.from(call.participants.keys())
      });
    });

    return { call, ended: false };
  }

  // Utility methods
  private sendToUser(userId: string, message: any) {
    const ws = this.userConnections.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  getActiveCall(callId: string): ActiveCall | undefined {
    return this.activeCalls.get(callId);
  }

  getUserActiveCalls(userId: string): ActiveCall[] {
    const userCalls: ActiveCall[] = [];
    
    this.activeCalls.forEach(call => {
      if (call.participants.has(userId)) {
        userCalls.push(call);
      }
    });

    return userCalls;
  }

  getCallStats() {
    return {
      activeCalls: this.activeCalls.size,
      connectedUsers: this.userConnections.size,
      calls: Array.from(this.activeCalls.values()).map(call => ({
        callId: call.callId,
        callType: call.callType,
        status: call.status,
        participantCount: call.participants.size,
        duration: call.startTime ? Date.now() - call.startTime.getTime() : 0
      }))
    };
  }

  // Screen sharing support
  async startScreenShare(callId: string, userId: string) {
    const call = this.activeCalls.get(callId);
    
    if (!call || !call.participants.has(userId)) {
      throw new Error('Call not found or user not part of call');
    }

    // Notify other participants about screen sharing
    call.participants.forEach((participant, participantId) => {
      if (participantId !== userId) {
        this.sendToUser(participantId, {
          type: 'screen_share_started',
          callId,
          userId
        });
      }
    });
  }

  async stopScreenShare(callId: string, userId: string) {
    const call = this.activeCalls.get(callId);
    
    if (!call || !call.participants.has(userId)) {
      throw new Error('Call not found or user not part of call');
    }

    // Notify other participants that screen sharing stopped
    call.participants.forEach((participant, participantId) => {
      if (participantId !== userId) {
        this.sendToUser(participantId, {
          type: 'screen_share_stopped',
          callId,
          userId
        });
      }
    });
  }

  // Call recording support (placeholder for future implementation)
  async startRecording(callId: string, userId: string) {
    const call = this.activeCalls.get(callId);
    
    if (!call || !call.participants.has(userId)) {
      throw new Error('Call not found or user not part of call');
    }

    // Notify all participants about recording
    call.participants.forEach((participant, participantId) => {
      this.sendToUser(participantId, {
        type: 'recording_started',
        callId,
        startedBy: userId
      });
    });
  }

  async stopRecording(callId: string, userId: string) {
    const call = this.activeCalls.get(callId);
    
    if (!call || !call.participants.has(userId)) {
      throw new Error('Call not found or user not part of call');
    }

    // Notify all participants that recording stopped
    call.participants.forEach((participant, participantId) => {
      this.sendToUser(participantId, {
        type: 'recording_stopped',
        callId,
        stoppedBy: userId
      });
    });
  }
}