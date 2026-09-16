import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AppSettings,
  AuthStep,
  Conversation,
  DesktopNavTab,
  InboxFilter,
  MessageReply,
  RelayMessage,
  UserProfile,
} from '../types';
import {
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
} from '../data/demoData';

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
  currentUser: UserProfile;
  settings: AppSettings;
  conversations: Conversation[];
  messages: Record<string, RelayMessage[]>;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  selectedDesktopTab: DesktopNavTab;
  setSelectedDesktopTab: (tab: DesktopNavTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  inboxFilter: InboxFilter;
  setInboxFilter: (filter: InboxFilter) => void;
  typingContacts: Record<string, boolean>;
  toasts: ToastInfo[];
  inAppNotification: InAppNotification | null;
  dismissInAppNotification: () => void;
  showToast: (message: string, icon?: 'check' | 'copy' | 'lock' | 'info') => void;
  sendTextMessage: (conversationId: string, text: string, replyTo?: MessageReply) => void;
  sendImageMessage: (conversationId: string, asset: string, caption?: string) => void;
  sendVoiceMessage: (conversationId: string, durationSeconds: number) => void;
  addReaction: (conversationId: string, messageId: string, emoji: string) => void;
  deleteMessage: (conversationId: string, messageId: string, forEveryone?: boolean) => void;
  toggleStarMessage: (conversationId: string, messageId: string) => void;
  markConversationRead: (conversationId: string) => void;
  togglePinConversation: (conversationId: string) => void;
  toggleMuteConversation: (conversationId: string) => void;
  createGroup: (name: string, memberNames: string[]) => string;
  updateGroupInfo: (groupId: string, name?: string, description?: string) => void;
  startNewChat: (contact: { id: string; name: string; avatarAsset?: string | null; about?: string }) => string;
  updateSettings: (partial: Partial<AppSettings>) => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  clearCache: () => void;
  exportBackup: () => string;
  deleteAccount: () => void;
}

const STORAGE_KEYS = {
  AUTH: 'relay_auth_state_v1',
  USER: 'relay_user_profile_v1',
  SETTINGS: 'relay_app_settings_v1',
  CONVERSATIONS: 'relay_conversations_v1',
  MESSAGES: 'relay_messages_v1',
};

const DEFAULT_USER: UserProfile = {
  uid: 'user_relay_7781',
  displayName: 'Navid',
  about: 'Building Relay. Fast, private messaging.',
  phoneNumber: '+880 1711-000000',
  avatarUrl: undefined,
  publicKey: '6Kx7vQ8mZ9yL2aW4tP1nC3fR5hB8eD9sU0iX4',
  isOnline: true,
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
  lastBackupTime: 'Yesterday at 03:00',
  cacheMb: {
    photos: 34.2,
    voice: 12.8,
    files: 8.5,
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authStep, setAuthStepState] = useState<AuthStep>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
      return (saved as AuthStep) || 'complete';
    } catch {
      return 'complete';
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
    } catch {
      return INITIAL_CONVERSATIONS;
    }
  });

  const [messages, setMessages] = useState<Record<string, RelayMessage[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedDesktopTab, setSelectedDesktopTab] = useState<DesktopNavTab>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all');
  const [typingContacts, setTypingContacts] = useState<Record<string, boolean>>({});
  const [toasts, setToasts] = useState<ToastInfo[]>([]);
  const [inAppNotification, setInAppNotification] = useState<InAppNotification | null>(null);

  // Apply theme to html root
  useEffect(() => {
    const isDark =
      settings.themeMode === 'dark' ||
      (settings.themeMode === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.themeMode]);

  // Persist state updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH, authStep);
    } catch {}
  }, [authStep]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    } catch {}
  }, [messages]);

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

  const formatNowTime = () => {
    const d = new Date();
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const markConversationRead = useCallback(
    (conversationId: string) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c))
      );
      if (settings.readReceipts) {
        setMessages((prev) => {
          const list = prev[conversationId] || [];
          const updated = list.map((m) =>
            !m.isMine && m.delivery !== 'read' ? { ...m, delivery: 'read' as const } : m
          );
          return { ...prev, [conversationId]: updated };
        });
      }
    },
    [settings.readReceipts]
  );

  const simulateIncomingReply = useCallback(
    (conversationId: string, replyText: string, kind: 'text' | 'voice' | 'image' = 'text') => {
      // Step 1: Start typing after 1.2s
      setTimeout(() => {
        setTypingContacts((prev) => ({ ...prev, [conversationId]: true }));

        // Step 2: Stop typing and post message after 2.4s
        setTimeout(() => {
          setTypingContacts((prev) => ({ ...prev, [conversationId]: false }));

          const time = formatNowTime();
          const targetConvo = conversations.find((c) => c.id === conversationId);
          const contactName = targetConvo?.name || 'Contact';

          const newMsg: RelayMessage = {
            id: 'in_' + Date.now(),
            senderId: conversationId,
            sentAt: time,
            kind: kind,
            text: kind === 'text' ? replyText : undefined,
            asset: kind === 'image' ? '/assets/images/sylhet_evening.png' : undefined,
            voiceDuration: kind === 'voice' ? 14 : undefined,
            isMine: false,
            delivery: 'read',
          };

          setMessages((prev) => ({
            ...prev,
            [conversationId]: [...(prev[conversationId] || []), newMsg],
          }));

          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === conversationId) {
                const isCurrentlyOpen = activeConversationId === conversationId;
                return {
                  ...c,
                  lastMessage:
                    kind === 'voice'
                      ? 'Voice message · 0:14'
                      : kind === 'image'
                      ? 'Sent a photo'
                      : replyText,
                  timeLabel: time,
                  unread: isCurrentlyOpen ? 0 : c.unread + 1,
                  previewKind: kind === 'voice' ? 'voice' : kind === 'image' ? 'image' : undefined,
                };
              }
              return c;
            })
          );

          // If active chat is different, show in-app banner alert if notifications allowed
          if (activeConversationId !== conversationId && settings.notificationsEnabled) {
            setInAppNotification({
              chatId: conversationId,
              senderName: contactName,
              avatarUrl: targetConvo?.avatarAsset,
              text:
                kind === 'voice'
                  ? '🎤 Voice message (0:14)'
                  : kind === 'image'
                  ? '📷 Photo'
                  : replyText,
              timestamp: time,
            });
          }
        }, 2200);
      }, 1200);
    },
    [activeConversationId, conversations, settings.notificationsEnabled]
  );

  const sendTextMessage = useCallback(
    (conversationId: string, text: string, replyTo?: MessageReply) => {
      const time = formatNowTime();
      const messageId = 'msg_' + Date.now();

      const newMsg: RelayMessage = {
        id: messageId,
        senderId: currentUser.uid,
        sentAt: time,
        kind: 'text',
        text: text.trim(),
        isMine: true,
        delivery: 'sending',
        replyTo,
      };

      // Add to messages
      setMessages((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), newMsg],
      }));

      // Update conversation last message
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessage: text.trim(),
                timeLabel: time,
                delivery: 'sending',
              }
            : c
        )
      );

      // Transition to 'sent' after 300ms
      setTimeout(() => {
        setMessages((prev) => {
          const list = prev[conversationId] || [];
          return {
            ...prev,
            [conversationId]: list.map((m) =>
              m.id === messageId ? { ...m, delivery: 'sent' as const } : m
            ),
          };
        });
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, delivery: 'sent' as const } : c
          )
        );

        // Transition to 'delivered' after 900ms
        setTimeout(() => {
          setMessages((prev) => {
            const list = prev[conversationId] || [];
            return {
              ...prev,
              [conversationId]: list.map((m) =>
                m.id === messageId ? { ...m, delivery: 'delivered' as const } : m
              ),
            };
          });
          setConversations((prev) =>
            prev.map((c) =>
              c.id === conversationId ? { ...c, delivery: 'delivered' as const } : c
            )
          );

          // Transition to 'read' after 2.2s and simulate reply
          setTimeout(() => {
            setMessages((prev) => {
              const list = prev[conversationId] || [];
              return {
                ...prev,
                [conversationId]: list.map((m) =>
                  m.id === messageId ? { ...m, delivery: 'read' as const } : m
                ),
              };
            });
            setConversations((prev) =>
              prev.map((c) =>
                c.id === conversationId ? { ...c, delivery: 'read' as const } : c
              )
            );

            // Auto reply for demo contacts
            const replyOptions: Record<string, string[]> = {
              aisha: [
                'Just stepped outside, the air is great today!',
                'I completely agree. Are we meeting up later?',
                'Let me send you the location link in a second.',
              ],
              mom: [
                'Take an umbrella just in case, okay?',
                'Dinner is almost ready, don’t be late.',
                'Stay safe and drive carefully.',
              ],
              sami: [
                'That sounds like a solid plan. Count me in.',
                'Let’s test the new sound system this Saturday.',
              ],
              rafi: [
                'Got it! The light was unbelievable.',
                'I have two rolls of film to develop tomorrow.',
              ],
              home: [
                'Sami: Don’t forget to grab fresh bread.',
                'Mom: Everyone please arrive before 9.',
              ],
            };

            const pool = replyOptions[conversationId];
            if (pool && pool.length > 0) {
              const reply = pool[Math.floor(Math.random() * pool.length)];
              simulateIncomingReply(conversationId, reply);
            }
          }, 1500);
        }, 700);
      }, 350);
    },
    [currentUser.uid, simulateIncomingReply]
  );

  const sendImageMessage = useCallback(
    (conversationId: string, asset: string, caption?: string) => {
      const time = formatNowTime();
      const messageId = 'img_' + Date.now();

      const newMsg: RelayMessage = {
        id: messageId,
        senderId: currentUser.uid,
        sentAt: time,
        kind: 'image',
        asset,
        text: caption,
        isMine: true,
        delivery: 'sending',
      };

      setMessages((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), newMsg],
      }));

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessage: caption ? caption : 'Sent a photo',
                previewKind: 'image',
                timeLabel: time,
                delivery: 'sending',
              }
            : c
        )
      );

      setTimeout(() => {
        setMessages((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).map((m) =>
            m.id === messageId ? { ...m, delivery: 'delivered' as const } : m
          ),
        }));
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, delivery: 'delivered' as const } : c
          )
        );
      }, 700);
    },
    [currentUser.uid]
  );

  const sendVoiceMessage = useCallback(
    (conversationId: string, durationSeconds: number) => {
      const time = formatNowTime();
      const messageId = 'voice_' + Date.now();

      const newMsg: RelayMessage = {
        id: messageId,
        senderId: currentUser.uid,
        sentAt: time,
        kind: 'voice',
        voiceDuration: durationSeconds,
        isMine: true,
        delivery: 'sending',
      };

      setMessages((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), newMsg],
      }));

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessage: `Voice message · 0:${durationSeconds.toString().padStart(2, '0')}`,
                previewKind: 'voice',
                timeLabel: time,
                delivery: 'sending',
              }
            : c
        )
      );

      setTimeout(() => {
        setMessages((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || []).map((m) =>
            m.id === messageId ? { ...m, delivery: 'delivered' as const } : m
          ),
        }));
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId ? { ...c, delivery: 'delivered' as const } : c
          )
        );
      }, 600);
    },
    [currentUser.uid]
  );

  const addReaction = useCallback(
    (conversationId: string, messageId: string, emoji: string) => {
      setMessages((prev) => {
        const list = prev[conversationId] || [];
        return {
          ...prev,
          [conversationId]: list.map((m) => {
            if (m.id === messageId) {
              const currentReactions = { ...(m.reactions || {}) };
              if (currentReactions['me'] === emoji) {
                delete currentReactions['me'];
              } else {
                currentReactions['me'] = emoji;
              }
              return { ...m, reactions: currentReactions };
            }
            return m;
          }),
        };
      });
    },
    []
  );

  const deleteMessage = useCallback(
    (conversationId: string, messageId: string, forEveryone = false) => {
      setMessages((prev) => {
        const list = prev[conversationId] || [];
        if (forEveryone) {
          return {
            ...prev,
            [conversationId]: list.map((m) =>
              m.id === messageId
                ? {
                    ...m,
                    isDeleted: true,
                    text: 'This message was deleted',
                    asset: undefined,
                  }
                : m
            ),
          };
        } else {
          return {
            ...prev,
            [conversationId]: list.filter((m) => m.id !== messageId),
          };
        }
      });
      showToast('Message deleted', 'check');
    },
    [showToast]
  );

  const toggleStarMessage = useCallback(
    (conversationId: string, messageId: string) => {
      setMessages((prev) => {
        const list = prev[conversationId] || [];
        return {
          ...prev,
          [conversationId]: list.map((m) =>
            m.id === messageId ? { ...m, isStarred: !m.isStarred } : m
          ),
        };
      });
      showToast('Starred messages updated', 'info');
    },
    [showToast]
  );

  const togglePinConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, pinned: !c.pinned } : c
      )
    );
  }, []);

  const toggleMuteConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId ? { ...c, muted: !c.muted } : c
      )
    );
  }, []);

  const createGroup = useCallback((name: string, memberNames: string[]) => {
    const groupId = 'group_' + Date.now();
    const time = formatNowTime();
    const newGroup: Conversation = {
      id: groupId,
      name,
      avatarAsset: null,
      lastMessage: `You created group "${name}"`,
      timeLabel: time,
      unread: 0,
      isGroup: true,
      members: [...memberNames, 'You'],
      groupAdmins: ['You'],
      description: 'Group created on Relay',
    };

    const sysMessage: RelayMessage = {
      id: 'sys_' + Date.now(),
      senderId: 'system',
      sentAt: time,
      kind: 'system',
      text: `You created group "${name}" with ${memberNames.length} members. Messages are end-to-end encrypted.`,
      isMine: false,
    };

    setConversations((prev) => [newGroup, ...prev]);
    setMessages((prev) => ({ ...prev, [groupId]: [sysMessage] }));
    setActiveConversationId(groupId);
    return groupId;
  }, []);

  const updateGroupInfo = useCallback((groupId: string, name?: string, description?: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === groupId) {
          return {
            ...c,
            name: name ?? c.name,
            description: description ?? c.description,
          };
        }
        return c;
      })
    );
  }, []);

  const startNewChat = useCallback(
    (contact: { id: string; name: string; avatarAsset?: string | null; about?: string }) => {
      const existing = conversations.find((c) => c.id === contact.id);
      if (existing) {
        setActiveConversationId(existing.id);
        return existing.id;
      }

      const time = formatNowTime();
      const newConvo: Conversation = {
        id: contact.id,
        name: contact.name,
        avatarAsset: contact.avatarAsset,
        lastMessage: 'Tap to start an encrypted conversation',
        timeLabel: time,
        unread: 0,
        online: true,
        recipientId: contact.id,
        description: contact.about,
      };

      setConversations((prev) => [newConvo, ...prev]);
      if (!messages[contact.id]) {
        setMessages((prev) => ({ ...prev, [contact.id]: [] }));
      }
      setActiveConversationId(contact.id);
      return contact.id;
    },
    [conversations, messages]
  );

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const updateProfile = useCallback((partial: Partial<UserProfile>) => {
    setCurrentUser((prev) => ({ ...prev, ...partial }));
    showToast('Profile updated', 'check');
  }, [showToast]);

  const clearCache = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      cacheMb: { photos: 0, voice: 0, files: 0 },
    }));
    showToast('Local cache cleared', 'check');
  }, [showToast]);

  const exportBackup = useCallback(() => {
    const backupData = {
      version: '0.3.0',
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
    a.download = `relay-backup-${new Date().toISOString().slice(0, 10)}.relaybak`;
    a.click();
    URL.revokeObjectURL(a);

    setSettings((prev) => ({
      ...prev,
      lastBackupTime: 'Just now',
    }));
    showToast('Encrypted backup exported', 'lock');
    return 'Backup completed';
  }, [conversations, currentUser, messages, showToast]);

  const deleteAccount = useCallback(() => {
    localStorage.clear();
    setConversations(INITIAL_CONVERSATIONS);
    setMessages(INITIAL_MESSAGES);
    setCurrentUser(DEFAULT_USER);
    setAuthStepState('phone');
    setActiveConversationId(null);
    showToast('Account deleted', 'info');
  }, [showToast]);

  const setAuthStep = useCallback((step: AuthStep) => {
    setAuthStepState(step);
  }, []);

  return (
    <AppContext.Provider
      value={{
        authStep,
        setAuthStep,
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
        createGroup,
        updateGroupInfo,
        startNewChat,
        updateSettings,
        updateProfile,
        clearCache,
        exportBackup,
        deleteAccount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
};
