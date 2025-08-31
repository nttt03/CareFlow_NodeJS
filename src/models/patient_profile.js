"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Patient_Profile extends Model {
    static associate(models) {}
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
      freezeTableName: true,
    }
  );
  return Patient_Profile;
};
