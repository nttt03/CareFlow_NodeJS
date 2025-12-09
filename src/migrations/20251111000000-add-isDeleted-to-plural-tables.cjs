'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Danh sách bảng thực tế trong DB (loại bỏ sequelize meta)
    const targetTables = [
      'bookings',
      'datacodes',
      'doctor_infor',
      'favorites',
      'histories',
      'hospitals',
      'hospital_specialties',
      'markdowns',
      'medical_records',
      'notifications',
      'patient_profile',
      'provinces',
      'schedules',
      'specialties',
      'users'
    ];

    console.log('Đang thêm cột isDeleted vào các bảng:', targetTables);

    // Lấy danh sách bảng tồn tại trong DB
    const existingTables = await queryInterface.showAllTables();
    const existingSet = new Set(existingTables.map(t => t.toLowerCase()));

    const promises = [];

    for (const table of targetTables) {
      const normalizedTable = existingTables.find(t => t.toLowerCase() === table.toLowerCase());

      if (!normalizedTable) {
        console.log(`Bảng không tồn tại (bỏ qua): ${table}`);
        continue;
      }

      // Kiểm tra cột isDeleted đã tồn tại chưa
      try {
        const columns = await queryInterface.describeTable(normalizedTable);
        if (columns.isDeleted !== undefined) {
          console.log(`Cột isDeleted đã tồn tại: ${normalizedTable}`);
          continue;
        }
      } catch (err) {
        console.error(`Lỗi khi kiểm tra bảng ${normalizedTable}:`, err.message);
        continue;
      }

      // Thêm cột isDeleted
      promises.push(
        queryInterface.addColumn(normalizedTable, 'isDeleted', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
          comment: 'Soft delete flag'
        }).then(() => {
          console.log(`Đã thêm isDeleted vào: ${normalizedTable}`);
        }).catch(err => {
          if (err.message.includes('already exists')) {
            console.log(`Cột isDeleted đã tồn tại: ${normalizedTable}`);
          } else {
            console.error(`Lỗi khi thêm vào ${normalizedTable}:`, err.message);
          }
        })
      );
    }

    await Promise.all(promises);
    console.log('Hoàn tất thêm cột isDeleted vào tất cả bảng hợp lệ.');
  },

  down: async (queryInterface, Sequelize) => {
    const targetTables = [
      'bookings', 'communes', 'datacodes', 'doctor_infor', 'favorites',
      'histories', 'hospitals', 'hospital_specialties', 'markdowns',
      'medical_records', 'notifications', 'patient_profile',
      'provinces', 'schedules', 'specialties', 'users'
    ];

    const existingTables = await queryInterface.showAllTables();

    const promises = targetTables
      .map(table => existingTables.find(t => t.toLowerCase() === table.toLowerCase()))
      .filter(Boolean)
      .map(table => {
        return queryInterface.removeColumn(table, 'isDeleted').catch(err => {
          if (!err.message.includes('does not exist')) {
            console.error(`Lỗi khi xóa cột ở ${table}:`, err.message);
          }
        });
      });

    await Promise.all(promises);
    console.log('Hoàn tất xóa cột isDeleted (nếu có).');
  }
};