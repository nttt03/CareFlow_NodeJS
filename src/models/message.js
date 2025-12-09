"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class Message extends Model {
    /**
     * Helper method for defining associations.
     */
    static associate(models) {
      // Liên kết tin nhắn với User
      Message.belongsTo(models.User, {
        foreignKey: "userId",
        as: "sender",
      });
    }
  }
  Message.init(
    {
      // ID của phiên trò chuyện mà tin nhắn này thuộc về
      conversationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // ID người dùng (người đã kích hoạt tin nhắn này, có thể là user_id thật
      // hoặc là ID chung nếu user_id là null cho bot, nhưng thường để user_id thật)
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [['user', 'bot']],
        }
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      // Thời gian tin nhắn được đọc (Tùy chọn)
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Message",
      tableName: "messages",
      freezeTableName: true,
    }
  );
  return Message;
};