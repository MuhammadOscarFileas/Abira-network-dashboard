import { DataTypes } from "sequelize";
import db from "../config/database.js";

const BtsModel = db.define(
  "bts",
  {
    id_bts: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    nama_bts: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ip_address_bts: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lokasi_bts: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    latitude: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    longtitude: {
      type: DataTypes.STRING,
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

export default BtsModel; 