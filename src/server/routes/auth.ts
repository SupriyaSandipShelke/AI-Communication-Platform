import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';

export const authRouter = Router();

// Register
authRouter.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    const dbService = req.app.locals.dbService;
    
    // Check if user already exists
    const existingUser = await dbService.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user in database
    const userId = uuidv4();
    await dbService.createUser({
      id: userId,
      username,
      passwordHash: hashedPassword
    });

    const token = jwt.sign({ id: userId, username }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.json({ success: true, token, username, userId });
  } catch (error: any) {
    if (error.message === 'Username already exists') {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Login
authRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    const dbService = req.app.locals.dbService;
    
    const user = await dbService.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.json({ success: true, token, username: user.username, userId: user.id });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify token
authRouter.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Verify that the user still exists in the database
    const dbService = req.app.locals.dbService;
    const user = await dbService.getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'User no longer exists' });
    }
    
    res.json({ success: true, user: { id: user.id, username: user.username } });
  } catch (error: any) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// Invite user
authRouter.post('/invite', async (req, res) => {
  try {
    const { email, invitedBy } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const dbService = req.app.locals.dbService;
    
    // Check if user already exists
    const existingUser = await dbService.getUserByUsername(email);
    if (existingUser) {
      return res.json({ 
        success: true, 
        message: 'User already exists and has been added to your contacts',
        user: { id: existingUser.id, username: existingUser.username }
      });
    }

    // In a real app, you would send an email invitation here
    // For demo purposes, we'll create a placeholder user
    const userId = uuidv4();
    const tempPassword = Math.random().toString(36).substring(2, 15);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    await dbService.createUser({
      id: userId,
      username: email,
      passwordHash: hashedPassword
    });

    // Create invitation record
    const invitationId = uuidv4();
    await dbService.createInvitation({
      id: invitationId,
      email,
      invitedBy,
      userId,
      status: 'pending'
    });

    res.json({ 
      success: true, 
      message: 'Invitation sent successfully',
      user: { id: userId, username: email }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get available users/contacts
authRouter.get('/users', async (req, res) => {
  try {
    const dbService = req.app.locals.dbService;
    const users = await dbService.getAllUsers();
    
    // Remove password hashes from response
    const safeUsers = users.map((user: any) => ({
      id: user.id,
      username: user.username,
      isOnline: Math.random() > 0.5 // Mock online status
    }));
    
    res.json({ success: true, users: safeUsers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// Block user
authRouter.post('/block-user', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    const currentUserId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;

    if (!currentUserId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    await dbService.blockUser(currentUserId, userId);

    res.json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Invite user
authRouter.post('/invite', authenticateToken, async (req, res) => {
  try {
    const { email, invitedBy } = req.body;
    const dbService = req.app.locals.dbService;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // In a real app, this would send an email invitation
    // For demo purposes, we'll just return success
    res.json({
      success: true,
      message: 'Invitation sent successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});