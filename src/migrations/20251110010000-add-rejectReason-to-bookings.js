'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('bookings', 'rejectReason', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    });

    console.log('Đã thêm cột rejectReason vào bảng bookings');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('bookings', 'rejectReason');
    console.log('Đã xóa cột rejectReason khỏi bảng bookings');
  }
};