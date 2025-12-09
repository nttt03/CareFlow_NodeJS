'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Kiểm tra xem bảng 'notifications' có tồn tại không
    const tableExists = await queryInterface.describeTable('notifications').catch(() => null);

    if (!tableExists) {
        console.error("Bảng 'notifications' không tồn tại. Bỏ qua việc thêm cột.");
        return;
    }
    
    // 2. Kiểm tra xem cột 'idBooking' đã tồn tại chưa
    const table = tableExists;

    if (!table.idBooking) {
      console.log("Đang thêm cột idBooking vào bảng notifications...");
      
      await queryInterface.addColumn('notifications', 'idBooking', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        comment: 'ID của lịch hẹn (booking) liên quan đến thông báo'
      });

      console.log('Đã thêm cột idBooking vào bảng notifications thành công.');
    } else {
      console.log("Cột 'idBooking' đã tồn tại trong bảng 'notifications'. Bỏ qua việc thêm cột.");
    }
  },

  async down(queryInterface, Sequelize) {
    // 1. Kiểm tra xem cột có tồn tại không trước khi xóa
    const table = await queryInterface.describeTable('notifications').catch(() => null);

    if (table && table.idBooking) {
      console.log('Đang xóa cột idBooking khỏi bảng notifications...');
      await queryInterface.removeColumn('notifications', 'idBooking');
      console.log('Đã xóa cột idBooking khỏi bảng notifications thành công.');
    } else {
      console.log("Cột 'idBooking' không tồn tại. Bỏ qua việc xóa cột.");
    }
  }
};