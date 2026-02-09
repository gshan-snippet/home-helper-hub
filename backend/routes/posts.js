import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { createPost, getAllPosts, getPostsByOperator } from '../database/db.js';
import { validatePostInput, sanitizeString } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || 52428800) }, // 50MB default
  fileFilter: (req, file, cb) => {
    // Only accept image files
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
    } else {
      cb(null, true);
    }
  }
});

// Create a post (operator only)
router.post('/create', upload.fields([{ name: 'beforeImage' }, { name: 'afterImage' }]), async (req, res) => {
  try {
    const { operatorId, typeOfWork, hoursWorked, userRating } = req.body;

    // Sanitize inputs
    const sanitizedType = sanitizeString(typeOfWork);
    const sanitizedHours = parseFloat(hoursWorked);
    const sanitizedRating = parseFloat(userRating) || 0;

    // Validate inputs
    const validationErrors = validatePostInput(sanitizedType, sanitizedHours, sanitizedRating);
    if (validationErrors.length > 0) {
      logger.warn('Post validation failed', { errors: validationErrors, operatorId });
      return res.status(400).json({ errors: validationErrors });
    }

    if (!operatorId) {
      logger.warn('Post creation attempt without operatorId');
      return res.status(400).json({ error: 'Operator ID is required' });
    }

    if (!req.files || !req.files.beforeImage || !req.files.afterImage) {
      logger.warn('Post creation attempt without images', { operatorId });
      return res.status(400).json({ error: 'Both before and after images are required' });
    }

    const post = {
      id: uuidv4(),
      operatorId,
      typeOfWork: sanitizedType,
      beforeImage: `/uploads/${req.files.beforeImage[0].filename}`,
      afterImage: `/uploads/${req.files.afterImage[0].filename}`,
      hoursWorked: sanitizedHours,
      userRating: sanitizedRating,
      createdAt: new Date().toISOString()
    };

    const createdPost = createPost(post);
    logger.info('Post created successfully', { postId: createdPost.id, operatorId });
    res.status(201).json({ success: true, post: createdPost });
  } catch (error) {
    logger.error('Post creation error', error, { operatorId: req.body?.operatorId });
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get all posts
router.get('/all', async (req, res) => {
  try {
    const posts = getAllPosts();
    logger.debug('Retrieved all posts', { count: posts.length });
    res.json(posts);
  } catch (error) {
    logger.error('Get all posts error', error);
    res.status(500).json({ error: 'Failed to retrieve posts' });
  }
});

// Get posts by operator
router.get('/operator/:operatorId', async (req, res) => {
  try {
    const { operatorId } = req.params;

    if (!operatorId) {
      logger.warn('Get operator posts without operatorId');
      return res.status(400).json({ error: 'Operator ID is required' });
    }

    const posts = getPostsByOperator(operatorId);
    logger.debug('Retrieved operator posts', { operatorId, count: posts.length });
    res.json(posts);
  } catch (error) {
    logger.error('Get operator posts error', error, { operatorId: req.params?.operatorId });
    res.status(500).json({ error: 'Failed to retrieve posts' });
  }
});

export default router;
