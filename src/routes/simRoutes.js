const express = require('express');

function createSimRoutes(repository, authMiddleware) {
  const router = express.Router();

  // Log an interaction from the simulator (email or sms)
  router.post('/interaction', authMiddleware, async (req, res) => {
    try {
      const userId = Number(req.auth && req.auth.sub) || null;
      const { type, action, payload } = req.body || {};

      if (!type || !action) return res.status(400).json({ message: 'Tipo y accion son requeridos.' });

      const created = await repository.createInteraction({ userId, type, action, payload });
      return res.status(201).json({ ok: true, interaction: created });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Allow anonymous logging as well (no auth) - some clients may not send token
  router.post('/anonymous/interaction', async (req, res) => {
    try {
      const { type, action, payload } = req.body || {};
      if (!type || !action) return res.status(400).json({ message: 'Tipo y accion son requeridos.' });
      const created = await repository.createInteraction({ userId: null, type, action, payload });
      return res.status(201).json({ ok: true, interaction: created });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  });

  return router;
}

module.exports = { createSimRoutes };
