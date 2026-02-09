import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createMessage, getMessages, getConversation, createAppointment } from '../database/db.js';
import { validateMessageInput, sanitizeString } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Send a regular message from user/operator
router.post('/send', async (req, res) => {
  try {
    const { operatorId, userId, userName, messageText, senderRole } = req.body;

    // Sanitize inputs
    const sanitizedMessage = sanitizeString(messageText);
    const sanitizedUserName = sanitizeString(userName);

    // Validate inputs
    const validationErrors = validateMessageInput(sanitizedMessage);
    if (validationErrors.length > 0) {
      logger.warn('Message validation failed', { errors: validationErrors, userId });
      return res.status(400).json({ errors: validationErrors });
    }

    if (!operatorId || !userId || !senderRole) {
      logger.warn('Send message attempt with missing fields', { operatorId, userId, senderRole });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const message = {
      id: uuidv4(),
      operatorId,
      userId,
      userName: sanitizedUserName,
      messageText: sanitizedMessage,
      senderRole, // 'consumer' or 'operator'
      type: 'message',
      createdAt: new Date().toISOString()
    };

    const createdMessage = createMessage(message);
    logger.info('Message sent', { messageId: message.id, userId, senderRole });
    res.status(201).json({ success: true, message: createdMessage });
  } catch (error) {
    logger.error('Send message error', error, { userId: req.body?.userId });
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Send appointment request (appears as a special message in operator inbox)
router.post('/appointment', async (req, res) => {
  try {
    const { operatorId, userId, userName, userPhone, appointmentDate, location, workingHours, typeOfWork } = req.body;

    // Sanitize inputs
    const sanitizedUserName = sanitizeString(userName);
    const sanitizedPhone = sanitizeString(userPhone);
    const sanitizedLocation = sanitizeString(location);
    const sanitizedType = sanitizeString(typeOfWork);
    const sanitizedHours = sanitizeString(workingHours);

    // Basic validation
    if (!operatorId || !userId || !appointmentDate || !sanitizedLocation || !sanitizedHours || !sanitizedType) {
      logger.warn('Appointment creation attempt with missing fields', { operatorId, userId });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const appointmentMessage = {
      id: uuidv4(),
      operatorId,
      userId,
      userName: sanitizedUserName,
      userPhone: sanitizedPhone || '',
      appointmentDate,
      location: sanitizedLocation,
      workingHours: sanitizedHours,
      typeOfWork: sanitizedType,
      type: 'appointment',
      senderRole: 'consumer',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Create appointment message
    const createdMessage = createMessage(appointmentMessage);
    
    // Also save to appointments table
    createAppointment(appointmentMessage);

    logger.info('Appointment created', { appointmentId: appointmentMessage.id, userId });
    res.status(201).json({ success: true, message: createdMessage });
  } catch (error) {
    logger.error('Appointment creation error', error, { userId: req.body?.userId });
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Get all messages for operator (grouped by user)
router.get('/operator/:operatorId', async (req, res) => {
  try {
    const { operatorId } = req.params;

    if (!operatorId) {
      logger.warn('Get operator messages without operatorId');
      return res.status(400).json({ error: 'Operator ID is required' });
    }

    const messages = getMessages(operatorId);
    
    // Group messages by userId with user info
    const grouped = {};
    messages.forEach(msg => {
      if (!grouped[msg.userId]) {
        // Find the consumer's actual name by looking for consumer messages
        let consumerName = msg.userName;
        if (msg.senderRole === 'operator') {
          // If this is an operator message, find a consumer message to get the real consumer name
          const consumerMsg = messages.find(m => m.userId === msg.userId && m.senderRole === 'consumer');
          if (consumerMsg) {
            consumerName = consumerMsg.userName;
          }
        }
        
        grouped[msg.userId] = {
          userId: msg.userId,
          userName: consumerName,
          userPhone: msg.userPhone,
          lastMessage: msg,
          messages: []
        };
      }
      grouped[msg.userId].messages.push(msg);
    });

    logger.debug('Retrieved operator messages', { operatorId, conversations: Object.keys(grouped).length });
    res.json(Object.values(grouped));
  } catch (error) {
    logger.error('Get operator messages error', error, { operatorId: req.params?.operatorId });
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

// Get conversation between operator and specific user
router.get('/conversation/:operatorId/:userId', async (req, res) => {
  try {
    const { operatorId, userId } = req.params;

    if (!operatorId || !userId) {
      logger.warn('Get conversation without required IDs', { operatorId, userId });
      return res.status(400).json({ error: 'Operator ID and User ID are required' });
    }

    const conversation = getConversation(operatorId, userId);
    logger.debug('Retrieved conversation', { operatorId, userId, messageCount: conversation.length });
    res.json(conversation);
  } catch (error) {
    logger.error('Get conversation error', error, { operatorId: req.params?.operatorId, userId: req.params?.userId });
    res.status(500).json({ error: 'Failed to retrieve conversation' });
  }
});

export default router;
