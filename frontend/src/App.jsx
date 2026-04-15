import { useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import MessageInput from './components/Chat/MessageInput';
import MessageList from './components/Chat/MessageList';
import { useChat } from './context/ChatContext';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminLoginPage from './pages/AdminLoginPage';

function UserChatApp() {
  const {
    groups,
    currentGroupId,
    selectGroup,
    messages,
    sendMessage,
    wsConnected,
    alias,
    messagesLoading,
    messageCountsByGroup,
    isBlockedInCurrentGroup,
    accessNotice,
    clearAccessNotice
  } = useChat();

  const [activeScreen, setActiveScreen] = useState('groups');

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === currentGroupId) || null,
    [groups, currentGroupId]
  );

  async function openGroup(groupId) {
    await selectGroup(groupId);
    setActiveScreen('chat');
  }

  function backToGroups() {
    setActiveScreen('groups');
  }

  return (
    <main className="app-shell">
      {activeScreen === 'groups' ? (
        <section className="screen groups-screen" key="groups-screen">
          <div className="groups-container">
            <header className="top-nav">
              <div className="brand">OpenVoice</div>
              <Link className="admin-login-btn" to="/adminlogin">Admin Login</Link>
            </header>

            <section className="groups-section">
              <h1>Groups</h1>

              <section className="groups-grid" aria-label="Group selection">
                {groups.map((group) => {
                  const unread = messageCountsByGroup[group.id] || 0;
                  return (
                    <button
                      key={group.id}
                      className="group-card"
                      onClick={() => openGroup(group.id)}
                      type="button"
                    >
                      <span className="group-card-icon">🗨</span>
                      <span className="group-card-name">{group.name}</span>
                      {unread > 0 ? <span className="group-badge">{unread}</span> : null}
                    </button>
                  );
                })}
              </section>
            </section>

            {groups.length === 0 ? (
              <p className="groups-empty">No groups available yet. Please contact admin.</p>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="screen chat-screen" key="chat-screen">
          <header className="chat-header">
            <button type="button" className="back-button" onClick={backToGroups}>
              ←
            </button>
            <h2>{selectedGroup?.name || 'Chat'}</h2>
            <div className="header-status">
              <span className={`status-dot ${wsConnected ? 'online' : 'offline'}`} />
              <span className="status-text">{wsConnected ? 'Connected' : 'Disconnected'}</span>
              <span className="user-pill">{alias}</span>
            </div>
          </header>

          {accessNotice ? (
            <div className="access-notice" role="status">
              <span>{accessNotice}</span>
              <button type="button" onClick={clearAccessNotice}>Dismiss</button>
            </div>
          ) : null}

          <div className="chat-messages-wrap">
            <MessageList messages={messages} currentAlias={alias} isLoading={messagesLoading} />
          </div>

          <footer className="chat-input-wrap">
            <MessageInput onSend={sendMessage} disabled={isBlockedInCurrentGroup} />
          </footer>
        </section>
      )}
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<UserChatApp />} />
      <Route path="/adminlogin" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;