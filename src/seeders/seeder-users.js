'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {  
    return queryInterface.bulkInsert('Users', [
      {
        email: 'Nttt03@gmail.com',
        password: '123',
        firstName: 'Thao',
        lastName: 'Nguyen',
        address: 'Bình Định',
        gender: 0,
        typeRole: 'ROLE',
        keyRole: 'R1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
