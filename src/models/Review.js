"use strict";
import { Model } from "sequelize";
// models/Review.js
export default (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {
      Review.belongsTo(models.User, { foreignKey: 'patientId', as: 'patient' });
      Review.belongsTo(models.User, { foreignKey: 'doctorId', as: 'doctor' });
      Review.belongsTo(models.Booking, { foreignKey: 'bookingId', as: 'booking' });
    }
  }

  Review.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    patientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // 1 booking chỉ được đánh giá 1 lần
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      validate: { min: 0, max: 5 }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'Review',
    tableName: "reviews",
    freezeTableName: true,
    indexes: [
      { fields: ['doctorId'] },
      { fields: ['bookingId'], unique: true },
      { fields: ['status'] }
    ]
  });

  return Review;
};