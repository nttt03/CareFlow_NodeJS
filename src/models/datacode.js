"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class Datacode extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Datacode.hasMany(models.User, {
        foreignKey: "positionId",
        as: "positionData",
      });
      Datacode.hasMany(models.User, { foreignKey: "gender", as: "genderData" });
      Datacode.hasMany(models.Schedule, {
        foreignKey: "timeType",
        as: "timeTypeData",
      });

      // Datacode.hasMany(models.Doctor_Infor, {
      //   foreignKey: "priceId",
      //   as: "priceTypeData",
      // });
      // Datacode.hasMany(models.Doctor_Infor, {
      //   foreignKey: "provinceId",
      //   as: "provinceTypeData",
      // });

      Datacode.hasMany(models.Booking, {
        foreignKey: "timeType",
        as: "timeTypeDataPatient",
      });
      Datacode.hasMany(models.Booking, {
        foreignKey: "statusId",
        as: "statusData",
      });
    }
  }
  Datacode.init(
    {
      keyMap: DataTypes.STRING,
      type: DataTypes.STRING,
      valueEn: DataTypes.STRING,
      valueVi: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Datacode",
      tableName: "datacodes",
      freezeTableName: true,
    }
  );
  return Datacode;
};
