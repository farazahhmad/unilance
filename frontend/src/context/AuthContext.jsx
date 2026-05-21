import { createContext, useState, useEffect } from 'react';
import API from '../api/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Normalize user object to ensure _id is set (handle both old 'id' and new '_id' formats)
    const normalizeUser = (userData) => {
        if (!userData) return null;
        return {
            ...userData,
            _id: userData._id || userData.id || null
        };
    };

    // Check if user is already logged in (on page load)
    useEffect(() => {
        const checkLoggedIn = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const res = await API.get('/auth/me'); 
                    setUser(normalizeUser(res.data.user));
                }
            } catch (err) {
                localStorage.removeItem('token');
            } finally {
                setLoading(false);
            }
        };
        checkLoggedIn();
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        setUser(normalizeUser(userData));
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};