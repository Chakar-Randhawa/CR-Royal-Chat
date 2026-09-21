import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateAuthProfile,
  deleteUser,
} from 'firebase/auth';
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  isUsernameAvailable,
  normalizeUsername,
  releaseUsername,
  reserveUsername,
  searchUsersByUsername,
  validateUsername,
} from '../lib/username';
import { CallSession, createCallDoc, writeAnswer } from '../lib/webrtc';
import {
  deriveSharedKey,
  encryptString,
  decryptString,
  exportPrivateKey,
  exportPublicKey,
  exportRawAesKey,
  fingerprintPublicKey,
  generateKeyPair,
  generateRandomAesKey,
  importPrivateKey,
  importPublicKey,
  importRawAesKey,
  loadStoredKeyPair,
  storeKeyPair,
  clearStoredKeyPair,
  unwrapRawKey,
  wrapRawKey,
  WrappedKey,
} from '../lib/crypto';
import {
  ActiveCall,
  AppSettings,
  AuthStep,
  CallType,
  Conversation,
  DesktopNavTab,
  InboxFilter,
  Message,
  MessageReply,
  UserProfile,
} from '../types';

interface ToastInfo {
  id: string;
  message: string;
  icon?: 'check' | 'copy' | 'lock' | 'info';
}

interface InAppNotification {
  chatId: string;
  senderName: string;
  avatarUrl?: string | null;
  text: string;
  timestamp: string;
}

interface AppContextType {
  authStep: AuthStep;
  setAuthStep: (step: AuthStep) => void;
  authError: string | null;
  authLoading: boolean;
  signUp: (params: { email: string; password: string; username: string; displayName: string }) => Promise<void>;
  logIn: (params: { email: string; password: string }) => Promise<void>;
  logOut: () => Promise<void>;
  currentUser: UserProfile;
  settings: AppSettings;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  selectedDesktopTab: DesktopNavTab;
  setSelectedDesktopTab: (tab: DesktopNavTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  inboxFilter: InboxFilter;
  setInboxFilter: (filter: InboxFilter) => void;
  typingContacts: Record<string, boolean>;
  setTypingStatus: (conversationId: string, isTyping: boolean) => void;
  toasts: ToastInfo[];
  inAppNotification: InAppNotification | null;
  dismissInAppNotification: () => void;
  showToast: (message: string, icon?: 'check' | 'copy' | 'lock' | 'info') => void;
  sendTextMessage: (conversationId: string, text: string, replyTo?: MessageReply) => void;
  sendImageMessage: (conversationId: string, asset: string, caption?: string) => void;
  sendVoiceMessage: (conversationId: string, durationSeconds: number, asset: string) => void;
  addReaction: (conversationId: string, messageId: string, emoji: string) => void;
  deleteMessage: (conversationId: string, messageId: string, forEveryone?: boolean) => void;
  toggleStarMessage: (conversationId: string, messageId: string) => void;
  markConversationRead: (conversationId: string) => void;
  togglePinConversation: (conversationId: string) => void;
  toggleMuteConversation: (conversationId: string) => void;
  toggleBlockConversation: (conversationId: string) => void;
  clearChatHistory: (conversationId: string) => Promise<void>;
  createGroup: (name: string, memberUids: string[]) => Promise<string>;
  updateGroupInfo: (groupId: string, name?: string, description?: string) => void;
  addGroupMembers: (groupId: string, users: { uid: string; displayName: string; username?: string; avatarUrl?: string | null }[]) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  searchUsers: (usernamePrefix: string) => Promise<import('../lib/username').UserSearchResult[]>;
  startNewChat: (contact: { id: string; name: string; avatarAsset?: string | null; about?: string; username?: string }) => Promise<string>;
  updateSettings: (partial: Partial<AppSettings>) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  clearCache: () => void;
  exportBackup: () => string;
  deleteAccount: () => Promise<void>;
  // Real WebRTC calling (Firestore-signaled, STUN-only — see lib/webrtc.ts)
  activeCall: ActiveCall | null;
  localCallStream: MediaStream | null;
  remoteCallStream: MediaStream | null;
  startCall: (conversationId: string, type: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  toggleCallMute: () => void;
  toggleCallCamera: () => void;
}

const STORAGE_KEYS = {
  SETTINGS: 'royalchat_app_settings_v1',
};

const EMPTY_USER: UserProfile = {
  uid: '',
  username: '',
  email: '',
  displayName: '',
  about: '',
  avatarUrl: undefined,
  publicKey: '',
  isOnline: false,
};

const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'system',
  readReceipts: true,
  lastSeen: true,
  appLock: false,
  notificationsEnabled: true,
  messagePreviews: true,
  quietHours: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  savePhotos: true,
  downloadOnWifi: true,
  downloadOnCellular: false,
  enterToSend: false,
  fontScale: 1.0,
  automaticBackups: true,
  lastBackupTime: undefined,
  cacheMb: {
    photos: 0,
    voice: 0,
    files: 0,
  },
};

function makeChatId(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('__');
}

function formatTimeLabel(ms?: number): string {
  if (!ms) return '';
  const d = new Date(ms);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function isWithinQuietHours(settings: AppSettings): boolean {
  if (!settings.quietHours) return false;
  const [startH, startM] = settings.quietHoursStart.split(':').map(Number);
  const [endH, endM] = settings.quietHoursEnd.split(':').map(Number);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) {
    // Same-day window, e.g. 09:00-17:00
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }
  // Overnight window, e.g. 22:00-07:00
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authStep, setAuthStepState] = useState<AuthStep>('loading');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile>(EMPTY_USER);

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const settingsRef = useRef<AppSettings>(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const conversationsRef = useRef<Conversation[]>([]);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [typingContacts, setTypingContacts] = useState<Record<string, boolean>>({});

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedDesktopTab, setSelectedDesktopTab] = useState<DesktopNavTab>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all');
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [inAppNotification, setInAppNotification] = useState<InAppNotification | null>(null);

  // Raw chat documents keyed by chat id, kept alongside the UI-friendly
  // `conversations` list so message read-receipts / unread bumps can be
  // computed without re-reading Firestore.
  const chatDocsRef = useRef<Record<string, any>>({});
  const pendingMessagesRef = useRef<Record<string, Message[]>>({});
  const currentUserRef = useRef<UserProfile>(EMPTY_USER);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  // -----------------------------------------------------------------------
  // Real end-to-end encryption. See lib/crypto.ts for the crypto itself;
  // this section wires it into auth + message send/receive. Keys are kept
  // only in refs (never in React state) since CryptoKey objects have no
  // business triggering re-renders.
  // -----------------------------------------------------------------------
  const myKeyPairRef = useRef<{ privateKey: CryptoKey; publicKey: CryptoKey; fingerprint: string } | null>(null);
  const myKeysReadyPromiseRef = useRef<Promise<{ privateKey: CryptoKey; publicKey: CryptoKey; fingerprint: string }> | null>(
    null
  );
  const peerPublicKeyCacheRef = useRef<Record<string, CryptoKey>>({});
  const sharedKeyCacheRef = useRef<Record<string, CryptoKey>>({});
  const groupKeyCacheRef = useRef<Record<string, CryptoKey>>({});

  /** Generates (first login on this browser) or loads (returning) this account's key pair, and makes sure Firestore has our current public key. */
  const ensureMyKeys = useCallback((uid: string) => {
    if (myKeyPairRef.current) return Promise.resolve(myKeyPairRef.current);
    if (myKeysReadyPromiseRef.current) return myKeysReadyPromiseRef.current;

    const setup = (async () => {
      const stored = loadStoredKeyPair(uid);
      let publicKeyJwk: JsonWebKey;
      let privateKey: CryptoKey;
      let publicKey: CryptoKey;

      if (stored) {
        publicKeyJwk = stored.publicKeyJwk;
        privateKey = await importPrivateKey(stored.privateKeyJwk);
        publicKey = await importPublicKey(stored.publicKeyJwk);
      } else {
        const pair = await generateKeyPair();
        publicKeyJwk = await exportPublicKey(pair.publicKey);
        const privateKeyJwk = await exportPrivateKey(pair.privateKey);
        storeKeyPair(uid, { publicKeyJwk, privateKeyJwk });
        privateKey = pair.privateKey;
        publicKey = pair.publicKey;
      }

      // Make sure Firestore reflects the public key that matches the
      // private key we actually hold in THIS browser — if this device's
      // stored key differs from what's on the server (e.g. a newer
      // device already overwrote it), other people need our current
      // public key to keep encrypting to something we can read.
      const fingerprint = await fingerprintPublicKey(publicKeyJwk);
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      const serverJwkStr = snap.data()?.publicKeyJwk;
      const localJwkStr = JSON.stringify(publicKeyJwk);
      if (serverJwkStr !== localJwkStr) {
        await updateDoc(userRef, { publicKeyJwk: localJwkStr, publicKey: fingerprint }).catch(() => {});
      }

      const result = { privateKey, publicKey, fingerprint };
      myKeyPairRef.current = result;
      return result;
    })();

    myKeysReadyPromiseRef.current = setup;
    return setup;
  }, []);

  /** Fetches (and caches) another account's ECDH public key from Firestore. */
  const getPeerPublicKey = useCallback(async (uid: string): Promise<CryptoKey | null> => {
    if (peerPublicKeyCacheRef.current[uid]) return peerPublicKeyCacheRef.current[uid];
    const snap = await getDoc(doc(db, 'users', uid));
    const jwkStr = snap.data()?.publicKeyJwk;
    if (!jwkStr) return null;
    const key = await importPublicKey(JSON.parse(jwkStr));
    peerPublicKeyCacheRef.current[uid] = key;
    return key;
  }, []);

  /** The pairwise AES-GCM key for a 1:1 chat — both sides derive the identical key independently. */
  const getSharedKeyWithPeer = useCallback(
    async (uid: string): Promise<CryptoKey | null> => {
      if (sharedKeyCacheRef.current[uid]) return sharedKeyCacheRef.current[uid];
      const myKeys = await ensureMyKeys(currentUserRef.current.uid);
      const peerPublic = await getPeerPublicKey(uid);
      if (!peerPublic) return null;
      const shared = await deriveSharedKey(myKeys.privateKey, peerPublic);
      sharedKeyCacheRef.current[uid] = shared;
      return shared;
    },
    [ensureMyKeys, getPeerPublicKey]
  );

  /** Unwraps (or returns the cached) AES-GCM group key for a group chat. */
  const getGroupKey = useCallback(
    async (chatId: string): Promise<CryptoKey | null> => {
      if (groupKeyCacheRef.current[chatId]) return groupKeyCacheRef.current[chatId];
      const uid = currentUserRef.current.uid;
      const chatRaw = chatDocsRef.current[chatId];
      const wrapped: { wrappedBy: string; iv: string; ciphertext: string } | undefined =
        chatRaw?.groupKeyWrapped?.[uid];
      if (!wrapped) return null;

      const myKeys = await ensureMyKeys(uid);
      const wrapperPublic = await getPeerPublicKey(wrapped.wrappedBy);
      if (!wrapperPublic) return null;
      const wrappingKey = await deriveSharedKey(myKeys.privateKey, wrapperPublic);
      const rawKey = await unwrapRawKey(wrappingKey, { iv: wrapped.iv, ciphertext: wrapped.ciphertext });
      const groupKey = await importRawAesKey(rawKey);
      groupKeyCacheRef.current[chatId] = groupKey;
      return groupKey;
    },
    [ensureMyKeys, getPeerPublicKey]
  );

  /** Resolves the right AES-GCM key (pairwise or group) to encrypt/decrypt content for a given chat. */
  const getKeyForConversation = useCallback(
    async (conversationId: string): Promise<CryptoKey | null> => {
      const uid = currentUserRef.current.uid;
      const chatRaw = chatDocsRef.current[conversationId];
      if (!chatRaw) return null;
      if (chatRaw.isGroup) return getGroupKey(conversationId);
      const otherUid = (chatRaw.participantIds || []).find((id: string) => id !== uid);
      if (!otherUid) return null;
      return getSharedKeyWithPeer(otherUid);
    },
    [getGroupKey, getSharedKeyWithPeer]
  );

  const showToast = useCallback((message: string, icon: 'check' | 'copy' | 'lock' | 'info' = 'check') => {
    const id = Date.now().toString() + Math.random();
    setToasts((prev) => [...prev, { id, message, icon }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  const dismissInAppNotification = useCallback(() => {
    setInAppNotification(null);
  }, []);

  // ---------------------------------------------------------------------
  // Auth: real Firebase Authentication (email + password). No phone
  // numbers, no OTP/SMS step anywhere in this flow.
  // ---------------------------------------------------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setCurrentUser(EMPTY_USER);
        setAuthStepState('splash');
        return;
      }
      try {
        const profileSnap = await getDoc(doc(db, 'users', fbUser.uid));
        if (profileSnap.exists()) {
          const data = profileSnap.data() as any;
          const keys = await ensureMyKeys(fbUser.uid).catch(() => null);
          setCurrentUser({
            uid: fbUser.uid,
            username: data.username || '',
            email: data.email || fbUser.email || '',
            displayName: data.displayName || fbUser.displayName || '',
            about: data.about || 'Available on Royal Chat',
            avatarUrl: data.avatarUrl,
            publicKey: keys?.fingerprint || data.publicKey || '',
            isOnline: true,
          });
          setAuthStepState('complete');
          await updateDoc(doc(db, 'users', fbUser.uid), {
            isOnline: settingsRef.current.lastSeen,
          }).catch(() => {});
        } else {
          // Signed in with Firebase Auth but no profile document yet
          // (e.g. sign-up flow interrupted mid-way). Send them back to
          // finish creating their profile rather than showing a broken
          // logged-in-but-empty screen.
          setAuthStepState('signup');
        }
      } catch {
        setAuthStepState('splash');
      }
    });
    return () => unsub();
  }, [ensureMyKeys]);

  // Mark the user offline when they close the tab (best-effort; Firestore
  // has no built-in presence system the way the Realtime Database does).
  useEffect(() => {
    const handleUnload = () => {
      const uid = currentUserRef.current.uid;
      if (!uid) return;
      updateDoc(doc(db, 'users', uid), { isOnline: false }).catch(() => {});
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  // "Last seen / online" privacy toggle: broadcast (or stop broadcasting)
  // online status the moment the user flips it, not just on next login.
  useEffect(() => {
    const uid = currentUserRef.current.uid;
    if (!uid || authStep !== 'complete') return;
    updateDoc(doc(db, 'users', uid), { isOnline: settings.lastSeen }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.lastSeen, authStep, currentUser.uid]);

  const signUp = useCallback(
    async ({ email, password, username, displayName }: { email: string; password: string; username: string; displayName: string }) => {
      setAuthError(null);
      setAuthLoading(true);
      const usernameLower = normalizeUsername(username);
      const usernameError = validateUsername(username);
      if (usernameError) {
        setAuthLoading(false);
        setAuthError(usernameError);
        throw new Error(usernameError);
      }
      try {
        const available = await isUsernameAvailable(usernameLower);
        if (!available) {
          throw new Error('That username is already taken. Try another one.');
        }

        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        try {
          await reserveUsername(usernameLower, cred.user.uid);
        } catch (reserveErr) {
          // Someone grabbed it in the split second between the check and
          // the account being created — extremely rare, but handle it.
          await deleteUser(cred.user).catch(() => {});
          throw new Error('That username was just taken. Please choose another.');
        }

        // Generate this account's real ECDH key pair now, before writing
        // the profile doc, so publicKeyJwk is set from the very first
        // write (no separate "backfill" step needed).
        const pair = await generateKeyPair();
        const publicKeyJwk = await exportPublicKey(pair.publicKey);
        const privateKeyJwk = await exportPrivateKey(pair.privateKey);
        storeKeyPair(cred.user.uid, { publicKeyJwk, privateKeyJwk });
        const fingerprint = await fingerprintPublicKey(publicKeyJwk);
        myKeyPairRef.current = { privateKey: pair.privateKey, publicKey: pair.publicKey, fingerprint };

        const profile = {
          uid: cred.user.uid,
          username,
          usernameLower,
          email: email.trim(),
          displayName: displayName.trim() || username,
          about: 'Available on Royal Chat',
          publicKey: fingerprint,
          publicKeyJwk: JSON.stringify(publicKeyJwk),
          isOnline: settingsRef.current.lastSeen,
          createdAt: Date.now(),
        };
        await setDoc(doc(db, 'users', cred.user.uid), profile);
        await updateAuthProfile(cred.user, { displayName: profile.displayName }).catch(() => {});

        setCurrentUser({
          uid: cred.user.uid,
          username: profile.username,
          email: profile.email,
          displayName: profile.displayName,
          about: profile.about,
          publicKey: profile.publicKey,
          isOnline: true,
        });
        setAuthStepState('complete');
        showToast('Welcome to Royal Chat!', 'check');
      } catch (err: any) {
        const message = friendlyAuthError(err);
        setAuthError(message);
        throw new Error(message);
      } finally {
        setAuthLoading(false);
      }
    },
    [showToast]
  );

  const logIn = useCallback(async ({ email, password }: { email: string; password: string }) => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // onAuthStateChanged picks up the rest (loads profile, sets step).
    } catch (err: any) {
      const message = friendlyAuthError(err);
      setAuthError(message);
      throw new Error(message);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logOut = useCallback(async () => {
    const uid = currentUserRef.current.uid;
    if (uid) {
      await updateDoc(doc(db, 'users', uid), { isOnline: false }).catch(() => {});
    }
    await signOut(auth);
    myKeyPairRef.current = null;
    myKeysReadyPromiseRef.current = null;
    peerPublicKeyCacheRef.current = {};
    sharedKeyCacheRef.current = {};
    groupKeyCacheRef.current = {};
    setConversations([]);
    setMessages({});
    setActiveConversationId(null);
    setAuthStepState('splash');
  }, []);

  const setAuthStep = useCallback((step: AuthStep) => {
    setAuthStepState(step);
  }, []);

  const activeConversationIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // ---------------------------------------------------------------------
  // Real-time chats: one Firestore listener for every chat the signed-in
  // user participates in. Replaces the old local/simulated conversation
  // list entirely.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (authStep !== 'complete' || !currentUser.uid) return;
    const uid = currentUser.uid;

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participantIds', 'array-contains', uid)
    );

    const unsub = onSnapshot(chatsQuery, async (snap) => {
      const nextTyping: Record<string, boolean> = {};

      const list: Conversation[] = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data() as any;
          const previous = chatDocsRef.current[d.id];
          chatDocsRef.current[d.id] = data;

          const otherUid = (data.participantIds || []).find((id: string) => id !== uid);
          const otherInfo = otherUid ? data.participantsInfo?.[otherUid] : undefined;

          const typingMap = data.typing || {};
          const someoneElseTyping = Object.entries(typingMap).some(
            ([id, val]) => id !== uid && !!val
          );
          if (someoneElseTyping) nextTyping[d.id] = true;

          // Decrypt the chat-list preview (it's encrypted with the same
          // per-chat key as the messages — see bumpChatAfterSend).
          let lastMessage = data.lastMessage || 'Say hello 👋';
          if (data.lastMessageEnc) {
            try {
              const key = await getKeyForConversation(d.id);
              lastMessage = key ? await decryptString(key, data.lastMessageEnc) : '🔒 Encrypted message';
            } catch {
              lastMessage = '🔒 Encrypted message';
            }
          }

          // A new incoming message just landed on a chat that isn't the
          // one currently open — surface an in-app notification banner
          // (unless notifications or quiet hours say not to).
          const isNewIncoming =
            previous &&
            data.lastMessageAt &&
            data.lastMessageAt !== previous.lastMessageAt &&
            data.lastMessageSenderId &&
            data.lastMessageSenderId !== uid &&
            d.id !== activeConversationIdRef.current;
          if (isNewIncoming && settingsRef.current.notificationsEnabled && !isWithinQuietHours(settingsRef.current)) {
            setInAppNotification({
              chatId: d.id,
              senderName: data.isGroup
                ? data.participantsInfo?.[data.lastMessageSenderId]?.displayName || data.name || 'Group'
                : otherInfo?.displayName || 'New message',
              avatarUrl: data.isGroup ? data.avatarAsset : otherInfo?.avatarUrl,
              text: settingsRef.current.messagePreviews ? lastMessage : 'New message',
              timestamp: formatTimeLabel(data.lastMessageAt),
            });
          }

          const conversation: Conversation = {
            id: d.id,
            name: data.isGroup ? data.name || 'Group' : otherInfo?.displayName || 'Unknown user',
            avatarAsset: data.isGroup ? data.avatarAsset || null : otherInfo?.avatarUrl || null,
            lastMessage,
            timeLabel: formatTimeLabel(data.lastMessageAt),
            lastMessageAt: data.lastMessageAt,
            online: data.isGroup ? undefined : !!otherInfo?.isOnline,
            unread: data.unreadCount?.[uid] || 0,
            pinned: (data.pinnedBy || []).includes(uid),
            isGroup: !!data.isGroup,
            muted: (data.mutedBy || []).includes(uid),
            blocked: (data.blockedBy || []).includes(uid),
            previewKind: data.lastMessageKind,
            delivery: data.lastMessageSenderId === uid ? computeDeliveryForChat(data, uid) : undefined,
            recipientId: data.isGroup ? undefined : otherUid,
            recipientUsername: data.isGroup ? undefined : otherInfo?.username,
            participantIds: data.participantIds || [],
            description: data.isGroup ? data.description : otherInfo?.about,
            members: data.isGroup
              ? (data.participantIds || []).map(
                  (id: string) => (id === uid ? 'You' : data.participantsInfo?.[id]?.displayName || 'Member')
                )
              : undefined,
            groupAdmins: data.isGroup
              ? (data.groupAdmins || []).map((id: string) =>
                  id === uid ? 'You' : data.participantsInfo?.[id]?.displayName || 'Member'
                )
              : undefined,
          };
          return conversation;
        })
      );

      setConversations(list);
      setTypingContacts(nextTyping);
    });

    return () => unsub();
  }, [authStep, currentUser.uid, getKeyForConversation]);

  // Live presence + profile updates for direct-chat contacts. Firestore
  // has no realtime-database-style presence, so this approximates it by
  // watching each contact's user document for isOnline / profile edits.
  useEffect(() => {
    if (authStep !== 'complete' || !currentUser.uid) return;
    const otherUids = Array.from(
      new Set(
        conversations
          .filter((c) => !c.isGroup && c.recipientId)
          .map((c) => c.recipientId as string)
      )
    );
    if (otherUids.length === 0) return;

    const unsubs = otherUids.slice(0, 30).map((otherUid) =>
      onSnapshot(doc(db, 'users', otherUid), (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as any;
        setConversations((prev) =>
          prev.map((c) =>
            c.recipientId === otherUid
              ? {
                  ...c,
                  online: !!data.isOnline,
                  name: data.displayName || c.name,
                  avatarAsset: data.avatarUrl || c.avatarAsset,
                }
              : c
          )
        );
      })
    );

    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStep, currentUser.uid, conversations.map((c) => c.recipientId).join(',')]);

  // ---------------------------------------------------------------------
  // Real-time messages for the currently open conversation only (keeps
  // reads/costs down — there is no need to listen to every chat's full
  // message history at once).
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (!activeConversationId || authStep !== 'complete') return;
    const uid = currentUser.uid;
    const conversationId = activeConversationId;

    const messagesQuery = query(
      collection(db, 'chats', conversationId, 'messages'),
      orderBy('sentAt', 'asc')
    );

    const unsub = onSnapshot(messagesQuery, async (snap) => {
      const chatRaw = chatDocsRef.current[conversationId];
      const confirmedIds = new Set<string>();
      const key = await getKeyForConversation(conversationId);

      const list: Message[] = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data() as any;
          confirmedIds.add(d.id);
          const isMine = data.senderId === uid;

          let text: string | undefined = data.text;
          let asset: string | undefined = data.asset;
          let voiceDuration: number | undefined = data.voiceDuration;
          let replyTo = data.replyTo || undefined;
          let decryptFailed = false;

          if (data.contentEnc && !data.isDeleted) {
            if (!key) {
              decryptFailed = true;
            } else {
              try {
                const decoded = JSON.parse(await decryptString(key, data.contentEnc));
                text = decoded.text;
                asset = decoded.asset;
                voiceDuration = decoded.voiceDuration ?? voiceDuration;
                replyTo = decoded.replyTo;
              } catch {
                decryptFailed = true;
              }
            }
          }

          return {
            id: d.id,
            senderId: data.senderId,
            senderName: data.senderName,
            sentAt: formatTimeLabel(data.sentAt),
            sentAtMs: data.sentAt,
            kind: data.kind,
            text,
            asset,
            voiceDuration,
            isMine,
            delivery: isMine
              ? chatRaw
                ? computeDeliveryForMessage(data.sentAt, chatRaw, uid)
                : 'sent'
              : undefined,
            replyTo,
            reactions: data.reactions || {},
            isDeleted: !!data.isDeleted,
            isStarred: (data.starredBy || []).includes(uid),
            decryptFailed,
          } as Message;
        })
      );

      const pending = (pendingMessagesRef.current[conversationId] || []).filter(
        (m) => !confirmedIds.has(m.id)
      );
      pendingMessagesRef.current[conversationId] = pending;

      setMessages((prev) => ({ ...prev, [conversationId]: [...list, ...pending] }));
    });

    return () => unsub();
  }, [activeConversationId, authStep, currentUser.uid, getKeyForConversation]);

  // Re-run the delivery-status calculation whenever the chat doc changes
  // (e.g. the other person just read the conversation) without waiting
  // for a new message to arrive.
  useEffect(() => {
    if (!activeConversationId) return;
    const conversationId = activeConversationId;
    const uid = currentUser.uid;
    const chatRaw = chatDocsRef.current[conversationId];
    if (!chatRaw) return;
    setMessages((prev) => {
      const list = prev[conversationId];
      if (!list) return prev;
      return {
        ...prev,
        [conversationId]: list.map((m) =>
          m.isMine ? { ...m, delivery: computeDeliveryForMessage(m.sentAtMs, chatRaw, uid) } : m
        ),
      };
    });
  }, [conversations, activeConversationId, currentUser.uid]);

  function computeDeliveryForMessage(sentAtMs: number | undefined, chatRaw: any, uid: string) {
    if (!sentAtMs) return 'sending' as const;
    // If the viewer has turned off read receipts, we also don't show them
    // when others have read their messages (mirrors WhatsApp's mutual
    // on/off behavior for this setting).
    if (!settingsRef.current.readReceipts) return 'sent' as const;
    const others = (chatRaw.participantIds || []).filter((id: string) => id !== uid);
    const lastReadAt = chatRaw.lastReadAt || {};
    const allRead = others.length > 0 && others.every((o: string) => (lastReadAt[o] || 0) >= sentAtMs);
    return allRead ? ('read' as const) : ('sent' as const);
  }

  function computeDeliveryForChat(chatRaw: any, uid: string) {
    return computeDeliveryForMessage(chatRaw.lastMessageAt, chatRaw, uid);
  }

  const setTypingStatus = useCallback(
    (conversationId: string, isTyping: boolean) => {
      const uid = currentUserRef.current.uid;
      if (!uid || !conversationId) return;
      updateDoc(doc(db, 'chats', conversationId), {
        [`typing.${uid}`]: isTyping,
      }).catch(() => {});
    },
    []
  );

  const markConversationRead = useCallback(
    (conversationId: string) => {
      const uid = currentUserRef.current.uid;
      if (!uid) return;
      const update: Record<string, any> = {
        [`unreadCount.${uid}`]: 0,
      };
      // Only broadcast that we've read the chat if the user has read
      // receipts turned on — otherwise the other participant would keep
      // seeing "read" ticks even though the setting says we opted out.
      if (settingsRef.current.readReceipts) {
        update[`lastReadAt.${uid}`] = Date.now();
      }
      updateDoc(doc(db, 'chats', conversationId), update).catch(() => {});
    },
    []
  );

  async function bumpChatAfterSend(
    conversationId: string,
    opts: { lastMessage: string; lastMessageKind: string; sentAt: number }
  ) {
    const chatRaw = chatDocsRef.current[conversationId];
    const uid = currentUserRef.current.uid;
    const others: string[] = (chatRaw?.participantIds || []).filter((id: string) => id !== uid);
    const update: Record<string, any> = {
      lastMessageAt: opts.sentAt,
      lastMessageKind: opts.lastMessageKind,
      lastMessageSenderId: uid,
    };
    // The chat-list preview text is encrypted with the same per-chat key
    // as the messages themselves, so it stays real end-to-end privacy —
    // not just the message thread.
    const key = await getKeyForConversation(conversationId);
    if (key) {
      update.lastMessageEnc = await encryptString(key, opts.lastMessage);
    } else {
      update.lastMessage = opts.lastMessage;
    }
    others.forEach((id) => {
      update[`unreadCount.${id}`] = increment(1);
    });
    await updateDoc(doc(db, 'chats', conversationId), update).catch(() => {});
  }

  function pushPendingMessage(conversationId: string, msg: Message) {
    pendingMessagesRef.current[conversationId] = [
      ...(pendingMessagesRef.current[conversationId] || []),
      msg,
    ];
    setMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), msg],
    }));
  }

  function isConversationBlockedByMe(conversationId: string): boolean {
    return !!conversationsRef.current.find((c) => c.id === conversationId)?.blocked;
  }

  /** Encrypts the message content envelope (text/asset/voiceDuration/replyTo) for a chat, if a key is available. */
  async function encryptMessageContent(
    conversationId: string,
    content: { text?: string; asset?: string; voiceDuration?: number; replyTo?: MessageReply }
  ): Promise<{ contentEnc?: WrappedKey; plain?: typeof content }> {
    const key = await getKeyForConversation(conversationId);
    if (!key) {
      // No key available yet (e.g. peer hasn't finished key setup) —
      // fail open to plaintext rather than silently dropping the
      // message, but this should be rare/transient in practice.
      return { plain: content };
    }
    const contentEnc = await encryptString(key, JSON.stringify(content));
    return { contentEnc };
  }

  const sendTextMessage = useCallback(
    async (conversationId: string, text: string, replyTo?: MessageReply) => {
      const uid = currentUserRef.current.uid;
      if (!uid || !text.trim()) return;
      if (isConversationBlockedByMe(conversationId)) {
        showToast('Unblock this contact to send messages.', 'info');
        return;
      }
      const now = Date.now();
      const ref = doc(collection(db, 'chats', conversationId, 'messages'));
      const trimmed = text.trim();

      pushPendingMessage(conversationId, {
        id: ref.id,
        senderId: uid,
        senderName: currentUserRef.current.displayName,
        sentAt: formatTimeLabel(now),
        sentAtMs: now,
        kind: 'text',
        text: trimmed,
        isMine: true,
        delivery: 'sending',
        replyTo,
        reactions: {},
      });

      try {
        const { contentEnc, plain } = await encryptMessageContent(conversationId, { text: trimmed, replyTo });
        await setDoc(ref, {
          id: ref.id,
          senderId: uid,
          senderName: currentUserRef.current.displayName,
          sentAt: now,
          kind: 'text',
          ...(contentEnc ? { contentEnc } : { text: plain?.text, replyTo: plain?.replyTo || null }),
          reactions: {},
          isDeleted: false,
          starredBy: [],
        });
        await bumpChatAfterSend(conversationId, { lastMessage: trimmed, lastMessageKind: 'text', sentAt: now });
      } catch {
        showToast('Message failed to send. Check your connection.', 'info');
      }
    },
    [showToast]
  );

  const sendImageMessage = useCallback(
    async (conversationId: string, asset: string, caption?: string) => {
      const uid = currentUserRef.current.uid;
      if (!uid) return;
      if (isConversationBlockedByMe(conversationId)) {
        showToast('Unblock this contact to send messages.', 'info');
        return;
      }

      // Images are stored inline as data URLs (no Firebase Storage
      // needed, keeping the whole app on Firebase's free tier). Firestore
      // caps a document at 1MB, so very large photos are rejected with a
      // clear message instead of silently failing. Encryption adds a
      // small overhead, so the raw-asset ceiling is kept a bit under 1MB.
      if (asset.length > 650_000) {
        showToast('That photo is too large — please choose a smaller image.', 'info');
        return;
      }

      const now = Date.now();
      const ref = doc(collection(db, 'chats', conversationId, 'messages'));

      pushPendingMessage(conversationId, {
        id: ref.id,
        senderId: uid,
        senderName: currentUserRef.current.displayName,
        sentAt: formatTimeLabel(now),
        sentAtMs: now,
        kind: 'image',
        asset,
        text: caption,
        isMine: true,
        delivery: 'sending',
        reactions: {},
      });

      try {
        const { contentEnc, plain } = await encryptMessageContent(conversationId, { asset, text: caption });
        await setDoc(ref, {
          id: ref.id,
          senderId: uid,
          senderName: currentUserRef.current.displayName,
          sentAt: now,
          kind: 'image',
          ...(contentEnc ? { contentEnc } : { asset: plain?.asset, text: plain?.text || null }),
          reactions: {},
          isDeleted: false,
          starredBy: [],
        });
        await bumpChatAfterSend(conversationId, {
          lastMessage: caption ? caption : 'Sent a photo',
          lastMessageKind: 'image',
          sentAt: now,
        });
      } catch {
        showToast('Photo failed to send. Check your connection.', 'info');
      }
    },
    [showToast]
  );

  const sendVoiceMessage = useCallback(
    async (conversationId: string, durationSeconds: number, asset: string) => {
      const uid = currentUserRef.current.uid;
      if (!uid) return;
      if (isConversationBlockedByMe(conversationId)) {
        showToast('Unblock this contact to send messages.', 'info');
        return;
      }

      // Same free-tier constraint as photos: audio is stored inline as a
      // data URL (no Firebase Storage needed), so it must fit in a single
      // Firestore document (1MB cap), with headroom for encryption overhead.
      if (asset.length > 650_000) {
        showToast('That voice message is too long — please record a shorter one.', 'info');
        return;
      }

      const now = Date.now();
      const ref = doc(collection(db, 'chats', conversationId, 'messages'));

      pushPendingMessage(conversationId, {
        id: ref.id,
        senderId: uid,
        senderName: currentUserRef.current.displayName,
        sentAt: formatTimeLabel(now),
        sentAtMs: now,
        kind: 'voice',
        asset,
        voiceDuration: durationSeconds,
        isMine: true,
        delivery: 'sending',
        reactions: {},
      });

      try {
        const { contentEnc, plain } = await encryptMessageContent(conversationId, {
          asset,
          voiceDuration: durationSeconds,
        });
        await setDoc(ref, {
          id: ref.id,
          senderId: uid,
          senderName: currentUserRef.current.displayName,
          sentAt: now,
          kind: 'voice',
          voiceDuration: durationSeconds,
          ...(contentEnc ? { contentEnc } : { asset: plain?.asset }),
          reactions: {},
          isDeleted: false,
          starredBy: [],
        });
        await bumpChatAfterSend(conversationId, {
          lastMessage: `Voice message · 0:${durationSeconds.toString().padStart(2, '0')}`,
          lastMessageKind: 'voice',
          sentAt: now,
        });
      } catch {
        showToast('Voice message failed to send. Check your connection.', 'info');
      }
    },
    [showToast]
  );

  const addReaction = useCallback((conversationId: string, messageId: string, emoji: string) => {
    const uid = currentUserRef.current.uid;
    if (!uid) return;
    const existing = messages[conversationId]?.find((m) => m.id === messageId);
    const alreadyReacted = existing?.reactions?.[uid] === emoji;
    updateDoc(doc(db, 'chats', conversationId, 'messages', messageId), {
      [`reactions.${uid}`]: alreadyReacted ? deleteField() : emoji,
    }).catch(() => {});
  }, [messages]);

  const deleteMessage = useCallback(
    (conversationId: string, messageId: string, forEveryone = false) => {
      const ref = doc(db, 'chats', conversationId, 'messages', messageId);
      if (forEveryone) {
        updateDoc(ref, {
          isDeleted: true,
          contentEnc: deleteField(),
          text: deleteField(),
          asset: deleteField(),
        }).catch(() => {});
      } else {
        // "Delete for me": just drop it from local state — Firestore
        // rules only allow the sender to hard-delete their own doc, and
        // a per-viewer hidden-message list is out of scope here.
        setMessages((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).filter((m) => m.id !== messageId),
        }));
      }
      showToast('Message deleted', 'check');
    },
    [showToast]
  );

  const toggleStarMessage = useCallback((conversationId: string, messageId: string) => {
    const uid = currentUserRef.current.uid;
    if (!uid) return;
    const existing = messages[conversationId]?.find((m) => m.id === messageId);
    const ref = doc(db, 'chats', conversationId, 'messages', messageId);
    if (existing?.isStarred) {
      getDoc(ref).then((snap) => {
        const starredBy: string[] = (snap.data()?.starredBy || []).filter((id: string) => id !== uid);
        updateDoc(ref, { starredBy });
      });
    } else {
      getDoc(ref).then((snap) => {
        const starredBy: string[] = snap.data()?.starredBy || [];
        if (!starredBy.includes(uid)) starredBy.push(uid);
        updateDoc(ref, { starredBy });
      });
    }
    showToast('Starred messages updated', 'info');
  }, [messages, showToast]);

  const togglePinConversation = useCallback((conversationId: string) => {
    const uid = currentUserRef.current.uid;
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!uid || !conversation) return;
    const ref = doc(db, 'chats', conversationId);
    if (conversation.pinned) {
      getDoc(ref).then((snap) => {
        const pinnedBy: string[] = (snap.data()?.pinnedBy || []).filter((id: string) => id !== uid);
        updateDoc(ref, { pinnedBy });
      });
    } else {
      getDoc(ref).then((snap) => {
        const pinnedBy: string[] = snap.data()?.pinnedBy || [];
        if (!pinnedBy.includes(uid)) pinnedBy.push(uid);
        updateDoc(ref, { pinnedBy });
      });
    }
  }, [conversations]);

  const toggleMuteConversation = useCallback((conversationId: string) => {
    const uid = currentUserRef.current.uid;
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!uid || !conversation) return;
    const ref = doc(db, 'chats', conversationId);
    if (conversation.muted) {
      getDoc(ref).then((snap) => {
        const mutedBy: string[] = (snap.data()?.mutedBy || []).filter((id: string) => id !== uid);
        updateDoc(ref, { mutedBy });
      });
    } else {
      getDoc(ref).then((snap) => {
        const mutedBy: string[] = snap.data()?.mutedBy || [];
        if (!mutedBy.includes(uid)) mutedBy.push(uid);
        updateDoc(ref, { mutedBy });
      });
    }
  }, [conversations]);

  // Blocking is enforced client-side only (it stops you from sending to
  // someone you blocked); it does not use Firestore rules to stop them
  // from sending to you, so treat it as a personal "hide/mute harder"
  // control rather than a guarantee the other person can't reach you.
  const toggleBlockConversation = useCallback((conversationId: string) => {
    const uid = currentUserRef.current.uid;
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!uid || !conversation) return;
    const ref = doc(db, 'chats', conversationId);
    if (conversation.blocked) {
      getDoc(ref).then((snap) => {
        const blockedBy: string[] = (snap.data()?.blockedBy || []).filter((id: string) => id !== uid);
        updateDoc(ref, { blockedBy });
        showToast(`Unblocked ${conversation.name}`, 'check');
      });
    } else {
      getDoc(ref).then((snap) => {
        const blockedBy: string[] = snap.data()?.blockedBy || [];
        if (!blockedBy.includes(uid)) blockedBy.push(uid);
        updateDoc(ref, { blockedBy });
        showToast(`Blocked ${conversation.name}`, 'info');
      });
    }
  }, [conversations, showToast]);

  // Actually deletes every message document in the chat (not just a
  // toast) — this only clears your own view; Firestore has no
  // per-viewer "hide" concept here, so for a 1:1 chat this clears the
  // history for both participants.
  const clearChatHistory = useCallback(async (conversationId: string) => {
    try {
      const messagesRef = collection(db, 'chats', conversationId, 'messages');
      const snap = await getDocs(messagesRef);
      await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, 'chats', conversationId, 'messages', d.id))));
      await updateDoc(doc(db, 'chats', conversationId), {
        lastMessage: 'Chat history cleared',
        lastMessageKind: 'text',
      });
      setMessages((prev) => ({ ...prev, [conversationId]: [] }));
      showToast('Chat history cleared', 'check');
    } catch {
      showToast('Could not clear chat history. Check your connection.', 'info');
    }
  }, [showToast]);

  const searchUsers = useCallback(
    (usernamePrefix: string) => searchUsersByUsername(usernamePrefix, currentUserRef.current.uid),
    []
  );

  const startNewChat = useCallback(
    async (contact: { id: string; name: string; avatarAsset?: string | null; about?: string; username?: string }) => {
      const uid = currentUserRef.current.uid;
      const chatId = makeChatId(uid, contact.id);
      const ref = doc(db, 'chats', chatId);
      const existing = await getDoc(ref);
      if (!existing.exists()) {
        const payload = {
          id: chatId,
          isGroup: false,
          participantIds: [uid, contact.id],
          participantsInfo: {
            [uid]: {
              displayName: currentUserRef.current.displayName,
              username: currentUserRef.current.username,
              avatarUrl: currentUserRef.current.avatarUrl || null,
            },
            [contact.id]: {
              displayName: contact.name,
              username: contact.username || '',
              avatarUrl: contact.avatarAsset || null,
              about: contact.about || '',
            },
          },
          lastMessage: 'Say hello 👋',
          lastMessageAt: Date.now(),
          unreadCount: {},
          pinnedBy: [],
          mutedBy: [],
          typing: {},
          lastReadAt: {},
          createdAt: Date.now(),
        };
        await setDoc(ref, payload);
        // Populate the cache immediately — the live chats listener may
        // not have delivered this new doc yet, and sending a message
        // right away needs participantIds present to pick an encryption
        // key (see getKeyForConversation), otherwise the first message
        // could race ahead of the listener and go out unencrypted.
        chatDocsRef.current[chatId] = payload;
      } else if (!chatDocsRef.current[chatId]) {
        chatDocsRef.current[chatId] = existing.data();
      }
      setActiveConversationId(chatId);
      return chatId;
    },
    []
  );

  const createGroup = useCallback(
    async (name: string, memberUids: string[]) => {
      const uid = currentUserRef.current.uid;
      const ref = doc(collection(db, 'chats'));
      const participantIds = Array.from(new Set([uid, ...memberUids]));

      const participantsInfo: Record<string, any> = {
        [uid]: {
          displayName: currentUserRef.current.displayName,
          username: currentUserRef.current.username,
          avatarUrl: currentUserRef.current.avatarUrl || null,
        },
      };
      // Member display info is filled in as each member's profile is
      // resolved (searchUsers already had it — callers pass full profile
      // objects via startNewChat-style flows for direct chats; for
      // groups we look each member up once here).
      await Promise.all(
        memberUids.map(async (memberUid) => {
          const snap = await getDoc(doc(db, 'users', memberUid));
          if (snap.exists()) {
            const data = snap.data() as any;
            participantsInfo[memberUid] = {
              displayName: data.displayName,
              username: data.username,
              avatarUrl: data.avatarUrl || null,
            };
          }
        })
      );

      // Generate a random group encryption key, then "wrap" (encrypt) it
      // individually for every member using the pairwise ECDH key
      // between me (the creator) and them — so only actual members can
      // ever recover the plaintext group key.
      const myKeys = await ensureMyKeys(uid);
      const groupKey = await generateRandomAesKey();
      const rawGroupKey = await exportRawAesKey(groupKey);
      groupKeyCacheRef.current[ref.id] = groupKey;

      const groupKeyWrapped: Record<string, { wrappedBy: string; iv: string; ciphertext: string }> = {};
      await Promise.all(
        participantIds.map(async (memberUid) => {
          const memberPublic = memberUid === uid ? myKeys.publicKey : await getPeerPublicKey(memberUid);
          if (!memberPublic) return; // member has no key yet — added once they do
          const wrappingKey = await deriveSharedKey(myKeys.privateKey, memberPublic);
          const wrapped = await wrapRawKey(wrappingKey, rawGroupKey);
          groupKeyWrapped[memberUid] = { wrappedBy: uid, ...wrapped };
        })
      );

      const lastMessagePreview = `You created group "${name}"`;
      const lastMessageEnc = await encryptString(groupKey, lastMessagePreview);

      const groupPayload = {
        id: ref.id,
        isGroup: true,
        name,
        participantIds,
        participantsInfo,
        groupAdmins: [uid],
        groupKeyWrapped,
        description: 'Group created on Royal Chat',
        lastMessageEnc,
        lastMessageAt: Date.now(),
        unreadCount: {},
        pinnedBy: [],
        mutedBy: [],
        typing: {},
        lastReadAt: {},
        createdAt: Date.now(),
      };
      await setDoc(ref, groupPayload);
      // Same race-condition guard as startNewChat: make sure the key
      // lookup for an immediate first message doesn't beat the chats
      // listener to populating this chat's cache entry.
      chatDocsRef.current[ref.id] = groupPayload;

      setActiveConversationId(ref.id);
      return ref.id;
    },
    [ensureMyKeys, getPeerPublicKey]
  );

  const updateGroupInfo = useCallback((groupId: string, name?: string, description?: string) => {
    const update: Record<string, any> = {};
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (Object.keys(update).length === 0) return;
    updateDoc(doc(db, 'chats', groupId), update).catch(() => {});
  }, []);

  const addGroupMembers = useCallback(async (groupId: string, users: { uid: string; displayName: string; username?: string; avatarUrl?: string | null }[]) => {
    const chatRef = doc(db, 'chats', groupId);
    const snap = await getDoc(chatRef);
    if (!snap.exists()) return;
    const data = snap.data() as any;
    chatDocsRef.current[groupId] = data;
    const already: string[] = data.participantIds || [];
    const newUsers = users.filter((u) => !already.includes(u.uid));
    if (newUsers.length === 0) {
      showToast('Already in the group', 'info');
      return;
    }
    const participantsInfoUpdate: Record<string, any> = {};
    newUsers.forEach((u) => {
      participantsInfoUpdate[`participantsInfo.${u.uid}`] = {
        displayName: u.displayName,
        username: u.username || '',
        avatarUrl: u.avatarUrl || null,
      };
    });

    // Re-wrap the group's encryption key for each new member, using the
    // pairwise key between me (the person adding them) and them. This
    // requires me to already hold the plaintext group key myself.
    const uid = currentUserRef.current.uid;
    const groupKeyWrappedUpdate: Record<string, any> = {};
    try {
      const myKeys = await ensureMyKeys(uid);
      const groupKey = await getGroupKey(groupId);
      if (groupKey) {
        const rawGroupKey = await exportRawAesKey(groupKey);
        await Promise.all(
          newUsers.map(async (u) => {
            const memberPublic = await getPeerPublicKey(u.uid);
            if (!memberPublic) return;
            const wrappingKey = await deriveSharedKey(myKeys.privateKey, memberPublic);
            const wrapped = await wrapRawKey(wrappingKey, rawGroupKey);
            groupKeyWrappedUpdate[`groupKeyWrapped.${u.uid}`] = { wrappedBy: uid, ...wrapped };
          })
        );
      }
    } catch {
      // If key wrapping fails for any reason, the member is still added
      // to the group below — they just won't be able to decrypt past
      // messages sent before their key was wrapped, same as any missed key.
    }

    await updateDoc(chatRef, {
      participantIds: arrayUnion(...newUsers.map((u) => u.uid)),
      ...participantsInfoUpdate,
      ...groupKeyWrappedUpdate,
    }).catch(() => {});
    showToast(
      newUsers.length === 1
        ? `Added ${newUsers[0].displayName} to group`
        : `Added ${newUsers.length} people to group`,
      'check'
    );
  }, [showToast, ensureMyKeys, getGroupKey, getPeerPublicKey]);

  const leaveGroup = useCallback(async (groupId: string) => {
    const uid = currentUserRef.current.uid;
    if (!uid) return;
    await updateDoc(doc(db, 'chats', groupId), {
      participantIds: arrayRemove(uid),
      groupAdmins: arrayRemove(uid),
    }).catch(() => {});
    showToast('Left group', 'info');
  }, [showToast]);

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const updateProfile = useCallback(
    (partial: Partial<UserProfile>) => {
      const uid = currentUserRef.current.uid;
      if (!uid) return;
      setCurrentUser((prev) => ({ ...prev, ...partial }));
      const firestoreUpdate: Record<string, any> = {};
      if (partial.displayName !== undefined) firestoreUpdate.displayName = partial.displayName;
      if (partial.about !== undefined) firestoreUpdate.about = partial.about;
      if (partial.avatarUrl !== undefined) firestoreUpdate.avatarUrl = partial.avatarUrl;
      if (Object.keys(firestoreUpdate).length > 0) {
        updateDoc(doc(db, 'users', uid), firestoreUpdate).catch(() => {});
      }
      if (partial.displayName && auth.currentUser) {
        updateAuthProfile(auth.currentUser, { displayName: partial.displayName }).catch(() => {});
      }
      showToast('Profile updated', 'check');
    },
    [showToast]
  );

  const clearCache = useCallback(() => {
    updateSettings({ cacheMb: { photos: 0, voice: 0, files: 0 } });
    showToast('Local cache cleared', 'check');
  }, [showToast, updateSettings]);

  const exportBackup = useCallback(() => {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      user: currentUser,
      conversations,
      messages,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `royalchat-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    updateSettings({ lastBackupTime: 'Just now' });
    showToast('Backup exported', 'lock');
    return 'Backup completed';
  }, [conversations, currentUser, messages, showToast, updateSettings]);

  const deleteAccount = useCallback(async () => {
    const uid = currentUserRef.current.uid;
    const usernameLower = normalizeUsername(currentUserRef.current.username);
    try {
      if (usernameLower) await releaseUsername(usernameLower);
      if (uid) await setDoc(doc(db, 'users', uid), { isOnline: false }, { merge: true }).catch(() => {});
      if (auth.currentUser) await deleteUser(auth.currentUser);
      if (uid) clearStoredKeyPair(uid);
      myKeyPairRef.current = null;
      setConversations([]);
      setMessages({});
      setCurrentUser(EMPTY_USER);
      setActiveConversationId(null);
      setAuthStepState('splash');
      showToast('Account deleted', 'info');
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        showToast('Please log out and log back in, then try deleting your account again.', 'info');
      } else {
        showToast('Could not delete account. Please try again.', 'info');
      }
      throw err;
    }
  }, [showToast]);

  // -----------------------------------------------------------------------
  // Real WebRTC calling. Signaling goes through Firestore (calls/{id} docs
  // + ICE-candidate subcollections); media is peer-to-peer via WebRTC.
  // Google's public STUN server is used (free, no account needed); there
  // is no TURN server, so calls on very restrictive networks may fail to
  // connect — a real limit of STUN-only WebRTC, not a logic bug.
  // -----------------------------------------------------------------------
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [localCallStream, setLocalCallStream] = useState<MediaStream | null>(null);
  const [remoteCallStream, setRemoteCallStream] = useState<MediaStream | null>(null);
  const callSessionRef = useRef<CallSession | null>(null);
  const activeCallRef = useRef<ActiveCall | null>(null);
  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  const teardownCall = useCallback(() => {
    callSessionRef.current?.cleanup();
    callSessionRef.current = null;
    setLocalCallStream(null);
    setRemoteCallStream(null);
    setActiveCall(null);
  }, []);

  const endCall = useCallback(() => {
    const call = activeCallRef.current;
    if (call) {
      callSessionRef.current?.updateStatus('ended').catch(() => {});
    }
    teardownCall();
  }, [teardownCall]);

  const declineCall = useCallback(() => {
    callSessionRef.current?.updateStatus('declined').catch(() => {});
    teardownCall();
  }, [teardownCall]);

  // Incoming calls: listen for any 'ringing' call where I'm the callee.
  useEffect(() => {
    if (authStep !== 'complete' || !currentUser.uid) return;
    const uid = currentUser.uid;

    const q = query(
      collection(db, 'calls'),
      where('calleeId', '==', uid),
      where('status', '==', 'ringing')
    );

    const unsub = onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        const callId = change.doc.id;
        const data = change.doc.data() as any;

        if (change.type === 'added') {
          // Already on a call (incoming or outgoing) — automatically
          // signal busy instead of silently dropping the new one.
          if (activeCallRef.current) {
            updateDoc(doc(db, 'calls', callId), { status: 'busy', updatedAt: Date.now() }).catch(() => {});
            return;
          }

          setActiveCall({
            callId,
            peerId: data.callerId,
            peerName: data.callerName || 'Unknown',
            peerAvatar: data.callerAvatar || null,
            type: data.type === 'video' ? 'video' : 'audio',
            direction: 'incoming',
            status: 'ringing',
            isMuted: false,
            isCameraOff: false,
          });
        } else if (change.type === 'removed') {
          // Status left 'ringing' (this query only matches status ==
          // 'ringing', so a doc leaving the result set means the caller
          // cancelled, timed out, or the call was otherwise resolved
          // before we answered it).
          if (activeCallRef.current?.callId === callId && activeCallRef.current.status === 'ringing') {
            teardownCall();
          }
        }
      });
    });

    return () => unsub();
  }, [authStep, currentUser.uid, teardownCall]);

  const startCall = useCallback(
    async (conversationId: string, type: CallType) => {
      const uid = currentUserRef.current.uid;
      if (!uid || activeCallRef.current) return;

      const conversation = conversationsRef.current.find((c) => c.id === conversationId);
      if (!conversation || conversation.isGroup || !conversation.recipientId) {
        showToast('Calling is only available in one-to-one chats right now.', 'info');
        return;
      }

      const callId = `${conversationId}_${Date.now()}`;
      const session = new CallSession(callId, 'caller');
      callSessionRef.current = session;

      setActiveCall({
        callId,
        peerId: conversation.recipientId,
        peerName: conversation.name,
        peerAvatar: conversation.avatarAsset,
        type,
        direction: 'outgoing',
        status: 'ringing',
        isMuted: false,
        isCameraOff: false,
      });

      try {
        const stream = await session.getLocalMedia(type);
        setLocalCallStream(stream);

        session.onRemoteStreamUpdated = () => setRemoteCallStream(session.remoteStream);
        session.onConnectionFailed = () => {
          showToast('Call failed to connect. Check your network and try again.', 'info');
          teardownCall();
        };
        session.onRemoteHangup = (reason) => {
          if (reason === 'declined') showToast(`${conversation.name} declined the call`, 'info');
          else if (reason === 'busy') showToast(`${conversation.name} is on another call`, 'info');
          else if (reason === 'ended') showToast('Call ended', 'info');
          teardownCall();
        };

        const offer = await session.createOffer();
        await createCallDoc({
          callId,
          callerId: uid,
          calleeId: conversation.recipientId,
          callerName: currentUserRef.current.displayName,
          callerAvatar: currentUserRef.current.avatarUrl || null,
          calleeName: conversation.name,
          calleeAvatar: conversation.avatarAsset || null,
          type,
          offer,
        });

        session.listenForRemoteCandidates();
        session.listenForCallDocChanges();

        setActiveCall((prev) => (prev ? { ...prev, status: 'connecting' } : prev));

        // Auto-cancel if nobody answers within 45 seconds.
        setTimeout(() => {
          const stillRinging =
            activeCallRef.current?.callId === callId &&
            (activeCallRef.current.status === 'ringing' || activeCallRef.current.status === 'connecting');
          if (stillRinging) {
            session.updateStatus('missed').catch(() => {});
            showToast('No answer', 'info');
            teardownCall();
          }
        }, 45000);
      } catch (err) {
        showToast('Could not access camera/microphone. Check permissions.', 'info');
        teardownCall();
      }
    },
    [showToast, teardownCall]
  );

  const acceptCall = useCallback(async () => {
    const call = activeCallRef.current;
    if (!call || call.direction !== 'incoming') return;

    const callDocSnap = await getDoc(doc(db, 'calls', call.callId));
    const data = callDocSnap.data() as any;
    if (!data?.offer) {
      showToast('This call is no longer available.', 'info');
      teardownCall();
      return;
    }

    const session = new CallSession(call.callId, 'callee');
    callSessionRef.current = session;
    setActiveCall({ ...call, status: 'connecting' });

    try {
      const stream = await session.getLocalMedia(call.type);
      setLocalCallStream(stream);

      session.onRemoteStreamUpdated = () => setRemoteCallStream(session.remoteStream);
      session.onConnectionFailed = () => {
        showToast('Call failed to connect. Check your network and try again.', 'info');
        teardownCall();
      };
      session.onRemoteHangup = () => {
        showToast('Call ended', 'info');
        teardownCall();
      };

      const answer = await session.createAnswer(data.offer);
      await writeAnswer(call.callId, answer);

      session.listenForRemoteCandidates();
      session.listenForCallDocChanges();

      setActiveCall((prev) => (prev ? { ...prev, status: 'connected', connectedAt: Date.now() } : prev));
    } catch (err) {
      showToast('Could not access camera/microphone. Check permissions.', 'info');
      declineCall();
    }
  }, [showToast, teardownCall, declineCall]);

  const toggleCallMute = useCallback(() => {
    setActiveCall((prev) => {
      if (!prev) return prev;
      const nextMuted = !prev.isMuted;
      callSessionRef.current?.setMuted(nextMuted);
      return { ...prev, isMuted: nextMuted };
    });
  }, []);

  const toggleCallCamera = useCallback(() => {
    setActiveCall((prev) => {
      if (!prev) return prev;
      const nextOff = !prev.isCameraOff;
      callSessionRef.current?.setCameraOff(nextOff);
      return { ...prev, isCameraOff: nextOff };
    });
  }, []);

  // If the caller's connection actually completes (WebRTC connectionState
  //'connected'), flip the outgoing call from "connecting" to "connected"
  // with a start time for the on-screen timer.
  useEffect(() => {
    const session = callSessionRef.current;
    if (!session || !activeCall || activeCall.status !== 'connecting') return;
    const pc = session.pc;
    const handler = () => {
      if (pc.connectionState === 'connected') {
        setActiveCall((prev) =>
          prev && prev.status === 'connecting' ? { ...prev, status: 'connected', connectedAt: Date.now() } : prev
        );
      }
    };
    pc.addEventListener('connectionstatechange', handler);
    return () => pc.removeEventListener('connectionstatechange', handler);
  }, [activeCall]);

  return (
    <AppContext.Provider
      value={{
        authStep,
        setAuthStep,
        authError,
        authLoading,
        signUp,
        logIn,
        logOut,
        currentUser,
        settings,
        conversations,
        messages,
        activeConversationId,
        setActiveConversationId,
        selectedDesktopTab,
        setSelectedDesktopTab,
        searchQuery,
        setSearchQuery,
        inboxFilter,
        setInboxFilter,
        typingContacts,
        setTypingStatus,
        toasts,
        inAppNotification,
        dismissInAppNotification,
        showToast,
        sendTextMessage,
        sendImageMessage,
        sendVoiceMessage,
        addReaction,
        deleteMessage,
        toggleStarMessage,
        markConversationRead,
        togglePinConversation,
        toggleMuteConversation,
        toggleBlockConversation,
        clearChatHistory,
        createGroup,
        updateGroupInfo,
        addGroupMembers,
        leaveGroup,
        searchUsers,
        startNewChat,
        updateSettings,
        updateProfile,
        clearCache,
        exportBackup,
        deleteAccount,
        activeCall,
        localCallStream,
        remoteCallStream,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleCallMute,
        toggleCallCamera,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

function friendlyAuthError(err: any): string {
  const code = err?.code || '';
  if (code.includes('email-already-in-use')) return 'An account with that email already exists.';
  if (code.includes('invalid-email')) return 'Please enter a valid email address.';
  if (code.includes('weak-password')) return 'Password should be at least 6 characters.';
  if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
    return 'Incorrect email or password.';
  }
  if (code.includes('too-many-requests')) return 'Too many attempts. Please wait a moment and try again.';
  if (code.includes('network-request-failed')) return 'Network error. Check your connection and try again.';
  return err?.message || 'Something went wrong. Please try again.';
}

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
};
