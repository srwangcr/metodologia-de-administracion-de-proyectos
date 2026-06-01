const test = require('node:test');
const assert = require('node:assert/strict');
const { createAuthService } = require('../src/services/authService');

function makeRepository() {
  return {
    users: [],
    async findByEmail(email) {
      return this.users.find(user => user.email === email) || null;
    },
    async createUser(user) {
      const created = {
        id: this.users.length + 1,
        full_name: user.fullName,
        email: user.email,
        password_hash: user.passwordHash,
        role: user.role || 'user'
      };
      this.users.push(created);
      return {
        id: created.id,
        fullName: created.full_name,
        email: created.email,
        role: created.role
      };
    }
  };
}

test('register creates a hashed user and returns safe data', async () => {
  const repository = makeRepository();
  const authService = createAuthService({
    userRepository: repository,
    jwtSecret: 'test-secret'
  });

  const result = await authService.register({
    fullName: 'Maria Perez',
    email: 'maria@example.com',
    password: 'password123'
  });

  assert.equal(result.user.email, 'maria@example.com');
  assert.notEqual(repository.users[0].password_hash, 'password123');
  assert.match(repository.users[0].password_hash, /^\$2[aby]\$/);
});

test('login rejects invalid credentials', async () => {
  const repository = makeRepository();
  const authService = createAuthService({
    userRepository: repository,
    jwtSecret: 'test-secret'
  });

  await assert.rejects(
    () => authService.login({ email: 'missing@example.com', password: 'nope' }),
    /Credenciales invalidas\./
  );
});
