"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("schedules", "currentNumber", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("schedules", "currentNumber", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
    });
  },
};
