import axios from 'axios';

// Base URL for your Django backend
const API_URL = 'http://127.0.0.1:8000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests automatically
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Auth APIs
export const register = async (userData) => {
    const response = await axios.post(`${API_URL}/auth/users/`, userData);
    return response.data;
};

export const login = async (credentials) => {
    const response = await axios.post(`${API_URL}/auth/jwt/create/`, credentials);
    return response.data;
};

export const refreshToken = async (refresh) => {
    const response = await axios.post(`${API_URL}/auth/jwt/refresh/`, { refresh });
    return response.data;
};

// Book APIs
export const getBooks = async () => {
    const response = await api.get('/books/');
    return response.data;
};

export const createBook = async (bookData) => {
    const response = await api.post('/books/', bookData);
    return response.data;
};

export const updateBook = async (id, bookData) => {
    const response = await api.put(`/books/${id}/`, bookData);
    return response.data;
};

export const deleteBook = async (id) => {
    const response = await api.delete(`/books/${id}/`);
    return response.data;
};

// Book Search
export const searchBooksExternal = async (query) => {
    const response = await api.get(`/books/search/?q=${query}`);
    return response.data;
};

// Admin - Books
export const adminGetAllBooks = async () => {
    const response = await api.get('/admin/books/');
    return response.data;
};

export const adminDeleteBook = async (id) => {
    const response = await api.delete(`/admin/books/${id}/`);
    return response.data;
};

export const adminUpdateBook = async (id, bookData) => {
    const response = await api.put(`/admin/books/${id}/update/`, bookData);
    return response.data;
};

// Admin - Users
export const adminGetAllUsers = async () => {
    const response = await api.get('/admin/users/');
    return response.data;
};

export const adminGetUserDetail = async (id) => {
    const response = await api.get(`/admin/users/${id}/`);
    return response.data;
};

export const adminUpdateUser = async (id, userData) => {
    const response = await api.put(`/admin/users/${id}/update/`, userData);
    return response.data;
};

export const adminDeleteUser = async (id) => {
    const response = await api.delete(`/admin/users/${id}/delete/`);
    return response.data;
};

export const adminGetAnalytics = async () => {
    const response = await api.get('/admin/analytics/');
    return response.data;
};

export default api;