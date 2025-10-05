"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Notifications", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      senderId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      receiverId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      receiverRole: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      message: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      url: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Notifications");
  },
};
