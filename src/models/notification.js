"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Notification.belongsTo(models.User, {
        foreignKey: "receiverId",
        as: "receiver",
      });
      Notification.belongsTo(models.User, {
        foreignKey: "senderId",
        as: "sender",
      });
    }
  }
  Notification.init(
    {
      senderId: DataTypes.INTEGER,
      receiverId: DataTypes.INTEGER,
      receiverRole: DataTypes.STRING,
      message: DataTypes.STRING,
      url: DataTypes.STRING,
      isRead: DataTypes.BOOLEAN,
      idBooking: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
      },
    },
    {
      sequelize,
      modelName: "Notification",
    }
  );
  return Notification;
};
