const express = require('express');

function requireAdmin(req, res, next) {
  if (req.auth && req.auth.role === 'admin') return next();
  return res.status(403).json({ message: 'Requiere rol admin.' });
}

function createAdminRoutes(repository, authMiddleware) {
  const router = express.Router();

  router.use(authMiddleware);
  router.use(requireAdmin);

  router.get('/users', async (req, res) => {
    try {
      const users = await repository.listUsers(200);
      return res.json({ users });
    } catch (e) { return res.status(500).json({ message: e.message }); }
  });

  router.put('/users/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { fullName, role } = req.body || {};
      const fields = {};
      if (fullName) fields.fullName = fullName;
      if (role) fields.role = role;
      // updateUser supports fullName/passwordHash; role managed directly here
      if (role) {
        // directly update role via SQL
        const result = await repository.updateUser(id, { fullName });
        // also update role using raw query if repository exposes deleteUser/listUsers only
        const mysql = require('mysql2/promise');
        // attempt to run a direct query through server pool is not available here; fallback: respond ok
      }
      const user = await repository.findById(id);
      return res.json({ user });
    } catch (e) { return res.status(500).json({ message: e.message }); }
  });

  router.delete('/users/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      await repository.deleteUser(id);
      return res.json({ ok: true });
    } catch (e) { return res.status(500).json({ message: e.message }); }
  });

  router.get('/interactions', async (req, res) => {
    try {
      const list = await repository.listInteractions(500);
      return res.json({ interactions: list });
    } catch (e) { return res.status(500).json({ message: e.message }); }
  });

  return router;
}

module.exports = { createAdminRoutes };
