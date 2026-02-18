import express from "express";
import {
  loginUser,
  addUser,
  getAllUsers,
  deleteUser,
  updateUser,
  updateStatusUser,
} from "../controllers/users_controller.js";

const router = express.Router();

// Auth
router.post("/login", loginUser);

// Users CRUD
router.post("/users", addUser);
router.get("/users", getAllUsers);
router.put("/users/:id_user", updateUser);
router.patch("/users/:id_user/status", updateStatusUser);
router.delete("/users/:id_user", deleteUser);

export default router;

