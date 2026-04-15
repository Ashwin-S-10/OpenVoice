function send(socket, payload) {
  socket.send(JSON.stringify(payload));
}

export function toWebSocketUrl(serverUrl) {
  if (serverUrl.startsWith('https://')) {
    return serverUrl.replace('https://', 'wss://') + '/ws/chat';
  }
  return serverUrl.replace('http://', 'ws://') + '/ws/chat';
}

export function createChatSocket(url, handlers) {
  const socket = new WebSocket(url);

  socket.onopen = () => handlers.onOpen?.();
  socket.onclose = () => handlers.onClose?.();
  socket.onerror = () => handlers.onClose?.();
  socket.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      handlers.onMessage?.(parsed);
    } catch {
    }
  };

  return {
    joinGroup(groupId, alias) {
      if (socket.readyState === WebSocket.OPEN) {
        send(socket, { type: 'JOIN_GROUP', groupId, alias });
      }
    },
    leaveGroup(groupId) {
      if (socket.readyState === WebSocket.OPEN) {
        send(socket, { type: 'LEAVE_GROUP', groupId });
      }
    },
    sendMessage({ groupId, alias, content }) {
      if (socket.readyState === WebSocket.OPEN) {
        send(socket, { type: 'SEND_MESSAGE', groupId, alias, content });
      }
    },
    isConnected() {
      return socket.readyState === WebSocket.OPEN;
    },
    close() {
      socket.close();
    }
  };
}