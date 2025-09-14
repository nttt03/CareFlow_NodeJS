"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Users", "hospitalId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Hospitals", // bảng Hospitals
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addIndex("Users", ["hospitalId"], {
      name: "users_hospitalId_index",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Users", "hospitalId");
  },
};
