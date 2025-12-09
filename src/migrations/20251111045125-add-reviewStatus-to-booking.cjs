'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Kiểm tra xem cột 'reviewStatus' đã tồn tại trong bảng 'Bookings' chưa
    const table = await queryInterface.describeTable('Bookings').catch(() => null);

    if (table && !table.reviewStatus) {
      console.log("Đang thêm cột reviewStatus vào bảng Bookings...");
      
      // Sử dụng return queryInterface.addColumn để thêm cột
      return queryInterface.addColumn('Bookings', 'reviewStatus', {
        type: Sequelize.ENUM('pending', 'reviewed'),
        allowNull: false,
        defaultValue: 'pending',
        after: 'statusId' // Đặt sau cột statusId (nếu tồn tại)
      }).then(() => {
          console.log("Đã thêm cột reviewStatus vào bảng Bookings thành công.");
      });

    } else if (table && table.reviewStatus) {
      console.log("Cột 'reviewStatus' đã tồn tại trong bảng 'Bookings'. Bỏ qua việc thêm cột.");
      return Promise.resolve();
    }
  },

  async down(queryInterface, Sequelize) {
    // 1. Kiểm tra xem cột có tồn tại không trước khi xóa
    const table = await queryInterface.describeTable('Bookings').catch(() => null);

    if (table && table.reviewStatus) {
      // Xóa cột reviewStatus
      await queryInterface.removeColumn('Bookings', 'reviewStatus');
      console.log('Đã xóa cột reviewStatus khỏi bảng Bookings.');

      // Xóa ENUM type nếu DB là PostgreSQL (Giữ nguyên logic của bạn)
      if (queryInterface.sequelize.options.dialect === 'postgres') {
        console.log('Đang xóa ENUM type cho PostgreSQL...');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Bookings_reviewStatus";');
      }
    } else {
      console.log("Cột 'reviewStatus' không tồn tại. Bỏ qua việc xóa cột.");
    }
  }
};