import { useEffect, useRef } from 'react';

function MessageList({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.map((message, index) => (
        <div className="message-bubble" key={`${message.createdAt}-${index}`}>
          <div className="meta">{message.aliasName || message.alias || 'Unknown'}</div>
          <div>{message.content}</div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

export default MessageList;