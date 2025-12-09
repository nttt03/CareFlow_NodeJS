'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Kiểm tra xem bảng 'Bookings' có tồn tại không
    const tableExists = await queryInterface.describeTable('Bookings').catch(() => null);

    if (!tableExists) {
        console.error("Bảng 'Bookings' không tồn tại. Bỏ qua việc thêm cột.");
        return;
    }
    
    // 2. Kiểm tra xem cột 'reviewRemindSent' đã tồn tại chưa
    const table = tableExists;

    if (!table.reviewRemindSent) {
      console.log("Đang thêm cột reviewRemindSent vào bảng Bookings...");
      
      await queryInterface.addColumn('Bookings', 'reviewRemindSent', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        after: 'reviewStatus',
      });

      console.log('Đã thêm cột reviewRemindSent vào bảng Bookings thành công.');
    } else {
      console.log("Cột 'reviewRemindSent' đã tồn tại trong bảng 'Bookings'. Bỏ qua việc thêm cột.");
    }
  },

  async down(queryInterface, Sequelize) {
    // 1. Kiểm tra xem cột có tồn tại không trước khi xóa
    const table = await queryInterface.describeTable('Bookings').catch(() => null);

    if (table && table.reviewRemindSent) {
      console.log('Đang xóa cột reviewRemindSent khỏi bảng Bookings...');
      await queryInterface.removeColumn('Bookings', 'reviewRemindSent');
      console.log('Đã xóa cột reviewRemindSent khỏi bảng Bookings thành công.');
    } else {
      console.log("Cột 'reviewRemindSent' không tồn tại. Bỏ qua việc xóa cột.");
    }
  }
};