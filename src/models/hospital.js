"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Hospital extends Model {
    static associate(models) {
      // Liên kết với bảng địa chỉ
      Hospital.belongsTo(models.Province, {
        foreignKey: "provinceId",
        as: "provinceData",
      });
      Hospital.belongsTo(models.CommuneUnit, {
        foreignKey: "communeUnitId",
        as: "communeUnitData",
      });
      Hospital.belongsTo(models.Datacode, {
        foreignKey: "status",
        targetKey: "keyMap",
        as: "statusData",
      });
    }
  }
  Hospital.init(
    {
      name: DataTypes.STRING,
      addressDetail: DataTypes.STRING, // Lưu số nhà, tên đường
      provinceId: {
        type: DataTypes.INTEGER,
      },
      communeUnitId: {
        type: DataTypes.INTEGER,
      },
      descriptionHTML: DataTypes.TEXT,
      descriptionMarkdown: DataTypes.TEXT,
      image: DataTypes.BLOB("long"),
      status: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Hospital",
      indexes: [
        { fields: ["provinceId"] }, // Chỉ mục cho provinceId
        { fields: ["communeUnitId"] }, // Chỉ mục cho communeUnitId
      ],
      timestamps: true, // Thêm createdAt, updatedAt
    }
  );
  return Hospital;
};
