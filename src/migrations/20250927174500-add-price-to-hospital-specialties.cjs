"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Kiểm tra xem cột 'price' đã tồn tại trong bảng 'Hospital_Specialties' chưa
    const table = await queryInterface.describeTable('Hospital_Specialties');

    // Chỉ thêm nếu cột 'price' CHƯA tồn tại
    if (!table.price) {
      console.log("Adding column 'price' to 'Hospital_Specialties'...");
      
      await queryInterface.addColumn("Hospital_Specialties", "price", {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      });

      console.log("Column 'price' added successfully.");
    } else {
      console.log("Column 'price' already exists in 'Hospital_Specialties'. Skipping add column.");
    }
  },

  async down(queryInterface, Sequelize) {
    // 1. Kiểm tra xem cột 'price' có tồn tại để tránh lỗi khi remove
    const table = await queryInterface.describeTable('Hospital_Specialties');
    
    if (table.price) {
      console.log("Removing column 'price' from 'Hospital_Specialties'...");
      await queryInterface.removeColumn("Hospital_Specialties", "price");
      console.log("Column 'price' removed successfully.");
    } else {
      console.log("Column 'price' does not exist in 'Hospital_Specialties'. Skipping remove column.");
    }
  },
};