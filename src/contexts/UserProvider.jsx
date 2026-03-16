//UserProvider.jsx

import { useContext, useState, useEffect } from "react";
import { UserContext } from "./UserContext";

export function UserProvider ({children}) {

  const initialUser = {
    isLoggedIn: false,
    name: '',
    email: '',
    role: ''
  };

  const API_URL = import.meta.env.VITE_API_URL;

  const [user, setUser] = useState(() => {
    // Restore session from localStorage on initial load
    const savedSession = localStorage.getItem("session");
    if (savedSession) {
      try {
        return JSON.parse(savedSession);
      } catch {
        return initialUser;
      }
    }
    return initialUser;
  });

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/user/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        return false;
      }
      
      // Fetch user profile after successful login
      const profileResponse = await fetch(`${API_URL}/api/user/profile`, {
        method: "GET",
        credentials: "include"
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const newUser = {
          isLoggedIn: true,
          name: profileData.username,
          email: profileData.email,
          role: profileData.role
        };
        setUser(newUser);
        localStorage.setItem("session", JSON.stringify(newUser));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  }

  const logout = async () => {
    const result = await fetch(`${API_URL}/api/user/logout`, {
      method: "POST",
      credentials: "include"
    });
    const newUser = { isLoggedIn: false, name: '', email: '' };
    setUser(newUser);
    localStorage.setItem("session", JSON.stringify(newUser));
  }

  return (
    <UserContext.Provider value={{user, login, logout}}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser () {
  return useContext(UserContext);
}