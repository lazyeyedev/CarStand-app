import { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('carstand_token'));
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await axiosInstance.get('/auth/me');
        setUser(data.user);
      } catch {
        localStorage.removeItem('carstand_token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    restore();
  }, [token]);

  const storeToken = (t) => {
    localStorage.setItem('carstand_token', t);
    setToken(t);
  };

  const login = async (email, password) => {
    const { data } = await axiosInstance.post('/auth/login', { email, password });
    storeToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const registerUser = async (formData) => {
    const { data } = await axiosInstance.post('/auth/register', formData);
    storeToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const registerDealer = async (formData) => {
    const { data } = await axiosInstance.post('/auth/register/dealer', formData);
    storeToken(data.token);
    setUser(data.user);
    return data.user;
  };

  // Buyer -> dealer on the same account. The server returns a fresh token and
  // the updated user, so the app switches to the dealer side without a re-login.
  const upgradeToDealer = async (formData) => {
    const { data } = await axiosInstance.post('/auth/upgrade-to-dealer', formData);
    storeToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('carstand_token');
    localStorage.removeItem('carstand_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        registerUser,
        registerDealer,
        upgradeToDealer,
        logout,
        isDealer: user?.role === 'dealer',
        isAdmin:  user?.role === 'admin',
        isUser:   user?.role === 'user',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
