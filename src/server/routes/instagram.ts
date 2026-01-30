import express from 'express';
import { InstagramAdapter } from '../adapters/InstagramAdapter.js';

const router = express.Router();
const instagramAdapter = new InstagramAdapter();

// Initialize Instagram adapter
instagramAdapter.connect().catch(console.error);

// Webhook verification for Instagram
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const result = instagramAdapter.verifyWebhook(mode as string, token as string, challenge as string);
  if (result) {
    res.status(200).send(result);
  } else {
    res.status(403).send('Forbidden');
  }
});

// Webhook endpoint for Instagram
router.post('/webhook', (req, res) => {
  try {
    instagramAdapter.handleWebhook(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Instagram webhook error:', error);
    res.status(500).send('Error');
  }
});

// Send message via Instagram
router.post('/send', async (req, res) => {
  try {
    const { roomId, content } = req.body;
    await instagramAdapter.sendMessage(roomId, content);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to send Instagram message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get Instagram conversations
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await instagramAdapter.getRooms();
    res.json(conversations);
  } catch (error) {
    console.error('Failed to get Instagram conversations:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get connection status
router.get('/status', (req, res) => {
  res.json({ 
    connected: instagramAdapter.isConnected(),
    platform: 'instagram'
  });
});

export { router as instagramRouter };