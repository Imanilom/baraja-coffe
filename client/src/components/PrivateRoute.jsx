import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ allowedRoles }) => {
  const { currentUser } = useSelector((state) => state.user);

  if (!currentUser) {
    // Redirect to sign-in if the user is not authenticated
    return <Navigate to="/sign-in" replace />;
  }

  if (allowedRoles) {
    const rawRole = typeof currentUser.role === 'object' ? currentUser.role?.name : currentUser.role;
    const userRole = (rawRole || '').toLowerCase().trim();
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase().trim());
    
    // Disallow cashier & customer roles from general admin routes
    const disallowedRoles = ['cashier', 'cashier junior', 'customer'];
    const hasAccess = normalizedAllowed.includes(userRole) || (userRole !== '' && !disallowedRoles.includes(userRole));

    if (!hasAccess) {
      // Redirect to home if the user does not have the required role
      return <Navigate to="/" replace />;
    }
  }

  // Render the requested route if the user is authenticated and authorized
  return <Outlet />;
};

export default PrivateRoute;