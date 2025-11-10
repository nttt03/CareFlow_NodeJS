'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Reviews', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      patientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      doctorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      bookingId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'Bookings',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      rating: {
        type: Sequelize.DECIMAL(3, 2), // 1.0 → 5.0, bước 0.5
        allowNull: false,
        validate: {
           min: 0,
           max: 5
        },
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      isAnonymous: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Ẩn danh hay không'
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'flagged'),
        allowNull: false,
        defaultValue: 'pending',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Thêm index để tìm kiếm nhanh
    await queryInterface.addIndex('Reviews', ['doctorId'], {
      name: 'idx_reviews_doctorId'
    });
    await queryInterface.addIndex('Reviews', ['bookingId'], {
      name: 'idx_reviews_bookingId',
      unique: true
    });
    await queryInterface.addIndex('Reviews', ['status'], {
      name: 'idx_reviews_status'
    });
    await queryInterface.addIndex('Reviews', ['createdAt'], {
      name: 'idx_reviews_createdAt'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Reviews');
  }
};