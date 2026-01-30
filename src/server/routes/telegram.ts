import express from 'express';
import { TelegramAdapter } from '../adapters/TelegramAdapter.js';

const router = express.Router();
const telegramAdapter = new TelegramAdapter();

// Initialize Telegram adapter
telegramAdapter.connect().catch(console.error);

// Webhook endpoint for Telegram
router.post('/webhook', (req, res) => {
  try {
    telegramAdapter.handleWebhook(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('Telegram webhook error:', error);
    res.status(500).send('Error');
  }
});

// Send message via Telegram
router.post('/send', async (req, res) => {
  try {
    const { roomId, content } = req.body;
    await telegramAdapter.sendMessage(roomId, content);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get Telegram chats
router.get('/chats', async (req, res) => {
  try {
    const chats = await telegramAdapter.getRooms();
    res.json(chats);
  } catch (error) {
    console.error('Failed to get Telegram chats:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

// Get connection status
router.get('/status', (req, res) => {
  res.json({ 
    connected: telegramAdapter.isConnected(),
    platform: 'telegram'
  });
});

export { router as telegramRouter };