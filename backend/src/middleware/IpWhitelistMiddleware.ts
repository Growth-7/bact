import { type Request, type Response, type NextFunction } from 'express';

// O bloqueio de IP foi centralizado no Nginx para maior segurança e eficiência.
// Este middleware é mantido para consistência estrutural, mas permite todas as requisições.
export const ipWhitelistAuth = (req: Request, res: Response, next: NextFunction): void => {
  next();
};


