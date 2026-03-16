import { useUser } from '../contexts/UserProvider';
import { Navigate } from 'react-router-dom';

export default function RequireAuth({ children }) {
  const { user } = useUser();
  
  // Check if user is logged in
  if (!user.isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}