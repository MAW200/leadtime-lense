/**
 * Authentication and Authorization Middleware
 * 
 * Since MySQL doesn't have RLS, we implement security at the application level.
 * This middleware checks user roles and permissions.
 */

/**
 * Check if user has required role
 * In development, allow all roles to pass through
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // For now, we'll get role from headers or session
    // In production, implement proper JWT authentication
    const userRole = req.headers['x-user-role'] || req.session?.userRole || 'ceo_admin';
    
    // In development, allow all roles to pass through
    // In production, uncomment the check below
    // if (!allowedRoles.includes(userRole)) {
    //   return res.status(403).json({
    //     error: 'Forbidden',
    //     message: `This action requires one of these roles: ${allowedRoles.join(', ')}`,
    //   });
    // }
    
    req.userRole = userRole;
    req.userName = req.headers['x-user-name'] || req.session?.userName || 'Unknown User';
    next();
  };
};

/**
 * Optional authentication - doesn't fail if no user
 */
export const optionalAuth = (req, res, next) => {
  req.userRole = req.headers['x-user-role'] || req.session?.userRole || null;
  req.userName = req.headers['x-user-name'] || req.session?.userName || null;
  next();
};

/**
 * Error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error('API Error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

