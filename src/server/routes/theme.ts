import { Router } from 'express';

export const themeRouter = Router();

// In-memory theme storage (in production, use database)
const userThemes = new Map<string, string>();

/**
 * Get user theme preference
 * GET /api/user/ui/theme
 */
themeRouter.get('/ui/theme', async (req, res) => {
  try {
    const userId = (req as any).user?.id || 'demo_user';
    
    const theme = userThemes.get(userId) || 'light';

    res.json({
      success: true,
      theme,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Set user theme preference
 * POST /api/user/ui/theme
 * 
 * Body: {
 *   theme: 'light' | 'dark' | 'gradient' | 'glassmorphism' | 'minimal';
 * }
 */
themeRouter.post('/ui/theme', async (req, res) => {
  try {
    const userId = (req as any).user?.id || 'demo_user';
    const { theme } = req.body;

    const validThemes = ['light', 'dark', 'gradient', 'glassmorphism', 'modern', 'minimal'];

    if (!theme || !validThemes.includes(theme)) {
      return res.status(400).json({
        success: false,
        error: `Invalid theme. Must be one of: ${validThemes.join(', ')}`,
      });
    }

    // Store theme preference
    userThemes.set(userId, theme);

    // In production, save to database
    // await dbService.saveUserPreference(userId, 'theme', theme);

    res.json({
      success: true,
      theme,
      message: 'Theme preference saved',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get available themes
 * GET /api/user/ui/themes
 */
themeRouter.get('/ui/themes', async (req, res) => {
  try {
    const themes = [
      {
        id: 'light',
        name: 'Light',
        description: 'Clean and bright - perfect for daytime',
        preview: '#ffffff',
      },
      {
        id: 'dark',
        name: 'Dark',
        description: 'Professional dark mode for low-light environments',
        preview: '#1a1d21',
      },
      {
        id: 'gradient',
        name: 'Gradient',
        description: 'Modern gradient backgrounds with purple/blue tones',
        preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      {
        id: 'glassmorphism',
        name: 'Glassmorphism',
        description: 'Frosted glass effect with blur and transparency',
        preview: 'rgba(255, 255, 255, 0.1)',
      },
      {
        id: 'modern',
        name: 'Modern Professional',
        description: 'Modern gradient theme with professional blue/purple tones',
        preview: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      },
      {
        id: 'minimal',
        name: 'Minimal Enterprise',
        description: 'Minimal gray/blue professional theme for business',
        preview: '#fafbfc',
      },
    ];

    res.json({
      success: true,
      themes,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
