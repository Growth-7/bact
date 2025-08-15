import { type Request, type Response, type NextFunction } from 'express';

const allowedIps: string[] = [
  '187.120.14.146', 
  '177.126.4.226',
  '177.30.133.61', // IP do usuário adicionado
  // Adicione aqui outros IPs de desenvolvimento ou de escritórios
];

const errorPagePaths: string[] = ['/ip-bloqueado', '/servidor-indisponivel'];
const assetPathRegex = /^\/(assets\/|src\/|public\/|@vite|@react-refresh)|\.(js|css|svg|png|jpg|jpeg|gif|woff|woff2|ttf|eot)$/i;

export const ipWhitelistAuth = (req: Request, res: Response, next: NextFunction): void => {
  // A ordem de preferência é a mais robusta para ambientes com proxies e Cloudflare
  let clientIp = (req.headers['cf-connecting-ip'] as string) ||
                 (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
                 req.ip ||
                 req.socket?.remoteAddress;

  // Normaliza IPs no formato IPv4-mapeado-para-IPv6
  if (clientIp && clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substring(7);
  }

  // Permite acesso a páginas de erro e assets estáticos para evitar loops de bloqueio
  if (errorPagePaths.includes(req.path) || assetPathRegex.test(req.path)) {
    return next();
  }

  const isIpAllowed = clientIp && allowedIps.includes(clientIp);

  if (isIpAllowed) {
    return next();
  } else {
    // Para a API, em vez de redirecionar, retornamos um erro 403 direto.
    // O redirecionamento para a página de erro deve ser tratado pelo Nginx ao receber o 403 do frontend.
    console.warn(`[Backend API] Acesso negado para o IP: ${clientIp} em ${req.originalUrl}.`);
    res.status(403).json({ success: false, message: 'Acesso negado. O seu IP não está na lista de permissões.' });
  }
};


