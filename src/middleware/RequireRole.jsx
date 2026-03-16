import { useUser } from '../contexts/UserProvider';
import { Navigate } from 'react-router-dom';

// RequireRole component - restricts access based on user role
// allowedRoles: array of roles that can access the children
export default function RequireRole({ children, allowedRoles }) {
  const { user } = useUser();
  
  // Check if user is logged in
  if (!user.isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has required role
  if (!allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
        <p>Required role: {allowedRoles.join(' or ')}</p>
      </div>
    );
  }
  
  return children;
}
