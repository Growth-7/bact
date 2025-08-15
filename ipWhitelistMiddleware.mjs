import path from 'path';

const allowedIps = [
  '187.120.14.146', 
  '177.126.4.226',
  '177.30.133.61', // IP do usuário adicionado
];

const errorPagePaths = ['/ip-bloqueado', '/servidor-indisponivel'];
const assetPathRegex = /^\/(assets\/|src\/|public\/|@vite|@react-refresh)|\.(js|css|svg|png|jpg|jpeg|gif|woff|woff2|ttf|eot)$/i;

const ipWhitelistAuth = (req, res, next) => {
  let clientIp = req.headers['cf-connecting-ip'] ||
                 req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                 req.ip ||
                 req.connection?.remoteAddress ||
                 req.socket?.remoteAddress;

  if (clientIp && clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substring(7);
  }

  if (errorPagePaths.includes(req.path) || assetPathRegex.test(req.path)) {
    return next();
  }

  const isIpAllowed = clientIp && allowedIps.includes(clientIp);

  if (isIpAllowed) {
    next();
  } else {
    console.warn(`[Frontend Dev] Acesso negado para o IP: ${clientIp} em ${req.originalUrl}. Redirecionando...`);
    // Em dev, um redirecionamento direto é mais útil para testar a página de bloqueio.
    res.writeHead(302, { 'Location': '/ip-bloqueado' });
    res.end();
  }
};

export default ipWhitelistAuth; 