"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Specialty extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Specialty.hasMany(models.Doctor_Infor, { foreignKey: "specialtyId" });
      Specialty.belongsTo(models.Datacode, {
        foreignKey: "status",
        targetKey: "keyMap",
        as: "statusData",
      });
    }
  }
  Specialty.init(
    {
      name: DataTypes.STRING,
      descriptionHTML: DataTypes.TEXT,
      descriptionMarkdown: DataTypes.TEXT,
      image: DataTypes.BLOB("long"),
      status: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Specialty",
    }
  );
  return Specialty;
};
