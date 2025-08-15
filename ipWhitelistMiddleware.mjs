// O bloqueio de IP foi centralizado no Nginx para maior segurança e eficiência.
// Em desenvolvimento, este middleware agora permite todas as requisições.
const ipWhitelistAuth = (req, res, next) => {
  next();
};

export default ipWhitelistAuth; 