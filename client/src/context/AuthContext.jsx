import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('carstand_token'));
  const [loading, setLoading] = useState(true);
  // Ids of listings the signed-in person has saved, as strings.
  const [savedIds, setSavedIds] = useState([]);

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

  // Login/register responses don't carry saved listings, so load them once
  // per signed-in account. Admins can't use the buyer side, so skip them.
  const userId = user?._id;
  const userRole = user?.role;
  useEffect(() => {
    if (!userId || userRole === 'admin') { setSavedIds([]); return; }
    let cancelled = false;
    axiosInstance.get('/users/saved')
      .then(({ data }) => { if (!cancelled) setSavedIds((data.savedIds || []).map(String)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [userId, userRole]);

  const isSaved = useCallback((listingId) => savedIds.includes(String(listingId)), [savedIds]);

  // Returns the new saved state. Throws on failure so the caller can toast.
  const toggleSaved = async (listingId) => {
    const id = String(listingId);
    const wasSaved = savedIds.includes(id);
    const { data } = wasSaved
      ? await axiosInstance.delete(`/users/saved/${id}`)
      : await axiosInstance.post(`/users/saved/${id}`);
    setSavedIds((data.savedListings || []).map(String));
    return !wasSaved;
  };

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
        isSaved,
        toggleSaved,
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
