async function createInteraction(pool, data) {
  const { userId = null, type, action, payload = {} } = data;
  const [result] = await pool.execute(
    'INSERT INTO interactions (user_id, type, action, payload) VALUES (?, ?, ?, ?)',
    [userId, type, action, JSON.stringify(payload)]
  );

  return {
    id: result.insertId,
    userId,
    type,
    action,
    payload,
  };
}

module.exports = { createInteraction };
 
async function listInteractions(pool, limit = 200) {
  const [rows] = await pool.execute('SELECT id, user_id, type, action, payload, created_at FROM interactions ORDER BY id DESC LIMIT ?', [Number(limit)]);
  return rows;
}

module.exports = { createInteraction, listInteractions };
