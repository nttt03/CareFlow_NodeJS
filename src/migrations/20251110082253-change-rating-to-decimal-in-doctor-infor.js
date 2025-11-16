'use strict';

export default {
  up: async (queryInterface, Sequelize) => {
    /**
     * Thay đổi cột rating từ STRING → DECIMAL(3,2)
     * - DECIMAL(3,2): 1 chữ số trước dấu chấm, 2 chữ số sau → max 5.00
     * - allowNull: true (vì bác sĩ mới chưa có đánh giá)
     * - defaultValue: null
     */
    await queryInterface.changeColumn('Doctor_Infor', 'rating', {
      type: Sequelize.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: null,
      validate: {
        min: 0,
        max: 5
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Hoàn tác: chuyển về STRING
     */
    await queryInterface.changeColumn('Doctor_Infor', 'rating', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null
    });
  }
};