import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ allowedRoles }) => {
  const { currentUser } = useSelector((state) => state.user);

  if (!currentUser) {
    // Redirect to sign-in if the user is not authenticated
    return <Navigate to="/sign-in" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirect to home if the user does not have the required role
    return <Navigate to="/" replace />;
  }

  // Render the requested route if the user is authenticated and authorized
  return <Outlet />;
};

export default PrivateRoute;
