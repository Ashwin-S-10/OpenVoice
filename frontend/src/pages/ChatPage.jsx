import Navbar from '../components/Common/Navbar';
import GroupList from '../components/Groups/GroupList';
import ChatWindow from '../components/Chat/ChatWindow';

function ChatPage() {
  return (
    <div className="chat-page">
      <Navbar />
      <div className="chat-layout">
        <GroupList />
        <ChatWindow />
      </div>
    </div>
  );
}

export default ChatPage;