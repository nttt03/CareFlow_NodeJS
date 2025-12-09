'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Kiểm tra xem bảng 'bookings' có tồn tại không
    const tableExists = await queryInterface.describeTable('bookings').catch(() => null);

    if (!tableExists) {
        console.error("Bảng 'bookings' không tồn tại. Bỏ qua việc thêm cột.");
        return;
    }
    
    // 2. Kiểm tra xem cột 'rejectReason' đã tồn tại chưa
    const table = tableExists;

    if (!table.rejectReason) {
      console.log("Đang thêm cột rejectReason vào bảng bookings...");
      await queryInterface.addColumn('bookings', 'rejectReason', {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      });
      console.log('Đã thêm cột rejectReason vào bảng bookings thành công.');
    } else {
      console.log("Cột 'rejectReason' đã tồn tại trong bảng 'bookings'. Bỏ qua việc thêm cột.");
    }
  },

  async down(queryInterface, Sequelize) {
    // 1. Kiểm tra xem bảng có tồn tại và cột có tồn tại không
    const table = await queryInterface.describeTable('bookings').catch(() => null);

    if (table && table.rejectReason) {
      console.log('Đang xóa cột rejectReason khỏi bảng bookings...');
      await queryInterface.removeColumn('bookings', 'rejectReason');
      console.log('Đã xóa cột rejectReason khỏi bảng bookings thành công.');
    } else {
      console.log("Cột 'rejectReason' không tồn tại hoặc đã bị xóa. Bỏ qua việc xóa cột.");
    }
  }
};