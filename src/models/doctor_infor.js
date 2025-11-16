"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Doctor_Infor extends Model {
    static associate(models) {
      Doctor_Infor.belongsTo(models.User, {
        foreignKey: "doctorId",
        as: "doctor",
      });
      Doctor_Infor.belongsTo(models.Specialty, {
        foreignKey: "specialtyId",
        as: "specialty",
      });
      Doctor_Infor.belongsTo(models.Hospital, {
        foreignKey: "hospitalId",
        as: "hospital",
      });
      Doctor_Infor.hasMany(models.Booking, {
        foreignKey: "doctorId",
        as: "doctorInfoData",
      });
    }
  }

  Doctor_Infor.init({
    doctorId: {
      type: DataTypes.INTEGER,
    },
    specialtyId: {
      type: DataTypes.INTEGER,
    },
    hospitalId: {
      type: DataTypes.INTEGER,
    },
    price: DataTypes.DECIMAL(10, 2),
    note: DataTypes.STRING,
    count: DataTypes.INTEGER,
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: null,
      validate: {
        min: 0,
        max: 5
      }
    },
  }, {
    sequelize,
    modelName: "Doctor_Infor",
    tableName: "doctor_infor",
    freezeTableName: true,
  });
  return Doctor_Infor;
};
