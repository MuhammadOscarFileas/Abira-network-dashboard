import { DataTypes } from "sequelize";
import db from "../config/database.js";

const PembayaranModel = db.define(
  "pembayaran",
  {
    id_pembayaran: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    tanggal_pembayaran: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    metode_pembayaran: {
      type: DataTypes.ENUM("Cash", "Transfer", "E-Wallet"),
      allowNull: false,
    },
    bukti_pembayaran: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    diskon: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    total_pembayaran: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    id_tagihan: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default PembayaranModel; 