import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userType, setUserType] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const encrypt = (text) => {
    try {
      return btoa(text);
    } catch (error) {
      console.error("Encryption error:", error);
      return null;
    }
  };

  const decrypt = (encrypted) => {
    try {
      return atob(encrypted);
    } catch (error) {
      console.error("Decryption error:", error);
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem("userType");
    localStorage.removeItem("userId");
    setUserType(null);
    setUserId(null);
    navigate("/");
  };

  useEffect(() => {
    const storedType = localStorage.getItem("userType");
    const storedId = localStorage.getItem("userId");

    if (storedType) setUserType(decrypt(storedType));
    if (storedId) setUserId(decrypt(storedId));

    setIsLoading(false); 
  }, []);

  useEffect(() => {
    if (userType) {
      localStorage.setItem("userType", encrypt(userType));
    }
  }, [userType]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem("userId", encrypt(userId));
    }
  }, [userId]);

  return (
    <AuthContext.Provider
      value={{ userType, setUserType, userId, setUserId, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
