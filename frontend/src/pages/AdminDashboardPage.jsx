import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { buildApi } from '../services/api';
import { clearAdminToken, getAdminToken } from '../utils/adminAuth';

function AdminDashboardPage() {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const serverUrl = localStorage.getItem('openvoice_server_url') || `http://${host}:8080`;
  const api = useMemo(() => buildApi(serverUrl), [serverUrl]);
  const navigate = useNavigate();

  const [token, setToken] = useState(getAdminToken());
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [alias, setAlias] = useState('');
  const [blockScope, setBlockScope] = useState('GLOBAL');
  const [targetGroupId, setTargetGroupId] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/adminlogin');
      return;
    }
    loadGroups();
  }, [token]);

  async function loadGroups() {
    try {
      const data = await api.getGroups();
      setGroups(data);
      if (!targetGroupId && data.length > 0) {
        setTargetGroupId(String(data[0].id));
      }
    } catch {
      setStatusMessage('Failed to load groups');
    }
  }

  async function createGroup(e) {
    e.preventDefault();
    const trimmed = groupName.trim();
    if (!trimmed) {
      setStatusMessage('Group name is required');
      return;
    }

    try {
      setLoading(true);
      await api.adminCreateGroup(trimmed, token);
      setGroupName('');
      setStatusMessage('Group created');
      await loadGroups();
    } catch (error) {
      if (error?.response?.status === 401) {
        clearAdminToken();
        setToken('');
        navigate('/adminlogin');
        return;
      }
      setStatusMessage(error?.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  }

  async function deleteGroup(groupId) {
    try {
      setLoading(true);
      await api.adminDeleteGroup(groupId, token);
      setStatusMessage('Group deleted');
      await loadGroups();
    } catch (error) {
      if (error?.response?.status === 401) {
        clearAdminToken();
        setToken('');
        navigate('/adminlogin');
        return;
      }
      setStatusMessage(error?.response?.data?.message || 'Failed to delete group');
    } finally {
      setLoading(false);
    }
  }

  async function applyBlock(blocked) {
    const trimmedAlias = alias.trim();
    if (!trimmedAlias) {
      setStatusMessage('Alias is required for blocking');
      return;
    }

    try {
      setLoading(true);
      if (blockScope === 'GLOBAL') {
        await api.adminSetGlobalBlock(trimmedAlias, blocked, token);
      } else {
        if (!targetGroupId) {
          setStatusMessage('Select a target group');
          return;
        }
        await api.adminSetGroupBlock(Number(targetGroupId), trimmedAlias, blocked, token);
      }
      setStatusMessage(blocked ? 'User blocked' : 'User unblocked');
      setAlias('');
    } catch (error) {
      if (error?.response?.status === 401) {
        clearAdminToken();
        setToken('');
        navigate('/adminlogin');
        return;
      }
      setStatusMessage(error?.response?.data?.message || 'Failed to update block');
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      if (token) {
        await api.adminLogout(token);
      }
    } catch {
    } finally {
      clearAdminToken();
      setToken('');
      navigate('/adminlogin');
    }
  }

  return (
    <section className="admin-dashboard-page">
      <div className="admin-dashboard-container">
        <header className="admin-dashboard-top">
          <h1>Admin Dashboard</h1>
          <div className="admin-dashboard-actions">
            <Link to="/">Open chat</Link>
            <button type="button" onClick={logout}>Logout</button>
          </div>
        </header>

        <section className="admin-dashboard-grid">
          <article className="admin-panel">
            <h2>Create group</h2>
            <form className="admin-inline-form" onSubmit={createGroup}>
              <input
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="New group name"
              />
              <button type="submit" disabled={loading}>Create</button>
            </form>
          </article>

          <article className="admin-panel">
            <h2>Block controls</h2>
            <div className="admin-block-form">
              <input
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Alias"
              />

              <select value={blockScope} onChange={(e) => setBlockScope(e.target.value)}>
                <option value="GLOBAL">Global</option>
                <option value="GROUP">Group-specific</option>
              </select>

              {blockScope === 'GROUP' ? (
                <select value={targetGroupId} onChange={(e) => setTargetGroupId(e.target.value)}>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              ) : null}

              <div className="admin-block-actions">
                <button type="button" onClick={() => applyBlock(true)} disabled={loading}>Block</button>
                <button type="button" onClick={() => applyBlock(false)} disabled={loading}>Unblock</button>
              </div>
            </div>
          </article>

          <article className="admin-panel admin-groups-panel">
            <h2>Groups</h2>
            <div className="admin-group-list">
              {groups.map((group) => (
                <div key={group.id} className="admin-group-row">
                  <span>{group.name}</span>
                  <button type="button" onClick={() => deleteGroup(group.id)} disabled={loading}>Delete</button>
                </div>
              ))}
            </div>
          </article>
        </section>

        {statusMessage ? <p className="admin-status">{statusMessage}</p> : null}
      </div>
    </section>
  );
}

export default AdminDashboardPage;
