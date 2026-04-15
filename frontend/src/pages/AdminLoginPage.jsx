import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { buildApi } from '../services/api';
import { setAdminToken } from '../utils/adminAuth';

function AdminLoginPage() {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const serverUrl = localStorage.getItem('openvoice_server_url') || `http://${host}:8080`;
  const api = useMemo(() => buildApi(serverUrl), [serverUrl]);
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    if (!trimmedUsername || !trimmedPassword) {
      setError('Username and password are required');
      return;
    }

    try {
      setLoading(true);
      const response = await api.adminLogin(trimmedUsername, trimmedPassword);
      setAdminToken(response.token);
      navigate('/admin');
    } catch (loginError) {
      setError(loginError?.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-login-page">
      <div className="admin-login-card">
        <h1>Admin Login</h1>
        <p>Sign in to manage groups and user access controls.</p>

        <form className="admin-login-form" onSubmit={onSubmit}>
          <label>
            <span>👤</span>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label>
            <span>🔒</span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error ? <div className="admin-form-error">{error}</div> : null}

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <Link to="/" className="admin-back-link">← Back to chat</Link>
      </div>
    </section>
  );
}

export default AdminLoginPage;
