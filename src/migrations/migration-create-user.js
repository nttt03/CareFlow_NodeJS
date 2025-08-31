"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      email: {
        type: Sequelize.STRING,
      },
      password: {
        type: Sequelize.STRING,
      },
      fullName: {
        type: Sequelize.STRING,
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
      phoneNumber: {
        type: Sequelize.STRING,
      },
      gender: {
        type: Sequelize.STRING,
      },
      dateOfBirth: {
        type: Sequelize.STRING,
      },
      CCCD: {
        type: Sequelize.STRING,
      },
      avatar: {
        type: Sequelize.STRING,
      },
      roleId: {
        type: Sequelize.STRING,
      },
      positionId: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.STRING,
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

    // Thêm chỉ mục cho provinceId và communeUnitId như trong model
    await queryInterface.addIndex("Users", ["provinceId"], {
      name: "users_provinceId_index",
    });
    await queryInterface.addIndex("Users", ["communeUnitId"], {
      name: "users_communeUnitId_index",
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Users");
  },
};
