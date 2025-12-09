"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Provinces", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      code: {
        type: Sequelize.STRING,
        unique: true, // Đảm bảo code là duy nhất
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Thêm chỉ mục cho code
    await queryInterface.addIndex("Provinces", ["code"], {
      unique: true,
      name: "provinces_code_index",
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Provinces");
  },
};
