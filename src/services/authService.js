const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function createAuthService({ userRepository, passwordHasher = bcrypt, tokenSigner = jwt, jwtSecret }) {
  if (!userRepository) {
    throw new Error('userRepository is required');
  }

  if (!jwtSecret) {
    throw new Error('jwtSecret is required');
  }

  async function register(input) {
    const fullName = String(input.fullName || '').trim();
    const email = String(input.email || '').trim().toLowerCase();
    const password = String(input.password || '');

    if (fullName.length < 3) {
      throw new Error('El nombre completo debe tener al menos 3 caracteres.');
    }

    if (!email || !email.includes('@')) {
      throw new Error('Debe ingresar un correo valido.');
    }

    if (password.length < 8) {
      throw new Error('La contrasena debe tener al menos 8 caracteres.');
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('El correo ya esta registrado.');
    }

    const passwordHash = await passwordHasher.hash(password, 10);
    const createdUser = await userRepository.createUser({
      fullName,
      email,
      passwordHash,
      role: input.role || 'user'
    });

    return {
      user: {
        id: createdUser.id,
        fullName: createdUser.fullName,
        email: createdUser.email,
        role: createdUser.role
      }
    };
  }

  async function login(input) {
    const email = String(input.email || '').trim().toLowerCase();
    const password = String(input.password || '');

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Credenciales invalidas.');
    }

    const isValid = await passwordHasher.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Credenciales invalidas.');
    }

    const token = tokenSigner.sign(
      { sub: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '2h' }
    );

    return {
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role
      }
    };
  }

  return { register, login };
}

module.exports = { createAuthService };
