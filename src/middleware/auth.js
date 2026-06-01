const jwt = require('jsonwebtoken');

function createAuthMiddleware(jwtSecret) {
  return function authMiddleware(req, res, next) {
    const header = req.headers.authorization || '';
    const match = header.match(/^Bearer\s+(.+)$/i);

    if (!match) {
      return res.status(401).json({ message: 'Falta token de acceso.' });
    }

    try {
      req.auth = jwt.verify(match[1], jwtSecret);
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Token invalido o expirado.' });
    }
  };
}

module.exports = { createAuthMiddleware };
