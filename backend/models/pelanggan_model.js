import { DataTypes } from "sequelize";
import db from "../config/database.js";

const PelangganModel = db.define(
  "pelanggan",
  {
    id_pelanggan: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    nama_pelanggan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    alamat: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nomor_telepon: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tgl_nonaktif: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tgl_aktif_kembali: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    longtitude: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status_pelanggan: {
      type: DataTypes.ENUM("aktif", "isolir", "nonaktif", "berhenti", "Fasum"),
      defaultValue: "aktif",
    },

    id_paket: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    usn_mikrotik: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    id_bts: {
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

export default PelangganModel;