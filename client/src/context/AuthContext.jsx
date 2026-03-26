import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'; // eslint-disable-line no-unused-vars
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const logoutRef = useRef(null);

    const clearSession = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    }, []);

    const logout = useCallback(async (options = {}) => {
        const { silent = false } = options;
        try {
            await api.post('/auth/logout');
        } catch (e) {
            // Swallow — token may already be invalid
        }
        clearSession();
        // Pass success message as route state; Login page reads and displays it
        // replace: true prevents the browser back button from returning to protected pages
        navigate('/login', {
            replace: true,
            state: silent ? undefined : { successMessage: 'Logged out successfully' }
        });
    }, [clearSession, navigate]);

    // Store latest logout in a ref so the API interceptor can call it
    // without needing to re-subscribe to closure updates
    useEffect(() => {
        logoutRef.current = logout;
    }, [logout]);

    // Listen for global auth:logout events dispatched by the API interceptor
    useEffect(() => {
        const handler = () => logoutRef.current?.({ silent: true });
        window.addEventListener('auth:logout', handler);
        return () => window.removeEventListener('auth:logout', handler);
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await api.get('/users/me');
                if (res.success) {
                    setUser(res.data);
                } else {
                    clearSession();
                }
            } catch (error) {
                console.error('Failed to authenticate user', error);
                clearSession();
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [clearSession]);

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
