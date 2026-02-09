import jwt from 'jsonwebtoken';

// JWT Secret - MUST be set in production
const JWT_SECRET = process.env.JWT_SECRET;

// Validate JWT_SECRET on startup
if (!JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is not set. Please set it before starting the server.');
}

/**
 * Generate JWT token for a user
 */
export function generateToken(userId, role, email) {
  const payload = {
    userId,
    role,
    email,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // Token expires in 7 days
  });

  return token;
}

/**
 * Verify JWT token and extract payload
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, data: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Middleware to check if user is authenticated
 */
export function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from "Bearer <token>"

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { valid, data, error } = verifyToken(token);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Attach user info to request object
    req.user = data;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Server error during authentication' });
  }
}

/**
 * Middleware to check if user is an operator
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Access denied. Required role: ${role}` });
    }
    next();
  };
}
