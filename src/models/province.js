"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Province extends Model {
    static associate(models) {
      // 1 tỉnh có nhiều xã/phường
      Province.hasMany(models.CommuneUnit, {
        foreignKey: "provinceId",
        as: "communeUnits",
      });
    }
  }
  Province.init(
    {
      code: {
        type: DataTypes.STRING,
        unique: true, // Đảm bảo code là duy nhất
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Province",
      indexes: [
        { fields: ["code"], unique: true }, // Chỉ mục cho code, đảm bảo tìm kiếm nhanh
      ],
      timestamps: true, // Bật timestamps để tự động quản lý createdAt, updatedAt
    }
  );
  return Province;
};
