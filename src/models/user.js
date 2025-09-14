"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Liên kết với bảng địa chỉ
      User.belongsTo(models.Province, {
        foreignKey: "provinceId",
        as: "provinceData",
      });
      User.belongsTo(models.CommuneUnit, {
        foreignKey: "communeUnitId",
        as: "communeUnitData",
      });

      // Các liên kết hiện có
      User.belongsTo(models.Datacode, {
        foreignKey: "positionId",
        targetKey: "keyMap",
        as: "positionData",
      });
      User.belongsTo(models.Datacode, {
        foreignKey: "gender",
        targetKey: "keyMap",
        as: "genderData",
      });
      User.hasOne(models.Markdown, { foreignKey: "doctorId" });
      User.hasOne(models.Doctor_Infor, { foreignKey: "doctorId" });
      User.hasMany(models.Schedule, {
        foreignKey: "doctorId",
        as: "doctorData",
      });
      User.hasMany(models.Booking, {
        foreignKey: "patientId",
        as: "patientData",
      });
      User.hasMany(models.Booking, {
        foreignKey: "doctorId",
        as: "infoDataDoctor",
      });
      User.belongsTo(models.Hospital, {
        foreignKey: "hospitalId",
        as: "hospital",
      });

    }
  }
  User.init(
    {
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      fullName: DataTypes.STRING,
      addressDetail: DataTypes.STRING,
      phoneNumber: DataTypes.STRING,
      gender: DataTypes.STRING,
      dateOfBirth: DataTypes.STRING,
      avatar: DataTypes.TEXT,
      CCCD: DataTypes.STRING,
      roleId: DataTypes.STRING,
      positionId: DataTypes.STRING,
      status: DataTypes.STRING,
      provinceId: {
        type: DataTypes.INTEGER,
      },
      communeUnitId: {
        type: DataTypes.INTEGER,
      },
      hospitalId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    },
    {
      sequelize,
      modelName: "User",
      indexes: [
        { fields: ["provinceId"] }, // Chỉ mục cho provinceId
        { fields: ["communeUnitId"] }, // Chỉ mục cho communeUnitId
      ],
      timestamps: true, // Thêm createdAt, updatedAt
    }
  );
  return User;
};
