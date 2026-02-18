import { DataTypes } from "sequelize";
import db from "../config/database.js";

const TagihanModel = db.define(
  "tagihan",
  {
    id_tagihan: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    id_pelanggan: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    bulan_tahun: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    nominal_tagihan: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Lunas", "Belum Lunas", "Tidak Bayar"),
      allowNull: false,
      defaultValue: "Belum Lunas",
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default TagihanModel; 