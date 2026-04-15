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
    async createGroup(name) {
      const response = await http.post('/groups', { name });
      return response.data;
    },
    async getMessages(groupId) {
      const response = await http.get(`/messages/${groupId}`);
      return response.data;
    }
  };
}