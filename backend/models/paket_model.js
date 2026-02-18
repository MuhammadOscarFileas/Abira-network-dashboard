import { DataTypes } from "sequelize";
import db from "../config/database.js";

const PaketModel = db.define(
  "paket",
  {
    id_paket: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    nama_paket: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    harga: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    paranoid: true,
    deletedAt: "deleted_at",
  }
);

export default PaketModel;
