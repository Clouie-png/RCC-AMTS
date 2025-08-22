import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    const storedName = localStorage.getItem('name');

    console.log("AuthContext: Initializing. Stored token:", storedToken ? "exists" : "none", "Stored role:", storedRole);

    if (storedToken && storedRole && storedName) {
      try {
        const decodedToken = jwtDecode(storedToken);
        console.log("Decoded token:", decodedToken);
        setUser({ 
          token: storedToken, 
          role: storedRole, 
          name: storedName,
          id: decodedToken.id
        });
        console.log("AuthContext: User set from localStorage:", { role: storedRole, name: storedName, id: decodedToken.id });
      } catch (error) {
        console.error("Error decoding token:", error);
        // If token is invalid, clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('name');
      }
    }
    setLoading(false);
    console.log("AuthContext: Loading finished.");
  }, []);

  const login = (token, role, name) => {
    try {
      const decodedToken = jwtDecode(token);
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('name', name);
      setUser({ token, role, name, id: decodedToken.id });
      console.log("AuthContext: User logged in. Role:", role, "ID:", decodedToken.id);
      // Redirect based on role
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'faculty/staff') {
        navigate('/faculty-staff');
      } else if (role === 'maintenance') {
        navigate('/maintenance');
      } else {
        navigate('/'); // Default redirect
      }
    } catch (error) {
      console.error("Error decoding token during login:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    setUser(null);
    console.log("AuthContext: User logged out.");
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
