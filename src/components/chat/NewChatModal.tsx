import React, { useEffect, useState } from 'react';
import { UserSearchResult } from '../../lib/username';
import { RoyalChatAvatar } from '../common/RoyalChatAvatar';
import { RoyalChatButton } from '../common/RoyalChatButton';
import { X, Search, Users, UserPlus, Check, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NewChatModalProps {
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ onClose }) => {
  const { startNewChat, createGroup, searchUsers, showToast } = useApp();
  const [tab, setTab] = useState<'direct' | 'group'>('direct');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);

  // Debounced live username search against Firestore.
  useEffect(() => {
    const q = search.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    const handle = setTimeout(async () => {
      try {
        const found = await searchUsers(q);
        setResults(found);
      } catch {
        showToast('Search failed. Check your connection.', 'info');
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [search, searchUsers, showToast]);

  const toggleSelect = (user: UserSearchResult) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.uid === user.uid)
        ? prev.filter((u) => u.uid !== user.uid)
        : [...prev, user]
    );
  };

  const handleStartDirect = async (user: UserSearchResult) => {
    await startNewChat({
      id: user.uid,
      name: user.displayName,
      avatarAsset: user.avatarUrl,
      about: user.about,
      username: user.username,
    });
    onClose();
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      showToast('Please enter a group name', 'info');
      return;
    }
    if (selectedUsers.length === 0) {
      showToast('Select at least one member', 'info');
      return;
    }
    await createGroup(
      groupName.trim(),
      selectedUsers.map((u) => u.uid)
    );
    showToast(`Created group "${groupName.trim()}"`, 'check');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#F8F8F5] dark:bg-[#141B20] w-full max-w-md max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl border border-[#E2E7EC] dark:border-[#354148] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E2E7EC] dark:border-[#354148]">
          <span className="text-base font-bold text-[#202A30] dark:text-[#F4F5F2]">
            New Royal Chat
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-[#68747A] hover:text-[#202A30] dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="p-3 bg-white dark:bg-[#202A30] border-b border-[#E2E7EC] dark:border-[#354148]">
          <div className="flex rounded-xl bg-stone-100 dark:bg-[#182026] p-1">
            <button
              onClick={() => setTab('direct')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors ${
                tab === 'direct'
                  ? 'bg-white dark:bg-[#202A30] text-[#202A30] dark:text-white shadow-xs'
                  : 'text-[#68747A] dark:text-[#ACB7BD]'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Direct message</span>
            </button>
            <button
              onClick={() => setTab('group')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors ${
                tab === 'group'
                  ? 'bg-white dark:bg-[#202A30] text-[#202A30] dark:text-white shadow-xs'
                  : 'text-[#68747A] dark:text-[#ACB7BD]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>New group</span>
            </button>
          </div>
        </div>

        {/* Group Name input if in group tab */}
        {tab === 'group' && (
          <div className="p-3 bg-white dark:bg-[#202A30] border-b border-[#E2E7EC] dark:border-[#354148]">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name"
              className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-[#182026] rounded-xl border border-[#E2E7EC] dark:border-[#354148] text-sm text-[#202A30] dark:text-[#F4F5F2] outline-none focus:border-[#F05D48]"
            />
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedUsers.map((u) => (
                  <span
                    key={u.uid}
                    onClick={() => toggleSelect(u)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F05D48]/10 text-[#F05D48] text-xs font-semibold rounded-full cursor-pointer hover:bg-[#F05D48]/20"
                  >
                    <span>{u.displayName}</span>
                    <X className="w-3 h-3" />
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Username search bar */}
        <div className="px-4 py-2.5 bg-stone-50 dark:bg-[#182026] border-b border-[#E2E7EC] dark:border-[#354148] flex items-center gap-2">
          <Search className="w-4 h-4 text-[#8C9BA5]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username..."
            autoCapitalize="off"
            className="w-full bg-transparent text-xs text-[#202A30] dark:text-[#F4F5F2] outline-none placeholder-[#8C9BA5]"
          />
          {isSearching && <Loader2 className="w-3.5 h-3.5 text-[#8C9BA5] animate-spin" />}
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E2E7EC] dark:divide-[#354148] bg-white dark:bg-[#202A30]">
          {!search.trim() ? (
            <div className="flex flex-col items-center justify-center h-40 text-center p-6">
              <p className="text-xs text-[#8C9BA5]">
                Type a username to find people on Royal Chat.
              </p>
            </div>
          ) : results.length === 0 && !isSearching ? (
            <div className="flex flex-col items-center justify-center h-40 text-center p-6">
              <p className="text-xs text-[#8C9BA5]">No one found with that username.</p>
            </div>
          ) : (
            results.map((user) => {
              const isSelected = selectedUsers.some((u) => u.uid === user.uid);
              return (
                <div
                  key={user.uid}
                  onClick={() => (tab === 'direct' ? handleStartDirect(user) : toggleSelect(user))}
                  className="flex items-center justify-between p-3.5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <RoyalChatAvatar name={user.displayName} asset={user.avatarUrl} size={42} />
                    <div>
                      <div className="text-sm font-semibold text-[#202A30] dark:text-[#F4F5F2]">
                        {user.displayName}
                      </div>
                      <div className="text-xs text-[#68747A] dark:text-[#ACB7BD]">
                        @{user.username}
                      </div>
                    </div>
                  </div>

                  {tab === 'group' && (
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-[#F05D48] border-[#F05D48] text-white'
                          : 'border-[#8C9BA5] bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer for Group creation */}
        {tab === 'group' && (
          <div className="p-3 bg-[#F8F8F5] dark:bg-[#141B20] border-t border-[#E2E7EC] dark:border-[#354148]">
            <RoyalChatButton
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedUsers.length === 0}
            >
              Create group ({selectedUsers.length})
            </RoyalChatButton>
          </div>
        )}
      </div>
    </div>
  );
};
