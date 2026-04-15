import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';

function Home() {
  const navigate = useNavigate();
  const { serverUrl, setServerUrl } = useChat();
  const [value, setValue] = useState(serverUrl);
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  function onConnect(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }
    setServerUrl(trimmed);
    navigate('/chat');
  }

  return (
    <main className="home-page">
      <h1>OpenVoice</h1>
      <form className="connect-form" onSubmit={onConnect}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={`Server URL (e.g. http://${host}:8080)`}
        />
        <button type="submit">Connect</button>
      </form>
    </main>
  );
}

export default Home;