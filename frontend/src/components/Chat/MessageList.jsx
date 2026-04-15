import { useEffect, useRef } from 'react';

function formatTimestamp(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MessageList({ messages, currentAlias, isLoading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="message-list">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className={`message-row ${item % 2 === 0 ? 'outgoing' : 'incoming'}`}>
            <div className="message-bubble skeleton" />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return <div className="messages-empty">No messages yet</div>;
  }

  return (
    <div className="message-list">
      {messages.map((message, index) => (
        <div
          className={`message-row ${(message.aliasName || message.alias) === currentAlias ? 'outgoing' : 'incoming'}`}
          key={`${message.id || message.createdAt}-${index}`}
        >
          <div className="message-bubble">
            <div className="meta-row">
              <span className="meta-user">{message.aliasName || message.alias || 'Unknown'}</span>
              <span className="meta-time">{formatTimestamp(message.createdAt)}</span>
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;