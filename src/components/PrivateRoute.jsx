import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const PrivateRoute = ({ children, requireRole }) => {
  const { authData } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!authData) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireRole && authData.role !== requireRole) {
    // Redirect to appropriate home
    if (authData.role === 'superadmin') return <Navigate to="/superadmin/dashboard" replace />;
    if(authData.role === 'student') return <Navigate to="/student/dashboard" replace />;
    if(authData.role === 'teacher') return <Navigate to="/teacher/dashboard" replace />;
    if (authData.company) return <Navigate to={`/company/${authData.company}/dashboard`} replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default React.memo(PrivateRoute);
