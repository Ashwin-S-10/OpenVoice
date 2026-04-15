import { useChat } from '../../context/ChatContext';
import MessageInput from './MessageInput';
import MessageList from './MessageList';

function ChatWindow() {
  const { currentGroupId, messages, sendMessage } = useChat();

  if (!currentGroupId) {
    return <div className="chat-empty">Create or select a group to begin chatting.</div>;
  }

  return (
    <section className="chat-window">
      <MessageList messages={messages} />
      <MessageInput onSend={sendMessage} />
    </section>
  );
}

export default ChatWindow;