export type DeliveryStage = 'sending' | 'sent' | 'delivered' | 'read';

export type MessageKind = 'text' | 'image' | 'voice' | 'system';

export interface MessageReply {
  id: string;
  senderName: string;
  text?: string;
  kind?: MessageKind;
}

export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  sentAt: string;
  sentAtMs?: number;
  kind: MessageKind;
  text?: string;
  asset?: string;
  voiceDuration?: number; // seconds
  isMine: boolean;
  delivery?: DeliveryStage;
  replyTo?: MessageReply;
  reactions?: Record<string, string>; // userId -> emoji
  isDeleted?: boolean;
  isStarred?: boolean;
  decryptFailed?: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  avatarAsset?: string | null;
  lastMessage: string;
  timeLabel: string;
  lastMessageAt?: number;
  online?: boolean;
  unread: number;
  pinned?: boolean;
  isGroup?: boolean;
  muted?: boolean;
  blocked?: boolean;
  previewKind?: MessageKind;
  delivery?: DeliveryStage;
  recipientId?: string;
  recipientUsername?: string;
  participantIds?: string[];
  description?: string;
  members?: string[];
  groupAdmins?: string[];
  isTyping?: boolean;
}

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  about: string;
  avatarUrl?: string;
  publicKey: string;
  isOnline: boolean;
}

export interface AppSettings {
  themeMode: 'system' | 'light' | 'dark';
  readReceipts: boolean;
  lastSeen: boolean;
  appLock: boolean;
  notificationsEnabled: boolean;
  messagePreviews: boolean;
  quietHours: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  savePhotos: boolean;
  downloadOnWifi: boolean;
  downloadOnCellular: boolean;
  enterToSend: boolean;
  fontScale: number;
  automaticBackups: boolean;
  lastBackupTime?: string;
  cacheMb: {
    photos: number;
    voice: number;
    files: number;
  };
}

export type AuthStep = 'loading' | 'splash' | 'login' | 'signup' | 'complete';

export type InboxFilter = 'all' | 'unread' | 'groups';

export type DesktopNavTab = 'chats' | 'calls' | 'status' | 'starred' | 'settings';

export type CallType = 'audio' | 'video';
export type CallStatus =
  | 'ringing'
  | 'connecting'
  | 'connected'
  | 'ended'
  | 'declined'
  | 'missed'
  | 'failed'
  | 'busy';

export interface ActiveCall {
  callId: string;
  peerId: string;
  peerName: string;
  peerAvatar?: string | null;
  type: CallType;
  direction: 'outgoing' | 'incoming';
  status: CallStatus;
  startedAt?: number;
  connectedAt?: number;
  isMuted: boolean;
  isCameraOff: boolean;
}
