import express from "express";
import {
  addLog,
  getAllLogs,
  getLogsByUser,
  deleteLog,
} from "../controllers/logs_controller.js";

const router = express.Router();

router.post("/logs", addLog);
router.get("/logs", getAllLogs);
router.get("/logs/user/:id_user", getLogsByUser);
router.delete("/logs/:id_logs", deleteLog);

export default router;

