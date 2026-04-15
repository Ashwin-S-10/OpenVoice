import { useChat } from '../../context/ChatContext';

function Navbar() {
  const { alias, setAlias, serverUrl, wsConnected } = useChat();

  return (
    <header className="navbar">
      <div className="brand">OpenVoice</div>
      <div className="navbar-right">
        <span className={`status ${wsConnected ? 'online' : 'offline'}`}>
          {wsConnected ? 'Connected' : 'Disconnected'}
        </span>
        <span className="server">{serverUrl}</span>
        <input
          className="alias-input"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          placeholder="Alias"
        />
      </div>
    </header>
  );
}

export default Navbar;