async function findByEmail(pool, email) {
  const [rows] = await pool.execute(
    'SELECT id, full_name, email, password_hash, role, created_at FROM users WHERE email = ? LIMIT 1',
    [email]
  );

  return rows[0] || null;
}

async function findById(pool, id) {
  const [rows] = await pool.execute(
    'SELECT id, full_name, email, role, created_at FROM users WHERE id = ? LIMIT 1',
    [id]
  );

  return rows[0] || null;
}

async function createUser(pool, user) {
  const [result] = await pool.execute(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [user.fullName, user.email, user.passwordHash, user.role || 'user']
  );

  return {
    id: result.insertId,
    fullName: user.fullName,
    email: user.email,
    role: user.role || 'user'
  };
}

async function updateUser(pool, id, fields) {
  const sets = [];
  const params = [];

  if (fields.fullName) {
    sets.push('full_name = ?');
    params.push(fields.fullName);
  }

  if (fields.passwordHash) {
    sets.push('password_hash = ?');
    params.push(fields.passwordHash);
  }

  if (fields.role) {
    sets.push('role = ?');
    params.push(fields.role);
  }

  if (sets.length === 0) return null;

  params.push(id);

  const sql = `UPDATE users SET ${sets.join(', ')} WHERE id = ?`;
  await pool.execute(sql, params);

  const [rows] = await pool.execute('SELECT id, full_name, email, role, created_at FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function listUsers(pool, limit = 100) {
  const [rows] = await pool.execute('SELECT id, full_name, email, role, created_at FROM users ORDER BY id DESC LIMIT ?', [Number(limit)]);
  return rows;
}

async function deleteUser(pool, id) {
  await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  return { ok: true };
}

module.exports = { findByEmail, findById, createUser, updateUser, listUsers, deleteUser };
