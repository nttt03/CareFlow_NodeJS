'use strict';

const fs = require('fs');
const path = require('path');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const modelsDir = path.join(__dirname, '../models');
    const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.cjs'));

    const tablesToUpdate = modelFiles
      .map(file => {
        const model = require(path.join(modelsDir, file));
        if (model && model.tableName) {
          return model.tableName;
        }
        // Nếu không có tableName, thử lấy tên file (loại bỏ .js)
        return path.basename(file, '.cjs');
      })
      .filter(table => table && table !== 'index'); // bỏ file index.js

    console.log('Đang thêm cột isDeleted vào các bảng:', tablesToUpdate);

    const promises = tablesToUpdate.map(table => {
      return queryInterface.addColumn(table, 'isDeleted', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }).then(() => {
        console.log(`Đã thêm isDeleted vào bảng: ${table}`);
      }).catch(err => {
        if (err.message.includes('already exists')) {
          console.log(`Cột isDeleted đã tồn tại trong bảng: ${table}`);
        } else {
          console.error(`Lỗi khi thêm isDeleted vào bảng ${table}:`, err);
        }
      });
    });

    await Promise.all(promises);
  },

  down: async (queryInterface, Sequelize) => {
    const modelsDir = path.join(__dirname, '../models');
    const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));

    const tablesToUpdate = modelFiles
      .map(file => {
        const model = require(path.join(modelsDir, file));
        if (model && model.tableName) {
          return model.tableName;
        }
        return path.basename(file, '.cjs');
      })
      .filter(table => table && table !== 'index');

    const promises = tablesToUpdate.map(table => {
      return queryInterface.removeColumn(table, 'isDeleted').then(() => {
        console.log(`Đã xóa isDeleted khỏi bảng: ${table}`);
      }).catch(err => {
        if (err.message.includes('does not exist')) {
          console.log(`Cột isDeleted không tồn tại trong bảng: ${table}`);
        } else {
          console.error(`Lỗi khi xóa isDeleted khỏi bảng ${table}:`, err);
        }
      });
    });

    await Promise.all(promises);
  }
};