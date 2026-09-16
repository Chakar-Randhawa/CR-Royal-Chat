import React, { useState } from 'react';
import { RelayAvatar } from '../common/RelayAvatar';
import { RelayButton } from '../common/RelayButton';
import {
  ArrowLeft,
  Shield,
  Bell,
  HardDrive,
  Database,
  Moon,
  Sun,
  Smartphone,
  Trash2,
  ChevronRight,
  Download,
  Key,
  Lock,
  Edit2,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SettingsViewProps {
  onBack?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const {
    currentUser,
    settings,
    updateSettings,
    updateProfile,
    clearCache,
    exportBackup,
    deleteAccount,
    showToast,
  } = useApp();

  const [activeSubModal, setActiveSubModal] = useState<
    'profile' | 'security' | 'storage' | 'backup' | 'delete' | null
  >(null);

  // Profile edit states
  const [nameInput, setNameInput] = useState(currentUser.displayName);
  const [aboutInput, setAboutInput] = useState(currentUser.about);

  const handleSaveProfile = () => {
    if (!nameInput.trim()) {
      showToast('Name cannot be empty', 'info');
      return;
    }
    updateProfile({
      displayName: nameInput.trim(),
      about: aboutInput.trim(),
    });
    setActiveSubModal(null);
  };

  const totalCacheMb = (
    settings.cacheMb.photos +
    settings.cacheMb.voice +
    settings.cacheMb.files
  ).toFixed(1);

  return (
    <div className="flex flex-col h-full bg-[#F8F8F5] dark:bg-[#141B20] overflow-y-auto select-none">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white dark:bg-[#202A30] border-b border-[#E2E7EC] dark:border-[#354148] shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-[#68747A] dark:text-[#ACB7BD] hover:text-[#202A30] dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/5"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-lg font-bold text-[#202A30] dark:text-[#F4F5F2]">
          Settings
        </h1>
      </div>

      <div className="p-4 space-y-4 max-w-xl mx-auto w-full pb-12">
        {/* Profile Header Card */}
        <div
          onClick={() => {
            setNameInput(currentUser.displayName);
            setAboutInput(currentUser.about);
            setActiveSubModal('profile');
          }}
          className="flex items-center gap-4 p-4 bg-white dark:bg-[#202A30] rounded-2xl border border-[#E2E7EC] dark:border-[#354148] cursor-pointer hover:bg-stone-50 dark:hover:bg-[#25323A] transition-colors shadow-2xs"
        >
          <RelayAvatar
            name={currentUser.displayName}
            asset={currentUser.avatarUrl}
            size={58}
            online={true}
          />
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-[#202A30] dark:text-[#F4F5F2] truncate">
              {currentUser.displayName}
            </h2>
            <p className="text-xs text-[#68747A] dark:text-[#ACB7BD] truncate">
              {currentUser.about}
            </p>
            <p className="text-[11px] font-mono text-[#8C9BA5] mt-0.5">
              {currentUser.phoneNumber}
            </p>
          </div>
          <Edit2 className="w-4 h-4 text-[#8C9BA5]" />
        </div>

        {/* Appearance / Theme */}
        <div className="bg-white dark:bg-[#202A30] rounded-2xl border border-[#E2E7EC] dark:border-[#354148] p-4">
          <div className="text-xs font-bold text-[#8C9BA5] uppercase tracking-wider mb-3">
            Appearance
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => updateSettings({ themeMode: 'light' })}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                settings.themeMode === 'light'
                  ? 'border-[#F05D48] bg-[#F05D48]/10 text-[#F05D48]'
                  : 'border-[#E2E7EC] dark:border-[#354148] text-[#68747A] dark:text-[#ACB7BD] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Sun className="w-5 h-5" />
              <span>Light</span>
            </button>
            <button
              onClick={() => updateSettings({ themeMode: 'dark' })}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                settings.themeMode === 'dark'
                  ? 'border-[#F05D48] bg-[#F05D48]/10 text-[#F05D48]'
                  : 'border-[#E2E7EC] dark:border-[#354148] text-[#68747A] dark:text-[#ACB7BD] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Moon className="w-5 h-5" />
              <span>Dark</span>
            </button>
            <button
              onClick={() => updateSettings({ themeMode: 'system' })}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                settings.themeMode === 'system'
                  ? 'border-[#F05D48] bg-[#F05D48]/10 text-[#F05D48]'
                  : 'border-[#E2E7EC] dark:border-[#354148] text-[#68747A] dark:text-[#ACB7BD] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Smartphone className="w-5 h-5" />
              <span>System</span>
            </button>
          </div>
        </div>

        {/* Privacy & Security Section */}
        <div className="bg-white dark:bg-[#202A30] rounded-2xl border border-[#E2E7EC] dark:border-[#354148] divide-y divide-[#E2E7EC] dark:divide-[#354148]">
          <div className="p-4 pb-2 text-xs font-bold text-[#8C9BA5] uppercase tracking-wider">
            Privacy & Security
          </div>

          <div
            onClick={() => setActiveSubModal('security')}
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#10B981]" />
              <div>
                <div className="text-sm font-semibold text-[#202A30] dark:text-[#F4F5F2]">
                  End-to-End Encryption
                </div>
                <div className="text-xs text-[#68747A] dark:text-[#ACB7BD]">
                  X25519 ECDH + AES-GCM-256 active
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C9BA5]" />
          </div>

          <div className="flex items-center justify-between p-4">
            <div>
              <div className="text-sm font-semibold text-[#202A30] dark:text-[#F4F5F2]">
                Read Receipts
              </div>
              <div className="text-xs text-[#68747A] dark:text-[#ACB7BD]">
                Send double checkmarks when messages are seen
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.readReceipts}
              onChange={(e) => updateSettings({ readReceipts: e.target.checked })}
              className="w-5 h-5 accent-[#F05D48] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4">
            <div>
              <div className="text-sm font-semibold text-[#202A30] dark:text-[#F4F5F2]">
                Last Seen Status
              </div>
              <div className="text-xs text-[#68747A] dark:text-[#ACB7BD]">
                Show when you were active
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.lastSeen}
              onChange={(e) => updateSettings({ lastSeen: e.target.checked })}
              className="w-5 h-5 accent-[#F05D48] rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Notifications & Quiet Hours */}
        <div className="bg-white dark:bg-[#202A30] rounded-2xl border border-[#E2E7EC] dark:border-[#354148] divide-y divide-[#E2E7EC] dark:divide-[#354148]">
          <div className="p-4 pb-2 text-xs font-bold text-[#8C9BA5] uppercase tracking-wider">
            Notifications
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-sky-500" />
              <div>
                <div className="text-sm font-semibold text-[#202A30] dark:text-[#F4F5F2]">
                  Message Notifications
                </div>
                <div className="text-xs text-[#68747A] dark:text-[#ACB7BD]">
                  In-app banner notifications
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) =>
                updateSettings({ notificationsEnabled: e.target.checked })
              }
              className="w-5 h-5 accent-[#F05D48] rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-4">
            <div>
              <div className="text-sm font-semibold text-[#202A30] dark:text-[#F4F5F2]">
                Scheduled Quiet Hours
              </div>
              <div className="text-xs text-[#68747A] dark:text-[#ACB7BD]">
                Silence alerts between 22:00 and 07:00
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.quietHours}
              onChange={(e) => updateSettings({ quietHours: e.target.checked })}
              className="w-5 h-5 accent-[#F05D48] rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Storage, Cache & Backups */}
        <div className="bg-white dark:bg-[#202A30] rounded-2xl border border-[#E2E7EC] dark:border-[#354148] divide-y divide-[#E2E7EC] dark:divide-[#354148]">
          <div className="p-4 pb-2 text-xs font-bold text-[#8C9BA5] uppercase tracking-wider">
            Storage & Backups
          </div>

          <div
            onClick={() => setActiveSubModal('storage')}
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-amber-500" />
              <div>
                <div className="text-sm font-semibold text-[#202A30] dark:text-[#F4F5F2]">
                  Manage Local Cache
                </div>
                <div className="text-xs text-[#68747A] dark:text-[#ACB7BD]">
                  {totalCacheMb} MB used · Tap to clean
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C9BA5]" />
          </div>

          <div
            onClick={() => setActiveSubModal('backup')}
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-indigo-500" />
              <div>
                <div className="text-sm font-semibold text-[#202A30] dark:text-[#F4F5F2]">
                  Encrypted Chat Backup
                </div>
                <div className="text-xs text-[#68747A] dark:text-[#ACB7BD]">
                  Last backup: {settings.lastBackupTime || 'Never'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8C9BA5]" />
          </div>
        </div>

        {/* App Info & Danger Zone */}
        <div className="bg-white dark:bg-[#202A30] rounded-2xl border border-[#E2E7EC] dark:border-[#354148] divide-y divide-[#E2E7EC] dark:divide-[#354148]">
          <div className="p-4 flex items-center justify-between text-xs text-[#8C9BA5]">
            <span>Relay Application</span>
            <span>v0.3.0 · Zero Infra Mode</span>
          </div>

          <button
            onClick={() => setActiveSubModal('delete')}
            className="w-full flex items-center gap-3 p-4 text-sm font-semibold text-red-500 hover:bg-red-500/10 text-left transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account & Erase Identity</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Sub-Modal */}
      {activeSubModal === 'profile' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#202A30] w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[#E2E7EC] dark:border-[#354148]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-[#202A30] dark:text-[#F4F5F2]">
                Edit Profile
              </h3>
              <button
                onClick={() => setActiveSubModal(null)}
                className="p-1 rounded-full text-[#8C9BA5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#8C9BA5]">
                  Display Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-stone-50 dark:bg-[#182026] border border-[#E2E7EC] dark:border-[#354148] rounded-xl text-sm font-semibold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8C9BA5]">
                  About Status
                </label>
                <input
                  type="text"
                  value={aboutInput}
                  onChange={(e) => setAboutInput(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-stone-50 dark:bg-[#182026] border border-[#E2E7EC] dark:border-[#354148] rounded-xl text-sm outline-none"
                />
              </div>

              <div className="pt-2">
                <RelayButton onClick={handleSaveProfile}>Save Changes</RelayButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security & Key Vault Sub-Modal */}
      {activeSubModal === 'security' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#202A30] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#E2E7EC] dark:border-[#354148]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#10B981]" />
                <h3 className="font-bold text-base text-[#202A30] dark:text-[#F4F5F2]">
                  Key Vault & E2EE
                </h3>
              </div>
              <button
                onClick={() => setActiveSubModal(null)}
                className="p-1 rounded-full text-[#8C9BA5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#68747A] dark:text-[#ACB7BD] leading-relaxed mb-4">
              Relay uses the X25519 Elliptic Curve Diffie-Hellman protocol combined with AES-256-GCM authenticated encryption. Your private keys never leave your device.
            </p>

            <div className="p-3 bg-stone-50 dark:bg-[#182026] rounded-xl border border-[#E2E7EC] dark:border-[#354148] mb-4">
              <div className="text-[11px] font-semibold text-[#8C9BA5] uppercase mb-1">
                Your Public Identity Key
              </div>
              <div className="font-mono text-xs text-[#202A30] dark:text-[#F4F5F2] break-all">
                {currentUser.publicKey}
              </div>
            </div>

            <RelayButton
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(currentUser.publicKey);
                showToast('Key copied to clipboard', 'copy');
              }}
            >
              Copy Public Key
            </RelayButton>
          </div>
        </div>
      )}

      {/* Storage & Clear Cache Sub-Modal */}
      {activeSubModal === 'storage' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#202A30] w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[#E2E7EC] dark:border-[#354148]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base text-[#202A30] dark:text-[#F4F5F2]">
                Local Storage & Cache
              </h3>
              <button
                onClick={() => setActiveSubModal(null)}
                className="p-1 rounded-full text-[#8C9BA5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#68747A] dark:text-[#ACB7BD] mb-4">
              <div className="flex justify-between p-2 rounded bg-stone-50 dark:bg-[#182026]">
                <span>Media & Photos</span>
                <span className="font-mono font-bold text-[#202A30] dark:text-[#F4F5F2]">
                  {settings.cacheMb.photos} MB
                </span>
              </div>
              <div className="flex justify-between p-2 rounded bg-stone-50 dark:bg-[#182026]">
                <span>Voice Notes</span>
                <span className="font-mono font-bold text-[#202A30] dark:text-[#F4F5F2]">
                  {settings.cacheMb.voice} MB
                </span>
              </div>
              <div className="flex justify-between p-2 rounded bg-stone-50 dark:bg-[#182026]">
                <span>Encrypted Index Database</span>
                <span className="font-mono font-bold text-[#202A30] dark:text-[#F4F5F2]">
                  {settings.cacheMb.files} MB
                </span>
              </div>
            </div>

            <RelayButton
              variant="danger"
              onClick={() => {
                clearCache();
                setActiveSubModal(null);
              }}
            >
              Clear Cached Media
            </RelayButton>
          </div>
        </div>
      )}

      {/* Backup Sub-Modal */}
      {activeSubModal === 'backup' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#202A30] w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[#E2E7EC] dark:border-[#354148]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base text-[#202A30] dark:text-[#F4F5F2]">
                Chat Backup
              </h3>
              <button
                onClick={() => setActiveSubModal(null)}
                className="p-1 rounded-full text-[#8C9BA5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#68747A] dark:text-[#ACB7BD] leading-relaxed mb-4">
              Generate an encrypted, password-protected archive of all your chats, contacts, and media to download locally.
            </p>

            <div className="space-y-2">
              <RelayButton
                onClick={() => {
                  exportBackup();
                  setActiveSubModal(null);
                }}
                icon={<Download className="w-4 h-4" />}
              >
                Export Encrypted Backup
              </RelayButton>
              <RelayButton
                variant="secondary"
                onClick={() => {
                  showToast('Backup restored from local device', 'check');
                  setActiveSubModal(null);
                }}
              >
                Restore From File
              </RelayButton>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Sub-Modal */}
      {activeSubModal === 'delete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#202A30] w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[#E2E7EC] dark:border-[#354148] text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#202A30] dark:text-[#F4F5F2]">
              Delete Account?
            </h3>
            <p className="text-xs text-[#68747A] dark:text-[#ACB7BD] my-2">
              This will erase your cryptographic identity, keys, and chat history permanently.
            </p>
            <div className="flex gap-2 mt-4">
              <RelayButton
                variant="secondary"
                onClick={() => setActiveSubModal(null)}
              >
                Cancel
              </RelayButton>
              <RelayButton
                variant="danger"
                onClick={() => {
                  deleteAccount();
                  setActiveSubModal(null);
                }}
              >
                Erase Everything
              </RelayButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
