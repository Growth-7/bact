import path from 'path';

const allowedIps = [
  '190.123.8.237',
  '187.120.14.146', 
  '177.126.4.226',
  // Loopback liberado para desenvolvimento local (Vite dev server)
  '127.0.0.1',
  '::1'
];
const errorPagePaths = ['/ip-bloqueado', '/servidor-indisponivel'];
// Expressões regulares para caminhos de assets comuns que não devem ser bloqueados
const assetPathRegex = /^\/(assets\/|src\/|public\/|@vite|@react-refresh|node_modules\/)|\.(js|css|svg|png|jpg|jpeg|gif|woff|woff2|ttf|eot)$/i;

const ipWhitelistAuth = (req, res, next) => {
  // Extrai pathname de forma compatível com Connect (Vite) e Express
  const rawUrl = req.originalUrl || req.url || '/';
  let pathname = '/';
  try {
    const parsed = new URL(rawUrl, 'http://localhost');
    pathname = parsed.pathname || '/';
  } catch {
    pathname = rawUrl || '/';
  }

  // Obter o IP do cliente ANTES para que possa ser usado em ambos os cenários de bloqueio
  let clientIp = req.headers['cf-connecting-ip'] ||
                 req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                 req.ip ||
                 req.connection?.remoteAddress ||
                 req.socket?.remoteAddress ||
                 req.connection?.socket?.remoteAddress;

  if (clientIp && clientIp.startsWith('::ffff:')) {
    clientIp = clientIp.substring(7);
  }
  if (clientIp === '::1') {
    clientIp = '127.0.0.1';
  }

  // Simulador de bloqueio: se ?force_block=1 estiver na URL, força redirecionamento
  try {
    const parsed = new URL(rawUrl, 'http://localhost');
    const shouldForceBlock = parsed.searchParams.get('force_block') === '1';
    if (shouldForceBlock && !errorPagePaths.includes(pathname) && !assetPathRegex.test(pathname)) {
      const redirectUrl = `/ip-bloqueado?auth=simulated&ip=${encodeURIComponent(clientIp || 'unknown')}`;
      res.statusCode = 302;
      res.setHeader('Location', redirectUrl);
      return res.end();
    }
  } catch {}

  // Em desenvolvimento, não bloquear para facilitar o trabalho local (a não ser que force_block=1)
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Liberar páginas de erro e assets do Vite/estáticos
  if (errorPagePaths.includes(pathname) || assetPathRegex.test(pathname)) {
    return next();
  }

  const isIpAllowed = clientIp && allowedIps.includes(clientIp);

  if (isIpAllowed) {
    return next();
  }

  // Loga o IP bloqueado no backend
  const apiUrl = process.env.VITE_API_URL || 'http://localhost:3333';
  fetch(`${apiUrl}/api/security/log-blocked-ip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ipAddress: clientIp }),
  }).catch(err => console.error('Falha ao logar IP bloqueado:', err));


  console.warn(`[Frontend] Acesso negado para o IP: ${clientIp} em ${rawUrl}. Redirecionando para /ip-bloqueado. Headers: cf-connecting-ip: ${req.headers['cf-connecting-ip']}, x-forwarded-for: ${req.headers['x-forwarded-for']}`);

  // Em Connect/Node http, não existe res.redirect; usar redirecionamento manual
  try {
    const redirectUrl = `/ip-bloqueado?auth=denied_by_middleware&ip=${encodeURIComponent(clientIp || 'unknown')}`;
    res.statusCode = 302;
    res.setHeader('Location', redirectUrl);
    return res.end();
  } catch {
    return next();
  }
};

export default ipWhitelistAuth; 