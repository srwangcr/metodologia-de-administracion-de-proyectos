const express = require('express');
const bcrypt = require('bcryptjs');

function createSetupRoutes(repository, env = process.env) {
  const router = express.Router();

  router.post('/admin', async (req, res) => {
    try {
      const token = req.headers['x-setup-token'] || req.body.setupToken;
      if (!env.ADMIN_SETUP_TOKEN || token !== env.ADMIN_SETUP_TOKEN) {
        return res.status(403).json({ message: 'Setup token inválido.' });
      }

      const { email = 'root@localhost', password = 'root', fullName = 'Administrador' } = req.body || {};
      const passwordHash = await bcrypt.hash(String(password), 10);
      const created = await repository.createUser({ fullName, email, passwordHash, role: 'admin' });
      return res.status(201).json({ ok: true, user: created });
    } catch (e) { return res.status(500).json({ message: e.message }); }
  });

  return router;
}

module.exports = { createSetupRoutes };
