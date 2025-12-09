"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class Conversation extends Model {
    /**
     * Helper method for defining associations.
     * Liên kết Conversation với User (người sở hữu) và Message (các tin nhắn thuộc phiên).
     */
    static associate(models) {
      // 1. Liên kết Conversation với User (người sở hữu phiên trò chuyện)
      Conversation.belongsTo(models.User, {
        foreignKey: "userId",
        as: "owner", // Alias là owner
      });

      // 2. Liên kết Conversation với các Messages
      Conversation.hasMany(models.Message, {
        foreignKey: "conversationId",
        as: "messages",
      });
    }
  }
  Conversation.init(
    {
      // ID người dùng sở hữu phiên
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // Tiêu đề/Tóm tắt của cuộc trò chuyện (tự sinh ra hoặc mặc định)
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // Thời gian hoạt động cuối cùng (giúp sắp xếp lịch sử)
      lastActive: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Conversation",
      tableName: "conversations",
      freezeTableName: true,
    }
  );
  return Conversation;
};