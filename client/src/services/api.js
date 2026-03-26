import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

API.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response) {
            // Auto-logout on 401 Unauthorized (expired / invalid token)
            if (error.response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // AuthContext listens for this event and handles redirect
                window.dispatchEvent(new Event('auth:logout'));
            }
            return Promise.reject(new Error(error.response.data?.error || error.response.data?.message || `HTTP Error ${error.response.status}`));
        }
        return Promise.reject(new Error('Network Error. Please check your connection to the server.'));
    }
);

export const api = API;
export default API;
