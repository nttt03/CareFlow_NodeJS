"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Medical_Record extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {}
  }
  Medical_Record.init(
    {
      patientId: DataTypes.INTEGER,
      bookingId: DataTypes.INTEGER,
      doctorId: DataTypes.INTEGER,
      description: DataTypes.TEXT,
      file: DataTypes.BLOB("medium"),
      updateBy: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Medical_Record",
    }
  );
  return Medical_Record;
};
