import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { AuthFlow } from './components/auth/AuthFlow';
import { ChatListPage } from './components/chat/ChatListPage';
import { ConversationView } from './components/chat/ConversationView';
import { SettingsView } from './components/settings/SettingsView';
import { RelayDesktopNavRail } from './components/desktop/RelayDesktopNavRail';
import { RelayDesktopDetailPane } from './components/desktop/RelayDesktopDetailPane';
import { CallsPane, StatusPane, StarredPane } from './components/desktop/AuxiliaryPanes';
import { RelayToastContainer } from './components/common/RelayToast';
import { InAppNotificationBanner } from './components/common/InAppNotificationBanner';

export const App: React.FC = () => {
  const {
    authStep,
    activeConversationId,
    setActiveConversationId,
    conversations,
    selectedDesktopTab,
    setSelectedDesktopTab,
  } = useApp();

  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  const [mobileShowSettings, setMobileShowSettings] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show Auth Flow if not logged in
  if (authStep !== 'complete') {
    return (
      <>
        <AuthFlow />
        <RelayToastContainer />
      </>
    );
  }

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F8F5] dark:bg-[#141B20] text-[#202A30] dark:text-[#F4F5F2]">
      {/* Global Toast & Banner Overlays */}
      <RelayToastContainer />
      <InAppNotificationBanner />

      {isDesktop ? (
        /* ================= DESKTOP 3-PANE SCAFFOLD ================= */
        <div className="flex h-full w-full overflow-hidden">
          {/* 1. Left Nav Rail */}
          <RelayDesktopNavRail />

          {/* 2. Middle Navigation Pane */}
          <div className="w-80 md:w-96 h-full shrink-0 flex flex-col">
            {selectedDesktopTab === 'chats' && <ChatListPage />}
            {selectedDesktopTab === 'calls' && <CallsPane />}
            {selectedDesktopTab === 'status' && <StatusPane />}
            {selectedDesktopTab === 'starred' && <StarredPane />}
            {selectedDesktopTab === 'settings' && <SettingsView />}
          </div>

          {/* 3. Right Detail Pane */}
          <div className="flex-1 h-full overflow-hidden">
            <RelayDesktopDetailPane />
          </div>
        </div>
      ) : (
        /* ================= MOBILE SINGLE-VIEW FLOW ================= */
        <div className="flex-1 h-full w-full overflow-hidden relative">
          {mobileShowSettings ? (
            <SettingsView onBack={() => setMobileShowSettings(false)} />
          ) : activeConversation ? (
            <ConversationView
              conversation={activeConversation}
              onBack={() => setActiveConversationId(null)}
            />
          ) : (
            <ChatListPage onOpenSettings={() => setMobileShowSettings(true)} />
          )}
        </div>
      )}
    </div>
  );
};

export default App;
