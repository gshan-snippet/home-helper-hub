import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_DIR = path.join(__dirname, '../database');
const USERS_FILE = path.join(DATABASE_DIR, 'users.json');
const POSTS_FILE = path.join(DATABASE_DIR, 'posts.json');
const MESSAGES_FILE = path.join(DATABASE_DIR, 'messages.json');
const APPOINTMENTS_FILE = path.join(DATABASE_DIR, 'appointments.json');

// Initialize database files if they don't exist
const initializeDatabase = async () => {
  try {
    if (!fs.existsSync(DATABASE_DIR)) {
      fs.mkdirSync(DATABASE_DIR, { recursive: true });
    }

    // Hash default operator password
    const defaultPassword = process.env.DEFAULT_OPERATOR_PASSWORD || 'Pesu@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Default operator account
    const defaultOperator = {
      id: 'operator-1',
      email: process.env.DEFAULT_OPERATOR_EMAIL || 'zeeshan@gmail.com',
      password: hashedPassword,
      name: 'Operator',
      role: 'operator',
      createdAt: new Date().toISOString()
    };

    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify([defaultOperator], null, 2));
      logger.info('Default operator account created');
    } else {
      // Update existing operator account with properly hashed password
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      const operatorIndex = users.findIndex(u => u.email === defaultOperator.email);
      if (operatorIndex !== -1) {
        users[operatorIndex] = defaultOperator;
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        logger.info('Operator password updated');
      }
    }

    if (!fs.existsSync(POSTS_FILE)) {
      fs.writeFileSync(POSTS_FILE, JSON.stringify([], null, 2));
    }

    if (!fs.existsSync(MESSAGES_FILE)) {
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2));
    }

    if (!fs.existsSync(APPOINTMENTS_FILE)) {
      fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify([], null, 2));
    }

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization error', error);
    throw error;
  }
};

// User operations
export const getUserById = (id) => {
  try {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    return users.find(u => u.id === id);
  } catch (error) {
    logger.error('Error reading users by ID', error);
    throw error;
  }
};

export const getUserByEmail = (email) => {
  try {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    return users.find(u => u.email === email);
  } catch (error) {
    logger.error('Error reading user by email', error);
    throw error;
  }
};

export const createUser = (user) => {
  try {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    users.push(user);
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    logger.info('User created', { userId: user.id });
    return user;
  } catch (error) {
    logger.error('Error creating user', error);
    throw error;
  }
};

export const getAllUsers = () => {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch (error) {
    logger.error('Error reading all users', error);
    throw error;
  }
};

// Post operations
export const createPost = (post) => {
  try {
    const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
    posts.push(post);
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
    logger.info('Post created', { postId: post.id, operatorId: post.operatorId });
    return post;
  } catch (error) {
    logger.error('Error creating post', error);
    throw error;
  }
};

export const getAllPosts = () => {
  try {
    return JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
  } catch (error) {
    logger.error('Error reading all posts', error);
    throw error;
  }
};

export const getPostsByOperator = (operatorId) => {
  try {
    const posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf-8'));
    return posts.filter(p => p.operatorId === operatorId);
  } catch (error) {
    logger.error('Error reading operator posts', error, { operatorId });
    throw error;
  }
};

// Message operations
export const createMessage = (message) => {
  try {
    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8'));
    messages.push(message);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    logger.debug('Message created', { messageId: message.id });
    return message;
  } catch (error) {
    logger.error('Error creating message', error);
    throw error;
  }
};

export const getMessages = (operatorId) => {
  try {
    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8'));
    return messages.filter(m => m.operatorId === operatorId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    logger.error('Error reading messages', error, { operatorId });
    throw error;
  }
};

export const getMessagesByUser = (userId) => {
  try {
    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8'));
    return messages.filter(m => m.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    logger.error('Error reading user messages', error, { userId });
    throw error;
  }
};

export const getConversation = (operatorId, userId) => {
  try {
    const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf-8'));
    return messages.filter(m => m.operatorId === operatorId && m.userId === userId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  } catch (error) {
    logger.error('Error reading conversation', error, { operatorId, userId });
    throw error;
  }
};

// Appointment operations
export const createAppointment = (appointment) => {
  try {
    const appointments = JSON.parse(fs.readFileSync(APPOINTMENTS_FILE, 'utf-8'));
    appointments.push(appointment);
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(appointments, null, 2));
    logger.info('Appointment created', { appointmentId: appointment.id });
    return appointment;
  } catch (error) {
    logger.error('Error creating appointment', error);
    throw error;
  }
};

export const getAppointments = (operatorId) => {
  try {
    const appointments = JSON.parse(fs.readFileSync(APPOINTMENTS_FILE, 'utf-8'));
    return appointments.filter(a => a.operatorId === operatorId);
  } catch (error) {
    logger.error('Error reading appointments', error, { operatorId });
    throw error;
  }
};

export const getAppointmentsByUser = (userId) => {
  try {
    const appointments = JSON.parse(fs.readFileSync(APPOINTMENTS_FILE, 'utf-8'));
    return appointments.filter(a => a.userId === userId);
  } catch (error) {
    logger.error('Error reading user appointments', error, { userId });
    throw error;
  }
};

// Initialize database on module load
await initializeDatabase();

export default {
  getUserById,
  getUserByEmail,
  createUser,
  getAllUsers,
  createPost,
  getAllPosts,
  getPostsByOperator,
  createMessage,
  getMessages,
  getMessagesByUser,
  getConversation,
  createAppointment,
  getAppointments,
  getAppointmentsByUser,
};
