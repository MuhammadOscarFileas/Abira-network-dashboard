import LogsModel from "../models/logs_model.js";
import UserModel from "../models/users_model.js";

// Function to add new Log
export const addLog = async (req, res) => {
  const { id_user, action, deskripsi } = req.body;

  try {
    const user = await UserModel.findByPk(id_user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newLog = await LogsModel.create({
      id_user,
      action,
      deskripsi,
    });

    res
      .status(201)
      .json({ message: "Log created successfully", log: newLog });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function to get all Logs
export const getAllLogs = async (req, res) => {
  try {
    const logs = await LogsModel.findAll({
      include: [
        {
          model: UserModel,
          as: "user",
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function to get Logs by User
export const getLogsByUser = async (req, res) => {
  const { id_user } = req.params;

  try {
    const logs = await LogsModel.findAll({
      where: { id_user },
      include: [
        {
          model: UserModel,
          as: "user",
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function to delete Log
export const deleteLog = async (req, res) => {
  const { id_logs } = req.params;

  try {
    const deletedLog = await LogsModel.destroy({
      where: { id_logs },
    });

    if (!deletedLog) {
      return res.status(404).json({ message: "Log not found" });
    }

    res.json({ message: "Log deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
