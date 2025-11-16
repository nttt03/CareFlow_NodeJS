// src/models/index.js
import "dotenv/config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";  // THÊM DÒNG NÀY
import { Sequelize } from "sequelize";
import config from "../config/config.js";

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

// SỬA: DÙNG fileURLToPath + path.dirname → CHUẨN 100%
const __filename = fileURLToPath(import.meta.url);           // → index.js
const __dirname = path.dirname(__filename);                  // → thư mục models/
const basename = path.basename(__filename);
const db = {};

let sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

// Load models
const files = fs.readdirSync(__dirname).filter(file => {
  return (
    file.indexOf('.') !== 0 &&
    file !== basename &&
    file.slice(-3) === '.js' &&
    file.indexOf('.test.js') === -1
  );
});

for (const file of files) {
  const modelPath = new URL(file, import.meta.url);  // Tạo URL từ file hiện tại
  const modelModule = await import(modelPath);
  const model = modelModule.default(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
}

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;