"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class Medical_Record extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Medical_Record.belongsTo(models.User, {
        foreignKey: "patientId",
        as: "patient",
      });
      Medical_Record.belongsTo(models.User, {
        foreignKey: "doctorId",
        as: "doctor",
      });
      Medical_Record.belongsTo(models.Booking, {
        foreignKey: "bookingId",
        as: "booking",
      });
    }
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
      tableName: "medical_records",
      freezeTableName: true,
      timestamps: false,
    }
  );
  return Medical_Record;
};
