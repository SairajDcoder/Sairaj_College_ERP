import React, { createContext, useContext, useState, useEffect } from "react";
import api, { loginUser, registerUser, getCaptcha } from "../services/api";

const AuthContext = createContext();

export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await api.get("/auth/me", { withCredentials: true });
        setUser(res.data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (
    email,
    password,
    captchaAnswer,
    captchaToken,
    rememberMe
  ) => {
    try {
      const response = await loginUser(
        email,
        password,
        captchaAnswer,
        captchaToken,
        rememberMe
      );
      const { user: userData } = response.data;

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Login failed",
      };
    }
  };

  const register = async (userData, captchaAnswer, captchaToken) => {
    try {
      await registerUser(userData, captchaAnswer, captchaToken);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Registration failed",
      };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout"); // call backend to clear cookie
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      localStorage.removeItem("user"); // optional
      setUser(null);
    }
  };

  const getCaptchaData = async () => {
    try {
      const response = await getCaptcha();
      return response.data;
    } catch (error) {
      throw new Error("Failed to get captcha");
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    getCaptchaData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
