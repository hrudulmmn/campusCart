import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: verify token still valid by calling /me
  useEffect(() => {
    const token = localStorage.getItem("campusCartToken");
    if (!token) {
      setIsLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => {
        // Token invalid — clean up
        localStorage.removeItem("campusCartToken");
        localStorage.removeItem("campusCartUser");
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Register new user — called from RegisterModal/page
  // Returns { success, error }
  const register = async ({ name, email, password, role, phone, whatsapp }) => {
    try {
      const res = await api.post("/auth/register", {
        name, email, password, role, phone, whatsapp,
      });
      localStorage.setItem("campusCartToken", res.data.token);
      localStorage.setItem("campusCartUser", JSON.stringify(res.data.user));
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Registration failed" };
    }
  };

  // Login — called from LoginModal
  // Returns { success, error }
  const login = async ({ email, password }) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("campusCartToken", res.data.token);
      localStorage.setItem("campusCartUser", JSON.stringify(res.data.user));
      setUser(res.data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Login failed" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("campusCartToken");
    localStorage.removeItem("campusCartUser");
  };

  // Admin: block a user by ID — calls PUT /api/admin/users/:id/block
  const blockUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/block`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Block failed" };
    }
  };

  // Admin: unblock a user by ID — calls PUT /api/admin/users/:id/unblock
  const unblockUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/unblock`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || "Unblock failed" };
    }
  };

  const isAdmin = () => user?.role === "admin";
  const isSeller = () => user?.role === "seller";
  const isBuyer = () => user?.role === "buyer";

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAdmin,
        isSeller,
        isBuyer,
        isLoading,
        // blockedUsers is now server-side on each User document (isBlocked field)
        // Admin.jsx fetches users from API and checks u.isBlocked directly
        blockUser,
        unblockUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
