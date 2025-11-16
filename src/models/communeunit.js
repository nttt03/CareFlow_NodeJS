"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class CommuneUnit extends Model {
    static associate(models) {
      // Mỗi xã/phường thuộc một tỉnh
      CommuneUnit.belongsTo(models.Province, {
        foreignKey: "provinceId",
        as: "province",
      });
    }
  }
  CommuneUnit.init(
    {
      code: {
        type: DataTypes.STRING,
        unique: true, // Đảm bảo code là duy nhất
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("WARD", "COMMUNE", "SPECIAL_ZONE"),
        allowNull: false,
      },
      provinceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "CommuneUnit",
      tableName: "communeunits",
      freezeTableName: true,
      indexes: [
        { fields: ["code"], unique: true }, // Chỉ mục cho code
        { fields: ["provinceId"] }, // Chỉ mục cho provinceId để tối ưu truy vấn theo tỉnh
        { fields: ["type"] }, // Chỉ mục cho type để tối ưu lọc theo loại đơn vị
      ],
      timestamps: true, // Bật timestamps
    }
  );
  return CommuneUnit;
};
