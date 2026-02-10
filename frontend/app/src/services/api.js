import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async register(username, password, email, city) {
    const response = await api.post('/auth/register', {
      username,
      password,
      email,
      city,
    });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  async login(username, password) {
    const response = await api.post('/auth/login', {
      username,
      password,
    });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/auth/me');
    return response.data.user;
  },

  async updateProfile(data) {
    const response = await api.put('/auth/profile', data);
    
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};

export const gamesService = {
  async getTeamGames(teamName, refresh = false) {
    const response = await api.get(`/games/${encodeURIComponent(teamName)}`, {
      params: { refresh: refresh ? 'true' : undefined },
    });
    return response.data;
  },

  async getTravelInfo(gameId) {
    const response = await api.get(`/games/${gameId}/travel`);
    return response.data;
  },

  async saveGameToDiary(gameId, data = {}) {
    const response = await api.post(`/games/${gameId}/save`, data);
    return response.data;
  },

  async removeFromDiary(gameId) {
    const response = await api.delete(`/games/${gameId}/diary`);
    return response.data;
  },
};

export const diaryService = {
  async getDiary() {
    const response = await api.get('/diary');
    return response.data;
  },
};

export const utilsService = {
  async searchCities(search) {
    const response = await api.get('/cities', {
      params: { search },
    });
    return response.data.cities;
  },

  async healthCheck() {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;