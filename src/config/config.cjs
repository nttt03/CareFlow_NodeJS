// src/config/config.js
const config = {
  development: {
    username: "root",
    password: null,
    database: "careflow",
    host: "127.0.0.1",
    dialect: "mysql",
    logging: false,
    query: { raw: false },
    timezone: "+07:00"
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false }
    },
    timezone: "+07:00",
    logging: false
  }
};

// export default config;
module.exports = config;