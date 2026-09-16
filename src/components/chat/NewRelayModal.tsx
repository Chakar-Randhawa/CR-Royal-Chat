import React, { useState } from 'react';
import { REGISTERED_CONTACTS } from '../../data/demoData';
import { RelayAvatar } from '../common/RelayAvatar';
import { RelayButton } from '../common/RelayButton';
import { X, Search, Users, UserPlus, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NewRelayModalProps {
  onClose: () => void;
}

export const NewRelayModal: React.FC<NewRelayModalProps> = ({ onClose }) => {
  const { startNewChat, createGroup, showToast } = useApp();
  const [tab, setTab] = useState<'direct' | 'group'>('direct');
  const [search, setSearch] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const filteredContacts = REGISTERED_CONTACTS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const toggleSelect = (contactName: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactName)
        ? prev.filter((n) => n !== contactName)
        : [...prev, contactName]
    );
  };

  const handleStartDirect = (contact: typeof REGISTERED_CONTACTS[0]) => {
    startNewChat({
      id: contact.id,
      name: contact.name,
      avatarAsset: contact.avatarAsset,
      about: contact.about,
    });
    onClose();
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      showToast('Please enter a group name', 'info');
      return;
    }
    if (selectedContacts.length === 0) {
      showToast('Select at least one member', 'info');
      return;
    }
    createGroup(groupName.trim(), selectedContacts);
    showToast(`Created group "${groupName.trim()}"`, 'check');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#F8F8F5] dark:bg-[#141B20] w-full max-w-md max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl border border-[#E2E7EC] dark:border-[#354148] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E2E7EC] dark:border-[#354148]">
          <span className="text-base font-bold text-[#202A30] dark:text-[#F4F5F2]">
            New Relay
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
            {selectedContacts.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedContacts.map((name) => (
                  <span
                    key={name}
                    onClick={() => toggleSelect(name)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F05D48]/10 text-[#F05D48] text-xs font-semibold rounded-full cursor-pointer hover:bg-[#F05D48]/20"
                  >
                    <span>{name}</span>
                    <X className="w-3 h-3" />
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search contacts bar */}
        <div className="px-4 py-2.5 bg-stone-50 dark:bg-[#182026] border-b border-[#E2E7EC] dark:border-[#354148] flex items-center gap-2">
          <Search className="w-4 h-4 text-[#8C9BA5]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full bg-transparent text-xs text-[#202A30] dark:text-[#F4F5F2] outline-none placeholder-[#8C9BA5]"
          />
        </div>

        {/* Contacts list */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#E2E7EC] dark:divide-[#354148] bg-white dark:bg-[#202A30]">
          {filteredContacts.map((contact) => {
            const isSelected = selectedContacts.includes(contact.name);
            return (
              <div
                key={contact.id}
                onClick={() => {
                  if (tab === 'direct') {
                    handleStartDirect(contact);
                  } else {
                    toggleSelect(contact.name);
                  }
                }}
                className="flex items-center justify-between p-3.5 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <RelayAvatar
                    name={contact.name}
                    asset={contact.avatarAsset}
                    size={42}
                  />
                  <div>
                    <div className="text-sm font-semibold text-[#202A30] dark:text-[#F4F5F2]">
                      {contact.name}
                    </div>
                    <div className="text-xs text-[#68747A] dark:text-[#ACB7BD]">
                      {contact.phone}
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
          })}
        </div>

        {/* Footer for Group creation */}
        {tab === 'group' && (
          <div className="p-3 bg-[#F8F8F5] dark:bg-[#141B20] border-t border-[#E2E7EC] dark:border-[#354148]">
            <RelayButton
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedContacts.length === 0}
            >
              Create group ({selectedContacts.length})
            </RelayButton>
          </div>
        )}
      </div>
    </div>
  );
};
