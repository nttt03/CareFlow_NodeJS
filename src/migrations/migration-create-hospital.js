"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Hospitals", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      addressDetail: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      provinceId: {
        type: Sequelize.INTEGER,
      },
      communeUnitId: {
        type: Sequelize.INTEGER,
      },
      descriptionHTML: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      descriptionMarkdown: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      image: {
        type: Sequelize.BLOB("long"),
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true,
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

    // Thêm chỉ mục cho provinceId và communeUnitId
    await queryInterface.addIndex("Hospitals", ["provinceId"], {
      name: "hospitals_provinceId_index",
    });
    await queryInterface.addIndex("Hospitals", ["communeUnitId"], {
      name: "hospitals_communeUnitId_index",
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Hospitals");
  },
};
