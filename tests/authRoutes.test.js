const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const { createApp } = require('../src/app');

function createRepository() {
  const user = {
    id: 1,
    full_name: 'Maria Perez',
    email: 'maria@example.com',
    password_hash: bcrypt.hashSync('password123', 10),
    role: 'user'
  };

  return {
    async findByEmail(email) {
      return email === user.email && !user.deleted ? user : null;
    },
    async findById(id) {
      return id === user.id && !user.deleted ? user : null;
    },
    async createUser() {
      return { id: 2, fullName: 'New User', email: 'new@example.com', role: 'user' };
    }
    ,
    async updateUser(id, fields) {
      if (id !== user.id) return null;
      if (fields.fullName) user.full_name = fields.fullName;
      if (fields.passwordHash) user.password_hash = fields.passwordHash;
      return user;
    },
    async deleteUser(id) {
      if (id !== user.id) return null;
      user.deleted = true;
      return { ok: true };
    }
  };
}

test('health endpoint responds ok', async () => {
  const app = createApp({
    userRepository: createRepository(),
    jwtSecret: 'test-secret'
  });

  const response = await request(app).get('/health');
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { ok: true });
});

test('root path serves the frontend html', async () => {
  const app = createApp({
    userRepository: createRepository(),
    jwtSecret: 'test-secret'
  });

  const response = await request(app).get('/');

  assert.equal(response.statusCode, 200);
  assert.match(response.text, /Simulador: Prevención de Fraude para Adultos Mayores/);
});

test('login returns jwt token', async () => {
  const app = createApp({
    userRepository: createRepository(),
    jwtSecret: 'test-secret'
  });

  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'maria@example.com', password: 'password123' });

  assert.equal(response.statusCode, 200);
  assert.ok(response.body.token);
  assert.equal(response.body.user.email, 'maria@example.com');
});

test('update profile with authenticated user', async () => {
  const app = createApp({
    userRepository: createRepository(),
    jwtSecret: 'test-secret'
  });

  // login first to get token
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'maria@example.com', password: 'password123' });

  assert.equal(login.statusCode, 200);
  const token = login.body.token;

  const res = await request(app)
    .put('/api/auth/me')
    .set('Authorization', `Bearer ${token}`)
    .send({ fullName: 'María Actualizada', password: 'newpass123' });

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.fullName || res.body.user.full_name, 'María Actualizada');
});

test('delete profile with authenticated user', async () => {
  const app = createApp({
    userRepository: createRepository(),
    jwtSecret: 'test-secret'
  });

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'maria@example.com', password: 'password123' });

  assert.equal(login.statusCode, 200);
  const token = login.body.token;

  const deleteResponse = await request(app)
    .delete('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(deleteResponse.statusCode, 200);
  assert.deepEqual(deleteResponse.body, { ok: true });

  const meResponse = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(meResponse.statusCode, 404);
});
