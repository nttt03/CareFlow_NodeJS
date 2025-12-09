"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('Users');

    // Kiểm tra và thêm resetPasswordToken
    if (!table.resetPasswordToken) {
      await queryInterface.addColumn("Users", "resetPasswordToken", {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Kiểm tra và thêm resetPasswordExpires
    if (!table.resetPasswordExpires) {
      await queryInterface.addColumn("Users", "resetPasswordExpires", {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Kiểm tra tồn tại trước khi xóa (để rollback an toàn hơn)
    const table = await queryInterface.describeTable('Users');
    
    if (table.resetPasswordToken) {
        await queryInterface.removeColumn("Users", "resetPasswordToken");
    }
    if (table.resetPasswordExpires) {
        await queryInterface.removeColumn("Users", "resetPasswordExpires");
    }
  },
};