import UserModel from "../models/users_model.js";  
import PembayaranModel from "../models/pembayaran_model.js";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";

// Function Login User
export const loginUser = async (req, res) => {
  const { username, password } = req.body;  
    try {   
    const user = await UserModel.findOne({ where: { username } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const token = jwt.sign(
      { id_user: user.id_user, role: user.role },
      process.env.JWT_SECRET, 
        { expiresIn: "1d" }
    );
    res.json({ token: token, user: { id_user: user.id_user, username: user.username, nama_lengkap: user.nama_lengkap, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function add User
export const addUser = async (req, res) => {
  const { username, password, nama_lengkap, role } = req.body;
    try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await UserModel.create({
      username,
      password: hashedPassword,
        nama_lengkap,
        role,
    });
    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function get all Users
export const getAllUsers = async (req, res) => {
    try {
    const users = await UserModel.findAll({
      attributes: { exclude: ["password"] },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }     
};

// Function delete User
export const deleteUser = async (req, res) => {
  const { id_user } = req.params;
    try {
    const deletedUser = await UserModel.destroy({
      where: { id_user },
    });
    if (deletedUser) {
      res.json({ message: "User deleted successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
    } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Function update User
export const updateUser = async (req, res) => {
  const { id_user } = req.params;
  const { username, password, nama_lengkap, role } = req.body;
    try {
    const user = await UserModel.findByPk(id_user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.update(
      {
        username,
        password: hashedPassword,
        nama_lengkap,
        role,
      },
      { where: { id_user } }
    );
    res.json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  } 
};

// Function to update status active User
export const updateStatusUser = async (req, res) => {
  const { id_user } = req.params;
    const { isActive } = req.body;
    try {
    const user = await UserModel.findByPk(id_user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await UserModel.update(
      {
        isActive,
        },
        { where: { id_user } }
    );
    res.json({ message: "User status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
