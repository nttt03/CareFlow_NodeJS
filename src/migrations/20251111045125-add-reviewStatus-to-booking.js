'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Bookings', 'reviewStatus', {
      type: Sequelize.ENUM('pending', 'reviewed'),
      allowNull: false,
      defaultValue: 'pending',
      after: 'statusId'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Xóa cột reviewStatus
    await queryInterface.removeColumn('Bookings', 'reviewStatus');

    // Xóa ENUM type nếu DB là PostgreSQL
    if (queryInterface.sequelize.options.dialect === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Bookings_reviewStatus";');
    }
  }
};
