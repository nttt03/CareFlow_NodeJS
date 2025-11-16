// const { Sequelize } = require('sequelize');

// // Option 3: Passing parameters separately (other dialects)
// const sequelize = new Sequelize('careflow', 'root', null, {
//   host: 'localhost',
//   dialect: 'mysql',
//   "logging": false
// });

// let connectDB = async() => {
//     try {
//         await sequelize.authenticate();
//         console.log('Connection has been established successfully.');
//     } catch (error) {
//         console.error('Unable to connect to the database:', error);
//     }
// }


// module.exports = connectDB;


// connectDB.js
// connectDB.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'railway',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'crossover.proxy.rlwy.net',
    port: process.env.DB_PORT || 12389,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    timezone: '+07:00'
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Kết nối MySQL (Railway) thành công!');
    await sequelize.sync({ alter: false });
  } catch (error) {
    console.error('Lỗi kết nối DB:', error.message);
    process.exit(1);
  }
};

// XUẤT ĐÚNG CÁCH (CommonJS)
module.exports = { sequelize, connectDB };