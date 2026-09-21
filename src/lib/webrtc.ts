// Royal Chat — real WebRTC audio/video calling.
//
// Signaling (who is calling whom, SDP offer/answer, ICE candidates) goes
// through Firestore documents — no separate signaling server needed.
// Media itself flows peer-to-peer once connected. This uses only Google's
// free public STUN server; there is no TURN server configured, so calls
// between two people on very restrictive networks (symmetric NAT,
// some corporate firewalls) may fail to connect — that's an inherent
// limit of STUN-only WebRTC, not a bug in this code. Adding a TURN
// server (several free-tier options exist, e.g. Twilio, Cloudflare)
// would close that gap.
import {
  addDoc,
  collection,
  doc,
  DocumentReference,
  onSnapshot,
  setDoc,
  Unsubscribe,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { CallType } from '../types';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];

export interface CallDoc {
  callerId: string;
  calleeId: string;
  callerName: string;
  callerAvatar?: string | null;
  calleeName: string;
  calleeAvatar?: string | null;
  type: CallType;
  status: 'ringing' | 'accepted' | 'declined' | 'ended' | 'missed' | 'busy';
  offer?: { type: RTCSdpType; sdp: string };
  answer?: { type: RTCSdpType; sdp: string };
  createdAt: number;
  updatedAt: number;
}

export class CallSession {
  pc: RTCPeerConnection;
  callId: string;
  role: 'caller' | 'callee';
  localStream: MediaStream | null = null;
  remoteStream: MediaStream;
  private unsubscribers: Unsubscribe[] = [];
  private callRef: DocumentReference;

  onRemoteStreamUpdated?: () => void;
  onRemoteHangup?: (reason: 'ended' | 'declined' | 'missed' | 'busy') => void;
  onConnectionFailed?: () => void;

  constructor(callId: string, role: 'caller' | 'callee') {
    this.callId = callId;
    this.role = role;
    this.callRef = doc(db, 'calls', callId);
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.remoteStream = new MediaStream();

    this.pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        if (!this.remoteStream.getTracks().find((t) => t.id === track.id)) {
          this.remoteStream.addTrack(track);
        }
      });
      this.onRemoteStreamUpdated?.();
    };

    this.pc.onconnectionstatechange = () => {
      if (this.pc.connectionState === 'failed') {
        this.onConnectionFailed?.();
      }
    };

    this.pc.onicecandidate = (event) => {
      if (!event.candidate) return;
      const subcollection = this.role === 'caller' ? 'callerCandidates' : 'calleeCandidates';
      addDoc(collection(this.callRef, subcollection), event.candidate.toJSON()).catch(() => {});
    };
  }

  async getLocalMedia(type: CallType): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === 'video' ? { facingMode: 'user' } : false,
    });
    this.localStream = stream;
    stream.getTracks().forEach((track) => this.pc.addTrack(track, stream));
    return stream;
  }

  setMuted(muted: boolean) {
    this.localStream?.getAudioTracks().forEach((t) => (t.enabled = !muted));
  }

  setCameraOff(off: boolean) {
    this.localStream?.getVideoTracks().forEach((t) => (t.enabled = !off));
  }

  /** Caller side: create the offer and write the call doc. */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    return offer;
  }

  /** Callee side: accept the offer and produce an answer. */
  async createAnswer(offer: { type: RTCSdpType; sdp: string }): Promise<RTCSessionDescriptionInit> {
    await this.pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    return answer;
  }

  /** Caller side: apply the callee's answer once it arrives. */
  async applyAnswer(answer: { type: RTCSdpType; sdp: string }) {
    if (this.pc.currentRemoteDescription) return; // already applied
    await this.pc.setRemoteDescription(new RTCSessionDescription(answer));
  }

  /** Start listening for ICE candidates from the other side. */
  listenForRemoteCandidates() {
    const remoteSubcollection = this.role === 'caller' ? 'calleeCandidates' : 'callerCandidates';
    const unsub = onSnapshot(collection(this.callRef, remoteSubcollection), (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const candidate = change.doc.data() as RTCIceCandidateInit;
          this.pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
        }
      });
    });
    this.unsubscribers.push(unsub);
  }

  /** Watch the call document itself for status changes / remote hangup. */
  listenForCallDocChanges() {
    const unsub = onSnapshot(this.callRef, (snap) => {
      const data = snap.data() as CallDoc | undefined;
      if (!data) return;
      if (this.role === 'caller' && data.answer && !this.pc.currentRemoteDescription) {
        this.applyAnswer(data.answer).catch(() => this.onConnectionFailed?.());
      }
      if (data.status === 'ended' || data.status === 'declined' || data.status === 'missed' || data.status === 'busy') {
        this.onRemoteHangup?.(data.status);
      }
    });
    this.unsubscribers.push(unsub);
  }

  async updateStatus(status: CallDoc['status']) {
    await updateDoc(this.callRef, { status, updatedAt: Date.now() }).catch(() => {});
  }

  cleanup() {
    this.unsubscribers.forEach((u) => u());
    this.unsubscribers = [];
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.pc.getSenders().forEach((s) => s.track?.stop());
    this.pc.close();
  }
}

export async function createCallDoc(params: {
  callId: string;
  callerId: string;
  calleeId: string;
  callerName: string;
  callerAvatar?: string | null;
  calleeName: string;
  calleeAvatar?: string | null;
  type: CallType;
  offer: RTCSessionDescriptionInit;
}) {
  const ref = doc(db, 'calls', params.callId);
  const payload: CallDoc = {
    callerId: params.callerId,
    calleeId: params.calleeId,
    callerName: params.callerName,
    callerAvatar: params.callerAvatar ?? null,
    calleeName: params.calleeName,
    calleeAvatar: params.calleeAvatar ?? null,
    type: params.type,
    status: 'ringing',
    offer: { type: params.offer.type as RTCSdpType, sdp: params.offer.sdp || '' },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(ref, payload);
}

export async function writeAnswer(callId: string, answer: RTCSessionDescriptionInit) {
  await updateDoc(doc(db, 'calls', callId), {
    answer: { type: answer.type, sdp: answer.sdp || '' },
    status: 'accepted',
    updatedAt: Date.now(),
  });
}
