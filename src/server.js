require('dotenv').config();
const { createPoolFromEnv } = require('./config/db');
const { createApp } = require('./app');
const userRepository = require('./repositories/userRepository');

async function main() {
  const pool = createPoolFromEnv();

  const repository = {
    async findByEmail(email) {
      return userRepository.findByEmail(pool, email);
    },
    async findById(id) {
      return userRepository.findById(pool, id);
    },
    async createUser(user) {
      return userRepository.createUser(pool, user);
    }
  ,
    async updateUser(id, fields) {
      return userRepository.updateUser(pool, id, fields);
    }
    ,
    async createInteraction(data) {
      const interactionRepo = require('./repositories/interactionRepository');
      return interactionRepo.createInteraction(pool, data);
    }
    ,
    async listUsers(limit) {
      return userRepository.listUsers(pool, limit);
    },
    async deleteUser(id) {
      return userRepository.deleteUser(pool, id);
    },
    async listInteractions(limit) {
      const interactionRepo = require('./repositories/interactionRepository');
      return interactionRepo.listInteractions(pool, limit);
    }
  };

  const app = createApp({
    userRepository: repository,
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production'
  });

  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => {
    console.log(`Servidor listo en http://localhost:${port}`);
  });
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
