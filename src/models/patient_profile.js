"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class Patient_Profile extends Model {
    static associate(models) {
      Patient_Profile.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
      });
    }
  }

  Patient_Profile.init(
    {
      userId: DataTypes.INTEGER,
      height: DataTypes.FLOAT,
      weight: DataTypes.FLOAT,
      underlying_diseases: DataTypes.STRING,
      allergies: DataTypes.STRING,
      medical_history: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Patient_Profile",
      tableName: "patient_profile",
      freezeTableName: true,
      timestamps: false,
    }
  );
  return Patient_Profile;
};
