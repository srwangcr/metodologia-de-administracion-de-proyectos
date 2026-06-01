const express = require('express');
const path = require('path');
const { createAuthRoutes } = require('./routes/authRoutes');
const { createAuthService } = require('./services/authService');
const { createAuthMiddleware } = require('./middleware/auth');

function createApp({ userRepository, jwtSecret }) {
  const app = express();
  const publicDir = path.join(__dirname, '..');

  app.use(express.json());
  app.use(express.static(publicDir));

  const authService = createAuthService({
    userRepository,
    jwtSecret
  });

  const authMiddleware = createAuthMiddleware(jwtSecret);

  app.get('/health', (req, res) => {
    res.json({ ok: true });
  });

  app.get('/', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  const { createSetupRoutes } = require('./routes/setupRoutes');
  app.use('/_setup', createSetupRoutes(userRepository, process.env));
  app.use('/api/auth', createAuthRoutes(authService, authMiddleware, userRepository));

  const { createSimRoutes } = require('./routes/simRoutes');
  app.use('/api/simulations', createSimRoutes(userRepository, authMiddleware));

  app.use('/api/auth', createAuthRoutes(authService, authMiddleware, userRepository));
  const { createAdminRoutes } = require('./routes/adminRoutes');
  app.use('/api/admin', createAdminRoutes(userRepository, authMiddleware));

  app.use((error, req, res, next) => {
    res.status(500).json({ message: 'Error interno del servidor.' });
  });

  return app;
}

module.exports = { createApp };
