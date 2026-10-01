const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'clinicbook_india_super_secret_jwt_key_2026';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Please login to your ClinicBook account to continue.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Middleware] Token verification failed:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Your user role (${req.user ? req.user.role : 'unauthenticated'}) does not have permission to access this resource.`
      });
    }
    next();
  };
};

module.exports = { protect, authorize, JWT_SECRET };
