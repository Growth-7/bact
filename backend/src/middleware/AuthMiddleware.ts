import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: {
    id: string;
    user_type: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.sendStatus(401);
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.user_type !== 'ADMIN') {
    return res.status(403).json({ message: 'Acesso negado. Rota somente para administradores.' });
  }
  next();
};
