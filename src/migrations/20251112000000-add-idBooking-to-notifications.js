'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('notifications', 'idBooking', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: 'ID của lịch hẹn (booking) liên quan đến thông báo'
    });

    console.log('Đã thêm cột idBooking vào bảng notifications');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('notifications', 'idBooking');
    console.log('Đã xóa cột idBooking khỏi bảng notifications');
  }
};