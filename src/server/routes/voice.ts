import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const voiceRouter = Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/voice/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files only
    const allowedMimes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      'audio/mp4',
      'audio/m4a',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  },
});

/**
 * Process voice command from audio file
 * POST /api/voice/command
 * 
 * Form data:
 *   audio: File (audio file)
 */
voiceRouter.post('/command', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided',
      });
    }

    const voiceService = req.app.locals.voiceService;
    const userId = (req as any).user?.id;

    // Process voice command
    const result = await voiceService.processVoiceCommand(
      req.file.path,
      userId
    );

    // Clean up uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (error) {
      console.warn('Failed to delete temp audio file:', error);
    }

    res.json({
      success: true,
      command: result,
    });
  } catch (error: any) {
    // Clean up file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        // Ignore cleanup errors
      }
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Process text command (for testing or text-based voice input)
 * POST /api/voice/text-command
 * 
 * Body: {
 *   text: string;
 * }
 */
voiceRouter.post('/text-command', async (req, res) => {
  try {
    const { text } = req.body;
    const voiceService = req.app.locals.voiceService;
    const userId = (req as any).user?.id;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'text required',
      });
    }

    const result = await voiceService.processTextCommand(text, userId);

    res.json({
      success: true,
      command: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'voice');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
