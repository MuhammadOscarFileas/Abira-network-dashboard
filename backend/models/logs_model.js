import { DataTypes } from "sequelize";
import db from "../config/database.js";

const LogsModel = db.define(
  "logs",
  {
    id_logs: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    id_user: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    action: {
      type: DataTypes.ENUM("create", "update", "delete"),
      allowNull: false,
    },
    deskripsi: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default LogsModel; 