import axios from 'axios';

export function buildApi(baseUrl) {
  const http = axios.create({
    baseURL: baseUrl,
    timeout: 10000
  });

  return {
    async getGroups() {
      const response = await http.get('/groups');
      return response.data;
    },
    async getMessages(groupId) {
      const response = await http.get(`/messages/${groupId}`);
      return response.data;
    },
    async adminLogin(username, password) {
      const response = await http.post('/admin/login', { username, password });
      return response.data;
    },
    async adminLogout(token) {
      const response = await http.post(
        '/admin/logout',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    async adminCreateGroup(name, token) {
      const response = await http.post(
        '/admin/groups',
        { name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    async adminDeleteGroup(groupId, token) {
      const response = await http.delete(`/admin/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    async adminSetGlobalBlock(alias, blocked, token) {
      const response = await http.post(
        '/admin/blocks/global',
        { alias, blocked },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    async adminSetGroupBlock(groupId, alias, blocked, token) {
      const response = await http.post(
        '/admin/blocks/group',
        { groupId, alias, blocked },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    }
  };
}