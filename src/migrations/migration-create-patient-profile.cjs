"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Patient_Profile", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
      },
      height: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      weight: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      underlying_diseases: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      allergies: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      medical_history: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Patient_Profile");
  },
};
