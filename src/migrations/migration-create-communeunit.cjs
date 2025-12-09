"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("CommuneUnits", {
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
      type: {
        type: Sequelize.ENUM("WARD", "COMMUNE", "SPECIAL_ZONE"),
        allowNull: false,
      },
      provinceId: {
        type: Sequelize.INTEGER,
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

    // Thêm chỉ mục cho code, provinceId, và type
    await queryInterface.addIndex("CommuneUnits", ["code"], {
      unique: true,
      name: "commune_units_code_index",
    });
    await queryInterface.addIndex("CommuneUnits", ["provinceId"], {
      name: "commune_units_provinceId_index",
    });
    await queryInterface.addIndex("CommuneUnits", ["type"], {
      name: "commune_units_type_index",
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("CommuneUnits");
  },
};
