import React from 'react';
import { RoyalChatMark } from '../common/RoyalChatMark';
import { RoyalChatAvatar } from '../common/RoyalChatAvatar';
import { DesktopNavTab } from '../../types';
import {
  MessageSquare,
  Phone,
  Radio,
  Star,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const RoyalChatDesktopNavRail: React.FC = () => {
  const {
    selectedDesktopTab,
    setSelectedDesktopTab,
    conversations,
    settings,
    updateSettings,
    currentUser,
  } = useApp();

  const totalUnread = conversations.reduce(
    (acc, c) => acc + (c.unread > 0 ? 1 : 0),
    0
  );

  const toggleTheme = () => {
    updateSettings({
      themeMode: settings.themeMode === 'dark' ? 'light' : 'dark',
    });
  };

  const navItems: { id: DesktopNavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'chats',
      label: 'Chats',
      icon: <MessageSquare className="w-5 h-5" />,
      badge: totalUnread,
    },
    {
      id: 'calls',
      label: 'Calls',
      icon: <Phone className="w-5 h-5" />,
    },
    {
      id: 'status',
      label: 'Status',
      icon: <Radio className="w-5 h-5" />,
    },
    {
      id: 'starred',
      label: 'Starred',
      icon: <Star className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return (
    <div className="w-16 bg-white dark:bg-[#182026] border-r border-[#E2E7EC] dark:border-[#354148] flex flex-col items-center justify-between py-4 select-none shrink-0 z-20">
      {/* Top Brand Mark */}
      <div className="flex flex-col items-center gap-6">
        <RoyalChatMark size={36} />

        {/* Navigation Items */}
        <div className="flex flex-col items-center gap-3">
          {navItems.map((item) => {
            const isActive = selectedDesktopTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedDesktopTab(item.id)}
                className={`relative p-2.5 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#F05D48]/15 text-[#F05D48] dark:bg-[#F05D48]/20'
                    : 'text-[#68747A] dark:text-[#ACB7BD] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                title={item.label}
              >
                {item.icon}
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F05D48] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-3">
        {/* Theme quick switch */}
        <button
          onClick={toggleTheme}
          className="p-2 text-[#68747A] dark:text-[#ACB7BD] hover:text-[#202A30] dark:hover:text-white rounded-xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
          title="Toggle theme"
        >
          {settings.themeMode === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* User avatar / profile button */}
        <button
          onClick={() => setSelectedDesktopTab('settings')}
          className="cursor-pointer hover:ring-2 hover:ring-[#F05D48] rounded-full transition-all"
          title="Account profile"
        >
          <RoyalChatAvatar
            name={currentUser.displayName}
            asset={currentUser.avatarUrl}
            size={36}
            online={true}
          />
        </button>
      </div>
    </div>
  );
};
