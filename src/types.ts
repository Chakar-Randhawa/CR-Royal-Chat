export type DeliveryStage = 'sending' | 'sent' | 'delivered' | 'read';

export type MessageKind = 'text' | 'image' | 'voice' | 'system';

export interface MessageReply {
  id: string;
  senderName: string;
  text?: string;
  kind?: MessageKind;
}

export interface RelayMessage {
  id: string;
  senderId: string;
  sentAt: string;
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
}

export interface Conversation {
  id: string;
  name: string;
  avatarAsset?: string | null;
  lastMessage: string;
  timeLabel: string;
  lastMessageAt?: string;
  online?: boolean;
  unread: number;
  pinned?: boolean;
  isGroup?: boolean;
  muted?: boolean;
  previewKind?: MessageKind;
  delivery?: DeliveryStage;
  recipientId?: string;
  description?: string;
  members?: string[];
  groupAdmins?: string[];
}

export interface UserProfile {
  uid: string;
  displayName: string;
  about: string;
  phoneNumber: string;
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

export type AuthStep = 'splash' | 'phone' | 'otp' | 'profile' | 'complete';

export type InboxFilter = 'all' | 'unread' | 'groups';

export type DesktopNavTab = 'chats' | 'calls' | 'status' | 'starred' | 'settings';
