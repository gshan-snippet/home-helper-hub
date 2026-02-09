import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser, getAllUsers } from '../database/db.js';
import { validateUserInput, sanitizeEmail, sanitizeString, sanitizePhone } from '../utils/validation.js';
import { generateToken } from '../middleware/authenticate.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      logger.warn('Login attempt with missing credentials', { ip: req.ip });
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = getUserByEmail(sanitizeEmail(email));

    if (!user) {
      logger.warn('Login attempt with non-existent email', { email: sanitizeEmail(email), ip: req.ip });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logger.warn('Login attempt with invalid password', { email: sanitizeEmail(email), ip: req.ip });
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.role, user.email);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    logger.info('User logged in successfully', { userId: user.id, email: user.email });
    res.json({ success: true, user: userWithoutPassword, token });
  } catch (error) {
    logger.error('Login error', error, { ip: req.ip });
    res.status(500).json({ error: 'Server error' });
  }
});

// Register route (for consumers only)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedName = sanitizeString(name);
    const sanitizedPhone = sanitizePhone(phone);

    // Validate inputs
    const validationErrors = validateUserInput(sanitizedEmail, password, sanitizedName);
    if (validationErrors.length > 0) {
      logger.warn('Registration validation failed', { errors: validationErrors, ip: req.ip });
      return res.status(400).json({ errors: validationErrors });
    }

    // Check if email already exists
    const existingUser = getUserByEmail(sanitizedEmail);
    if (existingUser) {
      logger.warn('Registration attempt with existing email', { email: sanitizedEmail, ip: req.ip });
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = {
      id: uuidv4(),
      email: sanitizedEmail,
      password: hashedPassword,
      name: sanitizedName,
      phone: sanitizedPhone || '',
      role: 'consumer',
      createdAt: new Date().toISOString()
    };

    const createdUser = createUser(newUser);

    // Generate JWT token
    const token = generateToken(createdUser.id, createdUser.role, createdUser.email);

    const { password: _, ...userWithoutPassword } = createdUser;
    
    logger.info('User registered successfully', { userId: createdUser.id, email: createdUser.email });
    res.status(201).json({ success: true, user: userWithoutPassword, token });
  } catch (error) {
    logger.error('Registration error', error, { ip: req.ip });
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users (for testing/admin purposes) - Protected route
router.get('/users', async (req, res) => {
  try {
    const users = getAllUsers();
    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
    logger.info('Retrieved all users');
    res.json(usersWithoutPasswords);
  } catch (error) {
    logger.error('Get users error', error, { ip: req.ip });
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
