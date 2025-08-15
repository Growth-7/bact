import { type Request, type Response, type NextFunction } from 'express';

const allowedIps = new Set<string>([
  '190.123.8.237',
  '187.120.14.146',
  '177.126.4.226',
  '127.0.0.1',
  '::1',
]);

const errorPagePaths = new Set<string>(['/ip-bloqueado', '/servidor-indisponivel']);

export const ipWhitelistAuth = (req: Request, res: Response, next: NextFunction) => {
  // Em desenvolvimento, não bloquear para facilitar o trabalho local
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }
  const assetPathRegex = /^\/(assets\/|src\/|public\/|@vite|@react-refresh)|\.(js|css|svg|png|jpg|jpeg|gif|woff|woff2|ttf|eot)$/i;

  let clientIp = (req.headers['cf-connecting-ip'] as string) ||
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (req.ip as string) ||
    (req.connection as any)?.remoteAddress ||
    (req.socket as any)?.remoteAddress ||
    (req.connection as any)?.socket?.remoteAddress;

  if (clientIp && clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substring(7);
  }
  if (clientIp === '::1') {
    clientIp = '127.0.0.1';
  }

  if (errorPagePaths.has(req.path) || assetPathRegex.test(req.path)) {
    return next();
  }

  const isIpAllowed = clientIp != null && allowedIps.has(clientIp);

  if (isIpAllowed) {
    return next();
  }

  console.warn(`[Backend] Acesso negado para o IP: ${clientIp} em ${req.originalUrl}. Headers: cf-connecting-ip: ${req.headers['cf-connecting-ip']}, x-forwarded-for: ${req.headers['x-forwarded-for']}`);
  return res.status(403).json({ success: false, message: 'Acesso negado pelo controle de IP.' });
};


