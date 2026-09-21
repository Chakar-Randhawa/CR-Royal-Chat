import React, { useEffect, useState } from 'react';
import { Conversation } from '../../types';
import { RoyalChatAvatar } from '../common/RoyalChatAvatar';
import { UserSearchResult } from '../../lib/username';
import {
  X,
  Edit2,
  UserPlus,
  LogOut,
  Trash2,
  Users,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface GroupDetailsModalProps {
  conversation: Conversation;
  onClose: () => void;
}

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({
  conversation,
  onClose,
}) => {
  const { updateGroupInfo, showToast, setActiveConversationId, searchUsers, addGroupMembers, leaveGroup } = useApp();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(conversation.name);

  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descVal, setDescVal] = useState(conversation.description || '');

  const [showAddMembers, setShowAddMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberResults, setMemberResults] = useState<UserSearchResult[]>([]);

  useEffect(() => {
    const q = memberSearch.trim();
    if (!q) {
      setMemberResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      const found = await searchUsers(q);
      setMemberResults(found);
    }, 300);
    return () => clearTimeout(handle);
  }, [memberSearch, searchUsers]);

  const members = conversation.members || [];
  const admins = conversation.groupAdmins || [];

  const handleSaveName = () => {
    if (nameVal.trim() && nameVal !== conversation.name) {
      updateGroupInfo(conversation.id, nameVal.trim());
      showToast('Group name updated', 'check');
    }
    setIsEditingName(false);
  };

  const handleSaveDesc = () => {
    updateGroupInfo(conversation.id, undefined, descVal.trim());
    showToast('Group description updated', 'check');
    setIsEditingDesc(false);
  };

  const handleLeaveGroup = () => {
    leaveGroup(conversation.id);
    setActiveConversationId(null);
    onClose();
  };

  const handleAddMember = (user: UserSearchResult) => {
    if (members.includes(user.displayName)) {
      showToast(`${user.displayName} is already in the group`, 'info');
      return;
    }
    addGroupMembers(conversation.id, [
      { uid: user.uid, displayName: user.displayName, username: user.username, avatarUrl: user.avatarUrl },
    ]);
    setShowAddMembers(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#F8F8F5] dark:bg-[#141B20] w-full max-w-md max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-[#E2E7EC] dark:border-[#354148] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E2E7EC] dark:border-[#354148]">
          <span className="text-sm font-bold text-[#202A30] dark:text-[#F4F5F2]">
            Group Info
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-[#68747A] hover:text-[#202A30] dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Avatar and Group Name */}
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-[#202A30] dark:text-white mb-3">
              <Users className="w-10 h-10 text-[#F05D48]" />
            </div>

            {isEditingName ? (
              <div className="flex items-center gap-2 w-full max-w-xs mt-1">
                <input
                  type="text"
                  value={nameVal}
                  onChange={(e) => setNameVal(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-[#202A30] border border-[#F05D48] rounded-xl text-center text-base font-bold outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-2 bg-[#F05D48] text-white rounded-xl"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#202A30] dark:text-[#F4F5F2]">
                  {conversation.name}
                </h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-[#8C9BA5] hover:text-[#202A30] dark:hover:text-white"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <p className="text-xs text-[#68747A] dark:text-[#ACB7BD] mt-1">
              Group · {members.length} members
            </p>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-[#202A30] p-4 rounded-2xl border border-[#E2E7EC] dark:border-[#354148]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-[#8C9BA5] uppercase tracking-wider">
                Description
              </span>
              <button
                onClick={() => setIsEditingDesc(!isEditingDesc)}
                className="text-xs text-[#F05D48] font-medium"
              >
                {isEditingDesc ? 'Cancel' : 'Edit'}
              </button>
            </div>
            {isEditingDesc ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={descVal}
                  onChange={(e) => setDescVal(e.target.value)}
                  className="w-full p-2 text-sm bg-stone-50 dark:bg-[#182026] border border-[#E2E7EC] dark:border-[#354148] rounded-xl outline-none"
                  rows={2}
                />
                <button
                  onClick={handleSaveDesc}
                  className="px-3 py-1 bg-[#F05D48] text-white text-xs font-semibold rounded-lg"
                >
                  Save description
                </button>
              </div>
            ) : (
              <p className="text-sm text-[#202A30] dark:text-[#F4F5F2]">
                {conversation.description || 'No description provided.'}
              </p>
            )}
          </div>

          {/* Members Roster */}
          <div className="bg-white dark:bg-[#202A30] rounded-2xl border border-[#E2E7EC] dark:border-[#354148] overflow-hidden">
            <div className="flex items-center justify-between p-3.5 border-b border-[#E2E7EC] dark:border-[#354148]">
              <span className="text-xs font-bold text-[#202A30] dark:text-[#F4F5F2]">
                {members.length} members
              </span>
              <button
                onClick={() => setShowAddMembers(true)}
                className="flex items-center gap-1.5 text-xs text-[#F05D48] font-semibold hover:underline"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add member</span>
              </button>
            </div>

            <div className="divide-y divide-[#E2E7EC] dark:divide-[#354148]">
              {members.map((memberName) => {
                const isAdmin = admins.includes(memberName);
                return (
                  <div
                    key={memberName}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-3">
                      <RoyalChatAvatar name={memberName} size={38} />
                      <div>
                        <div className="text-sm font-semibold text-[#202A30] dark:text-[#F4F5F2]">
                          {memberName}
                        </div>
                        <div className="text-[11px] text-[#8C9BA5]">
                          {memberName === 'You' ? 'Online' : 'Member'}
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#F05D48]/10 text-[#F05D48]">
                        Admin
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-[#202A30] rounded-2xl border border-[#E2E7EC] dark:border-[#354148] divide-y divide-[#E2E7EC] dark:divide-[#354148]">
            <button
              onClick={handleLeaveGroup}
              className="w-full flex items-center gap-3 p-3.5 text-sm text-red-500 hover:bg-red-500/10 text-left font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit group</span>
            </button>
            <button
              onClick={handleLeaveGroup}
              className="w-full flex items-center gap-3 p-3.5 text-sm text-red-500 hover:bg-red-500/10 text-left font-medium"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete group</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Members Sheet Modal */}
      {showAddMembers && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#202A30] w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[#E2E7EC] dark:border-[#354148]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-[#202A30] dark:text-[#F4F5F2]">
                Add to {conversation.name}
              </h3>
              <button
                onClick={() => setShowAddMembers(false)}
                className="p-1 rounded-full text-[#8C9BA5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-2 mb-2">
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search by username..."
                autoCapitalize="off"
                className="w-full px-3 py-2 bg-stone-50 dark:bg-[#182026] rounded-xl border border-[#E2E7EC] dark:border-[#354148] text-xs text-[#202A30] dark:text-[#F4F5F2] outline-none focus:border-[#F05D48]"
              />
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-[#E2E7EC] dark:divide-[#354148]">
              {memberSearch.trim() === '' ? (
                <p className="text-xs text-[#8C9BA5] text-center py-4">
                  Type a username to find people to add.
                </p>
              ) : memberResults.length === 0 ? (
                <p className="text-xs text-[#8C9BA5] text-center py-4">No one found.</p>
              ) : (
                memberResults.map((c) => (
                  <div
                    key={c.uid}
                    onClick={() => handleAddMember(c)}
                    className="flex items-center justify-between py-2.5 px-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <RoyalChatAvatar name={c.displayName} asset={c.avatarUrl} size={36} />
                      <div>
                        <div className="text-sm font-medium text-[#202A30] dark:text-[#F4F5F2]">
                          {c.displayName}
                        </div>
                        <div className="text-[11px] text-[#8C9BA5]">@{c.username}</div>
                      </div>
                    </div>
                    <span className="text-xs text-[#F05D48] font-semibold">Add</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
