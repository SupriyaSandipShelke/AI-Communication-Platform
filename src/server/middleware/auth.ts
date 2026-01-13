import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Verify that the user still exists in the database
    const dbService = (req as any).app.locals.dbService;
    const user = await dbService.getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'User no longer exists' });
    }
    
    req.user = { id: user.id, username: user.username };
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};