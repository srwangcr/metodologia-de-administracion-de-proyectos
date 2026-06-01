const test = require('node:test');
const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const userRepository = require('../src/repositories/userRepository');

const databaseUrl = process.env.MYSQL_TEST_URL;

if (!databaseUrl) {
  test('MySQL integration tests skipped without MYSQL_TEST_URL', () => {
    assert.ok(true);
  });
} else {
  test('repository can create and read users with a real MySQL database', async () => {
    const pool = mysql.createPool(databaseUrl);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        full_name VARCHAR(120) NOT NULL,
        email VARCHAR(180) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(40) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_users_email (email)
      )
    `);

    await pool.execute('DELETE FROM users WHERE email = ?', ['test.mysql@example.com']);

    const created = await userRepository.createUser(pool, {
      fullName: 'Test Mysql',
      email: 'test.mysql@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      role: 'user'
    });

    const found = await userRepository.findByEmail(pool, 'test.mysql@example.com');

    assert.equal(created.email, 'test.mysql@example.com');
    assert.equal(found.email, 'test.mysql@example.com');

    await pool.execute('DELETE FROM users WHERE email = ?', ['test.mysql@example.com']);
    await pool.end();
  });
}
