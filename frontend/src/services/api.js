import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a las solicitudes
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

// Servicios de Autenticación
export const authService = {
  register: async (userData) => {
    const response = await api.post('/register', userData);
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userName', response.data.nombre);
      localStorage.setItem('userId', response.data.userId);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
  },

  getCurrentUser: async () => {
    const response = await api.get('/profile');
    return response.data.user;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/update-profile', profileData);
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/delete-account');
    return response.data;
  },

  getSecurityQuestion: async (email) => {
    const response = await api.get(`/get-security-question/${email}`);
    return response.data;
  },

  verifySecurityAnswer: async (email, answer) => {
    const response = await api.post('/verify-security-answer', { email, answer });
    return response.data;
  },

  resetPassword: async (email, answer, newPassword) => {
    const response = await api.post('/reset-password', { email, answer, newPassword });
    return response.data;
  },
};

// Servicios de Recetas
export const recipeService = {
  getAll: async () => {
    const response = await api.get('/recipes');
    return response.data;
  },

  getFeatured: async () => {
    const response = await api.get('/featured-recipes');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/get-recipe/${id}`);
    return response.data;
  },

  search: async (term) => {
    const response = await api.get(`/api/search?term=${encodeURIComponent(term)}`);
    return response.data;
  },

  create: async (recipeData) => {
    const response = await api.post('/add-recipe', recipeData);
    return response.data;
  },

  update: async (id, recipeData) => {
    const response = await api.put(`/recipe/${id}`, recipeData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/recipe/${id}`);
    return response.data;
  },

  getUserRecipes: async () => {
    const response = await api.get('/user-recipes');
    return response.data;
  },
};

// Servicios de Comentarios
export const commentService = {
  getByRecipeId: async (recipeId) => {
    const response = await api.get(`/comentarios/${recipeId}`);
    return response.data;
  },

  create: async (recipeId, comentario, calificacion) => {
    const response = await api.post('/comentarios', { receta_id: recipeId, comentario, calificacion });
    return response.data;
  },

  update: async (id, comentario, calificacion) => {
    const response = await api.put(`/comentarios/${id}`, { comentario, calificacion });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/comentarios/${id}`);
    return response.data;
  },

  getReplies: async (commentId) => {
    const response = await api.get(`/comentarios/${commentId}/respuestas`);
    return response.data;
  },

  createReply: async (commentId, respuesta) => {
    const response = await api.post(`/comentarios/${commentId}/respuestas`, { respuesta });
    return response.data;
  },

  deleteReply: async (id) => {
    const response = await api.delete(`/respuestas_comentarios_recetas/${id}`);
    return response.data;
  },
};

export default api;
