const express = require('express');

function createAuthRoutes(authService, authMiddleware, userRepository) {
  const router = express.Router();

  router.post('/register', async (req, res) => {
    try {
      const result = await authService.register(req.body || {});
      return res.status(201).json(result);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  });

  router.post('/login', async (req, res) => {
    try {
      const result = await authService.login(req.body || {});
      return res.status(200).json(result);
    } catch (error) {
      return res.status(401).json({ message: error.message });
    }
  });

  router.get('/me', authMiddleware, async (req, res) => {
    const userId = Number(req.auth.sub);
    const user = await userRepository.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        preferences: user.preferences ? JSON.parse(user.preferences) : null
      }
    });
  });

  router.put('/me', authMiddleware, async (req, res) => {
    try {
      const userId = Number(req.auth.sub);
      const { fullName, password } = req.body || {};
      const { preferences } = req.body || {};
      const updates = {};
      const bcrypt = require('bcryptjs');

      if (fullName) updates.fullName = String(fullName).trim();
      if (password) updates.passwordHash = await bcrypt.hash(String(password), 10);
      if (preferences) updates.preferences = preferences;

      // userRepository is the wrapper provided by server.js which exposes updateUser(id, fields)
      const updated = await userRepository.updateUser(userId, updates);

      const userRecord = updated || await userRepository.findById(userId);

      if (!userRecord) return res.status(404).json({ message: 'Usuario no encontrado.' });

      return res.status(200).json({ user: { id: userRecord.id, fullName: userRecord.full_name || userRecord.fullName, email: userRecord.email, role: userRecord.role } });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  });

  router.delete('/me', authMiddleware, async (req, res) => {
    try {
      const userId = Number(req.auth.sub);
      await userRepository.deleteUser(userId);
      return res.status(200).json({ ok: true });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  });

  return router;
}

module.exports = { createAuthRoutes };
