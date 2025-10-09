"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Favorite extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Favorite.belongsTo(models.User, { foreignKey: "doctorId", as: "doctor" });
      Favorite.belongsTo(models.Hospital, { foreignKey: "hospitalId", as: "hospital" });
      Favorite.belongsTo(models.Doctor_Infor, { foreignKey: "doctorId", as: "doctorInfo" });
    }
  }
  Favorite.init(
    {
      userId: DataTypes.INTEGER,
      hospitalId: DataTypes.INTEGER,
      doctorId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Favorite",
      timestamps: false,
    }
  );
  return Favorite;
};
