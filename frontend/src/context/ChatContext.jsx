import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { buildApi } from '../services/api';
import { createChatSocket, toWebSocketUrl } from '../services/websocket';

const ChatContext = createContext(null);

const runtimeHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const DEFAULT_SERVER_URL = localStorage.getItem('openvoice_server_url') || `http://${runtimeHost}:8080`;
const DEFAULT_ALIAS = localStorage.getItem('openvoice_alias') || `User${Math.floor(Math.random() * 1000)}`;

export function ChatProvider({ children }) {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [alias, setAlias] = useState(DEFAULT_ALIAS);
  const [groups, setGroups] = useState([]);
  const [currentGroupId, setCurrentGroupId] = useState(null);
  const [messagesByGroup, setMessagesByGroup] = useState({});
  const [wsConnected, setWsConnected] = useState(false);

  const socketRef = useRef(null);

  const api = useMemo(() => buildApi(serverUrl), [serverUrl]);

  useEffect(() => {
    localStorage.setItem('openvoice_server_url', serverUrl);
  }, [serverUrl]);

  useEffect(() => {
    localStorage.setItem('openvoice_alias', alias);
  }, [alias]);

  useEffect(() => {
    loadGroups();
  }, [api]);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    const socket = createChatSocket(toWebSocketUrl(serverUrl), {
      onOpen: () => {
        setWsConnected(true);
      },
      onClose: () => setWsConnected(false),
      onMessage: (message) => {
        if (!message?.groupId) {
          return;
        }
        setMessagesByGroup((prev) => ({
          ...prev,
          [message.groupId]: [...(prev[message.groupId] || []), message]
        }));
      }
    });

    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [serverUrl]);

  useEffect(() => {
    if (currentGroupId && socketRef.current?.isConnected()) {
      socketRef.current.joinGroup(currentGroupId);
    }
  }, [currentGroupId, wsConnected]);

  async function loadGroups() {
    try {
      const data = await api.getGroups();
      setGroups(data);
      if (!currentGroupId && data.length > 0) {
        selectGroup(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load groups', error);
    }
  }

  async function createGroup(name) {
    const group = await api.createGroup(name);
    setGroups((prev) => [group, ...prev]);
    await selectGroup(group.id);
  }

  async function selectGroup(groupId) {
    if (!groupId) {
      return;
    }

    if (currentGroupId && currentGroupId !== groupId && socketRef.current?.isConnected()) {
      socketRef.current.leaveGroup(currentGroupId);
    }

    setCurrentGroupId(groupId);

    if (!messagesByGroup[groupId]) {
      try {
        const history = await api.getMessages(groupId);
        setMessagesByGroup((prev) => ({ ...prev, [groupId]: history }));
      } catch (error) {
        console.error('Failed to load messages', error);
      }
    }

  }

  function sendMessage(content) {
    if (!currentGroupId || !socketRef.current?.isConnected()) {
      return;
    }

    socketRef.current.sendMessage({
      groupId: currentGroupId,
      alias,
      content
    });
  }

  const value = {
    alias,
    setAlias,
    serverUrl,
    setServerUrl,
    wsConnected,
    groups,
    loadGroups,
    createGroup,
    currentGroupId,
    selectGroup,
    messages: currentGroupId ? messagesByGroup[currentGroupId] || [] : [],
    sendMessage
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used inside ChatProvider');
  }
  return context;
}