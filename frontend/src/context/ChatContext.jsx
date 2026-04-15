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
  const [messagesLoadingByGroup, setMessagesLoadingByGroup] = useState({});
  const [wsConnected, setWsConnected] = useState(false);
  const [globallyBlocked, setGloballyBlocked] = useState(false);
  const [groupBlockedMap, setGroupBlockedMap] = useState({});
  const [accessNotice, setAccessNotice] = useState('');

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
        if (!message) {
          return;
        }

        if (message.type === 'ERROR') {
          setAccessNotice(message.message || 'Action not allowed');
          return;
        }

        if (message.type === 'ADMIN_EVENT') {
          handleAdminEvent(message);
          return;
        }

        if (!message.groupId) {
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
      socketRef.current.joinGroup(currentGroupId, alias);
    }
  }, [currentGroupId, wsConnected, alias]);

  async function loadGroups() {
    try {
      const data = await api.getGroups();
      setGroups(data);
    } catch (error) {
      console.error('Failed to load groups', error);
    }
  }

  async function selectGroup(groupId) {
    if (!groupId) {
      return;
    }

    if (currentGroupId && currentGroupId !== groupId && socketRef.current?.isConnected()) {
      socketRef.current.leaveGroup(currentGroupId);
    }

    setCurrentGroupId(groupId);
    setAccessNotice('');

    if (!messagesByGroup[groupId]) {
      setMessagesLoadingByGroup((prev) => ({ ...prev, [groupId]: true }));
      try {
        const history = await api.getMessages(groupId);
        setMessagesByGroup((prev) => ({ ...prev, [groupId]: history }));
      } catch (error) {
        console.error('Failed to load messages', error);
      } finally {
        setMessagesLoadingByGroup((prev) => ({ ...prev, [groupId]: false }));
      }
    }

  }

  function sendMessage(content) {
    if (!currentGroupId || !socketRef.current?.isConnected()) {
      return;
    }

    if (globallyBlocked || groupBlockedMap[currentGroupId]) {
      setAccessNotice('You are blocked from sending messages in this group');
      return;
    }

    socketRef.current.sendMessage({
      groupId: currentGroupId,
      alias,
      content
    });
  }

  function handleAdminEvent(eventMessage) {
    const eventType = eventMessage.event;
    const eventData = eventMessage.data || {};

    if (eventType === 'GROUP_CREATED' && eventData.group) {
      setGroups((prev) => {
        if (prev.some((group) => group.id === eventData.group.id)) {
          return prev;
        }
        return [eventData.group, ...prev];
      });
      return;
    }

    if (eventType === 'GROUP_DELETED') {
      const deletedGroupId = Number(eventData.groupId);
      setGroups((prev) => prev.filter((group) => group.id !== deletedGroupId));
      setMessagesByGroup((prev) => {
        const next = { ...prev };
        delete next[deletedGroupId];
        return next;
      });
      setMessagesLoadingByGroup((prev) => {
        const next = { ...prev };
        delete next[deletedGroupId];
        return next;
      });
      setGroupBlockedMap((prev) => {
        const next = { ...prev };
        delete next[deletedGroupId];
        return next;
      });
      if (currentGroupId === deletedGroupId) {
        setCurrentGroupId(null);
        setAccessNotice('This group was removed by admin');
      }
      return;
    }

    if (eventType === 'USER_BLOCK_UPDATED') {
      const normalizedAlias = String(alias || '').trim().toLowerCase();
      const targetAlias = String(eventData.alias || '').trim().toLowerCase();
      if (!normalizedAlias || normalizedAlias !== targetAlias) {
        return;
      }

      const isBlocked = Boolean(eventData.blocked);
      if (eventData.scope === 'GLOBAL') {
        setGloballyBlocked(isBlocked);
        setAccessNotice(isBlocked ? 'You are blocked globally by admin' : 'Global block removed');
      }

      if (eventData.scope === 'GROUP') {
        const blockedGroupId = Number(eventData.groupId);
        setGroupBlockedMap((prev) => ({
          ...prev,
          [blockedGroupId]: isBlocked
        }));
        if (currentGroupId === blockedGroupId) {
          setAccessNotice(isBlocked ? 'You are blocked in this group by admin' : 'Group block removed');
        }
      }
    }
  }

  const isBlockedInCurrentGroup = currentGroupId
    ? globallyBlocked || Boolean(groupBlockedMap[currentGroupId])
    : globallyBlocked;

  const value = {
    alias,
    setAlias,
    serverUrl,
    setServerUrl,
    wsConnected,
    groups,
    loadGroups,
    currentGroupId,
    selectGroup,
    messages: currentGroupId ? messagesByGroup[currentGroupId] || [] : [],
    messagesLoading: currentGroupId ? Boolean(messagesLoadingByGroup[currentGroupId]) : false,
    messageCountsByGroup: Object.fromEntries(
      Object.entries(messagesByGroup).map(([groupId, groupMessages]) => [groupId, groupMessages.length])
    ),
    sendMessage,
    isBlockedInCurrentGroup,
    accessNotice,
    clearAccessNotice: () => setAccessNotice('')
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