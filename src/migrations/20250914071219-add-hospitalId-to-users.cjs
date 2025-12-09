"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Kiểm tra xem cột hospitalId đã tồn tại trong bảng Users chưa
    const table = await queryInterface.describeTable('Users');

    if (!table.hospitalId) {
      // Nếu cột CHƯA tồn tại, thì tiến hành thêm cột và khóa ngoại
      await queryInterface.addColumn("Users", "hospitalId", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Hospitals",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });

      // Tạo index để tối ưu hóa truy vấn
      await queryInterface.addIndex("Users", ["hospitalId"], {
        name: "users_hospitalId_index",
      });
    } else {
      console.log("Column 'hospitalId' already exists in 'Users'. Skipping add column.");
    }
  },

  async down(queryInterface, Sequelize) {
    // 1. Loại bỏ index trước
    try {
      await queryInterface.removeIndex("Users", "users_hospitalId_index");
    } catch (error) {
      console.log("Index not found or already removed, continuing.");
    }
    
    // 2. Loại bỏ cột
    await queryInterface.removeColumn("Users", "hospitalId");
  },
};