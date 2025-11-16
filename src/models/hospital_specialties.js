"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class Hospital_Specialties extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Liên kết với bảng Specialties
      Hospital_Specialties.belongsTo(models.Specialty, {
        foreignKey: "specialtyId",
        as: "specialty",
      });
      // Liên kết với bảng Hospitals
      Hospital_Specialties.belongsTo(models.Hospital, {
        foreignKey: "hospitalId",
        as: "hospital",
      });
    }
  }
  Hospital_Specialties.init(
    {
      specialtyId: DataTypes.INTEGER,
      hospitalId: DataTypes.INTEGER,
      price: DataTypes.INTEGER
    },
    {
      sequelize,
      modelName: "Hospital_Specialties",
      tableName: "hospital_specialties",
      freezeTableName: true,
      timestamps: false,
    }
  );
  return Hospital_Specialties;
};
